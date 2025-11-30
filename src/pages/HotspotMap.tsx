import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Thermometer,
  Waves,
  Wind,
  Navigation,
  MapPin,
  AlertTriangle,
  CloudLightning,
  Tornado,
  X,
  ShieldCheck,
  CheckCircle2,
  Compass,
  ArrowUp,
  ArrowDown,
  Crosshair,
  Move,
  Locate,
  Flag,
} from "lucide-react";
import { WiDaySunny, WiCloud, WiStrongWind, WiRaindrops } from "react-icons/wi";
import {
  mockHotspots,
  mockWeatherHazards,
  type WeatherHazard,
} from "@/services/mockData";
import { fetchOpenMeteo, type OpenMeteoResult } from "@/services/openMeteo";
import {
  fetchMarineData,
  fetchSeaSurfaceTemperature,
  fetchSeaLevelHeight,
  type MarineResult,
} from "@/services/openMeteoMarine";
import {
  calculateHazardLevel,
  type HazardResult,
} from "@/lib/hazardClassification";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useMapContext } from "@/context/MapContext";
import { useTheme } from "next-themes";
import Map, {
  Marker,
  Popup,
  Source,
  Layer,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  MapRef,
} from "react-map-gl";
import { useRef } from "react";
import JaffnaHotspotControls from "@/components/JaffnaHotspotControls";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LineLayer } from "react-map-gl";

// Haversine formula to calculate distance in Nautical Miles
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3440.065; // Radius of earth in Nautical Miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Hazard level to color mapping for route segments
const hazardColors: Record<string, string> = {
  LOW: "#22c55e", // green-500
  MEDIUM: "#eab308", // yellow-500
  HIGH: "#f97316", // orange-500
  DANGER: "#ef4444", // red-500
};

// Create route layer with hazard-based coloring
const createRouteLayer = (
  hazardLevel: string,
  isAlternative: boolean = false
): LineLayer => ({
  id: `route-${hazardLevel}${isAlternative ? "-alt" : ""}`,
  type: "line",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": hazardColors[hazardLevel] ?? "#ef4444",
    "line-width": isAlternative ? 6 : 5, // Thicker for alternative route
    "line-opacity": isAlternative ? 0.95 : 0.85,
  },
  filter: ["==", ["get", "hazard"], hazardLevel],
});

// Original route outline (when alternatives exist and original is risky)
const originalRouteOutlineLayer: LineLayer = {
  id: "route-original-outline",
  type: "line",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#dc2626", // red-600
    "line-width": 3,
    "line-opacity": 0.4,
    "line-dasharray": [2, 2], // Dashed line
  },
};

// Fallback route layer (when no weather data)
const defaultRouteLayer: LineLayer = {
  id: "route-default",
  type: "line",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#64748b",
    "line-width": 4,
    "line-opacity": 0.6,
  },
};

