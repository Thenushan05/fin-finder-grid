import React, { useState, useEffect } from "react";
import type { MapRef } from "react-map-gl";
import { postRegionPrediction } from "@/services/api";
import { showError } from "@/services/notificationService";
import { ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  mapRef: React.RefObject<MapRef>;
};

// Jaffna bbox (approx). Adjust if you want a different box.
const JAFFNA_BBOX = {
  min_lat: 8.5,
  max_lat: 10.5,
  min_lon: 79.0,
  max_lon: 80.5,
};

export default function JaffnaHotspotControls({ mapRef }: Props) {
  const [species, setSpecies] = useState("YFT");
  const [threshold, setThreshold] = useState(0.6);
  const [sstOverride, setSstOverride] = useState("");
  const [sshOverride, setSshOverride] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  async function runPrediction() {
    setLoading(true);
    const body = {
      date: null, // server will use today if null
      species,
      threshold,
      top_k: 200,
      bbox: JAFFNA_BBOX,
      overrides: {
        // If input is empty string, don't override
        ...(sstOverride !== "" ? { sst: Number(sstOverride) } : {}),
        ...(sshOverride !== "" ? { ssh: Number(sshOverride) } : {}),
      },
    };

    try {
      const json = await postRegionPrediction(body);
      const geojson = json.geojson;
      const map = mapRef.current?.getMap();
      if (!map) return;

      if (map.getSource("fishHotspots")) {
        (map.getSource("fishHotspots") as any).setData(geojson);
      } else {
        map.addSource("fishHotspots", { type: "geojson", data: geojson });
        map.addLayer({
          id: "fishHotspots-layer",
          type: "circle",
          source: "fishHotspots",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "prob"],
              0.0,
              2,
              0.5,
              5,
              0.8,
              8,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "prob"],
              0.0,
              "#3288bd",
              0.4,
              "#fee08b",
              0.7,
              "#f46d43",
              0.9,
              "#d53e4f",
            ],
            "circle-opacity": 0.8,
          },
        });

        map.on("click", "fishHotspots-layer", (e: any) => {
          const f = e.features && e.features[0];
          if (!f) return;
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [];
          // show a simple popup
          new (map as any).Popup()
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:12px"><strong>${
                p.species_code
              }</strong><br/>Prob: ${(p.prob * 100).toFixed(0)}%<br/>SST: ${
                p.sst ?? "n/a"
              }</div>`
            )
            .addTo(map);
        });
        map.on(
          "mouseenter",
          "fishHotspots-layer",
          () => (map.getCanvas().style.cursor = "pointer")
        );
        map.on(
          "mouseleave",
          "fishHotspots-layer",
          () => (map.getCanvas().style.cursor = "")
        );
      }
    } catch (err) {
      console.error("Prediction failed", err);
      showError("Prediction failed: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  // optional: run on mount once
  useEffect(() => {
    // don't auto-run to avoid accidental API calls
  }, []);

  return (
    <div className="absolute top-6 left-6 w-80 bg-slate-900/95 backdrop-blur-md text-slate-100 p-5 rounded-2xl shadow-2xl border border-slate-700/50 z-30 font-sans transition-all duration-300 ease-in-out">
      <div 
        className="flex items-center justify-between mb-0 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm tracking-wide text-slate-50">Jaffna Hotspot Predictor</h3>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <button 
          className="p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-5 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Species Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Species</label>
            <div className="relative">
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full appearance-none bg-slate-800/80 hover:bg-slate-800 transition-colors text-sm py-2.5 px-3 rounded-lg border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="YFT">YFT - Yellowfin Tuna</option>
                <option value="BET">BET - Bigeye Tuna</option>
                <option value="SWO">SWO - Swordfish</option>
                <option value="BLM">BLM - Blue Marlin</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Threshold Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Threshold</label>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
            />
          </div>

          {/* Overrides Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">SST Override (°C)</label>
              <input
                value={sstOverride}
                onChange={(e) => setSstOverride(e.target.value)}
                className="w-full bg-slate-800/80 text-sm py-2 px-3 rounded-lg border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600 transition-all"
                placeholder="e.g. 28.5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">SSH Override (m)</label>
              <input
                value={sshOverride}
                onChange={(e) => setSshOverride(e.target.value)}
                className="w-full bg-slate-800/80 text-sm py-2 px-3 rounded-lg border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600 transition-all"
                placeholder="e.g. 0.12"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={runPrediction}
            disabled={loading}
            className="w-full group relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Run Jaffna Prediction</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
