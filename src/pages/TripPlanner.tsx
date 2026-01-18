import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { mockHotspots } from "@/services/mockData";
import { useState, useEffect, useMemo } from "react";
import {
  Ship,
  Fuel,
  Compass,
  Calculator,
  CheckSquare,
  AlertTriangle,
  Droplets,
  Gauge,
  Wind,
  Navigation,
  Loader2,
  RefreshCw,
  MapPin,
  CalendarCheck,
  Anchor,
  CloudLightning,
  Waves,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  calculateMultipleStopsFuel,
  getFuelVessels,
  getVessels,
} from "@/services/api";
import AddVesselDialog from "@/components/AddVesselDialog";
import { useToast } from "@/hooks/use-toast";
import TripPlannerEnhancements from "@/components/TripPlannerEnhancements";
import {
  getRouteSeaConditions,
  SeaCondition,
} from "@/services/weatherConditions";

const HARBORS = {
  colombo: { lat: 6.9271, lng: 79.8612, name: "Colombo Harbor" },
  galle: { lat: 6.0535, lng: 80.221, name: "Galle Harbor" },
  trinco: { lat: 8.5874, lng: 81.2152, name: "Trincomalee Harbor" },
  negombo: { lat: 7.2008, lng: 79.8737, name: "Negombo Harbor" },
};

const SAFETY_ITEMS = [
  { id: "lifejackets", label: "Life Jackets (All Crew)", checked: false },
  { id: "firstaid", label: "First Aid Kit", checked: false },
  { id: "radio", label: "VHF Radio Check", checked: false },
  { id: "gps", label: "GPS & Navigation Backup", checked: false },
  { id: "engine", label: "Engine Oil & Coolant", checked: false },
  { id: "water", label: "Drinking Water & Rations", checked: false },
  { id: "lights", label: "Nav Lights & Torches", checked: false },
];