export default function HotspotMap() {
  const {
    selectedHotspot,
    setSelectedHotspot,
    manualDestination,
    setManualDestination,
    routeWeatherPoints,
    setRouteWeatherPoints,
    viewState,
    setViewState,
    alternativeRoutes,
    setAlternativeRoutes,
    selectedRouteType,
    setSelectedRouteType,
    originalMainRoute,
    setOriginalMainRoute,
  } = useMapContext();

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const mapRef = useRef<MapRef | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userLocationMeta, setUserLocationMeta] = useState<{
    accuracy?: number | null;
    timestamp?: number | null;
    source?: "geolocation" | "manual" | null;
  } | null>(null);

  // When user clicks map we hold the click as "pending" until they confirm
  const [pendingManualDestination, setPendingManualDestination] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<WeatherHazard | null>(
    null
  );
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  // Destination Environmental Data State
  const [destinationSST, setDestinationSST] = useState<number | null>(null);
  const [destinationSSTError, setDestinationSSTError] = useState<string | null>(
    null
  );
  const [destinationSSTLoading, setDestinationSSTLoading] = useState(false);

  const [destinationSeaLevel, setDestinationSeaLevel] = useState<number | null>(
    null
  );
  const [destinationSeaLevelError, setDestinationSeaLevelError] = useState<
    string | null
  >(null);
  const [destinationSeaLevelLoading, setDestinationSeaLevelLoading] =
    useState(false);

  const [destinationMarine, setDestinationMarine] =
    useState<MarineResult | null>(null);
  const [destinationMarineError, setDestinationMarineError] = useState<
    string | null
  >(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Reset map loaded state when theme changes (forcing map remount)
  useEffect(() => {
    setIsMapLoaded(false);
  }, [isDarkMode]);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Get User Location (initial attempt) with error handling
  useEffect(() => {
    if (!navigator?.geolocation) {
      setGeolocationError("Geolocation not supported in this browser");
      return;
    }
    let mounted = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted) return;
        setGeolocationError(null);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        // Debug: log raw geolocation to console for troubleshooting
        console.debug("Geolocation success:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          position,
        });
        setUserLocationMeta({
          accuracy: position.coords.accuracy ?? null,
          timestamp: position.timestamp ?? Date.now(),
          source: "geolocation",
        });
        // center the map on the user if viewState is at default
        setViewState({
          ...viewState,
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: viewState.zoom ?? 9,
        });
      },
      (error) => {
        if (!mounted) return;
        const msg = error?.message ?? String(error) ?? "Geolocation failed";
        console.warn("Error getting location:", msg);
        setGeolocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const destination =
    manualDestination ||
    (selectedHotspot
      ? { lat: selectedHotspot.lat, lng: selectedHotspot.lng }
      : { lat: viewState.latitude, lng: viewState.longitude });

  // Fetch environmental data for the destination
  useEffect(() => {
    let mounted = true;
    const fetchDestData = async () => {
      // Only fetch if we have a specific target (hotspot or manual point)
      if (!manualDestination && !selectedHotspot) {
        setDestinationSST(null);
        setDestinationSeaLevel(null);
        setDestinationMarine(null);
        return;
      }

      setDestinationSSTLoading(true);
      setDestinationSSTError(null);
      setDestinationSeaLevelLoading(true);
      setDestinationSeaLevelError(null);
      setDestinationMarineError(null);

      try {
        const [sstRes, seaLevelRes, marine] = await Promise.all([
          fetchSeaSurfaceTemperature(destination.lat, destination.lng),
          fetchSeaLevelHeight(destination.lat, destination.lng),
          fetchMarineData(destination.lat, destination.lng, {
            hourly: [
              "wave_height",
              "wave_direction",
              "ocean_current_velocity",
              "ocean_current_direction",
            ],
            timezone: "UTC",
          }),
        ]);

        if (mounted) {
          // Extract current SST (closest to now)
          const now = new Date();
          const sstIdx = sstRes?.time
            ? findNearestHourlyIndex(sstRes.time, now)
            : 0;
          const currentSST = sstRes?.sea_surface_temperature?.[sstIdx] ?? null;

          // Extract current sea level height (closest to now)
          const seaLevelIdx = seaLevelRes?.time
            ? findNearestHourlyIndex(seaLevelRes.time, now)
            : 0;
          const currentSeaLevel =
            seaLevelRes?.sea_level_height_msl?.[seaLevelIdx] ?? null;

          setDestinationSST(currentSST);
          setDestinationSeaLevel(currentSeaLevel);
          setDestinationMarine(marine);
        }
      } catch (err) {
        console.error("Failed to fetch destination data", err);
        if (mounted) {
          setDestinationSSTError("Failed to load data");
          setDestinationSeaLevelError("Failed to load data");
          setDestinationMarineError("Failed to load data");
        }
      } finally {
        if (mounted) {
          setDestinationSSTLoading(false);
          setDestinationSeaLevelLoading(false);
        }
      }
    };

    fetchDestData();

    return () => {
      mounted = false;
    };
  }, [
    destination.lat,
    destination.lng,
    manualDestination,
    selectedHotspot,
    // dependencies for fetch functions are stable imports
  ]);

  // Manual retry for geolocation (useful if user previously denied permissions)
  const requestGeolocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setGeolocationError("Geolocation not supported in this browser");
      return;
    }
    setGeolocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeolocationError(null);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        // Debug: log raw geolocation on retry
        console.debug("Geolocation retry success:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          position,
        });
        setUserLocationMeta({
          accuracy: position.coords.accuracy ?? null,
          timestamp: position.timestamp ?? Date.now(),
          source: "geolocation",
        });
        setViewState({
          ...viewState,
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: viewState.zoom ?? 9,
        });
      },
      (error) => {
        const msg = error?.message ?? String(error) ?? "Geolocation failed";
        console.warn("Geolocation retry error:", msg);
        setGeolocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        destination.lat,
        destination.lng
      )
    : null;
  const distanceKm = distance ? distance * 1.852 : null;

  // Route weather: stored points and a manual fetch function (run only when user requests)
  const [selectedRoutePoint, setSelectedRoutePoint] = useState<{
    lat: number;
    lng: number;
    distanceFromStart?: number;
    etaHours?: number;
    forecastTime?: Date;
    windspeed?: number | null;
    precipitation?: number | null;
    weathercode?: number | null;
    category?: string;
    hazard?: HazardResult;
    primaryReason?: string | null;
    wind_direction?: number | null;
    windgusts?: number | null;
    wave_height?: number | null;
    wave_direction?: number | null;
    ocean_current_velocity?: number | null;
    ocean_current_direction?: number | null;
  } | null>(null);
  const [routeWeatherLoading, setRouteWeatherLoading] = useState(false);

  // Alternative route generation (declare before useMemo hooks that reference them)
  const [analyzingRoutes, setAnalyzingRoutes] = useState(false);

  // Generate colored route segments based on hazard levels
  const routeSegments = useMemo(() => {
    if (routeWeatherPoints.length === 0) return [];

    const segments: any[] = [];

    // Create segments between consecutive points
    for (let i = 0; i < routeWeatherPoints.length - 1; i++) {
      const currentPoint = routeWeatherPoints[i];
      const nextPoint = routeWeatherPoints[i + 1];
      const hazard = nextPoint.hazard ?? {
        level: "LOW",
        bgColor: "bg-green-400",
      };

      segments.push({
        type: "Feature",
        properties: { hazard: hazard.level },
        geometry: {
          type: "LineString",
          coordinates: [
            [currentPoint.lng, currentPoint.lat],
            [nextPoint.lng, nextPoint.lat],
          ],
        },
      });
    }

    return segments;
  }, [routeWeatherPoints]);

  // Explain why the route is not safe: aggregate top causes (wind/waves/current/weather)
  const routeExplanation = useMemo(() => {
    if (routeWeatherPoints.length === 0) return null;

    const counts: Record<string, { count: number; examples: string[] }> = {
      wind: { count: 0, examples: [] },
      waves: { count: 0, examples: [] },
      current: { count: 0, examples: [] },
      weather: { count: 0, examples: [] },
      other: { count: 0, examples: [] },
    };

    for (const pt of routeWeatherPoints) {
      const lvl = pt.hazard?.level ?? "LOW";
      if (lvl === "LOW") continue; // only explain non-low

      const reasons = pt.hazard?.reasons ?? [];
      const joined = reasons.join(" | ");

      if (/wind/i.test(joined)) {
        counts.wind.count++;
        if (counts.wind.examples.length < 3 && reasons.length)
          counts.wind.examples.push(reasons[0]);
      } else if (/wave|waves/i.test(joined)) {
        counts.waves.count++;
        if (counts.waves.examples.length < 3 && reasons.length)
          counts.waves.examples.push(reasons[0]);
      } else if (/current/i.test(joined)) {
        counts.current.count++;
        if (counts.current.examples.length < 3 && reasons.length)
          counts.current.examples.push(reasons[0]);
      } else if (/thunderstorm|rain|weather/i.test(joined)) {
        counts.weather.count++;
        if (counts.weather.examples.length < 3 && reasons.length)
          counts.weather.examples.push(reasons[0]);
      } else {
        counts.other.count++;
        if (counts.other.examples.length < 3 && reasons.length)
          counts.other.examples.push(reasons[0]);
      }
    }

    // Build a sorted list of causes by count
    const causeList = Object.keys(counts)
      .map((k) => ({ key: k, ...counts[k as keyof typeof counts] }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);

    return { counts, causeList };
  }, [routeWeatherPoints]);

  // Original route outline (shown as dashed red when alternative is selected)
  const originalRouteOutline = useMemo(() => {
    if (
      originalMainRoute.length === 0 ||
      selectedRouteType === "main" ||
      alternativeRoutes.length <= 1
    ) {
      return null;
    }

    const coordinates = originalMainRoute.map((p) => [p.lng, p.lat]);

    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    };
  }, [originalMainRoute, selectedRouteType, alternativeRoutes.length]);

  // Fallback: simple route line when no weather data
  const routeGeoJSON = useMemo(() => {
    if (!userLocation || routeWeatherPoints.length > 0) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [userLocation.lng, userLocation.lat],
          [destination.lng, destination.lat],
        ],
      },
    };
  }, [userLocation, destination, routeWeatherPoints.length]);

  // Analyze route for summary
  const routeSummary = useMemo(() => {
    if (routeWeatherPoints.length === 0) return null;

    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, DANGER: 0 };
    const warnings: Array<{ level: string; message: string }> = [];

    routeWeatherPoints.forEach((pt, idx) => {
      const level = pt.hazard?.level ?? "LOW";
      counts[level as keyof typeof counts]++;

      // Generate specific warnings for HIGH and DANGER zones
      if (level === "HIGH" || level === "DANGER") {
        const timeStr = pt.forecastTime
          ? pt.forecastTime.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "unknown time";
        const distStr = pt.distanceFromStart
          ? `${pt.distanceFromStart.toFixed(0)} km`
          : "unknown distance";

        // Prefer explicit hazard reasons from the hazard classifier when available
        const reasonList = (() => {
          const rs = getHazardReasons(pt.hazard);
          if (rs && rs.length > 0) return rs;
          const c: string[] = [];
          if (pt.windspeed && pt.windspeed >= 40)
            c.push(`wind ${pt.windspeed.toFixed(0)} km/h`);
          if (pt.wave_height && pt.wave_height >= 2)
            c.push(`waves ${pt.wave_height.toFixed(1)} m`);
          if (pt.weathercode && pt.weathercode >= 95) c.push("thunderstorm");
          else if (pt.weathercode && pt.weathercode >= 63) c.push("heavy rain");
          return c.length > 0 ? c : ["adverse conditions"];
        })();

        warnings.push({
          level,
          message: `${
            level === "DANGER" ? "⛔" : "⚠️"
          } ${level} risk at ${distStr} around ${timeStr} - ${reasonList.join(
            ", "
          )}`,
        });
      }
    });

    const total = routeWeatherPoints.length;
    const safePercent = ((counts.LOW / total) * 100).toFixed(0);

    let overallStatus = "✅ Mostly Safe";
    if (counts.DANGER > 0) overallStatus = "⛔ Not Recommended";
    else if (counts.HIGH > total * 0.3) overallStatus = "⚠️ High Risk";
    else if (counts.HIGH > 0 || counts.MEDIUM > total * 0.5)
      overallStatus = "⚠️ Caution Advised";

    return { counts, warnings, safePercent, overallStatus, total };
  }, [routeWeatherPoints]);

  // Prepare display-friendly route items (direct + alternatives)
  const displayRoutes = useMemo(() => {
    if (!routeSummary) return [];
    if (alternativeRoutes.length > 1) {
      return alternativeRoutes.map((r) => {
        const total =
          r.counts.LOW + r.counts.MEDIUM + r.counts.HIGH + r.counts.DANGER;
        const safePercent =
          total > 0 ? Math.round((r.counts.LOW / total) * 100).toString() : "0";
        return {
          title:
            r.routeType === "main"
              ? "Direct"
              : r.routeType === "north"
              ? "Northern"
              : "Southern",
          counts: r.counts,
          hazardScore: r.hazardScore,
          safePercent,
          routeType: r.routeType,
        } as const;
      });
    }

    return [
      {
        title: "Direct",
        counts: routeSummary.counts,
        hazardScore:
          routeSummary.counts.LOW * 1 +
          routeSummary.counts.MEDIUM * 2 +
          routeSummary.counts.HIGH * 5 +
          routeSummary.counts.DANGER * 10,
        safePercent: routeSummary.safePercent,
        routeType: "main",
      },
    ];
  }, [routeSummary, alternativeRoutes]);

  // Compute intermediate points every `intervalKm` between two coordinates (linear interpolation)
  function computeIntermediatePoints(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    intervalKm = 15
  ) {
    // distance in km
    const distNM = calculateDistance(start.lat, start.lng, end.lat, end.lng);
    const distKm = distNM * 1.852;
    if (distKm === 0) return [start];
    const count = Math.max(1, Math.ceil(distKm / intervalKm));
    const points: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;
      points.push({ lat, lng });
    }
    return points;
  }

  function classifyWind(kmh: number | null | undefined) {
    if (kmh == null)
      return { level: "Unknown", color: "bg-gray-400", description: "No data" };
    if (kmh < 5)
      return {
        level: "Calm / Very Low",
        color: "bg-green-400",
        description: "Almost no wind",
      };
    if (kmh >= 5 && kmh < 20)
      return {
        level: "Normal / Low",
        color: "bg-emerald-400",
        description: "Light breeze",
      };
    if (kmh >= 20 && kmh < 40)
      return {
        level: "Medium / Moderate",
        color: "bg-yellow-400",
        description: "Choppy sea",
      };
    if (kmh >= 40 && kmh < 60)
      return {
        level: "High / Strong",
        color: "bg-orange-500",
        description: "Uncomfortable wind",
      };
    return {
      level: "Very High / Gale",
      color: "bg-red-600",
      description: "Dangerous",
    };
  }

  // Determine primary reason from hazard.reasons
  function determinePrimaryReason(reasons?: string[] | null) {
    if (!reasons || reasons.length === 0) return null;
    const r = reasons.join("|").toLowerCase();
    if (r.includes("wind")) return "wind";
    if (r.includes("waves") || r.includes("wave")) return "waves";
    if (r.includes("current")) return "current";
    if (r.includes("thunderstorm") || r.includes("weather")) return "weather";
    return "other";
  }

  // Safe accessor for hazard.reasons that works when hazard may be a lightweight fallback object
  function getHazardReasons(h: any): string[] | undefined {
    return Array.isArray((h as HazardResult | any)?.reasons)
      ? (h as HazardResult).reasons
      : undefined;
  }

  // Midpoint between two lat/lngs (simple average, ok for short distances)
  function midpoint(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ) {
    return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  }

  const handleMapClick = (event: mapboxgl.MapLayerMouseEvent) => {
    const { lng, lat } = event.lngLat;
    const dest = { lat, lng };
    // Don't immediately use the clicked point; ask user to confirm
    setPendingManualDestination(dest);
  };

  const handleHotspotSelect = (hotspot: (typeof mockHotspots)[0]) => {
    setSelectedHotspot(hotspot);
    setManualDestination(null);
    setViewState({
      ...viewState,
      longitude: hotspot.lng,
      latitude: hotspot.lat,
      zoom: 10,
      // transitionDuration: 1000, // Context state might not support transitionDuration if not typed, removing for safety or adding to type if needed.
    });
  };

  // Weather state for the currently targeted location (selected hotspot OR manual map click)
  const [localWeather, setLocalWeather] = useState<OpenMeteoResult | null>(
    null
  );
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Determine the coordinates we should fetch weather for: manualDestination overrides hotspot
  // IMPORTANT: do not fetch on map pan/scroll — return null when neither manual nor hotspot is selected
  const targetCoords = useMemo(() => {
    if (manualDestination) return manualDestination;
    if (selectedHotspot)
      return { lat: selectedHotspot.lat, lng: selectedHotspot.lng };
    return null;
  }, [manualDestination, selectedHotspot]);

  // Fetch weather whenever the target coordinates change (only when non-null)
  useEffect(() => {
    let cancelled = false;
    setLocalWeather(null);
    setWeatherError(null);
    if (!targetCoords) return;
    (async () => {
      try {
        const w = await fetchOpenMeteo(targetCoords.lat, targetCoords.lng);
        if (!cancelled) setLocalWeather(w);
      } catch (err: any) {
        if (!cancelled) setWeatherError(String(err.message || err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetCoords]);

  // Fetch marine data for the selected destination (manual or hotspot) to show wave/current
  useEffect(() => {
    let cancelled = false;
    setDestinationMarine(null);
    setDestinationMarineError(null);
    setDestinationSST(null);
    setDestinationSSTError(null);
    setDestinationSSTLoading(false);
    if (!targetCoords) return;
    (async () => {
      try {
        setDestinationSSTLoading(true);
        const [m, sstRes] = await Promise.all([
          fetchMarineData(targetCoords.lat, targetCoords.lng, {
            hourly: [
              "wave_height",
              "wave_direction",
              "ocean_current_velocity",
              "ocean_current_direction",
            ],
            daily: "wave_height_max",
            timezone: "UTC",
          }),
          fetchSeaSurfaceTemperature(targetCoords.lat, targetCoords.lng, {
            timezone: "UTC",
          }),
        ]);

        if (!cancelled) {
          setDestinationMarine(m);

          // Choose SST nearest to now (fallback to first value)
          let sstVal: number | null = null;
          if (sstRes && Array.isArray(sstRes.time) && sstRes.time.length > 0) {
            const nowMs = Date.now();
            let nearestIdx = 0;
            let minDiff = Infinity;
            for (let i = 0; i < sstRes.time.length; i++) {
              const t = sstRes.time[i];
              // t can be Date|null; accept Date or parseable string
              if (!(t instanceof Date)) {
                // if the helper returned a string (unexpected), try to parse
                try {
                  if (typeof t === "string") {
                    const parsed = new Date(t);
                    if (!isNaN(parsed.getTime())) {
                      const diff = Math.abs(parsed.getTime() - nowMs);
                      if (diff < minDiff) {
                        minDiff = diff;
                        nearestIdx = i;
                      }
                    }
                  }
                } catch (e) {
                  continue;
                }
                continue;
              }
              const diff = Math.abs(t.getTime() - nowMs);
              if (diff < minDiff) {
                minDiff = diff;
                nearestIdx = i;
              }
            }
            sstVal = sstRes.sea_surface_temperature?.[nearestIdx] ?? null;
            // If nearest index yields null, try to fall back to the first non-null value
            if (
              sstVal == null &&
              Array.isArray(sstRes.sea_surface_temperature)
            ) {
              for (let j = 0; j < sstRes.sea_surface_temperature.length; j++) {
                const v = sstRes.sea_surface_temperature[j];
                if (v !== null && v !== undefined) {
                  sstVal = Number(v);
                  break;
                }
              }
            }
          } else if (
            sstRes &&
            Array.isArray(sstRes.sea_surface_temperature) &&
            sstRes.sea_surface_temperature.length > 0
          ) {
            // fallback: first element
            sstVal = sstRes.sea_surface_temperature[0];
            if (sstVal == null) {
              for (let j = 0; j < sstRes.sea_surface_temperature.length; j++) {
                const v = sstRes.sea_surface_temperature[j];
                if (v !== null && v !== undefined) {
                  sstVal = Number(v);
                  break;
                }
              }
            }
          }

          if (sstVal == null) {
            // helpful debug info when SST exists but couldn't be picked
            // inspect `sstRes.rawHourly` in browser console
            // eslint-disable-next-line no-console
            console.debug(
              "SST helper returned no usable value:",
              sstRes?.rawHourly
            );

            // Fallback: try to read directly from the raw marine response `m.hourly` (ISO time strings)
            try {
              if (m?.hourly && Array.isArray(m.hourly.time)) {
                const fallbackIdx = findNearestHourlyIndex(
                  m.hourly.time,
                  new Date()
                );
                const fallbackVal =
                  m.hourly.sea_surface_temperature?.[fallbackIdx];
                if (fallbackVal !== null && fallbackVal !== undefined) {
                  sstVal = Number(fallbackVal);
                  // eslint-disable-next-line no-console
                  console.debug(
                    "SST fallback used m.hourly value at index",
                    fallbackIdx,
                    sstVal
                  );
                }
              }
            } catch (e) {
              // eslint-disable-next-line no-console
              console.debug("SST fallback attempt failed", e);
            }
          }
          setDestinationSST(sstVal ?? null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setDestinationMarineError(String(err?.message ?? err));
          setDestinationSSTError(String(err?.message ?? err));
        }
      } finally {
        if (!cancelled) setDestinationSSTLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetCoords]);

  // Journey parameters for time-based forecasts
  const [boatSpeedKmh, setBoatSpeedKmh] = useState(10); // Default 10 km/h
  const [departureTime, setDepartureTime] = useState<Date>(new Date()); // Default now

  // Route summary for overall assessment
  const [showRouteSummary, setShowRouteSummary] = useState(false);

  // Time optimization: analyze route at different departure times
  const [timeAnalysis, setTimeAnalysis] = useState<Array<{
    departureTime: Date;
    hazardScore: number;
    counts: { LOW: number; MEDIUM: number; HIGH: number; DANGER: number };
    overallStatus: string;
    safePercent?: string;
  }> | null>(null);
  const [analyzingTimes, setAnalyzingTimes] = useState(false);
  const [departureUpdateMessage, setDepartureUpdateMessage] = useState<
    string | null
  >(null);

  // Helper: compute hazard score (lower is better)
  // Scoring: LOW=1, MEDIUM=2, HIGH=5, DANGER=10
  const computeHazardScore = useCallback(
    (counts: { LOW: number; MEDIUM: number; HIGH: number; DANGER: number }) => {
      return (
        counts.LOW * 1 +
        counts.MEDIUM * 2 +
        counts.HIGH * 5 +
        counts.DANGER * 10
      );
    },
    []
  );

  // Helper: check if route is too risky (more than 20% HIGH/DANGER segments)
  const isRouteHighRisk = useCallback(
    (routePoints: typeof routeWeatherPoints) => {
      if (routePoints.length === 0) return false;
      const dangerSegments = routePoints.filter(
        (p) => p.hazard?.level === "HIGH" || p.hazard?.level === "DANGER"
      ).length;
      return dangerSegments / routePoints.length > 0.2;
    },
    []
  );

  // Helper: generate parallel route with simple latitude offset
  // delta_lat: positive = north, negative = south
  // Example: 0.08° ≈ 9 km, 0.1° ≈ 11 km
  // Keep start and end points fixed, only shift intermediate waypoints
  const buildParallelRoute = useCallback(
    (
      mainRoutePoints: Array<{ lat: number; lng: number }>,
      deltaLat: number
    ) => {
      return mainRoutePoints.map((p, idx) => {
        // Keep first and last points at original coordinates
        if (idx === 0 || idx === mainRoutePoints.length - 1) {
          return { lat: p.lat, lng: p.lng };
        }
        // Shift intermediate points
        return {
          lat: p.lat + deltaLat,
          lng: p.lng, // same longitude, shifted latitude
        };
      });
    },
    []
  );

  // Helper: find the nearest hourly index for a given target timestamp
  const findNearestHourlyIndex = useCallback(
    (hourlyTimes: (string | Date)[], targetTime: Date): number => {
      if (!hourlyTimes || hourlyTimes.length === 0) return 0;
      const targetMs = targetTime.getTime();
      let nearestIdx = 0;
      let minDiff = Infinity;

      for (let i = 0; i < hourlyTimes.length; i++) {
        const t = hourlyTimes[i];
        const timeMs = t instanceof Date ? t.getTime() : new Date(t).getTime();
        const diff = Math.abs(timeMs - targetMs);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIdx = i;
        }
      }
      return nearestIdx;
    },
    []
  );

  // Analyze route at multiple departure times to find the safest window
  const analyzeMultipleTimes = useCallback(
    async (
      start: { lat: number; lng: number },
      end: { lat: number; lng: number },
      intervalKm = 15
    ) => {
      if (!start || !end) return;
      setAnalyzingTimes(true);

      try {
        const points = computeIntermediatePoints(start, end, intervalKm);
        const limited = points.slice(0, 100); // Support routes up to 1500km

        // Time windows to analyze: now, +2h, +4h, +6h, +8h
        const timeOffsets = [0, 2, 4, 6, 8];
        const analyses = [];

        for (const offsetHours of timeOffsets) {
          const testDepartureTime = new Date(
            departureTime.getTime() + offsetHours * 3600 * 1000
          );

          // Calculate cumulative distances and ETAs for each point
          let cumulativeDistance = 0;
          const pointsWithETA = limited.map((p, idx) => {
            if (idx > 0) {
              const prevPoint = limited[idx - 1];
              const segmentDistNM = calculateDistance(
                prevPoint.lat,
                prevPoint.lng,
                p.lat,
                p.lng
              );
              cumulativeDistance += segmentDistNM * 1.852;
            }
            const etaHours = cumulativeDistance / boatSpeedKmh;
            const forecastTime = new Date(
              testDepartureTime.getTime() + etaHours * 3600 * 1000
            );
            return {
              p,
              distanceFromStart: cumulativeDistance,
              etaHours,
              forecastTime,
            };
          });

          // Fetch weather and marine data for all points
          const fetches = pointsWithETA.map(({ p, forecastTime }) =>
            Promise.all([
              fetchOpenMeteo(p.lat, p.lng),
              fetchMarineData(p.lat, p.lng, {
                hourly: [
                  "wave_height",
                  "wave_direction",
                  "ocean_current_velocity",
                  "ocean_current_direction",
                ],
                daily: "wave_height_max",
                timezone: "UTC",
              }),
            ]).then(([d, m]) => ({ forecastTime, d, m }))
          );

          const results = await Promise.all(fetches);

          // Count hazards for this time window
          const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, DANGER: 0 };

          results.forEach(({ forecastTime, d, m }) => {
            const hourlyIdx = d.hourly?.time
              ? findNearestHourlyIndex(d.hourly.time, forecastTime)
              : 0;

            const ws =
              d.hourly?.wind_speed_10m?.[hourlyIdx] ??
              d.current?.windspeed ??
              null;
            const weathercode = d.hourly?.weathercode?.[hourlyIdx] ?? null;

            const marineIdx = m.hourly?.time
              ? findNearestHourlyIndex(m.hourly.time, forecastTime)
              : 0;
            const wave_height = m.hourly?.wave_height?.[marineIdx] ?? null;
            const ocean_current_velocity =
              m.hourly?.ocean_current_velocity?.[marineIdx] ?? null;

            const hazard = calculateHazardLevel(
              ws,
              wave_height,
              weathercode,
              ocean_current_velocity
            );
            counts[hazard.level]++;
          });

          const hazardScore = computeHazardScore(counts);
          const total =
            counts.LOW + counts.MEDIUM + counts.HIGH + counts.DANGER;
          const safePercent =
            total > 0 ? ((counts.LOW / total) * 100).toFixed(0) : "0";

          let overallStatus = "Safe";
          if (counts.DANGER > 0) overallStatus = "Dangerous";
          else if (counts.HIGH > 0) overallStatus = "High Risk";
          else if (counts.MEDIUM > total * 0.3) overallStatus = "Moderate Risk";

          analyses.push({
            departureTime: testDepartureTime,
            hazardScore,
            counts,
            overallStatus,
            safePercent,
          });
        }

        // Sort by hazard score (lower is better)
        analyses.sort((a, b) => a.hazardScore - b.hazardScore);
        setTimeAnalysis(analyses);
      } catch (e) {
        console.error("Time analysis error", e);
      } finally {
        setAnalyzingTimes(false);
      }
    },
    [boatSpeedKmh, departureTime, findNearestHourlyIndex, computeHazardScore]
  );

  const fetchRouteWeather = useCallback(
    async (
      start: { lat: number; lng: number },
      end: { lat: number; lng: number },
      intervalKm = 15
    ) => {
      if (!start || !end) return;
      setRouteWeatherLoading(true);
      try {
        const points = computeIntermediatePoints(start, end, intervalKm);

        // Limit total points to avoid flooding the API
        const limited = points.slice(0, 100); // Support routes up to 1500km (100 points * 15km)

        // Calculate cumulative distances and ETAs for each point
        let cumulativeDistance = 0;
        const pointsWithETA = limited.map((p, idx) => {
          if (idx > 0) {
            const prevPoint = limited[idx - 1];
            const segmentDistNM = calculateDistance(
              prevPoint.lat,
              prevPoint.lng,
              p.lat,
              p.lng
            );
            cumulativeDistance += segmentDistNM * 1.852; // Convert NM to km
          }
          const etaHours = cumulativeDistance / boatSpeedKmh;
          const forecastTime = new Date(
            departureTime.getTime() + etaHours * 3600 * 1000
          );
          return {
            p,
            distanceFromStart: cumulativeDistance,
            etaHours,
            forecastTime,
          };
        });

        // For each sampled point, fetch both atmospheric and marine data
        const fetches = pointsWithETA.map(
          ({ p, distanceFromStart, etaHours, forecastTime }) =>
            Promise.all([
              fetchOpenMeteo(p.lat, p.lng),
              fetchMarineData(p.lat, p.lng, {
                hourly: [
                  "wave_height",
                  "wave_direction",
                  "ocean_current_velocity",
                  "ocean_current_direction",
                ],
                daily: "wave_height_max",
                timezone: "UTC",
              }),
            ]).then(([d, m]) => ({
              p,
              distanceFromStart,
              etaHours,
              forecastTime,
              d,
              m,
            }))
        );
        const results = await Promise.all(fetches);

        const mapped = results.map(
          ({ p, distanceFromStart, etaHours, forecastTime, d, m }) => {
            // Find the nearest hourly forecast index for this point's ETA
            const hourlyIdx = d.hourly?.time
              ? findNearestHourlyIndex(d.hourly.time, forecastTime)
              : 0;

            // Use time-aligned forecast values
            const ws =
              d.hourly?.wind_speed_10m?.[hourlyIdx] ??
              d.current?.windspeed ??
              null;
            const pr = d.hourly?.precipitation?.[hourlyIdx] ?? null;
            const weathercode = d.hourly?.weathercode?.[hourlyIdx] ?? null;
            const cat = classifyWind(ws).level;

            // Marine hourly arrays: use time-aligned values
            const marineIdx = m.hourly?.time
              ? findNearestHourlyIndex(m.hourly.time, forecastTime)
              : 0;
            const wave_height = m.hourly?.wave_height?.[marineIdx] ?? null;
            const wave_direction =
              m.hourly?.wave_direction?.[marineIdx] ?? null;
            const ocean_current_velocity =
              m.hourly?.ocean_current_velocity?.[marineIdx] ?? null;
            const ocean_current_direction =
              m.hourly?.ocean_current_direction?.[marineIdx] ?? null;

            // Calculate unified hazard level from wind, waves, weather, and current
            const hazard = calculateHazardLevel(
              ws,
              wave_height,
              weathercode,
              ocean_current_velocity
            );

            return {
              lat: p.lat,
              lng: p.lng,
              distanceFromStart,
              etaHours,
              forecastTime,
              windspeed: ws,
              precipitation: pr,
              weathercode,
              category: cat,
              hazard,
              primaryReason: determinePrimaryReason(
                Array.isArray((hazard as HazardResult).reasons)
                  ? (hazard as HazardResult).reasons
                  : undefined
              ),
              wave_height,
              wave_direction,
              ocean_current_velocity,
              ocean_current_direction,
            };
          }
        );
        setRouteWeatherPoints(mapped);
      } catch (e) {
        console.error("Route weather error", e);
      } finally {
        setRouteWeatherLoading(false);
      }
    },
    [boatSpeedKmh, departureTime, findNearestHourlyIndex]
  );

  // Analyze alternative routes when main route is too risky
  const analyzeAlternativeRoutes = useCallback(
    async (
      start: { lat: number; lng: number },
      end: { lat: number; lng: number },
      intervalKm = 15
    ) => {
      if (!start || !end) return;
      setAnalyzingRoutes(true);

      try {
        const routes = [];

        // 1. Analyze main (direct) route
        const mainPoints = computeIntermediatePoints(start, end, intervalKm);
        const mainWeather = await analyzeRoutePoints(
          mainPoints,
          start,
          end,
          "main",
          0
        );
        routes.push(mainWeather);

        // Check if main route has any risks - only show alternatives if needed
        const mainHasRisks =
          mainWeather.counts.MEDIUM > 0 ||
          mainWeather.counts.HIGH > 0 ||
          mainWeather.counts.DANGER > 0;

        if (!mainHasRisks) {
          // Main route is perfectly safe - no alternatives needed
          setAlternativeRoutes([mainWeather]);
          setOriginalMainRoute(mainWeather.routeWeatherPoints);
          setSelectedRouteType("main");
          setRouteWeatherPoints(mainWeather.routeWeatherPoints);
          return;
        }

        // Generate alternatives to find safer routes
        // 2. North alternative: parallel route shifted +0.08° latitude (~9 km north)
        const deltaLatNorth = 0.08; // ~9 km
        const northPoints = buildParallelRoute(mainPoints, deltaLatNorth);
        const northWeather = await analyzeRoutePoints(
          northPoints,
          start,
          end,
          "north",
          9
        );
        routes.push(northWeather);

        // 3. South alternative: parallel route shifted -0.08° latitude (~9 km south)
        const deltaLatSouth = -0.08; // ~9 km
        const southPoints = buildParallelRoute(mainPoints, deltaLatSouth);
        const southWeather = await analyzeRoutePoints(
          southPoints,
          start,
          end,
          "south",
          9
        );
        routes.push(southWeather);

        // Sort by hazard score (safest first)
        routes.sort((a, b) => a.hazardScore - b.hazardScore);
        setAlternativeRoutes(routes);

        // Store original main route for comparison visualization
        setOriginalMainRoute(mainWeather.routeWeatherPoints);

        // Auto-select the safest route
        if (routes.length > 0) {
          setSelectedRouteType(routes[0].routeType);
          setRouteWeatherPoints(routes[0].routeWeatherPoints);
        }
      } catch (e) {
        console.error("Alternative route analysis error", e);
      } finally {
        setAnalyzingRoutes(false);
      }
    },
    [
      boatSpeedKmh,
      departureTime,
      findNearestHourlyIndex,
      computeHazardScore,
      isRouteHighRisk,
      buildParallelRoute,
    ]
  );

  // Helper: analyze weather for a set of route points
  const analyzeRoutePoints = useCallback(
    async (
      points: Array<{ lat: number; lng: number }>,
      start: { lat: number; lng: number },
      end: { lat: number; lng: number },
      routeType: "main" | "north" | "south",
      offset: number
    ) => {
      const limited = points.slice(0, 100); // Support routes up to 1500km

      // Calculate cumulative distances and ETAs
      let cumulativeDistance = 0;
      const pointsWithETA = limited.map((p, idx) => {
        if (idx > 0) {
          const prevPoint = limited[idx - 1];
          const segmentDistNM = calculateDistance(
            prevPoint.lat,
            prevPoint.lng,
            p.lat,
            p.lng
          );
          cumulativeDistance += segmentDistNM * 1.852;
        }
        const etaHours = cumulativeDistance / boatSpeedKmh;
        const forecastTime = new Date(
          departureTime.getTime() + etaHours * 3600 * 1000
        );
        return {
          p,
          distanceFromStart: cumulativeDistance,
          etaHours,
          forecastTime,
        };
      });

      // Fetch weather data
      const fetches = pointsWithETA.map(
        ({ p, distanceFromStart, etaHours, forecastTime }) =>
          Promise.all([
            fetchOpenMeteo(p.lat, p.lng),
            fetchMarineData(p.lat, p.lng, {
              hourly: [
                "wave_height",
                "wave_direction",
                "ocean_current_velocity",
                "ocean_current_direction",
              ],
              daily: "wave_height_max",
              timezone: "UTC",
            }),
          ]).then(([d, m]) => ({
            p,
            distanceFromStart,
            etaHours,
            forecastTime,
            d,
            m,
          }))
      );

      const results = await Promise.all(fetches);

      // Process results
      const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, DANGER: 0 };
      const mapped = results.map(
        ({ p, distanceFromStart, etaHours, forecastTime, d, m }, idx) => {
          const idx_forecast = findNearestHourlyIndex(
            d?.hourly?.time ?? [],
            forecastTime
          );
          const ws = d?.hourly?.wind_speed_10m?.[idx_forecast] ?? null;
          const wd = d?.hourly?.wind_direction_10m?.[idx_forecast] ?? null;
          const gusts = d?.hourly?.windgusts_10m?.[idx_forecast] ?? null;
          const precip = d?.hourly?.precipitation?.[idx_forecast] ?? null;
          const weathercode = d?.hourly?.weathercode?.[idx_forecast] ?? null;

          const wave_height = m?.hourly?.wave_height?.[idx_forecast] ?? null;
          const wave_direction =
            m?.hourly?.wave_direction?.[idx_forecast] ?? null;
          const ocean_current_velocity =
            m?.hourly?.ocean_current_velocity?.[idx_forecast] ?? null;
          const ocean_current_direction =
            m?.hourly?.ocean_current_direction?.[idx_forecast] ?? null;

          const hazard = calculateHazardLevel(
            ws,
            wave_height,
            weathercode,
            ocean_current_velocity
          );
          counts[hazard.level]++;

          return {
            ...p,
            windspeed: ws,
            wind_direction: wd,
            windgusts: gusts,
            precipitation: precip,
            weathercode,
            wave_height,
            wave_direction,
            ocean_current_velocity,
            ocean_current_direction,
            distanceFromStart,
            etaHours,
            forecastTime,
            hazard,
            primaryReason: determinePrimaryReason(getHazardReasons(hazard)),
          };
        }
      );

      const hazardScore = computeHazardScore(counts);

      return {
        points,
        routeWeatherPoints: mapped,
        hazardScore,
        counts,
        routeType,
        offset,
      };
    },
    [boatSpeedKmh, departureTime, findNearestHourlyIndex, computeHazardScore]
  );

  // No automatic scanning: route markers remain empty until the user clicks 'Scan'
  if (!mapboxToken) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-lg border border-destructive">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-bold text-destructive">
          Mapbox Token Missing
        </h3>
        <p className="text-muted-foreground">
          Please add VITE_MAPBOX_TOKEN to your .env file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Container - Full Width */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 h-[600px] relative">
          {/* Route Status Legend (overlaid on map) */}
          {alternativeRoutes.length > 1 && (
            <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg border-2 border-slate-200 dark:border-slate-700 p-4 max-w-sm">
              {selectedRouteType === "main" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      Direct Route Selected
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                    ✅ Direct route is the safest option for this trip.
                  </p>
                </div>
              ) : (
                (() => {
                  const mainRoute = alternativeRoutes.find(
                    (r) => r.routeType === "main"
                  );
                  if (!mainRoute) return null;

                  const total =
                    mainRoute.counts.LOW +
                    mainRoute.counts.MEDIUM +
                    mainRoute.counts.HIGH +
                    mainRoute.counts.DANGER;
                  const mediumHighPercent =
                    ((mainRoute.counts.MEDIUM +
                      mainRoute.counts.HIGH +
                      mainRoute.counts.DANGER) /
                      total) *
                    100;
                  const highDangerPercent =
                    ((mainRoute.counts.HIGH + mainRoute.counts.DANGER) /
                      total) *
                    100;

                  let riskLabel = "Elevated Risk";
                  let riskColor = "text-yellow-700";
                  let dashColor = "bg-yellow-600";

                  if (highDangerPercent > 20) {
                    riskLabel = "High Risk";
                    riskColor = "text-red-700";
                    dashColor = "bg-red-600";
                  } else if (mediumHighPercent > 30) {
                    riskLabel = "Moderate Risk";
                    riskColor = "text-orange-700";
                    dashColor = "bg-orange-600";
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-1 ${dashColor} opacity-40`}
                          style={{ borderStyle: "dashed" }}
                        ></div>
                        <span
                          className={`text-sm font-bold ${
                            riskColor === "text-red-700"
                              ? "text-red-700 dark:text-red-400"
                              : riskColor === "text-orange-700"
                              ? "text-orange-700 dark:text-orange-400"
                              : "text-yellow-700 dark:text-yellow-400"
                          }`}
                        >
                          Original Route ({riskLabel})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-1.5 bg-green-500 rounded"></div>
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">
                          Suggested:{" "}
                          {selectedRouteType === "north"
                            ? "Northern"
                            : "Southern"}{" "}
                          Route
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                        ✅ Safer alternative ~22 km{" "}
                        {selectedRouteType === "north" ? "north" : "south"} with
                        lower hazard exposure.
                      </p>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* No Safe Route Warning */}
          {alternativeRoutes.length > 1 &&
            (() => {
              const allRoutesHighRisk = alternativeRoutes.every((r) => {
                const total =
                  r.counts.LOW +
                  r.counts.MEDIUM +
                  r.counts.HIGH +
                  r.counts.DANGER;
                return (r.counts.HIGH + r.counts.DANGER) / total > 0.4; // More than 40% high risk
              });

              if (allRoutesHighRisk) {
                return (
                  <div className="absolute bottom-12 left-4 z-10 bg-red-600 text-white rounded-xl shadow-xl border-2 border-red-800 p-4 max-w-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⛔</span>
                      <div>
                        <p className="text-base font-bold mb-1">
                          No Safe Route Found
                        </p>
                        <p className="text-sm leading-snug">
                          All routes have high-risk conditions.{" "}
                          <strong>Please delay your trip</strong> or follow
                          official weather warnings.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          {/* Geolocation overlay (retry / status) */}
          <div className="absolute top-4 right-14 z-20">
            <div className="glass-card p-3 rounded-xl shadow-lg border border-white/40 dark:border-slate-700 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 flex flex-col gap-2 min-w-[200px]">
              {userLocation ? (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Using your location
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Lat: {userLocation.lat.toFixed(4)}</span>
                      <span>Lng: {userLocation.lng.toFixed(4)}</span>
                    </div>
                    {userLocationMeta?.accuracy && (
                      <div className="text-[10px] text-slate-400 text-right">
                        ±{userLocationMeta.accuracy.toFixed(0)}m accuracy
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-1">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-2 rounded-lg transition-colors shadow-sm"
                      onClick={() => {
                        setViewState({
                          ...viewState,
                          longitude: userLocation.lng,
                          latitude: userLocation.lat,
                          zoom: 10,
                        });
                      }}
                      title="Recenter Map"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      Recenter
                    </button>
                    <button
                      className="flex items-center justify-center p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                      onClick={() => {
                        setUserLocation({
                          lat: viewState.latitude,
                          lng: viewState.longitude,
                        });
                        setUserLocationMeta({
                          source: "manual",
                          timestamp: Date.now(),
                          accuracy: null,
                        });
                        setGeolocationError(null);
                      }}
                      title="Set Location to Map Center"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg shadow-md transition-all active:scale-95"
                    onClick={() => requestGeolocation()}
                  >
                    <Locate className="w-4 h-4" />
                    Use My Location
                  </button>

                  {geolocationError && (
                    <div className="bg-red-50 border border-red-100 rounded p-1.5">
                      <p className="text-[10px] text-red-600 leading-tight">
                        {geolocationError}
                      </p>
                    </div>
                  )}

                  <button
                    className="text-[10px] text-slate-500 hover:text-purple-600 underline decoration-dotted underline-offset-2 text-center transition-colors"
                    onClick={() => {
                      setUserLocation({
                        lat: viewState.latitude,
                        lng: viewState.longitude,
                      });
                      setUserLocationMeta({
                        source: "manual",
                        timestamp: Date.now(),
                        accuracy: null,
                      });
                      setGeolocationError(null);
                    }}
                  >
                    Or use map center instead
                  </button>

                  {manualDestination && (
                    <button
                      className="text-[10px] text-slate-500 hover:text-purple-600 underline decoration-dotted underline-offset-2 text-center transition-colors mt-1"
                      onClick={() => {
                        setUserLocation({
                          lat: manualDestination.lat,
                          lng: manualDestination.lng,
                        });
                        setUserLocationMeta({
                          source: "manual",
                          timestamp: Date.now(),
                          accuracy: null,
                        });
                        setGeolocationError(null);
                      }}
                    >
                      Use clicked point
                    </button>
                  )}
                </>
              )}
            </div>
          </div>



          <Map
            key={isDarkMode ? "dark-map" : "light-map"}
            {...viewState}
            ref={mapRef}
            onMove={(evt) => setViewState(evt.viewState)}
            onLoad={() => setIsMapLoaded(true)}
            style={{ width: "100%", height: "100%" }}
            mapStyle={
              isDarkMode
                ? "mapbox://styles/thenushan05/cmieo0ph6005b01qtfshv5owu"
                : "mapbox://styles/mapbox/outdoors-v12"
            }
            mapboxAccessToken={mapboxToken}
            onClick={handleMapClick}
          >
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
            <ScaleControl />

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                longitude={userLocation.lng}
                latitude={userLocation.lat}
                anchor="center"
              >
                <div
                  className="relative flex items-center justify-center w-6 h-6"
                  title="Your Current Location"
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                </div>
              </Marker>
            )}

            {/* Hotspot Markers */}
            {mockHotspots.map((hotspot, idx) => (
              <Marker
                key={idx}
                longitude={hotspot.lng}
                latitude={hotspot.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleHotspotSelect(hotspot);
                }}
              >
                <div
                  title={`${hotspot.species} Hotspot - ${(
                    hotspot.probability * 100
                  ).toFixed(0)}% probability`}
                >
                  <MapPin
                    className={`h-8 w-8 transition-all cursor-pointer ${
                      selectedHotspot === hotspot && !manualDestination
                        ? "text-primary scale-125 drop-shadow-lg"
                        : "text-primary/70 hover:scale-110"
                    }`}
                    fill="currentColor"
                  />
                </div>
              </Marker>
            ))}

            {/* Selected Hotspot Popup (only when a hotspot is selected and not manual destination) */}
            {!manualDestination && selectedHotspot && (
              <Popup
                className="mapbox-popup"
                longitude={selectedHotspot.lng}
                latitude={selectedHotspot.lat}
                anchor="top"
                closeButton={false}
                closeOnClick={false}
                offset={10}
              >
                <div className="glass-card relative p-3 min-w-[160px] text-foreground rounded-lg">
                  <button
                    aria-label="Close"
                    className="absolute -top-3 -right-3 glass-close z-20"
                    onClick={() => setSelectedHotspot(null)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="text-center">
                    <p className="font-bold text-sm">
                      {selectedHotspot.species}
                    </p>
                    <Badge
                      variant={
                        selectedHotspot.probability > 0.8
                          ? "default"
                          : "secondary"
                      }
                      className="mt-1"
                    >
                      {(selectedHotspot.probability * 100).toFixed(0)}%
                      Probability
                    </Badge>
                  </div>
                </div>
              </Popup>
            )}

            {/* Manual Destination Marker */}
            {/* Pending manual destination requires confirmation before scanning */}
            {pendingManualDestination && (
              <Popup
                className="mapbox-popup"
                longitude={pendingManualDestination.lng}
                latitude={pendingManualDestination.lat}
                anchor="top"
                closeButton={false}
                closeOnClick={false}
                offset={10}
              >
                <div className="glass-card relative p-3 min-w-[200px] text-foreground rounded-lg text-xs">
                  <button
                    aria-label="Close"
                    className="absolute -top-3 -right-3 glass-close z-20"
                    onClick={() => setPendingManualDestination(null)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <p className="font-medium mb-2">Confirm destination?</p>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-primary text-white text-xs"
                      onClick={() => {
                        const dest = pendingManualDestination;
                        if (!dest) return;
                        setPendingManualDestination(null);
                        setManualDestination(dest);
                        // Clear previous alternative routes when setting new destination
                        setAlternativeRoutes([]);
                        setSelectedRouteType("main");
                        setOriginalMainRoute([]);
                        // Start from userLocation if available, otherwise use current view center
                        const start = userLocation ?? {
                          lat: viewState.latitude,
                          lng: viewState.longitude,
                        };
                        void fetchRouteWeather(start, dest, 15);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="px-3 py-1 rounded border text-xs"
                      onClick={() => setPendingManualDestination(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Popup>
            )}



            {/* Original route outline (dashed red when alternative is selected) */}
            {isMapLoaded && originalRouteOutline && (
              <Source
                id="route-original-outline"
                type="geojson"
                data={originalRouteOutline as any}
              >
                <Layer {...originalRouteOutlineLayer} />
              </Source>
            )}

            {/* Hazard-colored Route Segments */}
            {isMapLoaded && routeSegments.length > 0 && (
              <Source
                id="route-segments"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: routeSegments,
                }}
              >
                <Layer
                  {...createRouteLayer("LOW", selectedRouteType !== "main")}
                />
                <Layer
                  {...createRouteLayer("MEDIUM", selectedRouteType !== "main")}
                />
                <Layer
                  {...createRouteLayer("HIGH", selectedRouteType !== "main")}
                />
                <Layer
                  {...createRouteLayer("DANGER", selectedRouteType !== "main")}
                />
              </Source>
            )}

            {/* Fallback Route Line (before weather scan) */}
            {isMapLoaded && routeGeoJSON && (
              <Source
                id="route-default"
                type="geojson"
                data={routeGeoJSON as any}
              >
                <Layer {...defaultRouteLayer} />
              </Source>
            )}

            {/* Weather hazard markers removed to reduce map clutter */}

            {/* Route weather markers (sampled points) */}
            {routeWeatherPoints.map((pt, idx) => {
              const hazard = pt.hazard ?? {
                level: "LOW",
                bgColor: "bg-gray-400",
                description: "Unknown",
              };
              const isDanger = hazard.level === "DANGER";
              const isHigh = hazard.level === "HIGH";
              const showWarning = isDanger || isHigh;

              // Determine primary reason for icon selection
              const _reasons = getHazardReasons(hazard);
              const primaryReason =
                _reasons && _reasons.length > 0
                  ? determinePrimaryReason(_reasons)
                  : null;

              const etaText =
                pt.etaHours !== undefined
                  ? ` • ETA: +${pt.etaHours.toFixed(1)}h`
                  : "";
              const arrivalText = pt.forecastTime
                ? ` (${pt.forecastTime.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })})`
                : "";

              const title =
                `${hazard.level} - ${hazard.description}${etaText}${arrivalText}` +
                (pt.windspeed
                  ? ` • Wind ${pt.windspeed.toFixed(1)} km/h`
                  : "") +
                (pt.wave_height
                  ? ` • Waves ${pt.wave_height.toFixed(1)} m`
                  : "") +
                (pt.ocean_current_velocity
                  ? ` • Current ${pt.ocean_current_velocity.toFixed(2)} m/s`
                  : "");

              return (
                <Marker
                  key={`route-weather-${idx}`}
                  longitude={pt.lng}
                  latitude={pt.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedRoutePoint(pt);
                  }}
                >
                  <div className="relative flex items-center justify-center cursor-pointer group transition-transform hover:scale-110">
                    {/* Modern Glassmorphism Marker with Icon */}
                    <div
                      title={title}
                      className={`
                        flex items-center justify-center backdrop-blur-md shadow-sm border border-white/40
                        transition-all duration-300
                        ${
                          hazard.level === "DANGER"
                            ? "bg-red-500/90 shadow-red-500/20"
                            : hazard.level === "HIGH"
                            ? "bg-orange-500/90 shadow-orange-500/20"
                            : hazard.level === "MEDIUM"
                            ? "bg-yellow-500/90 shadow-yellow-500/20"
                            : "bg-emerald-500/90 shadow-emerald-500/20"
                        }
                        ${showWarning ? "w-6 h-6 ring-2 ring-red-500/30" : "w-5 h-5"}
                        rounded-lg
                      `}
                    >
                      {/* Icon is always visible now, but small and neat */}
                      {primaryReason === "wind" ? (
                        <Wind className="h-3 w-3 text-white" />
                      ) : primaryReason === "waves" ? (
                        <Waves className="h-3 w-3 text-white" />
                      ) : primaryReason === "current" ? (
                        <Droplets className="h-3 w-3 text-white" />
                      ) : primaryReason === "weather" ? (
                        <CloudLightning className="h-3 w-3 text-white" />
                      ) : isDanger ? (
                        <AlertTriangle className="h-3 w-3 text-white" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90" />
                      )}
                    </div>

                    {/* Subtle indicator for high risk */}
                    {isDanger && !primaryReason && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    )}
                  </div>
                </Marker>
              );
            })}

            {/* Mid-segment primary reason icons removed to reduce map clutter */}

            {/* Alternative route indicator - show which route is selected */}
            {alternativeRoutes.length > 1 &&
              selectedRouteType !== "main" &&
              userLocation && (
                <Marker
                  longitude={userLocation.lng}
                  latitude={
                    userLocation.lat +
                    (selectedRouteType === "north" ? 0.05 : -0.05)
                  }
                  anchor="center"
                >
                  <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {selectedRouteType === "north"
                      ? "⬆️ Northern Route"
                      : "⬇️ Southern Route"}
                  </div>
                </Marker>
              )}

            {manualDestination && (
              <Marker
                longitude={manualDestination.lng}
                latitude={manualDestination.lat}
                anchor="bottom"
                offset={[0, -10]} // Lift it up slightly to sit "on top" of any hazard icon
                style={{ zIndex: 9999 }}
              >
                <div className="relative group cursor-pointer" title="Destination">
                  {/* Sleek Professional Pin - Purple & Larger */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 bg-purple-600 rounded-full shadow-2xl border-[3px] border-white transform transition-transform group-hover:scale-110 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div className="w-1 h-4 bg-purple-600/90 rounded-b-full" />
                  </div>
                  {/* Shadow base */}
                  <div className="absolute top-[95%] left-1/2 -translate-x-1/2 w-5 h-2 bg-black/40 rounded-full blur-[2px]" />
                  
                  {/* Label */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <span className="bg-purple-900/95 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md border border-purple-500/30">
                      Destination
                    </span>
                  </div>
                </div>
              </Marker>
            )}

            {/* Route Point Hazard Popup */}
            {selectedRoutePoint && (
              <Popup
                className="mapbox-popup"
                longitude={selectedRoutePoint.lng}
                latitude={selectedRoutePoint.lat}
                anchor="top"
                closeButton={false}
                closeOnClick={false}
                onClose={() => setSelectedRoutePoint(null)}
                offset={10}
                maxWidth="400px"
              >
                <div className="glass-card rounded-xl shadow-xl overflow-hidden min-w-[320px] backdrop-blur-md bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/50">
                  {/* Header with Risk Level */}
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-b ${
                      selectedRoutePoint.hazard?.level === "DANGER"
                        ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                        : selectedRoutePoint.hazard?.level === "HIGH"
                        ? "bg-orange-100 text-orange-700 border-orange-200"
                        : selectedRoutePoint.hazard?.level === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-green-100 text-green-700 border-green-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedRoutePoint.hazard?.level === "DANGER" ||
                      selectedRoutePoint.hazard?.level === "HIGH" ? (
                        <AlertTriangle className="h-6 w-6" />
                      ) : (
                        <ShieldCheck className="h-6 w-6" />
                      )}
                      <span className="font-extrabold text-base tracking-wide uppercase drop-shadow-sm">
                        {selectedRoutePoint.hazard?.level ?? "UNKNOWN"} Risk
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedRoutePoint(null)}
                      className="hover:bg-black/20 rounded-full p-1 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Primary Reason Badge */}
                    {(() => {
                      const rs = getHazardReasons(selectedRoutePoint.hazard);
                      if (!rs || rs.length === 0) return null;
                      const primary = determinePrimaryReason(rs);
                      if (!primary) return null;
                      return (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          {primary === "wind" ? (
                            <Wind className="h-4 w-4 text-slate-700 dark:text-slate-400" />
                          ) : primary === "waves" ? (
                            <Waves className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                          ) : primary === "current" ? (
                            <Droplets className="h-4 w-4 text-sky-700 dark:text-sky-400" />
                          ) : (
                            <CloudLightning className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                          )}
                          <span className="uppercase">
                            Primary Factor: {primary}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Journey Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mb-0.5">
                          Distance
                        </div>
                        <div className="text-sm font-black text-black dark:text-white">
                          {selectedRoutePoint.distanceFromStart?.toFixed(1) ??
                            "--"}{" "}
                          <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                            km
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mb-0.5">
                          ETA
                        </div>
                        <div className="text-sm font-black text-black dark:text-white">
                          +{selectedRoutePoint.etaHours?.toFixed(1) ?? "--"}{" "}
                          <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                            hrs
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Weather Metrics List */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400 font-medium">
                          <Wind className="h-4 w-4" />
                          <span>Wind Speed</span>
                        </div>
                        <span className="font-bold text-black dark:text-white">
                          {selectedRoutePoint.windspeed?.toFixed(1) ?? "--"}{" "}
                          km/h
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400 font-medium">
                          <Waves className="h-4 w-4" />
                          <span>Wave Height</span>
                        </div>
                        <span className="font-bold text-black dark:text-white">
                          {selectedRoutePoint.wave_height?.toFixed(1) ?? "--"} m
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400 font-medium">
                          <Droplets className="h-4 w-4" />
                          <span>Current</span>
                        </div>
                        <span className="font-bold text-black dark:text-white">
                          {selectedRoutePoint.ocean_current_velocity?.toFixed(
                            2
                          ) ?? "--"}{" "}
                          m/s
                        </span>
                      </div>
                    </div>

                    {/* Footer: Location & Time */}
                    <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedRoutePoint.lat.toFixed(3)}°N,{" "}
                        {selectedRoutePoint.lng.toFixed(3)}°E
                      </div>
                      {selectedRoutePoint.forecastTime && (
                        <div>
                          {selectedRoutePoint.forecastTime.toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            )}

            {/* Weather Hazard Popup */}
            {selectedHazard && (
              <Popup
                className="mapbox-popup"
                longitude={selectedHazard.lng}
                latitude={selectedHazard.lat}
                anchor="bottom"
                closeButton={false}
                closeOnClick={false}
                onClose={() => setSelectedHazard(null)}
                offset={15}
              >
                <div className="glass-card relative p-3 min-w-[200px] text-foreground rounded-lg">
                  <button
                    aria-label="Close"
                    className="absolute -top-3 -right-3 glass-close z-20"
                    onClick={() => setSelectedHazard(null)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedHazard.type === "storm" ? (
                      <CloudLightning className="h-5 w-5 text-red-500" />
                    ) : selectedHazard.type === "tornado" ? (
                      <Tornado className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Waves className="h-5 w-5 text-blue-500" />
                    )}
                    <p className="font-bold text-sm text-foreground">
                      {selectedHazard.type === "storm"
                        ? "Storm Warning"
                        : selectedHazard.type === "tornado"
                        ? "Tornado Warning"
                        : "High Waves"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {selectedRoutePoint.hazard?.description ?? "No data"}
                  </p>

                  {/* Show explicit reasons when available */}
                  {(() => {
                    const rs = getHazardReasons(selectedRoutePoint.hazard);
                    if (!rs || rs.length === 0) return null;
                    return (
                      <div className="mb-3 text-xs">
                        <p className="font-semibold text-[11px] mb-1">Why:</p>
                        <ul className="list-disc pl-4 text-[11px] text-muted-foreground">
                          {rs.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={
                        selectedHazard.severity === "high"
                          ? "destructive"
                          : selectedHazard.severity === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className="w-fit"
                    >
                      {selectedHazard.severity.toUpperCase()} Severity
                    </Badge>
                    {selectedHazard.windSpeed && (
                      <p className="text-xs text-foreground">
                        Wind: {selectedHazard.windSpeed} knots
                      </p>
                    )}
                    {selectedHazard.waveHeight && (
                      <p className="text-xs text-foreground">
                        Wave Height: {selectedHazard.waveHeight}m
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Map>

          {/* Jaffna controls overlay - passes the mapRef so it can add/update hotspot layer */}
          <JaffnaHotspotControls mapRef={mapRef} />
        </CardContent>
      </Card>

      {/* Route Safety Summary (modern, compact) */}
      {routeSummary && (
        <div className="space-y-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Recommended: {displayRoutes[0]?.title} Route
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Based on current weather, wind, and wave conditions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayRoutes.map((r) => {
                  const isSelected = selectedRouteType === r.routeType;
                  const isSafest =
                    r.hazardScore ===
                    Math.min(...displayRoutes.map((d) => d.hazardScore));
                  let riskColor = "text-green-600";
                  let riskBg = "bg-green-50";
                  let borderColor = "border-slate-200";

                  if (r.hazardScore > 50 || r.counts.DANGER > 0) {
                    riskColor = "text-red-600";
                    riskBg = "bg-red-50";
                  } else if (
                    r.hazardScore > 20 ||
                    r.counts.HIGH > 0 ||
                    r.counts.MEDIUM > 5
                  ) {
                    riskColor = "text-yellow-600";
                    riskBg = "bg-yellow-50";
                  }

                  if (isSelected) {
                    borderColor = "border-primary ring-2 ring-primary/20";
                  }

                  const riskLabel =
                    r.hazardScore > 50 || r.counts.DANGER > 0
                      ? "High Risk"
                      : r.hazardScore > 20 ||
                        r.counts.HIGH > 0 ||
                        r.counts.MEDIUM > 5
                      ? "Medium Risk"
                      : "Safe";

                  return (
                    <div
                      key={r.routeType}
                      onClick={() => {
                        setSelectedRouteType(r.routeType as any);
                        if (alternativeRoutes.length > 0) {
                          const chosen = alternativeRoutes.find(
                            (ar) => ar.routeType === r.routeType
                          );
                          if (chosen) {
                            setRouteWeatherPoints(chosen.routeWeatherPoints);
                            setOriginalMainRoute(chosen.routeWeatherPoints);
                          }
                        }
                      }}
                      className={`relative cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-md rounded-xl border-2 ${borderColor} bg-white dark:bg-slate-800 p-4`}
                    >
                      {isSafest && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          BEST OPTION
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                            }`}
                          >
                            {r.routeType === "north" ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : r.routeType === "south" ? (
                              <ArrowDown className="w-4 h-4" />
                            ) : (
                              <Compass className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={`font-semibold ${
                              isSelected
                                ? "text-primary"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {r.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <div className="flex items-end gap-2 mb-2">
                        <span className={`text-3xl font-bold ${riskColor}`}>
                          {r.hazardScore}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                          Risk Score
                        </span>
                      </div>

                      <div
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${riskBg} ${riskColor}`}
                      >
                        {riskLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Time Analysis Results */}
      {timeAnalysis && timeAnalysis.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🕐 Departure Time Recommendations
            </CardTitle>
            <CardDescription>
              Route analyzed at different departure times to find the safest
              window
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeAnalysis.map((analysis, idx) => {
                const isRecommended = idx === 0; // First item has lowest hazard score
                const isCurrent =
                  Math.abs(
                    analysis.departureTime.getTime() - departureTime.getTime()
                  ) < 60000;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isRecommended
                        ? "bg-green-50 dark:bg-green-950 border-green-500"
                        : isCurrent
                        ? "bg-blue-50 dark:bg-blue-950 border-blue-400"
                        : "bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-foreground">
                            {analysis.departureTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            {analysis.departureTime.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          {isRecommended && (
                            <Badge className="bg-green-600 text-white text-xs">
                              ⭐ Safest
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              analysis.overallStatus === "Safe"
                                ? "bg-green-100 text-green-700 border-green-400"
                                : analysis.overallStatus === "Moderate Risk"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-400"
                                : analysis.overallStatus === "High Risk"
                                ? "bg-orange-100 text-orange-700 border-orange-400"
                                : "bg-red-100 text-red-700 border-red-400"
                            }`}
                          >
                            {analysis.overallStatus}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {analysis.safePercent}% safe
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • Score: {analysis.hazardScore}
                          </span>
                        </div>

                        <div className="flex gap-1 text-xs">
                          {analysis.counts.LOW > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700 border-green-300"
                            >
                              {analysis.counts.LOW} Safe
                            </Badge>
                          )}
                          {analysis.counts.MEDIUM > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-700 border-yellow-300"
                            >
                              {analysis.counts.MEDIUM} Med
                            </Badge>
                          )}
                          {analysis.counts.HIGH > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-orange-100 text-orange-700 border-orange-300"
                            >
                              {analysis.counts.HIGH} High
                            </Badge>
                          )}
                          {analysis.counts.DANGER > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {analysis.counts.DANGER} Danger
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => {
                            setDepartureTime(analysis.departureTime);
                            setDepartureUpdateMessage(
                              `Departure time updated to ${analysis.departureTime.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )} on ${analysis.departureTime.toLocaleDateString(
                                [],
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}. Re-scanning route with safer conditions...`
                            );
                            setTimeout(
                              () => setDepartureUpdateMessage(null),
                              5000
                            );
                            if (userLocation && destination) {
                              void fetchRouteWeather(
                                userLocation,
                                destination,
                                15
                              );
                            }
                            setTimeAnalysis(null);
                          }}
                          className="px-3 py-1.5 text-xs rounded bg-primary text-white hover:opacity-90 whitespace-nowrap"
                        >
                          Use This Time
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              💡 Tip: Leaving at the recommended time can significantly reduce
              weather-related risks along your route.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safer Route Promo Banner (Show when we have a route but no alternatives yet) */}
      {routeWeatherPoints.length > 0 && alternativeRoutes.length <= 1 && (
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950 dark:to-fuchsia-950 border border-violet-100 dark:border-violet-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg shadow-sm border border-violet-100 dark:border-violet-700">
              <Compass className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-violet-900 dark:text-violet-100">
                Want to find a safer route?
              </h3>
              <p className="text-sm text-violet-700/80 dark:text-violet-300/80">
                Analyze parallel routes ~9 km north/south to find the safest
                path with lower weather risks
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (userLocation && destination) {
                void analyzeAlternativeRoutes(userLocation, destination, 15);
              }
            }}
            disabled={analyzingRoutes}
            className="whitespace-nowrap px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-lg shadow-md shadow-violet-200 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzingRoutes ? (
              <>
                <WiRaindrops className="animate-spin h-5 w-5" />
                Analyzing...
              </>
            ) : (
              <>
                <Compass className="h-4 w-4" />
                Find Safer Route
              </>
            )}
          </button>
        </div>
      )}

      {/* Alternative Routes Results */}
      {alternativeRoutes && alternativeRoutes.length > 1 && (
        <Card className="border-0 shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-slate-900/5 dark:ring-slate-700/50">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Compass className="h-5 w-5 text-violet-200" />
                Alternative Routes Found
              </h3>
              <p className="text-violet-100 text-xs mt-0.5 opacity-90">
                AI analysis of parallel paths (~9km offset) to minimize risk
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-md"
            >
              {alternativeRoutes.length} Options
            </Badge>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Panel: Recommendation & Guide */}
              <div className="lg:col-span-4 space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-2">
                    {alternativeRoutes[0].routeType === "main"
                      ? "Direct Route is Safest"
                      : "Alternative Recommended"}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {alternativeRoutes[0].routeType === "main"
                      ? "The direct path has the lowest cumulative risk score based on current weather conditions."
                      : `The ${alternativeRoutes[0].routeType}ern route avoids higher risk areas found on the direct path.`}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="text-lg">💡</span> How to use
                  </h5>
                  <ul className="space-y-2.5">
                    <li className="flex gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold">
                        1
                      </span>
                      <span>
                        Select a route card to visualize it on the map.
                      </span>
                    </li>
                    <li className="flex gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold">
                        2
                      </span>
                      <span>Compare risk scores (lower is better).</span>
                    </li>
                    <li className="flex gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold">
                        3
                      </span>
                      <span>
                        Check for{" "}
                        <span className="text-red-500 font-medium">
                          red segments
                        </span>{" "}
                        indicating danger.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Panel: Route Cards */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                  {alternativeRoutes.map((route) => {
                    const isSelected = selectedRouteType === route.routeType;
                    const isBest = route === alternativeRoutes[0];
                    const total =
                      route.counts.LOW +
                      route.counts.MEDIUM +
                      route.counts.HIGH +
                      route.counts.DANGER;
                    const safePercent =
                      total > 0
                        ? Math.round((route.counts.LOW / total) * 100)
                        : 0;

                    return (
                      <div
                        key={route.routeType}
                        onClick={() => {
                          setSelectedRouteType(route.routeType);
                          setRouteWeatherPoints(route.routeWeatherPoints);
                        }}
                        className={`
                          relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 flex flex-col justify-between group
                          ${
                            isSelected
                              ? "border-violet-600 dark:border-violet-500 bg-violet-50/50 dark:bg-violet-950/50 shadow-md scale-[1.02]"
                              : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-sm"
                          }
                        `}
                      >
                        {isBest && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            RECOMMENDED
                          </div>
                        )}

                        <div className="space-y-1 text-center mb-4">
                          <div
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isSelected
                                ? "text-violet-700 dark:text-violet-300"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {route.routeType === "main"
                              ? "Direct"
                              : `${route.routeType}ern`}
                          </div>
                          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {route.hazardScore}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Risk Score
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs border-t border-slate-100 pt-3">
                            <span className="text-slate-500">Safety</span>
                            <span
                              className={`font-bold ${
                                safePercent > 80
                                  ? "text-green-600"
                                  : safePercent > 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {safePercent}%
                            </span>
                          </div>
                          {/* Mini visual bar */}
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{
                                width: `${(route.counts.LOW / total) * 100}%`,
                              }}
                              className="bg-green-400"
                            />
                            <div
                              style={{
                                width: `${
                                  (route.counts.MEDIUM / total) * 100
                                }%`,
                              }}
                              className="bg-yellow-400"
                            />
                            <div
                              style={{
                                width: `${
                                  ((route.counts.HIGH + route.counts.DANGER) /
                                    total) *
                                  100
                                }%`,
                              }}
                              className="bg-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotspot Details - Grid Below Map */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Navigation Info */}
        <Card className="border-0 shadow-xl bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-slate-900/5 dark:ring-slate-700/50">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Navigation className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* Start / End Points */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Start Point
                </span>
                <Badge
                  variant="outline"
                  className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 font-normal"
                >
                  {userLocation ? "Current Location" : "Waiting for GPS..."}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Destination
                </span>
                <Badge
                  variant={manualDestination ? "destructive" : "default"}
                  className={
                    manualDestination
                      ? "bg-red-500 hover:bg-red-600 border-0"
                      : "bg-slate-800 hover:bg-slate-900 border-0"
                  }
                >
                  {manualDestination
                    ? "Manual Selection"
                    : selectedHotspot
                    ? `${selectedHotspot.species} Hotspot`
                    : "No destination"}
                </Badge>
              </div>
            </div>

            {/* Distance Display */}
            {distanceKm !== null && (
              <div className="py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">
                  DISTANCE
                </p>
                <p className="text-3xl font-black text-sky-600 dark:text-sky-400">
                  {distanceKm!.toFixed(1)}{" "}
                  <span className="text-lg text-sky-400 dark:text-sky-500">
                    km
                  </span>
                </p>
              </div>
            )}

            {/* Destination Marine Data */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Destination Marine
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Data from Open-Meteo Marine
                </span>
              </div>

              <div className="p-4">
                {/* Loading State */}
                {!destinationMarine && !destinationMarineError && (
                  <div className="flex flex-col items-center justify-center py-4 gap-3">
                    <div className="relative">
                      <WiCloud className="h-12 w-12 text-slate-200 dark:text-slate-600" />
                      <WiRaindrops className="h-6 w-6 text-sky-400 absolute bottom-0 right-0 animate-bounce" />
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                      Loading marine forecasts...
                    </span>
                  </div>
                )}

                {destinationMarineError && (
                  <div className="text-sm text-red-500 text-center py-2">
                    {destinationMarineError}
                  </div>
                )}

                {destinationMarine && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Wave Height */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Waves className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Wave Height
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {destinationMarine.hourly?.wave_height?.[0] ?? "N/A"}{" "}
                        <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                          m
                        </span>
                      </div>
                    </div>

                    {/* Wave Direction */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Wave Dir
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {destinationMarine.hourly?.wave_direction?.[0] ?? "N/A"}
                        °
                      </div>
                    </div>

                    {/* Ocean Current */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="h-4 w-4 text-sky-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Ocean Current
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {destinationMarine.hourly
                          ?.ocean_current_velocity?.[0] ?? "N/A"}{" "}
                        <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                          m/s
                        </span>
                      </div>
                    </div>

                    {/* Current Direction */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation className="h-4 w-4 text-slate-500 dark:text-slate-400 rotate-90" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Current Dir
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {destinationMarine.hourly
                          ?.ocean_current_direction?.[0] ?? "N/A"}
                        °
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Journey Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-slate-800 dark:text-slate-200" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Journey Settings
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Adjust trip parameters
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* Boat Speed Input */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Boat Speed{" "}
                    <span className="text-slate-400 font-normal">(km/h)</span>
                  </label>
                  <input
                    type="number"
                    value={boatSpeedKmh}
                    onChange={(e) =>
                      setBoatSpeedKmh(
                        Math.max(1, parseFloat(e.target.value) || 10)
                      )
                    }
                    className="w-24 px-3 py-1.5 text-sm font-semibold text-right border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    min="1"
                    max="50"
                    step="0.5"
                  />
                </div>

                {/* Departure Time Input */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Departure
                  </label>
                  <input
                    type="datetime-local"
                    value={departureTime.toISOString().slice(0, 16)}
                    onChange={(e) => setDepartureTime(new Date(e.target.value))}
                    className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Est Journey Time */}
                {distanceKm && boatSpeedKmh > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="text-lg">🕒</span>
                      <span>Est. Journey Time</span>
                    </div>
                    <span className="font-bold text-slate-800 text-lg">
                      {(distanceKm / boatSpeedKmh).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        h
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  if (!userLocation) return;
                  const start = userLocation;
                  const end = destination;
                  if (!end) return;
                  void fetchRouteWeather(start, end, 15);
                }}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition-all shadow-md shadow-sky-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={routeWeatherLoading || !userLocation}
              >
                {routeWeatherLoading ? (
                  <>
                    <WiRaindrops className="animate-spin h-5 w-5" />
                    <span>Scanning route...</span>
                  </>
                ) : (
                  <>
                    <CloudLightning className="h-5 w-5" />
                    <span>Scan route weather (15 km)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (!userLocation) return;
                  const start = userLocation;
                  const end = destination;
                  if (!end) return;
                  void analyzeMultipleTimes(start, end, 15);
                }}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={analyzingTimes || !userLocation || !destination}
              >
                <span className="text-lg">⏱️</span>
                <span>Find Safer Time</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-slate-900/5 dark:ring-slate-700/50">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <MapPin className="h-5 w-5 text-rose-500" />
              Selected Hotspot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* Location Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Location
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {manualDestination
                      ? `${manualDestination.lat.toFixed(
                          3
                        )}°N, ${manualDestination.lng.toFixed(3)}°E`
                      : selectedHotspot
                      ? `${selectedHotspot.lat.toFixed(
                          3
                        )}°N, ${selectedHotspot.lng.toFixed(3)}°E`
                      : "No selection"}
                  </p>
                  {manualDestination && (
                    <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                      Manual Selection
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Target Species
                  </p>
                  <div className="mt-1">
                    <Badge className="bg-slate-800 hover:bg-slate-900 text-white border-0">
                      {selectedHotspot ? selectedHotspot.species : "—"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Probability Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    Catch Probability
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {selectedHotspot
                      ? `${(selectedHotspot.probability * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                  {selectedHotspot && (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedHotspot.probability > 0.7
                          ? "bg-emerald-500"
                          : selectedHotspot.probability > 0.4
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${selectedHotspot.probability * 100}%` }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Environmental Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Depth */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Waves className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Depth
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {selectedHotspot ? selectedHotspot.depth : "—"}{" "}
                  <span className="text-xs font-normal text-slate-400">m</span>
                </p>
              </div>

              {/* SST */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    SST
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {destinationSSTLoading ? (
                      <span className="text-xs text-slate-400 animate-pulse">
                        Loading...
                      </span>
                    ) : destinationSST !== null ? (
                      destinationSST.toFixed(1)
                    ) : selectedHotspot?.sst ? (
                      selectedHotspot.sst
                    ) : (
                      "—"
                    )}
                  </p>
                  <span className="text-xs text-slate-400">°C</span>
                </div>
              </div>

              {/* Chlorophyll */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Chlorophyll
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {selectedHotspot ? selectedHotspot.chl : "—"}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    mg/m³
                  </span>
                </p>
              </div>

              {/* Wind (from local weather) */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="h-4 w-4 text-sky-500" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Wind
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {localWeather?.current?.windspeed ?? "—"}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    km/h
                  </span>
                </p>
              </div>
            </div>

            {/* Local Weather Widget */}
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50/50 dark:from-sky-950 dark:to-indigo-950/50 rounded-xl border border-sky-100 dark:border-sky-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CloudLightning className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-sm font-bold text-sky-900 dark:text-sky-100">
                    Local Weather
                  </span>
                </div>
                {localWeather?.current?.time && (
                  <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900 px-2 py-0.5 rounded-full">
                    {new Date(localWeather.current.time).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                )}
              </div>

              {weatherError ? (
                <div className="text-xs text-red-500 text-center py-2">
                  Unable to load weather data
                </div>
              ) : !localWeather ? (
                <div className="flex justify-center py-4">
                  <WiCloud className="h-8 w-8 text-sky-300 animate-bounce" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm">
                        <WiDaySunny className="h-8 w-8 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                          {localWeather.current?.temperature ?? "—"}°
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Current Temp
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Navigation className="h-3 w-3 rotate-45" />
                        <span>
                          {localWeather.current?.winddirection ?? "—"}°
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <WiRaindrops className="h-3 w-3 text-blue-500" />
                        <span>
                          {localWeather.hourly?.precipitation?.[0] ?? "0"} mm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Forecast Mini-Scroll */}
                  {localWeather.hourly?.time && (
                    <div className="pt-2 border-t border-sky-100/50">
                      <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-2">
                        Forecast
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {localWeather.hourly.time.slice(0, 6).map((t, i) => (
                          <div
                            key={t}
                            className="flex-shrink-0 bg-white/60 p-2 rounded-lg min-w-[60px] text-center border border-white/50"
                          >
                            <p className="text-[10px] font-bold text-slate-600">
                              {new Date(t).getHours()}:00
                            </p>
                            <div className="my-1 flex justify-center">
                              {/* Simple icon logic */}
                              {localWeather.hourly.precipitation?.[i]! > 0.5 ? (
                                <WiRaindrops className="h-5 w-5 text-blue-500" />
                              ) : localWeather.hourly.wind_speed_180m?.[i]! >
                                20 ? (
                                <WiStrongWind className="h-5 w-5 text-slate-500" />
                              ) : (
                                <WiDaySunny className="h-5 w-5 text-amber-500" />
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-slate-800">
                              {localWeather.hourly.wind_speed_180m?.[
                                i
                              ]?.toFixed(0)}{" "}
                              kph
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">All Hotspots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockHotspots.map((hotspot, idx) => (
              <button
                key={idx}
                onClick={() => handleHotspotSelect(hotspot)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedHotspot === hotspot && !manualDestination
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {hotspot.species}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hotspot.lat.toFixed(2)}°N, {hotspot.lng.toFixed(2)}°E
                    </p>
                  </div>
                  <Badge variant="outline">
                    {(hotspot.probability * 100).toFixed(0)}%
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
