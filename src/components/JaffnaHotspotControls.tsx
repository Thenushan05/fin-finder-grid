import React, { useState, useEffect } from "react";
import type { MapRef } from "react-map-gl";
import { postRegionPrediction } from "@/services/api";

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
      alert("Prediction failed: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  // optional: run on mount once
  useEffect(() => {
    // don't auto-run to avoid accidental API calls
  }, []);

  return (
    <div className="absolute top-4 left-4 bg-slate-900/90 text-slate-50 p-3 rounded-xl shadow-lg space-y-2 text-xs z-30">
      <div className="font-semibold">Jaffna Hotspot Predictor</div>

      <div className="flex items-center justify-between gap-2">
        <label className="text-xs">Species</label>
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="text-xs bg-slate-800/60 p-1 rounded"
        >
          <option value="YFT">YFT - Yellowfin Tuna</option>
          <option value="BET">BET - Bigeye Tuna</option>
          <option value="SWO">SWO - Swordfish</option>
          <option value="BLM">BLM - Blue Marlin</option>
        </select>
      </div>

      <div>
        <label className="text-xs block">
          Threshold: {threshold.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.5"
          max="0.95"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-40"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs">SST override (°C)</label>
          <input
            value={sstOverride}
            onChange={(e) => setSstOverride(e.target.value)}
            className="w-full text-xs p-1 rounded bg-slate-800/60"
            placeholder="e.g. 28.5"
          />
        </div>
        <div>
          <label className="text-xs">SSH override (m)</label>
          <input
            value={sshOverride}
            onChange={(e) => setSshOverride(e.target.value)}
            className="w-full text-xs p-1 rounded bg-slate-800/60"
            placeholder="e.g. 0.12"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={runPrediction}
          disabled={loading}
          className="px-3 py-1 bg-emerald-500 text-black rounded text-xs"
        >
          {loading ? "Running..." : "Run Jaffna Prediction"}
        </button>
      </div>
    </div>
  );
}