export default function TripPlanner() {
  const { theme } = useTheme();
  const { toast } = useToast();

  // Trip Config State
  const [fuelRate, setFuelRate] = useState("25"); // L/hr base
  const [selectedHotspots, setSelectedHotspots] = useState<number[]>([0, 1]);
  const [selectedHarbor, setSelectedHarbor] =
    useState<keyof typeof HARBORS>("colombo");

  // Vessel & Logistics State
  const [tankCapacity, setTankCapacity] = useState("500"); // Liters
  const [currentFuelLevel, setCurrentFuelLevel] = useState("80"); // %
  const [seaCondition, setSeaCondition] = useState("calm"); // calm, choppy, rough
  const [selectedVessel, setSelectedVessel] = useState<string>(""); // Vessel ID
  const [useRealCalculation, setUseRealCalculation] = useState(false);

  // API State
  const [vessels, setVessels] = useState<any[]>([]);
  const [fuelCalculation, setFuelCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingVessels, setIsLoadingVessels] = useState(false);

  // Weather State
  const [realWeatherCondition, setRealWeatherCondition] =
    useState<SeaCondition | null>(null);
  const [useRealWeather, setUseRealWeather] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Checklist State
  const [checklist, setChecklist] = useState(SAFETY_ITEMS);

  // Load vessels on component mount
  const loadVessels = async () => {
    setIsLoadingVessels(true);
    try {
      const vesselsData = await getVessels();
      setVessels(vesselsData || []);
      if (vesselsData?.length > 0) {
        setSelectedVessel(vesselsData[0]._id || vesselsData[0].name);
      }
    } catch (error) {
      console.error("Failed to load vessels:", error);
      toast({
        title: "Error",
        description: "Failed to load vessel data. Using default calculations.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVessels(false);
    }
  };

  useEffect(() => {
    loadVessels();
  }, [toast]);

  // Calculate fuel consumption when parameters change
  useEffect(() => {
    if (useRealCalculation && selectedVessel && selectedHotspots.length > 0) {
      calculateRealFuelConsumption();
    }
  }, [selectedHotspots, selectedHarbor, selectedVessel, useRealCalculation]);

  // Fetch weather conditions when parameters change
  useEffect(() => {
    if (useRealWeather && selectedHotspots.length > 0) {
      fetchWeatherConditions();
    }
  }, [selectedHotspots, selectedHarbor, useRealWeather]);

  const fetchWeatherConditions = async () => {
    setIsLoadingWeather(true);
    try {
      // Build coordinates for weather sampling
      const harbor = HARBORS[selectedHarbor];
      const coordinates = [harbor];

      selectedHotspots.forEach((idx) => {
        const hotspot = mockHotspots[idx];
        coordinates.push({ lat: hotspot.lat, lng: hotspot.lng, name: hotspot.species });
      });

      coordinates.push(harbor); // return journey

      const weatherCondition = await getRouteSeaConditions(coordinates);
      setRealWeatherCondition(weatherCondition);

      // Auto-update manual sea condition to match weather
      if (weatherCondition.condition !== seaCondition) {
        setSeaCondition(weatherCondition.condition);
      }
    } catch (error) {
      console.error("Weather fetch failed:", error);
      toast({
        title: "Weather Error",
        description:
          "Failed to fetch weather conditions. Using manual settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const calculateRealFuelConsumption = async () => {
    if (!useRealCalculation || !selectedVessel) return;

    setIsCalculating(true);
    try {
      // Build coordinates array: harbor -> hotspots -> harbor
      const harbor = HARBORS[selectedHarbor];
      const coordinates = [harbor];

      // Add selected hotspots
      selectedHotspots.forEach((idx) => {
        const hotspot = mockHotspots[idx];
        coordinates.push({ lat: hotspot.lat, lng: hotspot.lng, name: hotspot.species });
      });

      // Return to harbor
      coordinates.push(harbor);

      // Try to find a matching fuel vessel for calculation
      // This is needed because the fuel API expects vessel_id from fuel database
      const selectedMaintenanceVessel = vessels.find(
        (v) => (v._id || v.name) === selectedVessel
      );
      let vesselIdForCalculation = selectedVessel;

      // If we can't find fuel vessel with same name, try to get fuel vessels and match by specs
      try {
        const fuelVesselsData = await getFuelVessels();
        const fuelVessels = fuelVesselsData.vessels || [];

        if (selectedMaintenanceVessel && fuelVessels.length > 0) {
          // Try to match by vessel type and horsepower
          const matchingFuelVessel = fuelVessels.find(
            (fv) =>
              fv.vessel_type?.toLowerCase() ===
                selectedMaintenanceVessel.type?.toLowerCase() &&
              Math.abs(
                (fv.hp || 0) -
                  (selectedMaintenanceVessel.specifications?.horsepower || 0)
              ) <= 20
          );

          if (matchingFuelVessel) {
            vesselIdForCalculation = matchingFuelVessel.vessel_id;
          } else {
            // Use the first available fuel vessel as fallback
            vesselIdForCalculation = fuelVessels[0].vessel_id;
            toast({
              title: "Vessel Match",
              description: `Using similar vessel (${fuelVessels[0].vessel_id}) for fuel calculation.`,
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.warn("Could not load fuel vessels for matching:", error);
      }

      const result = await calculateMultipleStopsFuel({
        coordinates,
        vessel_id: vesselIdForCalculation,
      });

      setFuelCalculation(result);
    } catch (error) {
      console.error("Fuel calculation failed:", error);
      toast({
        title: "Calculation Error",
        description:
          "Failed to calculate fuel consumption. Check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculations
  const calculateDistance = (spots: number[]) => {
    return spots.length * 85; // Simple estimation
  };

  const baseDistance =
    useRealCalculation && fuelCalculation
      ? fuelCalculation.totals.distance_km
      : calculateDistance(selectedHotspots);

  // Weather Impact Multiplier - use real weather data when available
  const weatherMultiplier =
    useRealWeather && realWeatherCondition
      ? realWeatherCondition.fuelMultiplier
      : seaCondition === "rough"
      ? 1.3
      : seaCondition === "choppy"
      ? 1.15
      : 1.0;

  const speedMultiplier =
    useRealWeather && realWeatherCondition
      ? realWeatherCondition.speedMultiplier
      : seaCondition === "rough"
      ? 0.7
      : seaCondition === "choppy"
      ? 0.85
      : 1.0;

  // Adjusted Fuel Calculation
  const adjustedFuelRate = parseFloat(fuelRate || "0") * weatherMultiplier;
  const baseSpeed = 20 * speedMultiplier; // Adjust speed based on conditions
  const estimatedDuration =
    useRealCalculation && fuelCalculation
      ? fuelCalculation.totals.estimated_trip_duration_hours
      : baseDistance / baseSpeed; // Using weather-adjusted speed
  const fuelUsed =
    useRealCalculation && fuelCalculation
      ? fuelCalculation.totals.fuel_consumption_liters * weatherMultiplier
      : estimatedDuration * adjustedFuelRate;

  // Tank Analysis
  const tankCap = parseFloat(tankCapacity || "0");
  const fuelOnboard = parseFloat(currentFuelLevel || "0"); // Input is now in Liters
  const reserveFuel = tankCap * 0.2; // 20% reserve
  const fuelRemainingAfterTrip = fuelOnboard - fuelUsed;
  const maxRange = (fuelOnboard / adjustedFuelRate) * 20; // km

  // Status Logic
  const hasEnoughFuel = fuelRemainingAfterTrip > 0;
  const cutsIntoReserve =
    fuelRemainingAfterTrip > 0 && fuelRemainingAfterTrip < reserveFuel;

  // Checklist Calculations
  const checkedCount = checklist.filter((i) => i.checked).length;
  const progress = (checkedCount / checklist.length) * 100;

  const toggleCheck = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Generate chaotic plexus pattern
  const plexusPattern = useMemo(() => {
    const nodes: { x: number; y: number; r: number }[] = [];
    const width = 1000;
    const height = 1000;
    const nodeCount = 80;

    // Generate random nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 2,
      });
    }

    // Generate connections based on distance
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
    }[] = [];
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((otherNode) => {
        const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
        if (dist < 200) {
          lines.push({
            x1: node.x,
            y1: node.y,
            x2: otherNode.x,
            y2: otherNode.y,
            opacity: 1 - dist / 200,
          });
        }
      });
    });

    return { nodes, lines };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-6">
       {/* Background */}
       <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="trip-plexus"
              x="0"
              y="0"
              width="1000"
              height="1000"
              patternUnits="userSpaceOnUse"
            >
              {plexusPattern.lines.map((line, i) => (
                <line
                  key={`line-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-300 dark:text-sky-900"
                  style={{ opacity: line.opacity }}
                />
              ))}
              {plexusPattern.nodes.map((node, i) => (
                <circle
                  key={`node-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  className="fill-slate-300 dark:fill-sky-900"
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#trip-plexus)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-sky-100 dark:bg-sky-900/40 rounded-lg">
                <Compass className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Mission Control
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg">
              Advanced logistics planning and risk assessment system
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-2 rounded-xl border border-slate-200 dark:border-slate-800">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
               hasEnoughFuel && !cutsIntoReserve 
               ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400' 
               : cutsIntoReserve 
               ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400'
               : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400'
             }`}>
                {hasEnoughFuel && !cutsIntoReserve ? <CalendarCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span className="text-sm font-bold uppercase tracking-wide">
                  {!hasEnoughFuel ? "Mission Critical" : cutsIntoReserve ? "Caution Required" : "Ready for Launch"}
                </span>
             </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* LEFT COLUMN: SETTINGS */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                     <AccordionIcon className="h-5 w-5 text-sky-500" />
                     Mission Configuration
                  </CardTitle>
                  <CardDescription>Set parameters for the upcoming voyage</CardDescription>
               </CardHeader>
               <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vessel & Harbor</Label>
                    <div className="grid gap-3">
                       <Select value={selectedHarbor} onValueChange={(v: any) => setSelectedHarbor(v)}>
                          <SelectTrigger className="bg-slate-50 dark:bg-slate-950/50">
                             <div className="flex items-center gap-2">
                                <Anchor className="h-4 w-4 text-sky-500" />
                                <SelectValue />
                             </div>
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="colombo">Colombo Harbor</SelectItem>
                              <SelectItem value="galle">Galle Harbor</SelectItem>
                              <SelectItem value="trinco">Trincomalee Harbor</SelectItem>
                              <SelectItem value="negombo">Negombo Harbor</SelectItem>
                          </SelectContent>
                       </Select>

                       <div className="flex gap-2">
                          <Select value={selectedVessel} onValueChange={setSelectedVessel} disabled={isLoadingVessels}>
                            <SelectTrigger className="bg-slate-50 dark:bg-slate-950/50 flex-1">
                                <div className="flex items-center gap-2">
                                  <Ship className="h-4 w-4 text-sky-500" />
                                  <SelectValue placeholder={isLoadingVessels ? "Loading..." : "Select Vessel"} />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {vessels.map((v) => (
                                  <SelectItem key={v._id || v.name} value={v._id || v.name}>
                                    {v.name} ({v.type})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <AddVesselDialog onVesselAdded={loadVessels} />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logistics Data</Label>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400">TANK CAPACITY (L)</Label>
                          <Input type="number" value={tankCapacity} onChange={(e) => setTankCapacity(e.target.value)} className="bg-slate-50 dark:bg-slate-950/50 font-mono" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400">CURRENT FUEL (L)</Label>
                          <div className="relative">
                            <Input type="number" value={currentFuelLevel} onChange={(e) => setCurrentFuelLevel(e.target.value)} className="bg-slate-50 dark:bg-slate-950/50 font-mono pr-8" />
                            <span className="absolute right-3 top-2.5 text-xs text-slate-400">L</span>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400">BASE CONSUMPTION (L/HR)</Label>
                          <Input type="number" value={fuelRate} onChange={(e) => setFuelRate(e.target.value)} className="bg-slate-50 dark:bg-slate-950/50 font-mono" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation Points</Label>
                     <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto p-2">
                        {mockHotspots.map((hotspot, idx) => (
                          <label
                            key={idx}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all mb-1 ${
                              selectedHotspots.includes(idx)
                                ? "bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedHotspots.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedHotspots([...selectedHotspots, idx]);
                                else setSelectedHotspots(selectedHotspots.filter((i) => i !== idx));
                              }}
                              className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                            />
                            <div className="flex-1">
                               <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{hotspot.species}</span>
                                  <Badge variant="outline" className="text-[10px] h-5 bg-white dark:bg-black/20">{(hotspot.probability * 100).toFixed(0)}%</Badge>
                               </div>
                            </div>
                          </label>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Advanced Data</Label>
                    <div className="grid gap-2">
                       <Button 
                         variant="outline" 
                         className={`justify-between ${useRealCalculation ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-400'}`}
                         onClick={() => setUseRealCalculation(!useRealCalculation)}
                       >
                         <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            <span>Fuel Calculator</span>
                         </div>
                         <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useRealCalculation ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${useRealCalculation ? 'translate-x-4' : 'translate-x-0'}`} />
                         </div>
                       </Button>

                       <Button 
                         variant="outline" 
                         className={`justify-between ${useRealWeather ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-400'}`}
                         onClick={() => setUseRealWeather(!useRealWeather)}
                       >
                         <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4" />
                            <span>Live Weather Data</span>
                         </div>
                         <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useRealWeather ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${useRealWeather ? 'translate-x-4' : 'translate-x-0'}`} />
                         </div>
                       </Button>
                    </div>
                  </div>
               </CardContent>
            </Card>


          </div>


          {/* RIGHT COLUMN: STATUS */}
          <div className="lg:col-span-8 space-y-6">
             
             {/* TOP CARDS: ANALYSIS */}
             <div className="grid md:grid-cols-2 gap-6">
                
                {/* 1. Fuel Analysis */}
                <Card className="backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-lg group">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium uppercase tracking-widest text-slate-500 flex items-center justify-between">
                         <span>Range Analysis</span>
                         {isCalculating && <Loader2 className="h-3 w-3 animate-spin" />}
                      </CardTitle>
                   </CardHeader>
                   <CardContent>
                      <div className="flex flex-col gap-6">
                         
                         {/* Primary Fuel Indicator */}
                         <div className="flex flex-col items-center justify-center py-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Fuel Required</div>
                            <div className="flex items-baseline gap-2">
                               <span className={`text-5xl font-black tracking-tighter ${
                                  !hasEnoughFuel ? 'text-red-500' : 'text-slate-900 dark:text-white'
                               }`}>
                                  {fuelUsed.toFixed(0)}
                               </span>
                               <span className="text-xl font-bold text-slate-400">Liters</span>
                            </div>
                            {/* Comparison pill */}
                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${
                               !hasEnoughFuel 
                               ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                               : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}>
                               Uses {fuelUsed.toFixed(0)}L of {fuelOnboard.toFixed(0)}L available
                            </div>
                         </div>

                         <div className="relative pt-2">
                            {/* Fuel Visualization Bar */}
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-slate-300 dark:bg-slate-700 w-full relative">
                                  {/* Available Fuel Base (scaled to tank capacity if known, else relative) */}
                                  <div className="absolute top-0 left-0 h-full bg-slate-200 dark:bg-slate-700 w-full"></div>
                                  
                                  {/* Current Onboard Fuel Bar */}
                                  <div className="absolute top-0 left-0 h-full bg-sky-200 dark:bg-sky-900/50" 
                                       style={{ width: `${Math.min(100, (fuelOnboard / tankCap) * 100)}%` }}></div>

                                  {/* Usage Bar (Relative to Tank Capacity) */}
                                  <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                                     !hasEnoughFuel ? 'bg-red-500' : 'bg-sky-500'
                                  }`} 
                                  style={{ width: `${Math.min(100, (fuelUsed / tankCap) * 100)}%` }}></div>
                                  
                                  {/* Reserve Marker Line */}
                                  <div className="absolute top-0 left-[20%] h-full w-0.5 bg-red-400/50 z-10" title="Reserve Level"></div>
                               </div>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 uppercase">
                               <span>0 L</span>
                               <span>Reserve ({reserveFuel.toFixed(0)} L)</span>
                               <span>Capacity ({tankCap.toFixed(0)} L)</span>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                               <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Max Range</div>
                               <div className="text-2xl font-black text-slate-900 dark:text-white">{maxRange.toFixed(0)} <span className="text-sm text-slate-400 font-normal">km</span></div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                               <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Fuel Remaining</div>
                               <div className={`text-2xl font-black ${
                                  !hasEnoughFuel ? 'text-red-500' : cutsIntoReserve ? 'text-amber-500' : 'text-emerald-500'
                               }`}>
                                  {Math.max(0, fuelRemainingAfterTrip).toFixed(0)} <span className="text-sm text-slate-400 font-normal">L</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                {/* 2. Environmental Analysis */}
                 <Card className="backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-lg">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium uppercase tracking-widest text-slate-500 flex items-center justify-between">
                         <span>Condition Assessment</span>
                         {isLoadingWeather && <Loader2 className="h-3 w-3 animate-spin" />}
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-6">
                      
                      <div className="flex gap-2">
                        {['calm', 'choppy', 'rough'].map((cond) => (
                           <button
                              key={cond}
                              onClick={() => !useRealWeather && setSeaCondition(cond)}
                              disabled={useRealWeather}
                              className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold uppercase transition-all border ${
                                seaCondition === cond
                                ? cond === 'rough' 
                                  ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30' 
                                  : cond === 'choppy' 
                                  ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30'
                                  : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30'
                                : 'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 opacity-60 hover:opacity-100'
                              }`}
                           >
                              {cond}
                           </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-500">
                               <Waves className="h-4 w-4" />
                               <span className="text-xs uppercase font-bold">Sea State</span>
                            </div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white pl-5.5">
                               {useRealWeather && realWeatherCondition ? `${realWeatherCondition.waveHeight.toFixed(1)}m Swells` : seaCondition === 'rough' ? '> 2.0m Swells' : 'Normal'}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-500">
                               <Wind className="h-4 w-4" />
                               <span className="text-xs uppercase font-bold">Wind</span>
                            </div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white pl-5.5">
                               {useRealWeather && realWeatherCondition ? `${realWeatherCondition.windSpeed.toFixed(1)} m/s` : 'Variable'}
                            </div>
                         </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                         <div className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm">
                            <Navigation className="h-4 w-4 text-sky-500" />
                         </div>
                         <div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold">Consumption Impact</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                               + {((weatherMultiplier - 1) * 100).toFixed(0)}% <span className="font-normal text-slate-500">due to conditions</span>
                            </div>
                         </div>
                      </div>

                   </CardContent>
                </Card>
             </div>

             {/* BOTTOM: PRE-FLIGHT CHECKLIST */}
             <Card className="backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-lg">
                <CardHeader className="pb-4">
                   <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center gap-2">
                         <CheckSquare className="h-5 w-5 text-sky-500" />
                         Pre-Departure Safety Protocols
                      </CardTitle>
                      <Badge variant="outline" className={`font-mono ${progress === 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100'}`}>
                         {checkedCount}/{checklist.length} CLEARED
                      </Badge>
                   </div>
                   <Progress value={progress} className="h-1.5 bg-slate-100" />
                </CardHeader>
                <CardContent>
                   <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {checklist.map((item) => (
                         <div 
                           key={item.id}
                           onClick={() => toggleCheck(item.id)}
                           className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${
                             item.checked 
                             ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 shadow-sm' 
                             : 'bg-white/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                           }`}
                         >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              item.checked ? 'bg-emerald-500 text-white scale-110' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-300'
                            }`}>
                               {item.checked ? <CheckSquare className="h-4 w-4" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                            </div>
                            <span className={`text-sm font-medium ${item.checked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                               {item.label}
                            </span>
                         </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             {/* Trip Enhancements (Market/Route) */}
             <TripPlannerEnhancements
                selectedVessel={selectedVessel}
                selectedHotspots={selectedHotspots}
                fuelCalculation={fuelCalculation}
                seaCondition={seaCondition}
                realWeatherCondition={realWeatherCondition}
                useRealWeather={useRealWeather}
             />

          </div>
        </div>
      </div>
    </div>
  );
}

// Helper icon component
function AccordionIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  );
}
