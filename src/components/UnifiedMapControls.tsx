
import React, { useState, useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl";
import { postRegionPrediction } from "@/services/api";
import { showError } from "@/services/notificationService";
import { ChevronDown, ChevronUp, Map as MapIcon, Anchor, AlertCircle, Wind, Droplets, Waves, Cloud, History } from "lucide-react";
import { mockRegularGrounds, RegularGround } from "@/services/mockRegularGrounds";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

export default function UnifiedMapControls({ mapRef }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("hotspots");

  // --- Jaffna Hotspot Prediction State ---
  const [species, setSpecies] = useState("YFT");
  const [threshold, setThreshold] = useState(0.6);
  const [sstOverride, setSstOverride] = useState("");
  const [sshOverride, setSshOverride] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Regular Grounds State ---
  const [showRegularGrounds, setShowRegularGrounds] = useState(false);
  
  // Initialize map layers for Regular Grounds
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    if (showRegularGrounds && map) {
       // Add Source if not exists
       if (!map.getSource("regularGrounds")) {
         const geojson: any = {
           type: "FeatureCollection",
           features: mockRegularGrounds.map((g) => ({
             type: "Feature",
             geometry: { type: "Point", coordinates: [g.lng, g.lat] },
             properties: g as any,
           })),
         };
         map.addSource("regularGrounds", { type: "geojson", data: geojson });
       }

       // Add Layer if not exists
       if (!map.getLayer("regularGrounds-layer")) {
         map.addLayer({
           id: "regularGrounds-layer",
           type: "circle",
           source: "regularGrounds",
           paint: {
             "circle-radius": 12,
             "circle-stroke-width": 2,
             "circle-stroke-color": "#ffffff",
             "circle-color": [
               "match",
               ["get", "predictionLevel"],
               "Good", "#22c55e",    // Green
               "Moderate", "#eab308", // Yellow
               "Poor", "#ef4444",    // Red
               "#9ca3af"             // Default Gray
             ],
             "circle-opacity": 0.9,
             "circle-pitch-alignment": "viewport"
           },
           layout: {
             "visibility": "visible"
           }
         });

         // Add Label Layer
         map.addLayer({
            id: "regularGrounds-labels",
            type: "symbol",
            source: "regularGrounds",
            layout: {
              "text-field": ["get", "name"],
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 12,
              "text-offset": [0, 1.5],
              "text-anchor": "top",
              "visibility": "visible"
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "#000000",
              "text-halo-width": 1
            }
         });

         // Add Events
         const onClick = (e: any) => {
            const f = e.features && e.features[0];
            if (!f) return;
            const p = f.properties as RegularGround; // Mapbox serializes this, beware of complex objects if any
            // We need to parse back the JSON objects if they got flattened or just rely on simple props.
            // Mapbox GL JS properties are flattened? No, but nested objects might be serialized.
            // Check if weatherFactors is a string or object. GeoJSON properties must be JSON types.
            // Since we passed the object directly, Mapbox might flatten it or we need to access it carefully.
            // Actually, for simplicity in the popup HTML, let's use the data from the mock array by ID if needed, 
            // but let's try to trust the properties first.
            
            // Note: Mapbox properties don't support nested objects well in some versions. 
            // We might need to look it up by ID if 'weatherFactors' comes out as [object Object] string.
            const ground = mockRegularGrounds.find(g => g.id === p.id) || p;

            new (map as any).Popup({ closeButton: true, focusAfterOpen: false, className: 'fishing-popup' })
              .setLngLat(f.geometry.coordinates)
              .setHTML(generatePopupHtml(ground))
              .addTo(map);
         };

         map.on("click", "regularGrounds-layer", onClick);
         map.on("mouseenter", "regularGrounds-layer", () => (map.getCanvas().style.cursor = "pointer"));
         map.on("mouseleave", "regularGrounds-layer", () => (map.getCanvas().style.cursor = ""));
       } else {
         // Layer exists, just make sure it is visible
         map.setLayoutProperty("regularGrounds-layer", "visibility", "visible");
         map.setLayoutProperty("regularGrounds-labels", "visibility", "visible");
       }
    } else if (!showRegularGrounds && map && map.getLayer("regularGrounds-layer")) {
       // Hide it
       map.setLayoutProperty("regularGrounds-layer", "visibility", "none");
       map.setLayoutProperty("regularGrounds-labels", "visibility", "none");
    }

  }, [showRegularGrounds, mapRef]);

  // Helper for Popup HTML
  const generatePopupHtml = (g: RegularGround) => {
    // Basic HTML string construction (since Mapbox popup takes HTML string or DOM node)
    // We'll style it with inline styles or global CSS if possible.
    const color = g.predictionLevel === 'Good' ? '#22c55e' : g.predictionLevel === 'Moderate' ? '#eab308' : '#ef4444';
    
    return `
      <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 240px; color: #0f172a;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <h3 style="margin:0; font-weight:700; font-size:16px;">${g.name}</h3>
          <span style="background:${color}; color:white; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:bold; text-transform:uppercase;">${g.predictionLevel}</span>
        </div>
        
        <div style="display:flex; gap:8px; margin-bottom:12px;">
           <div style="background:#f1f5f9; padding:6px; border-radius:8px; flex:1; text-align:center;">
              <div style="font-size:10px; color:#64748b; text-transform:uppercase;">Catch Prov</div>
              <div style="font-size:16px; font-weight:800; color:${color};">${g.catchProbability}%</div>
           </div>
           <div style="background:#f1f5f9; padding:6px; border-radius:8px; flex:1; text-align:center;">
              <div style="font-size:10px; color:#64748b; text-transform:uppercase;">AI Conf</div>
              <div style="font-size:14px; font-weight:600; color:#334155;">${g.aiConfidence}</div>
           </div>
        </div>

        <div style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px; text-transform:uppercase;">Weather Impact</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:12px;">
           <div style="display:flex; align-items:center; gap:4px; font-size:12px; color:#334155;">
             <span>💨</span> ${g.weatherFactors.windSpeed} km/h
           </div>
           <div style="display:flex; align-items:center; gap:4px; font-size:12px; color:#334155;">
             <span>🌊</span> ${g.weatherFactors.waveHeight}m
           </div>
           <div style="display:flex; align-items:center; gap:4px; font-size:12px; color:#334155;">
             <span>🌧️</span> ${g.weatherFactors.rainProbability}%
           </div>
           <div style="display:flex; align-items:center; gap:4px; font-size:12px; color:#334155;">
             <span>☁️</span> ${g.weatherFactors.cloudCover}%
           </div>
        </div>

        <div style="background:#f8fafc; padding:8px; border-radius:6px; font-size:11px; color:#475569; border:1px solid #e2e8f0;">
          <strong>Historical:</strong> Based on last ${g.historicalInfluence.lastTrips} trips • Trend: <span style="color:${g.historicalInfluence.trend === 'Rising' ? '#22c55e' : (g.historicalInfluence.trend === 'Falling' ? '#ef4444' : '#eab308')}">${g.historicalInfluence.trend}</span>
        </div>
      </div>
    `;
  };


  // --- Jaffna Prediction Logic ---
  async function runPrediction() {
    setLoading(true);
    const body = {
      date: null,
      species,
      threshold,
      top_k: 200,
      bbox: JAFFNA_BBOX,
      overrides: {
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
              "interpolate", ["linear"], ["get", "prob"],
              0.0, 2, 0.5, 5, 0.8, 8,
            ],
            "circle-color": [
              "interpolate", ["linear"], ["get", "prob"],
              0.0, "#3288bd", 0.4, "#fee08b", 0.7, "#f46d43", 0.9, "#d53e4f",
            ],
            "circle-opacity": 0.8,
          },
        });

        // Add Popup for Hotspots
        map.on("click", "fishHotspots-layer", (e: any) => {
          const f = e.features && e.features[0];
          if (!f) return;
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [];
          new (map as any).Popup()
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:12px; color:black;"><strong>${p.species_code}</strong><br/>Prob: ${(p.prob * 100).toFixed(0)}%<br/>SST: ${p.sst ?? "n/a"}</div>`
            )
            .addTo(map);
        });
        map.on("mouseenter", "fishHotspots-layer", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "fishHotspots-layer", () => (map.getCanvas().style.cursor = ""));
      }
    } catch (err) {
      console.error("Prediction failed", err);
      showError("Prediction failed: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`absolute top-6 left-6 w-96 transition-all duration-300 ease-in-out z-30 font-sans ${isExpanded ? 'bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-700/50 rounded-2xl' : 'bg-transparent pointer-events-none'}`}>
      
      {/* Header Button (Always Visible - but handles its own layout when collapsed) */}
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer pointer-events-auto ${!isExpanded ? 'bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 w-auto inline-flex' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
             <Anchor className="h-5 w-5 text-white" />
          </div>
          <div className={`${!isExpanded ? 'hidden' : 'block'}`}>
            <h3 className="font-bold text-base tracking-wide text-slate-50">Fishing Intelligence</h3>
            <p className="text-xs text-slate-400">AI-Powered Forecasting</p>
          </div>
        </div>
        <button 
          className={`p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white ${!isExpanded ? 'ml-2' : ''}`}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <Tabs defaultValue="hotspots" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mb-4 p-1 rounded-lg">
              <TabsTrigger value="hotspots" className="text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm">Hotspot Scanner</TabsTrigger>
              <TabsTrigger value="grounds" className="text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm">Regular Grounds</TabsTrigger>
            </TabsList>

            <TabsContent value="hotspots" className="space-y-4">
              {/* Existing Jaffna Controls */}
              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Species</label>
                        <select
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            className="w-full bg-slate-800 text-sm py-2 px-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none"
                        >
                            <option value="YFT">Yellowfin</option>
                            <option value="BET">Bigeye</option>
                            <option value="SWO">Swordfish</option>
                            <option value="BLM">Blue Marlin</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Threshold ({threshold})</label>
                        <input
                            type="range"
                            min="0.5"
                            max="0.95"
                            step="0.05"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg accent-emerald-500 mt-3"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">SST <span className="text-slate-600">(°C)</span></label>
                      <input
                        value={sstOverride}
                        onChange={(e) => setSstOverride(e.target.value)}
                        className="w-full bg-slate-800 text-sm py-2 px-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none placeholder-slate-600"
                        placeholder="Default"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">SSH <span className="text-slate-600">(m)</span></label>
                      <input
                        value={sshOverride}
                        onChange={(e) => setSshOverride(e.target.value)}
                        className="w-full bg-slate-800 text-sm py-2 px-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none placeholder-slate-600"
                        placeholder="Default"
                      />
                    </div>
                  </div>

                  <button
                    onClick={runPrediction}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                       <>
                         <div className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                         <span>Scanning...</span>
                       </>
                    ) : (
                       <>
                         <MapIcon className="h-4 w-4" />
                         <span>Scan for Hotspots</span>
                       </>
                    )}
                  </button>
              </div>
            </TabsContent>

            <TabsContent value="grounds" className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4">
                 
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${showRegularGrounds ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                          <History className="h-5 w-5" />
                       </div>
                       <div>
                          <h4 className="font-semibold text-sm text-slate-200">Show Regular Grounds</h4>
                          <p className="text-[10px] text-slate-500">Analyze your usual spots</p>
                       </div>
                    </div>
                    <Switch 
                       checked={showRegularGrounds} 
                       onCheckedChange={setShowRegularGrounds} 
                       className="data-[state=checked]:bg-emerald-500"
                    />
                 </div>

                 {showRegularGrounds && (
                   <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="h-px bg-slate-700 w-full" />
                      
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Prediction Legend</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-700/50">
                               <div className="h-2 w-2 rounded-full bg-green-500 mx-auto mb-1 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                               <span className="text-[10px] font-medium text-slate-300">Good</span>
                            </div>
                            <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-700/50">
                               <div className="h-2 w-2 rounded-full bg-yellow-500 mx-auto mb-1 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                               <span className="text-[10px] font-medium text-slate-300">Moderate</span>
                            </div>
                            <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-700/50">
                               <div className="h-2 w-2 rounded-full bg-red-500 mx-auto mb-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                               <span className="text-[10px] font-medium text-slate-300">Poor</span>
                            </div>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                         <div className="flex gap-2 items-start">
                            <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                            <p className="text-[10px] text-blue-200 leading-relaxed">
                              Predictions combine <strong>historical logs</strong> with today's <strong>weather patterns</strong> (Wind, Wave, Rain).
                            </p>
                         </div>
                      </div>
                   </div>
                 )}

              </div>
              
              {showRegularGrounds && (
                <div className="max-h-40 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                   {mockRegularGrounds.map(g => (
                     <div 
                       key={g.id} 
                       className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer group transition-colors"
                       onClick={() => {
                          if(mapRef.current) {
                            mapRef.current.flyTo({ center: [g.lng, g.lat], zoom: 12 });
                          }
                       }}
                     >
                        <span className="text-xs text-slate-300 group-hover:text-emerald-400 transition-colors">{g.name}</span>
                        <div className={`h-2 w-2 rounded-full ${g.predictionLevel === 'Good' ? 'bg-green-500' : g.predictionLevel === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                     </div>
                   ))}
                </div>
              )}

            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
