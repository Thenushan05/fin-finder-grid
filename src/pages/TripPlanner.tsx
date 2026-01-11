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
import { useState, useEffect } from "react";
import {
  Ship,
  Fuel,
  DollarSign,
  Calculator,
  CheckSquare,
  AlertTriangle,
  Droplets,
  Gauge,
  Wind,
  Navigation,
  Loader2,
  RefreshCw,
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
  const [fuelPrice, setFuelPrice] = useState("1.2");
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
        coordinates.push({ lat: hotspot.lat, lng: hotspot.lng });
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
        coordinates.push({ lat: hotspot.lat, lng: hotspot.lng });
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
  const fuelCost =
    useRealCalculation && fuelCalculation
      ? fuelCalculation.totals.fuel_cost_usd * weatherMultiplier
      : fuelUsed * parseFloat(fuelPrice || "0");

  // Tank Analysis
  const tankCap = parseFloat(tankCapacity || "0");
  const currentLevelPct = parseFloat(currentFuelLevel || "0");
  const fuelOnboard = tankCap * (currentLevelPct / 100);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Trip Planner & Logistics
        </h2>
        <p className="text-muted-foreground">
          Plan your route, fuel requirements, and vessel readiness
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Configuration */}
        <Card className="border-border lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              Trip Configuration
            </CardTitle>
            <CardDescription>Set vessel and route parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="harbor">Departure Harbor</Label>
              <Select
                value={selectedHarbor}
                onValueChange={(v: any) => setSelectedHarbor(v)}
              >
                <SelectTrigger id="harbor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colombo">Colombo</SelectItem>
                  <SelectItem value="galle">Galle</SelectItem>
                  <SelectItem value="trinco">Trincomalee</SelectItem>
                  <SelectItem value="negombo">Negombo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vessel">Vessel Selection</Label>
                <AddVesselDialog onVesselAdded={loadVessels} />
              </div>
              <Select
                value={selectedVessel}
                onValueChange={setSelectedVessel}
                disabled={isLoadingVessels}
              >
                <SelectTrigger id="vessel">
                  <SelectValue
                    placeholder={
                      isLoadingVessels ? "Loading vessels..." : "Select vessel"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map((vessel) => (
                    <SelectItem
                      key={vessel._id || vessel.name}
                      value={vessel._id || vessel.name}
                    >
                      {vessel.name} - {vessel.type} (
                      {vessel.specifications?.horsepower || "N/A"}HP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingVessels && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading vessel data...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useReal"
                  checked={useRealCalculation}
                  onChange={(e) => setUseRealCalculation(e.target.checked)}
                  className="rounded border-border accent-primary"
                  disabled={!selectedVessel || vessels.length === 0}
                />
                <Label htmlFor="useReal" className="text-sm">
                  Use Real Fuel Calculations
                </Label>
                {isCalculating && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {useRealCalculation
                  ? "Using backend API for accurate fuel consumption based on vessel specifications"
                  : "Using estimated calculations based on manual fuel rate settings"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useWeather"
                  checked={useRealWeather}
                  onChange={(e) => setUseRealWeather(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <Label htmlFor="useWeather" className="text-sm">
                  Use Real Weather Conditions
                </Label>
                {isLoadingWeather && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {useRealWeather
                  ? "Fetching live weather data from Open-Meteo Marine API"
                  : "Using manual sea condition settings"}
              </p>
              {useRealWeather && realWeatherCondition && (
                <div className="text-xs p-2 bg-accent rounded border">
                  <div className="font-medium text-foreground mb-1">
                    Current Conditions:
                  </div>
                  <div className="text-muted-foreground space-y-1">
                    <div>
                      Wind: {realWeatherCondition.windSpeed.toFixed(1)} m/s
                    </div>
                    <div>
                      Waves: {realWeatherCondition.waveHeight.toFixed(1)} m
                    </div>
                    <div>
                      Fuel Impact: +
                      {(
                        (realWeatherCondition.fuelMultiplier - 1) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                    <div className="text-xs italic">
                      {realWeatherCondition.description}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fuelRate">Base Fuel (L/hr)</Label>
                <Input
                  id="fuelRate"
                  type="number"
                  value={fuelRate}
                  onChange={(e) => setFuelRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelPrice">Price ($/L)</Label>
                <Input
                  id="fuelPrice"
                  type="number"
                  step="0.1"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Hotspots</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {mockHotspots.map((hotspot, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                      selectedHotspots.includes(idx)
                        ? "bg-primary/10 border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedHotspots.includes(idx)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHotspots([...selectedHotspots, idx]);
                        } else {
                          setSelectedHotspots(
                            selectedHotspots.filter((i) => i !== idx)
                          );
                        }
                      }}
                      className="rounded border-border accent-primary"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">
                        {hotspot.species}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hotspot.lat.toFixed(2)}°N, {hotspot.lng.toFixed(2)}°E
                      </p>
                    </div>
                    <Badge
                      variant={
                        selectedHotspots.includes(idx) ? "default" : "outline"
                      }
                      className="text-xs"
                    >
                      {(hotspot.probability * 100).toFixed(0)}%
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Tools */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Fuel Range & Logistics */}
          <Card className="border-border shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-blue-500" />
                  Fuel Range & Logistics
                  {useRealCalculation && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={calculateRealFuelConsumption}
                      disabled={isCalculating || !selectedVessel}
                      className="ml-auto"
                    >
                      {isCalculating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      hasEnoughFuel && !cutsIntoReserve
                        ? "default"
                        : "destructive"
                    }
                    className={
                      hasEnoughFuel && !cutsIntoReserve
                        ? "bg-green-600"
                        : cutsIntoReserve
                        ? "bg-amber-500"
                        : ""
                    }
                  >
                    {!hasEnoughFuel
                      ? "Insufficient Fuel"
                      : cutsIntoReserve
                      ? "Reserve Warning"
                      : "Fuel Sufficient"}
                  </Badge>
                  {useRealCalculation && (
                    <Badge variant="outline" className="text-xs">
                      API Calculation
                    </Badge>
                  )}
                  {useRealWeather && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Live Weather
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                Analyze vessel range and fuel requirements based on conditions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  {/* Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="tank"
                        className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        Tank Capacity (L)
                      </Label>
                      <Input
                        id="tank"
                        type="number"
                        value={tankCapacity}
                        onChange={(e) => setTankCapacity(e.target.value)}
                        className="font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="level"
                        className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        Current Level (%)
                      </Label>
                      <div className="relative">
                        <Input
                          id="level"
                          type="number"
                          min="0"
                          max="100"
                          value={currentFuelLevel}
                          onChange={(e) => setCurrentFuelLevel(e.target.value)}
                          className="font-bold pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Sea Conditions
                      {useRealWeather && realWeatherCondition && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={fetchWeatherConditions}
                          disabled={isLoadingWeather}
                          className="ml-auto h-5 px-2"
                        >
                          {isLoadingWeather ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["calm", "choppy", "rough"].map((cond) => (
                        <button
                          key={cond}
                          onClick={() => setSeaCondition(cond)}
                          disabled={useRealWeather}
                          className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all capitalize ${
                            seaCondition === cond
                              ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                              : useRealWeather
                              ? "bg-muted border-border text-muted-foreground opacity-50 cursor-not-allowed"
                              : "bg-card border-border hover:bg-accent text-muted-foreground"
                          }`}
                        >
                          {cond}
                          {useRealWeather && seaCondition === cond && (
                            <span className="ml-1 text-xs">📡</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">
                      {useRealWeather
                        ? `Real Weather: +${(
                            (weatherMultiplier - 1) *
                            100
                          ).toFixed(0)}% Fuel Usage`
                        : seaCondition === "rough"
                        ? "+30% Fuel Usage"
                        : seaCondition === "choppy"
                        ? "+15% Fuel Usage"
                        : "Standard Consumption"}
                    </p>
                  </div>
                </div>

                {/* Visualization */}
                <div className="flex flex-col justify-center space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Fuel Onboard</span>
                      <span>{fuelOnboard.toFixed(0)} L</span>
                    </div>
                    <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                      {/* Current Fuel Bar */}
                      <div
                        className="h-full bg-blue-500 absolute left-0 top-0"
                        style={{ width: "100%" }}
                      />
                      {/* Usage Overlay */}
                      <div
                        className={`h-full absolute left-0 top-0 border-r-2 border-white/50 ${
                          !hasEnoughFuel ? "bg-red-500/80" : "bg-transparent"
                        } pattern-diagonal-lines`}
                        style={{
                          width: `${Math.min(
                            100,
                            (fuelUsed / fuelOnboard) * 100
                          )}%`,
                          backgroundImage:
                            "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)",
                          backgroundSize: "1rem 1rem",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 L</span>
                      <span>
                        Required:{" "}
                        <span className="font-bold text-foreground">
                          {fuelUsed.toFixed(0)} L
                        </span>
                      </span>
                      <span>{fuelOnboard.toFixed(0)} L</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-card rounded-lg border border-border">
                      <div className="text-[10px] uppercase text-muted-foreground font-bold">
                        Max Range
                      </div>
                      <div className="text-xl font-black text-foreground">
                        {maxRange.toFixed(0)} km
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        @ current conditions
                      </div>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border">
                      <div className="text-[10px] uppercase text-muted-foreground font-bold">
                        Remaining
                      </div>
                      <div
                        className={`text-xl font-black ${
                          !hasEnoughFuel
                            ? "text-red-500"
                            : cutsIntoReserve
                            ? "text-amber-500"
                            : "text-green-500"
                        }`}
                      >
                        {Math.max(0, fuelRemainingAfterTrip).toFixed(0)} L
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        after trip
                      </div>
                    </div>
                  </div>

                  {!hasEnoughFuel && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      WARNING: Not enough fuel for this trip!
                    </div>
                  )}
                  {cutsIntoReserve && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-800">
                      <Droplets className="h-4 w-4" />
                      CAUTION: Trip cuts into 20% safety reserve.
                    </div>
                  )}

                  {/* Sea Condition Risk Warnings */}
                  {seaCondition === "rough" && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800 animate-pulse">
                      <AlertTriangle className="h-4 w-4" />
                      WARNING: High Risk Conditions. Navigation not recommended.
                    </div>
                  )}
                  {seaCondition === "choppy" && (
                    <div className="flex items-center gap-2 text-orange-600 text-xs font-bold bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      WARNING: Medium Risk. Experienced sailors only.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Safety Checklist */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Pre-Departure Safety Check
                </CardTitle>
                <span className="text-sm font-bold text-muted-foreground">
                  {checkedCount}/{checklist.length}
                </span>
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      item.checked
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-card border-border hover:bg-accent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        item.checked
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-muted-foreground"
                      }`}
                    >
                      {item.checked && <CheckSquare className="h-3.5 w-3.5" />}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        item.checked
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Cost Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span>Total Distance</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {baseDistance}
                </p>
                <p className="text-xs text-muted-foreground">kilometers</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Fuel className="h-4 w-4 text-primary" />
                  <span>Fuel Required</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {fuelUsed.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  liters ({seaCondition})
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>Est. Fuel Cost</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  ${fuelCost.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {useRealCalculation ? "API Calculation" : `@ $${fuelPrice}/L`}
                </p>
                {useRealCalculation && selectedVessel && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Vessel:{" "}
                    {vessels.find((v) => (v._id || v.name) === selectedVessel)
                      ?.type || selectedVessel}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Trip Planning Features */}
      <TripPlannerEnhancements
        selectedVessel={selectedVessel}
        selectedHotspots={selectedHotspots}
        fuelCalculation={fuelCalculation}
        seaCondition={seaCondition}
        realWeatherCondition={realWeatherCondition}
        useRealWeather={useRealWeather}
      />
    </div>
  );
}
