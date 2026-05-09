import React, { useState, useEffect, useRef, useCallback } from "react";
import type { MapRef } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import {
  postRegionPrediction,
  predictFromPoint,
  predictLocalGround,
  startPredictJob,
  getPredictJobStatus,
  listSpots,
  saveSpot,
  deleteSpot,
  getDepth,
  type SavedSpot,
} from "@/services/api";
import { showError } from "@/services/notificationService";
import {
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Anchor,
  AlertCircle,
  Wind,
  Droplets,
  Waves,
  Cloud,
  History,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Locate,
  Navigation,
  RefreshCw,
  Database,
  Trash2,
  Thermometer,
  Gauge,
  CloudRain,
  Star,
  Search,
  Plus,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import {
  mockRegularGrounds,
  RegularGround,
} from "@/services/mockRegularGrounds";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchMarineData } from "@/services/openMeteoMarine";
import { booleanPointInPolygon, point as turfPoint } from "@turf/turf";

// ── EEZ boundary check ──────────────────────────────────────────────────────
let _eezCache: any = null;
async function loadEEZ() {
  if (_eezCache) return _eezCache;
  const resp = await fetch("/geojson/sri_lanka_eez.geojson");
  _eezCache = await resp.json();
  return _eezCache;
}
// Returns true only if point is in the EEZ polygon (the EEZ polygon has a
// land-hole cut out, so Sri Lanka land points return false here too).
function isInsideEEZ(lat: number, lng: number, eez: any): boolean {
  try {
    const geom = eez.features[0]?.geometry;
    if (!geom) return true;
    return booleanPointInPolygon(turfPoint([lng, lat]), geom);
  } catch {
    return true; // assume inside if check fails
  }
}

// ── Sri Lanka land check ─────────────────────────────────────────────────────
// The EEZ polygon excludes the island itself (land hole), so when a user picks
// a point on Sri Lankan land it incorrectly looks "outside EEZ". We suppress
// the EEZ warning for land points — the scan/predict flow will catch them
// separately via the ocean wave-data check.
let _landCache: any = null;
async function loadLand() {
  if (_landCache) return _landCache;
  try {
    const resp = await fetch("/geojson/sri_lanka_land.geojson");
    _landCache = await resp.json();
  } catch {
    _landCache = null;
  }
  return _landCache;
}
function isOnSriLankaLand(lat: number, lng: number, land: any): boolean {
  if (!land) return false;
  try {
    const geom = land.features[0]?.geometry;
    if (!geom) return false;
    return booleanPointInPolygon(turfPoint([lng, lat]), geom);
  } catch {
    return false;
  }
}

type Props = {
  mapRef: React.RefObject<MapRef>;
  onTopPrediction?: (hotspot: {
    lat: number;
    lng: number;
    species: string;
    probability: number;
  }) => void;
};

// Jaffna bbox (approx). Adjust if you want a different box.
const JAFFNA_BBOX = {
  min_lat: 8.5,
  max_lat: 10.5,
  min_lon: 79.0,
  max_lon: 80.5,
};

/** localStorage key for persisting the last hotspot scan result */
const HOTSPOT_LS_KEY = "fishspot_hotspot_scan";
const LOCAL_GROUND_FORM_LS_KEY = "fishspot_localground_form";

/**
 * Minimum spacing between scan points (km).
 * Chosen as 5 km — just above the SST/CHLO grid resolution (~4.5 km)
 * so every point in the sunflower grid falls in a distinct data pixel.
 * SSH varies at ~9 km, SSS/SSD at ~28 km (coarser — those values are uniform
 * within a single scan but still valid as absolute region descriptors).
 */
const SCAN_MIN_SPACING_KM = 5.0;

const DEPARTURE_HARBORS = [
  "Myllidy",
  "Point Pedro",
  "Codbay",
  "Valaichennai",
] as const;

/**
 * Compute the scan radius (km) for N points such that inter-point spacing
 * equals SCAN_MIN_SPACING_KM:  spacing = radius × 1.41 / √N
 * → radius = spacing × √N / 1.41
 */
function calcScanRadius(n: number): number {
  return (
    Math.round(
      ((SCAN_MIN_SPACING_KM * Math.sqrt(Math.max(n, 1))) / 1.41) * 10,
    ) / 10
  );
}

/** Build a circular GeoJSON polygon (64-sided) centred on [lat, lng] with radius_km. */
function makeCircleGeoJSON(
  lat: number,
  lng: number,
  radiusKm: number,
  sides = 64,
) {
  const R = 6371.0;
  const d = radiusKm / R;
  const coords: [number, number][] = [];
  for (let i = 0; i <= sides; i++) {
    const bearing = (i / sides) * 2 * Math.PI;
    const lat1 = (lat * Math.PI) / 180;
    const lon1 = (lng * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
        Math.cos(lat1) * Math.sin(d) * Math.cos(bearing),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      );
    coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [coords] },
        properties: {},
      },
    ],
  };
}

export default function UnifiedMapControls({ mapRef, onTopPrediction }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("hotspots");
  const [hasDangerZone, setHasDangerZone] = useState(false);

  // --- Jaffna Hotspot Prediction State ---
  const [species, setSpecies] = useState("YFT");
  const [threshold, setThreshold] = useState(0.6);
  const [nPoints, setNPoints] = useState<number>(20);
  /** Radius multiplier: 1 = auto-optimal, 2 = wide, 3 = regional */
  const [radiusMult, setRadiusMult] = useState<1 | 2 | 3>(1);

  const [loading, setLoading] = useState(false);

  // --- Scan State ---
  type ValidationStep = {
    label: string;
    status: "pending" | "running" | "ok" | "fail";
    detail?: string;
  };
  const [startPoint, setStartPoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<any | null>(null);
  const [savedScanAt, setSavedScanAt] = useState<number | null>(null);
  const [showRegularGrounds, setShowRegularGrounds] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Ground predictions fetched live from the backend
  interface GroundPred {
    level: "High" | "Moderate" | "Low";
    score: number; // best hotspot score 0-100
    confidence: number; // avg confidence_pct 0-100
    sst: number | null; // avg SST °C
    spawning: boolean;
  }
  const [groundPredictions, setGroundPredictions] = useState<
    Record<string, GroundPred | null>
  >({});
  const [groundsLoading, setGroundsLoading] = useState(false);
  // Ref so Mapbox onClick closures always read the latest predictions without re-registering
  const groundPredictionsRef = useRef<Record<string, GroundPred | null>>({});

  // ── Local-ground spot predictor state ──────────────────────────────
  const [spotName, setSpotName] = useState("");
  const [spotLat, setSpotLat] = useState("");
  const [spotLng, setSpotLng] = useState("");
  const [spotTotalKg, setSpotTotalKg] = useState("");
  const [spotDeparturePort, setSpotDeparturePort] = useState<string>(
    DEPARTURE_HARBORS[0],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_GROUND_FORM_LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved?.spotName === "string") setSpotName(saved.spotName);
      if (typeof saved?.spotLat === "string") setSpotLat(saved.spotLat);
      if (typeof saved?.spotLng === "string") setSpotLng(saved.spotLng);
      if (typeof saved?.spotTotalKg === "string")
        setSpotTotalKg(saved.spotTotalKg);
      if (
        typeof saved?.spotDeparturePort === "string" &&
        DEPARTURE_HARBORS.includes(saved.spotDeparturePort)
      ) {
        setSpotDeparturePort(saved.spotDeparturePort);
      }
    } catch {
      // ignore invalid local storage payload
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_GROUND_FORM_LS_KEY,
        JSON.stringify({
          spotName,
          spotLat,
          spotLng,
          spotTotalKg,
          spotDeparturePort,
        }),
      );
    } catch {
      // ignore quota or storage errors
    }
  }, [spotName, spotLat, spotLng, spotTotalKg, spotDeparturePort]);

  // ── Saved spots (per-user, from DB) ──────────────────────────────────
  const [savedSpots, setSavedSpots] = useState<SavedSpot[]>([]);
  const [spotsDropdownOpen, setSpotsDropdownOpen] = useState(false);
  const [spotsSaving, setSpotsSaving] = useState(false);
  const [spotsError, setSpotsError] = useState<string | null>(null);

  const loadSavedSpots = useCallback(async () => {
    try {
      const list = await listSpots();
      setSavedSpots(list);
    } catch {
      // not logged in or network error — silently ignore
    }
  }, []);

  useEffect(() => {
    loadSavedSpots();
  }, [loadSavedSpots]);

  const handleSaveSpot = useCallback(async () => {
    const lat = parseFloat(spotLat);
    const lng = parseFloat(spotLng);
    if (!spotName.trim()) {
      setSpotsError("Enter a spot name to save.");
      return;
    }
    if (isNaN(lat) || isNaN(lng)) {
      setSpotsError("Enter valid coordinates first.");
      return;
    }
    setSpotsError(null);
    setSpotsSaving(true);
    try {
      const totalKg = parseFloat(spotTotalKg);
      const spot = await saveSpot(
        spotName.trim(),
        lat,
        lng,
        isNaN(totalKg) ? 0 : totalKg,
      );
      setSavedSpots((prev) => [spot, ...prev]);
    } catch (e: any) {
      setSpotsError(e?.response?.data?.detail ?? "Failed to save spot.");
    } finally {
      setSpotsSaving(false);
    }
  }, [spotName, spotLat, spotLng, spotTotalKg]);

  const handleDeleteSpot = useCallback(async (id: string) => {
    try {
      await deleteSpot(id);
      setSavedSpots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  }, []);

  const clearLocalGroundInputs = useCallback(() => {
    setSpotName("");
    setSpotLat("");
    setSpotLng("");
    setSpotTotalKg("");
    setSpotDeparturePort(DEPARTURE_HARBORS[0]);
    setSpotsError(null);
    setLocalGroundError(null);
    setSpotOutsideEEZ(false);
    setLocalGroundPred(null);
    localGroundMarkerRef.current?.remove();
    localGroundMarkerRef.current = null;
    try {
      localStorage.removeItem(LOCAL_GROUND_FORM_LS_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const [isPickingFromMap, setIsPickingFromMap] = useState(false);
  const [localGroundLoading, setLocalGroundLoading] = useState(false);
  const [localGroundPred, setLocalGroundPred] = useState<{
    name: string | null;
    lat: number;
    lng: number;
    score: number;
    p_hotspot: number;
    level: "High" | "Moderate" | "Low";
    weather: { wind_speed: number; pressure: number; precip: number };
  } | null>(null);
  const [localGroundError, setLocalGroundError] = useState<string | null>(null);
  const pickMapListenerRef = useRef<((e: any) => void) | null>(null);
  const localGroundMarkerRef = useRef<any>(null);

  // ── EEZ warnings ────────────────────────────────────────────────────────
  const eezRef = useRef<any>(null);
  const landRef = useRef<any>(null);
  const [eezLoaded, setEezLoaded] = useState(false);
  const [spotOutsideEEZ, setSpotOutsideEEZ] = useState(false);
  const [scanOutsideEEZ, setScanOutsideEEZ] = useState(false);
  const [eezPopupOpen, setEezPopupOpen] = useState(false);
  const [eezPopupType, setEezPopupType] = useState<"local" | "hotspot">(
    "local",
  );

  // ── Background Job Resume ───────────────────────────────────────────────
  // Resumes a pending prediction if the user navigates away and comes back
  useEffect(() => {
    const rawJob = localStorage.getItem("fishspot_pending_job");
    if (!rawJob || validating) return;
    try {
      const { jobId, context } = JSON.parse(rawJob);
      if (!jobId || !context) return;

      setValidating(true);
      setValidationSteps([
        { label: "Resuming prediction from background...", status: "running" },
      ]);
      const ab = new AbortController();
      abortControllerRef.current = ab;

      const resumeJob = async () => {
        try {
          let result = null;
          while (!ab.signal.aborted) {
            const st = await getPredictJobStatus(jobId, ab.signal);
            if (st.status === "completed") {
              result = st.result;
              break;
            } else if (st.status === "failed") {
              throw new Error(st.detail || "Prediction failed on server.");
            }
            await new Promise((r) => setTimeout(r, 10000));
          }
          if (ab.signal.aborted) return;
          localStorage.removeItem("fishspot_pending_job");

          const waterPredictions = (result.predictions ?? []).filter(
            (p: any) => p.depth == null || Number(p.depth) < 0,
          );
          result.predictions = waterPredictions;
          setValidationSteps([{ label: "Scan complete!", status: "ok" }]);
          setPredictionResult(result);
          if (context) {
            plotSampledPoints(result.predictions, {
              species: context.species,
              threshold: context.threshold,
              nPoints: context.nPoints,
            });
          }

          const map = mapRef.current?.getMap();
          if (map && result.start_point) {
            map.flyTo({
              center: [result.start_point.lon, result.start_point.lat],
              zoom: 12,
              duration: 1500,
            });
          }
        } catch (err: any) {
          if (err.response?.status === 404)
            localStorage.removeItem("fishspot_pending_job");
          setValidationError(
            err.response?.data?.detail ||
              err.message ||
              "Failed to resume prediction.",
          );
          setValidationSteps([
            { label: "Error resuming scan", status: "fail" },
          ]);
        } finally {
          setValidating(false);
          abortControllerRef.current = null;
        }
      };
      resumeJob();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  useEffect(() => {
    loadEEZ().then((data) => {
      eezRef.current = data;
      setEezLoaded(true);
    });
    // Load land boundary in parallel (used to suppress false EEZ warnings on land)
    loadLand().then((data) => {
      landRef.current = data;
    });
  }, []);

  // Re-runs whenever location changes OR when EEZ data finishes loading (fixes race condition)
  useEffect(() => {
    const lat = parseFloat(spotLat);
    const lng = parseFloat(spotLng);
    if (!isNaN(lat) && !isNaN(lng) && eezRef.current) {
      // Primary land check: GeoJSON polygon (fast, synchronous)
      const onLandGeoJSON = isOnSriLankaLand(lat, lng, landRef.current);
      if (onLandGeoJSON) {
        // Definitely land — suppress EEZ warning immediately
        setSpotOutsideEEZ(false);
        return;
      }
      // EEZ check — also do GEBCO depth check for land pixels the GeoJSON misses
      const outside = !isInsideEEZ(lat, lng, eezRef.current);
      if (outside) {
        // Secondary land check: GEBCO depth (async, catches pixels GeoJSON misses)
        getDepth(lat, lng)
          .then((depthData) => {
            const elev: number | null = depthData?.value ?? null;
            const onLandGEBCO = elev !== null && elev >= 0;
            if (!onLandGEBCO) {
              // Confirmed ocean and outside EEZ — show legal warning
              setSpotOutsideEEZ(true);
              setEezPopupType("local");
              setEezPopupOpen(true);
            } else {
              // Land point — suppress warning
              setSpotOutsideEEZ(false);
            }
          })
          .catch(() => {
            // GEBCO unreachable — fall back to showing warning (ocean assumed)
            setSpotOutsideEEZ(true);
            setEezPopupType("local");
            setEezPopupOpen(true);
          });
      } else {
        setSpotOutsideEEZ(false);
      }
    } else {
      setSpotOutsideEEZ(false);
    }
  }, [spotLat, spotLng, eezLoaded]);

  useEffect(() => {
    if (startPoint && eezRef.current) {
      // Primary land check: GeoJSON polygon (fast, synchronous)
      const onLandGeoJSON = isOnSriLankaLand(
        startPoint.lat,
        startPoint.lng,
        landRef.current,
      );
      if (onLandGeoJSON) {
        setScanOutsideEEZ(false);
        return;
      }
      const outside = !isInsideEEZ(
        startPoint.lat,
        startPoint.lng,
        eezRef.current,
      );
      if (outside) {
        // Secondary land check: GEBCO depth (catches pixels the GeoJSON misses)
        getDepth(startPoint.lat, startPoint.lng)
          .then((depthData) => {
            const elev: number | null = depthData?.value ?? null;
            const onLandGEBCO = elev !== null && elev >= 0;
            if (!onLandGEBCO) {
              setScanOutsideEEZ(true);
              setEezPopupType("hotspot");
              setEezPopupOpen(true);
            } else {
              setScanOutsideEEZ(false);
            }
          })
          .catch(() => {
            setScanOutsideEEZ(true);
            setEezPopupType("hotspot");
            setEezPopupOpen(true);
          });
      } else {
        setScanOutsideEEZ(false);
      }
    } else {
      setScanOutsideEEZ(false);
    }
  }, [startPoint, eezLoaded]);

  // Start/stop map-pick mode
  const startMapPick = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    setIsPickingFromMap(true);
    const handler = (e: any) => {
      const { lng, lat } = e.lngLat;
      setSpotLat(lat.toFixed(5));
      setSpotLng(lng.toFixed(5));
      setIsPickingFromMap(false);
      map.off("click", handler);
      pickMapListenerRef.current = null;
      map.getCanvas().style.cursor = "";
    };
    pickMapListenerRef.current = handler;
    map.on("click", handler);
    map.getCanvas().style.cursor = "crosshair";
  }, [mapRef]);

  const cancelMapPick = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && pickMapListenerRef.current) {
      map.off("click", pickMapListenerRef.current);
      map.getCanvas().style.cursor = "";
    }
    pickMapListenerRef.current = null;
    setIsPickingFromMap(false);
  }, [mapRef]);

  const runLocalGroundPredict = useCallback(async () => {
    const lat = parseFloat(spotLat);
    const lng = parseFloat(spotLng);
    if (isNaN(lat) || isNaN(lng)) {
      setLocalGroundError(
        "Enter valid latitude and longitude or pick from map.",
      );
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocalGroundError("Coordinates out of range.");
      return;
    }
    // Fallback EEZ guard (covers cases where EEZ loaded after location was set)
    // First check GeoJSON polygon (fast), then GEBCO depth (catches missed land pixels)
    const onLandFallback = isOnSriLankaLand(lat, lng, landRef.current);
    if (
      !onLandFallback &&
      eezRef.current &&
      !isInsideEEZ(lat, lng, eezRef.current)
    ) {
      // Secondary GEBCO check before showing legal warning
      try {
        const depthData = await getDepth(lat, lng);
        const elev: number | null = depthData?.value ?? null;
        if (elev !== null && elev >= 0) {
          // Land point — proceed without warning
        } else {
          setSpotOutsideEEZ(true);
          setEezPopupType("local");
          setEezPopupOpen(true);
          return;
        }
      } catch {
        // GEBCO unreachable — show warning (assume ocean)
        setSpotOutsideEEZ(true);
        setEezPopupType("local");
        setEezPopupOpen(true);
        return;
      }
    }
    setLocalGroundError(null);
    setLocalGroundLoading(true);
    // Clear previous result + marker immediately when a new prediction starts
    setLocalGroundPred(null);
    localGroundMarkerRef.current?.remove();
    localGroundMarkerRef.current = null;
    try {
      const totalKg = parseFloat(spotTotalKg);
      const result = await predictLocalGround(
        lat,
        lng,
        spotName.trim() || undefined,
        isNaN(totalKg) ? 0 : totalKg,
        spotDeparturePort,
      );
      setLocalGroundPred(result);
      // Fly map to the spot
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 11 });

      // Drop a confidence marker on the map (remove previous one first)
      localGroundMarkerRef.current?.remove();
      const map = mapRef.current?.getMap();
      if (map) {
        const score = result.score; // 0-100
        const bg =
          score >= 70 ? "#22c55e" : score >= 40 ? "#f97316" : "#ef4444";
        const glow =
          score >= 70
            ? "rgba(34,197,94,.55)"
            : score >= 40
              ? "rgba(249,115,22,.55)"
              : "rgba(239,68,68,.55)";
        const label = result.name ?? "My Spot";
        const bubble = `
<div style="font-family:system-ui,sans-serif;transform:translateX(-50%)">
  <div style="background:${bg};color:#fff;border-radius:12px;padding:5px 10px;text-align:center;box-shadow:0 4px 16px ${glow};white-space:nowrap;border:2px solid rgba(255,255,255,.25)">
    <div style="font-size:8px;font-weight:700;opacity:.8;letter-spacing:.06em;max-width:100px;overflow:hidden;text-overflow:ellipsis">${label}</div>
    <div style="font-size:9px;font-weight:700;opacity:.75;letter-spacing:.05em">CONFIDENCE</div>
    <div style="font-size:19px;font-weight:900;line-height:1.1">${score}%</div>
    <div style="font-size:8px;font-weight:800;letter-spacing:.08em;opacity:.9">${result.level.toUpperCase()}</div>
  </div>
  <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${bg};margin:0 auto"></div>
</div>`;
        const el = document.createElement("div");
        el.innerHTML = bubble;
        localGroundMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([lng, lat])
          .addTo(map);
      }
    } catch (err: any) {
      setLocalGroundError(
        err?.response?.data?.detail ?? err?.message ?? "Prediction failed.",
      );
    } finally {
      setLocalGroundLoading(false);
    }
  }, [spotLat, spotLng, spotName, spotTotalKg, spotDeparturePort, mapRef]);

  // Refs to track HTML overlay markers so we can remove them on clear
  const markerRefs = useRef<any[]>([]);
  const hotspotMarkerRefs = useRef<any[]>([]);
  // Abort controller ref for cancelling in-flight prediction
  const abortControllerRef = useRef<AbortController | null>(null);

  function cancelPrediction() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    // Remove scan-area circle from map immediately
    const map = mapRef.current?.getMap();
    if (map) {
      if (map.getLayer("scanArea-fill")) map.removeLayer("scanArea-fill");
      if (map.getLayer("scanArea-ring")) map.removeLayer("scanArea-ring");
      if (map.getSource("scanArea")) map.removeSource("scanArea");
    }
    setValidating(false);
  }

  // --- localStorage restore ---
  /** Holds the restored scan data until the map is ready to plot it */
  const pendingRestoreRef = useRef<{
    result: any;
    meta: { species: string; threshold: number; nPoints: number };
  } | null>(null);

  // Load last scan from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HOTSPOT_LS_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (!stored?.result?.predictions?.length) return;
      pendingRestoreRef.current = {
        result: stored.result,
        meta: stored.meta ?? { species: "YFT", threshold: 0.6, nPoints: 20 },
      };
      setPredictionResult(stored.result);
      setSavedScanAt(stored.savedAt ?? null);
      if (stored.startPoint) setStartPoint(stored.startPoint);
      if (stored.meta) {
        if (stored.meta.species) setSpecies(stored.meta.species);
        if (stored.meta.threshold !== undefined)
          setThreshold(stored.meta.threshold);
        if (stored.meta.nPoints !== undefined) setNPoints(stored.meta.nPoints);
        if (stored.meta.radiusMult !== undefined)
          setRadiusMult(stored.meta.radiusMult);
      }
    } catch {
      /* corrupted localStorage data — skip restore */
    }
  }, []);

  // Re-plot restored scan once the map style is ready
  useEffect(() => {
    const rd = pendingRestoreRef.current;
    if (!rd) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const doPlot = () => {
      plotSampledPoints(rd.result.predictions, rd.meta);
      pendingRestoreRef.current = null;
    };
    if (map.isStyleLoaded()) {
      requestAnimationFrame(doPlot);
    } else {
      map.once("idle", doPlot);
      return () => {
        map.off("idle", doPlot);
      };
    }
  }, [predictionResult]); // fires right after the mount effect sets predictionResult

  // --- Scan mode: start point (map centre / GPS) or destination ---
  const [scanMode, setScanMode] = useState<"start" | "destination">("start");
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [pickingDestination, setPickingDestination] = useState(false);
  const destPickHandlerRef = useRef<((e: any) => void) | null>(null);

  // Destination pick-on-map mode
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (pickingDestination) {
      map.getCanvas().style.cursor = "crosshair";
      const handler = (e: any) => {
        const lat: number = e.lngLat.lat;
        const lng: number = e.lngLat.lng;
        setManualLat(lat.toFixed(5));
        setManualLon(lng.toFixed(5));
        setPickingDestination(false);
      };
      destPickHandlerRef.current = handler;
      map.once("click", handler);
      return () => {
        map.getCanvas().style.cursor = "";
        if (destPickHandlerRef.current) {
          map.off("click", destPickHandlerRef.current);
          destPickHandlerRef.current = null;
        }
      };
    } else {
      map.getCanvas().style.cursor = "";
    }
  }, [pickingDestination, mapRef]);

  // Check destination coords immediately when user types/picks them — before scan button is clicked
  useEffect(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLon);
    if (!isNaN(lat) && !isNaN(lng) && eezRef.current) {
      const onLand = isOnSriLankaLand(lat, lng, landRef.current);
      const outside = !onLand && !isInsideEEZ(lat, lng, eezRef.current);
      setScanOutsideEEZ(outside);
      if (outside) {
        setEezPopupType("hotspot");
        setEezPopupOpen(true);
      }
    } else if (!manualLat && !manualLon) {
      if (!startPoint) setScanOutsideEEZ(false);
    }
  }, [manualLat, manualLon, eezLoaded]);

  /** Remove all predicted points, markers, and reset state */
  function clearPredictedPoints() {
    const map = mapRef.current?.getMap();
    if (map) {
      if (map.getLayer("sampledPoints-layer"))
        map.removeLayer("sampledPoints-layer");
      if (map.getSource("sampledPoints")) map.removeSource("sampledPoints");
      if (map.getLayer("sampledPath-layer"))
        map.removeLayer("sampledPath-layer");
      if (map.getSource("sampledPath")) map.removeSource("sampledPath");
      if (map.getLayer("fishHotspots-layer"))
        map.removeLayer("fishHotspots-layer");
      if (map.getSource("fishHotspots")) map.removeSource("fishHotspots");
      // Remove scan-area circle overlay
      if (map.getLayer("scanArea-fill")) map.removeLayer("scanArea-fill");
      if (map.getLayer("scanArea-ring")) map.removeLayer("scanArea-ring");
      if (map.getSource("scanArea")) map.removeSource("scanArea");
    }
    // Remove HTML markers
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];
    hotspotMarkerRefs.current.forEach((m) => m.remove());
    hotspotMarkerRefs.current = [];

    localStorage.removeItem(HOTSPOT_LS_KEY);
    setSavedScanAt(null);
    setPredictionResult(null);
    setValidationSteps([]);
    setValidationError(null);
    setStartPoint(null);
    setHasDangerZone(false);
  }

  /** Scan using the current map centre */
  const runFromMapCenter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const center = map.getCenter();
    setStartPoint({ lat: center.lat, lng: center.lng });
    setValidationSteps([]);
    setValidationError(null);
    setPredictionResult(null);
    validateAndRun(center.lat, center.lng, "center");
  }, [mapRef, nPoints, threshold, species, radiusMult]);

  /** Scan using GPS location */
  const runFromGPS = useCallback(() => {
    if (!navigator?.geolocation) {
      setValidationError("Geolocation not supported in this browser.");
      return;
    }
    setGpsLoading(true);
    setValidationSteps([]);
    setValidationError(null);
    setPredictionResult(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setStartPoint({ lat, lng });
        mapRef.current?.getMap()?.flyTo({ center: [lng, lat], zoom: 11 });
        validateAndRun(lat, lng, "gps");
      },
      () => {
        setGpsLoading(false);
        setValidationError(
          "GPS permission denied. Pan the map to open sea and use 'Scan Map Centre', or enter coordinates manually.",
        );
      },
      { timeout: 8000 },
    );
  }, [mapRef, nPoints, threshold, species, radiusMult]);

  /** Scan using manually entered lat/lon (destination or manual start) */
  const runFromManual = useCallback(
    (mode: "manual" | "destination" = "manual") => {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLon);
      if (
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        setValidationError(
          "Invalid coordinates. Latitude must be −90 to 90, longitude −180 to 180.",
        );
        return;
      }
      // Fallback EEZ guard for destination scan
      const onLandDest = isOnSriLankaLand(lat, lng, landRef.current);
      if (
        !onLandDest &&
        eezRef.current &&
        !isInsideEEZ(lat, lng, eezRef.current)
      ) {
        setScanOutsideEEZ(true);
        setEezPopupType("hotspot");
        setEezPopupOpen(true);
        return;
      }
      setStartPoint({ lat, lng });
      setValidationSteps([]);
      setValidationError(null);
      setPredictionResult(null);
      mapRef.current?.getMap()?.flyTo({ center: [lng, lat], zoom: 11 });
      validateAndRun(lat, lng, mode);
    },
    [manualLat, manualLon, mapRef, nPoints, threshold, species, radiusMult],
  );

  // Validation + prediction — land checks only on destination scan point (not GPS start)
  async function validateAndRun(
    lat: number,
    lng: number,
    source: "center" | "gps" | "manual" | "destination" = "center",
  ) {
    setValidating(true);
    setValidationError(null);

    // When scanning from GPS, the lat/lng is the fisherman's own location —
    // they might be at home / a harbour on land, so we skip land validation.
    // We only validate the destination scan point (center / manual / destination).
    const shouldValidateLand = source !== "gps";

    const steps: ValidationStep[] = [
      ...(shouldValidateLand
        ? [
            {
              label: "Checking destination is in the ocean…",
              status: "running" as const,
            },
          ]
        : []),
      {
        label: `Scanning ${nPoints} pts · ${(calcScanRadius(nPoints) * radiusMult).toFixed(1)} km radius · ~${(SCAN_MIN_SPACING_KM * radiusMult).toFixed(1)} km spacing`,
        status: shouldValidateLand
          ? ("pending" as const)
          : ("running" as const),
      },
    ];
    setValidationSteps([...steps]);

    const scanStepIdx = shouldValidateLand ? 1 : 0;

    const update = (index: number, patch: Partial<ValidationStep>) => {
      steps[index] = { ...steps[index], ...patch };
      setValidationSteps([...steps]);
    };

    // ── Step 1 (destination only): parallel marine + GEBCO land checks ────────
    if (shouldValidateLand) {
      const landMsg = (reason: string) =>
        source === "destination"
          ? `That destination is on land (${reason}). Enter ocean coordinates (e.g. south of Sri Lanka).`
          : source === "manual"
            ? `Those coordinates are on land (${reason}). Enter a location in open sea.`
            : `Map centre is on land (${reason}). Pan the map to open sea, then tap 'Scan Map Centre'.`;

      const [waveResult, depthResult] = await Promise.allSettled([
        // Check A — Marine wave API: no wave data = land
        (async () => {
          const marine = await fetchMarineData(lat, lng, {
            hourly: ["wave_height"],
          });
          const waveHourly = marine?.hourly?.wave_height;
          const hasWave =
            Array.isArray(waveHourly) &&
            waveHourly.some((v: any) => v !== null && v !== undefined);
          return { isLand: !hasWave, reason: "no ocean wave data" };
        })(),
        // Check B — Backend GEBCO depth: elevation >= 0 = land/above sea level
        (async () => {
          const depthData = await getDepth(lat, lng);
          const elev: number | null = depthData?.value ?? null;
          const isLand = elev !== null && elev >= 0;
          return {
            isLand,
            reason: isLand
              ? `elevation ${elev?.toFixed(0)} m above sea level`
              : "ocean depth confirmed",
          };
        })(),
      ]);

      // Rejected promise = API unreachable — treat as "not land" (benefit of the doubt)
      const waveIsLand =
        waveResult.status === "fulfilled" && waveResult.value.isLand;
      const depthIsLand =
        depthResult.status === "fulfilled" && depthResult.value.isLand;

      if (waveIsLand || depthIsLand) {
        const reasons = [
          waveIsLand && waveResult.status === "fulfilled"
            ? waveResult.value.reason
            : null,
          depthIsLand && depthResult.status === "fulfilled"
            ? depthResult.value.reason
            : null,
        ]
          .filter(Boolean)
          .join("; ");
        update(0, { status: "fail", detail: `Land detected — ${reasons}` });
        setValidationError(landMsg(reasons));
        setValidating(false);
        return;
      }

      // Both passed (or unreachable)
      const passDetails = [
        waveResult.status === "fulfilled" ? "wave ✓" : "wave skipped",
        depthResult.status === "fulfilled" && !depthIsLand
          ? `depth: ${depthResult.value.reason}`
          : "depth skipped",
      ].join(" · ");
      update(0, { status: "ok", detail: passDetails });
    }

    // ── Step 2 (always): backend scan — GEBCO filters land points + ML model ──
    update(scanStepIdx, { status: "running" });

    // Draw scan-area circle on map so user sees the scan radius
    const _map = mapRef.current?.getMap();
    if (_map) {
      if (_map.getLayer("scanArea-fill")) _map.removeLayer("scanArea-fill");
      if (_map.getLayer("scanArea-ring")) _map.removeLayer("scanArea-ring");
      if (_map.getSource("scanArea")) _map.removeSource("scanArea");
      _map.addSource("scanArea", {
        type: "geojson",
        data: makeCircleGeoJSON(lat, lng, calcScanRadius(nPoints) * radiusMult),
      });
      _map.addLayer({
        id: "scanArea-fill",
        type: "fill",
        source: "scanArea",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.08 },
      });
      _map.addLayer({
        id: "scanArea-ring",
        type: "line",
        source: "scanArea",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 1.5,
          "line-dasharray": [4, 3],
          "line-opacity": 0.6,
        },
      });
      // Fit map to scan area so user sees the full bbox
      const DEG = 1 / 111.0;
      const scanR = calcScanRadius(nPoints) * radiusMult;
      const padLat = scanR * DEG * 1.35;
      const padLon = scanR * DEG * 1.35;
      _map.fitBounds(
        [
          [lng - padLon, lat - padLat],
          [lng + padLon, lat + padLat],
        ],
        {
          padding: { top: 60, bottom: 60, left: 60, right: 360 },
          duration: 1000,
          maxZoom: 13,
        },
      );
    }

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const jobRes = await startPredictJob({
        lat,
        lng,
        species,
        threshold,
        n_points: nPoints,
        radius_km: calcScanRadius(nPoints) * radiusMult,
        signal: abortCtrl.signal,
      });

      localStorage.setItem(
        "fishspot_pending_job",
        JSON.stringify({
          jobId: jobRes.job_id,
          context: { lat, lng, species, threshold, nPoints, radiusMult },
        }),
      );

      let apiResult = null;
      while (!abortCtrl.signal.aborted) {
        const st = await getPredictJobStatus(jobRes.job_id, abortCtrl.signal);
        if (st.status === "completed") {
          apiResult = st.result;
          break;
        } else if (st.status === "failed") {
          const e = new Error(st.detail || "Prediction failed");
          (e as any).response = { data: { detail: st.detail } };
          throw e;
        }
        await new Promise((r) => setTimeout(r, 30000));
      }

      localStorage.removeItem("fishspot_pending_job");
      if (abortCtrl.signal.aborted) return;

      const result = apiResult;
      abortControllerRef.current = null;

      // ── Filter out land points ──────────────────────────────────────────
      // GEBCO depth convention: negative = ocean, positive/zero = land/above sea level.
      // Keep points where depth is unknown (null/undefined) as benefit of the doubt.
      const waterPredictions = (result.predictions ?? []).filter(
        (p: any) => p.depth == null || Number(p.depth) < 0,
      );
      result.predictions = waterPredictions;
      if (result.total_points != null) {
        result.total_points = waterPredictions.length;
      }

      const high = result.summary?.high ?? 0;
      const best = result.summary?.best_confidence_pct ?? 0;
      update(scanStepIdx, {
        status: "ok",
        detail: `${waterPredictions.length} pts (water only) · best ${best}% · ${high} high confidence`,
      });
      setPredictionResult(result);
      plotSampledPoints(result.predictions, { species, threshold, nPoints });
      // Persist to localStorage so the scan survives page refresh
      try {
        const ts = Date.now();
        localStorage.setItem(
          HOTSPOT_LS_KEY,
          JSON.stringify({
            result,
            startPoint: { lat, lng },
            meta: { species, threshold, nPoints, radiusMult },
            savedAt: ts,
          }),
        );
        setSavedScanAt(ts);

        // Also write the top prediction as the confirmed destination so TripPlanner
        // shows the same distance as HotspotMap
        const topPred = result.predictions
          ?.slice()
          .sort((a: any, b: any) => b.score - a.score)[0];
        if (topPred) {
          localStorage.setItem(
            "fishspot_confirmed_destination",
            JSON.stringify({
              lat: topPred.lat,
              lng: topPred.lon,
              label: species,
            }),
          );
          // Always write start location so TripPlanner distance is accurate
          localStorage.setItem(
            "fishspot_start_location",
            JSON.stringify({ lat, lng }),
          );
          // Notify HotspotMap so its distance display updates immediately
          onTopPrediction?.({
            lat: topPred.lat,
            lng: topPred.lon,
            species,
            probability: topPred.score ?? 0,
          });
        }
      } catch {
        /* quota exceeded — not critical */
      }
      // Remove scan circle — prediction points are now visible
      const mapAfter = mapRef.current?.getMap();
      if (mapAfter) {
        if (mapAfter.getLayer("scanArea-fill"))
          mapAfter.removeLayer("scanArea-fill");
        if (mapAfter.getLayer("scanArea-ring"))
          mapAfter.removeLayer("scanArea-ring");
        if (mapAfter.getSource("scanArea")) mapAfter.removeSource("scanArea");
        // Fit to actual prediction points (slightly tighter than the scan circle)
        if (result.predictions?.length) {
          const allLats = result.predictions.map((p: any) => p.lat);
          const allLons = result.predictions.map((p: any) => p.lon);
          const minLat = Math.min(...allLats);
          const maxLat = Math.max(...allLats);
          const minLon = Math.min(...allLons);
          const maxLon = Math.max(...allLons);
          const latPad = Math.max((maxLat - minLat) * 0.3, 0.04);
          const lonPad = Math.max((maxLon - minLon) * 0.3, 0.05);
          mapAfter.fitBounds(
            [
              [minLon - lonPad, minLat - latPad],
              [maxLon + lonPad, maxLat + latPad],
            ],
            {
              padding: { top: 60, bottom: 60, left: 60, right: 360 },
              duration: 1000,
              maxZoom: 13,
            },
          );
        }
      }
    } catch (err: any) {
      abortControllerRef.current = null;
      if (
        err?.code === "ERR_CANCELED" ||
        err?.name === "AbortError" ||
        err?.name === "CanceledError"
      ) {
        update(scanStepIdx, { status: "fail", detail: "Scan cancelled" });
        setValidationError(null);
      } else {
        // Prefer the backend's human-readable `detail` field (FastAPI 422/4xx responses)
        const backendDetail =
          err?.response?.data?.detail ?? err?.response?.data?.message ?? null;
        const userMsg = backendDetail
          ? String(backendDetail)
          : "Prediction failed: " + String(err?.message ?? err);
        update(scanStepIdx, {
          status: "fail",
          detail: backendDetail
            ? String(backendDetail).slice(0, 80)
            : String(err?.message ?? err).slice(0, 80),
        });
        setValidationError(userMsg);
      }
    }
    setValidating(false);
  }

  function plotSampledPoints(
    predictions: any[],
    scanMeta?: { species: string; threshold: number; nPoints?: number },
  ) {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Filter land points — depth negative = ocean, positive/0 = land (GEBCO convention)
    const waterOnly = predictions.filter(
      (p: any) => p.depth == null || Number(p.depth) < 0,
    );
    predictions = waterOnly;

    // Remove any old markers first
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    if (map.getLayer("sampledPath-layer")) map.removeLayer("sampledPath-layer");
    if (map.getSource("sampledPath")) map.removeSource("sampledPath");

    let tempHasDanger = false;
    predictions.forEach((p) => {
      const level = String(p.hotspot_level ?? "");
      if (
        p.spawning === true ||
        level.includes("spawn") ||
        level.includes("danger") ||
        level.includes("high")
      ) {
        tempHasDanger = true;
      }
    });
    setHasDangerZone(tempHasDanger);

    const metaSpecies = scanMeta?.species ?? species;
    const metaThresh = scanMeta?.threshold ?? threshold;
    // Derive a shared source label from the first prediction that has one
    const firstChloSrc =
      predictions.find((p) => p.chlo_source)?.chlo_source ?? "";
    const firstSssSrc = predictions.find((p) => p.sss_source)?.sss_source ?? "";
    const geojson: any = {
      type: "FeatureCollection",
      features: predictions.map((p) => {
        const level = String(p.hotspot_level ?? "");
        const score = Number(p.score ?? 0);
        const isSpawning = p.spawning === true || level.includes("spawn");
        const isDanger = level.includes("danger") || level.includes("high");

        let pointColor = "#ef4444"; // red (low)
        if (isSpawning || isDanger) {
          pointColor = "#ef4444"; // red (danger)
        } else if (score >= 0.7) {
          pointColor = "#16a34a"; // green (high)
        } else if (score >= 0.4) {
          pointColor = "#eab308"; // yellow (medium)
        }

        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lon, p.lat] },
          properties: {
            score: p.score,
            confidence_pct: p.confidence_pct,
            hotspot_level: p.hotspot_level,
            spawn_probability: p.spawn_probability ?? null,
            spawning: p.spawning ?? false,
            sst: p.sst,
            ssh: p.ssh,
            chlo: p.chlo,
            sss: p.sss,
            ssd: p.ssd,
            depth: p.depth,
            chlo_source: p.chlo_source ?? firstChloSrc,
            sss_source: p.sss_source ?? firstSssSrc,
            sst_source: p.sst_source ?? "",
            data_date: p.data_date ?? "",
            _species: metaSpecies,
            _threshold: metaThresh,
            marker_color: pointColor,
          },
        };
      }),
    };
    if (map.getSource("sampledPoints")) {
      (map.getSource("sampledPoints") as any).setData(geojson);
    } else {
      map.addSource("sampledPoints", { type: "geojson", data: geojson });
      map.addLayer({
        id: "sampledPoints-layer",
        type: "circle",
        source: "sampledPoints",
        paint: {
          "circle-radius": 7,
          "circle-color": ["get", "marker_color"],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 1.0,
        },
      });
      map.on("click", "sampledPoints-layer", (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties;
        const score = Number(p.score);
        const pct = (score * 100).toFixed(1);
        const level = String(p.hotspot_level ?? "");
        const lvlColor =
          level === "core_hotspot"
            ? "#ef4444"
            : level === "candidate_hotspot"
              ? "#f97316"
              : score >= 0.7
                ? "#ef4444"
                : score >= 0.4
                  ? "#f97316"
                  : "#6b7280";
        const lvlLabel =
          level === "core_hotspot"
            ? "Core Hotspot"
            : level === "candidate_hotspot"
              ? "Candidate Hotspot"
              : level === "no_hotspot"
                ? "No Hotspot"
                : level
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
        const bar = Math.round(score * 100);
        const barColor =
          score >= 0.7
            ? "#ef4444"
            : score >= 0.5
              ? "#f97316"
              : score >= 0.35
                ? "#facc15"
                : "#6b7280";
        // ── Format values with correct units; handle unit normalisation ──
        const sst =
          p.sst != null ? `${Number(p.sst).toFixed(1)} \u00b0C` : "n/a";
        // SSH in metres
        const ssh = p.ssh != null ? `${Number(p.ssh).toFixed(3)} m` : "n/a";
        // CHLO: mg/m³ — use scientific notation for sub-0.01 values
        const chloRaw = Number(p.chlo);
        const chlo =
          p.chlo != null
            ? chloRaw < 0.01
              ? `${chloRaw.toExponential(2)} mg/m\u00b3`
              : `${chloRaw.toFixed(3)} mg/m\u00b3`
            : "n/a";
        // SSS: PSU (practical salinity units)
        const sss = p.sss != null ? `${Number(p.sss).toFixed(2)} PSU` : "n/a";
        // SSD: kg/m³ — safety convert if value < 10 (arrived as g/cm³)
        const ssdRaw = Number(p.ssd);
        const ssdKgm3 =
          !isNaN(ssdRaw) && ssdRaw > 0 && ssdRaw < 10 ? ssdRaw * 1000 : ssdRaw;
        const ssd = p.ssd != null ? `${ssdKgm3.toFixed(1)} kg/m\u00b3` : "n/a";
        // Depth: positive metres (GEBCO elevation is negative for ocean)
        const depth =
          p.depth != null ? `${Math.abs(Number(p.depth)).toFixed(0)} m` : "n/a";
        // Data date
        const dDate = String(p.data_date ?? "").slice(0, 10) || null;
        // Spawn prediction
        const isSpawningPoint =
          p.spawning === true || String(p.spawning) === "true";
        const spawnProb =
          p.spawn_probability != null
            ? `${(Number(p.spawn_probability) * 100).toFixed(1)}%`
            : null;
        // Source labels — strip long dataset IDs, keep human-readable prefix
        const cSrc =
          String(p.chlo_source ?? "")
            .split("|")[0]
            .trim() || "unknown";
        const sSrc =
          String(p.sss_source ?? "")
            .split("|")[0]
            .trim() || "unknown";
        const tSrc =
          String(p.sst_source ?? "")
            .split("|")[0]
            .trim() || "Open-Meteo";
        const speciesLabel = String(p._species ?? "YFT");
        const threshLabel = `${(Number(p._threshold ?? 0.6) * 100).toFixed(0)}%`;
        new (map as any).Popup({ maxWidth: "280px" })
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `
<div style="font-family:system-ui,sans-serif;font-size:12px;color:#0f172a;min-width:250px;line-height:1.5">
  <!-- SCAN INPUTS -->
  <div style="background:#f1f5f9;border-radius:6px;padding:5px 8px;margin-bottom:6px;display:flex;align-items:center;gap:6px">
    <span style="background:#1e293b;color:#f8fafc;border-radius:3px;padding:2px 7px;font-size:11px;font-weight:700">${speciesLabel}</span>
    <span style="color:#475569;font-size:11px">Threshold: <b>${threshLabel}</b></span>
  </div>
  <!-- CONFIDENCE BLOCK -->
  <div style="background:${lvlColor}18;border:1px solid ${lvlColor}44;border-radius:6px;padding:6px 8px;margin-bottom:6px">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
      <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${lvlColor}">Confidence</span>
      <span style="font-size:18px;font-weight:900;color:${lvlColor};line-height:1">${pct}%</span>
    </div>
    <div style="background:#e2e8f0;border-radius:4px;height:8px;margin-bottom:4px">
      <div style="width:${bar}%;background:${barColor};height:8px;border-radius:4px"></div>
    </div>
    <div style="font-size:11px;font-weight:600;color:${lvlColor}">${lvlLabel}</div>
  </div>
  <!-- SPAWN PREDICTION -->
  ${
    spawnProb != null
      ? `
  <div style="background:${isSpawningPoint ? "#fef9c3" : "#f0fdf4"};border:1px solid ${isSpawningPoint ? "#fde047" : "#bbf7d0"};border-radius:6px;padding:5px 8px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between">
    <span style="font-size:11px;font-weight:700;color:${isSpawningPoint ? "#92400e" : "#166534"}">🥚 Spawning Activity</span>
    <span style="font-size:13px;font-weight:900;color:${isSpawningPoint ? "#b45309" : "#15803d"}">${isSpawningPoint ? "YES" : "NO"} <span style="font-size:10px;font-weight:500;opacity:0.8">(${spawnProb})</span></span>
  </div>`
      : ""
  }
  <!-- OCEAN CONDITIONS -->
  <div style="background:#f8fafc;border-radius:6px;padding:5px 8px;margin-bottom:6px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:4px">Ocean Conditions</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">🌡 SST</td>
        <td style="font-weight:600;text-align:right">${sst}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">🌊 SSH</td>
        <td style="font-weight:600;text-align:right">${ssh}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">📏 Depth</td>
        <td style="font-weight:600;text-align:right">${depth}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">🌿 Chlorophyll</td>
        <td style="font-weight:600;text-align:right">${chlo}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">🧂 Salinity</td>
        <td style="font-weight:600;text-align:right">${sss}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">💧 Density</td>
        <td style="font-weight:600;text-align:right">${ssd}</td>
      </tr>
    </table>
  </div>
  <!-- DATA SOURCES + DATE -->
  <div style="font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:4px">
    <div>📡 SST: ${tSrc}</div>
    <div>📡 Chlo: ${cSrc}</div>
    <div>📡 SSS: ${sSrc}</div>
    ${dDate ? `<div style="margin-top:2px;color:#cbd5e1">🗓 Data: ${dDate}</div>` : ""}
  </div>
</div>`,
          )
          .addTo(map);
      });
      map.on(
        "mouseenter",
        "sampledPoints-layer",
        () => (map.getCanvas().style.cursor = "pointer"),
      );
      map.on(
        "mouseleave",
        "sampledPoints-layer",
        () => (map.getCanvas().style.cursor = ""),
      );
    }

    // ── HTML overlay badges (speech-bubble style) ──────────────────────────
    predictions.forEach((p: any) => {
      const score = Number(p.score ?? 0);
      const pct = Math.round(score * 100);
      const level = String(p.hotspot_level ?? "");
      const isSpawning = p.spawning === true || level.includes("spawn");
      const isDanger = level.includes("danger") || level.includes("high");

      // Removed threshold cutoff: all predicted points rendered on map will have a confidence badge.

      let bubble: string;
      if (isSpawning || isDanger) {
        bubble = `
<div style="font-family:system-ui,sans-serif;cursor:pointer;padding-bottom:8px;">
  <div style="filter:drop-shadow(0 4px 6px rgba(239,68,68,0.4));">
    <div style="background:#fff; border-radius:30px; padding:3px; position:relative;">
      <div style="position:absolute; bottom:-6px; left:50%; margin-left:-7px; width:14px; height:14px; transform:rotate(45deg); background:#fff; z-index:1; border-radius:2px;"></div>
      <div style="background:#ef4444; color:#fff; border-radius:27px; padding:5px 16px; text-align:center; position:relative; z-index:2;">
        <div style="font-size:9px;font-weight:800;letter-spacing:0.06em;opacity:0.95;margin-bottom:1px;">
          <span style="font-size:9px;">▵</span> DANGER ZONE
        </div>
        <div style="font-size:20px;font-weight:900;line-height:1.1;letter-spacing:0.02em;">SPAWNING</div>
        <div style="position:absolute; bottom:-7px; left:50%; margin-left:-5px; width:10px; height:10px; transform:rotate(45deg); background:#ef4444; z-index:3; border-radius:1px;"></div>
      </div>
    </div>
  </div>
</div>`;
      } else {
        const bg =
          score >= 0.7 ? "#16a34a" : score >= 0.4 ? "#eab308" : "#ef4444";
        bubble = `
<div style="font-family:system-ui,sans-serif;cursor:pointer;padding-bottom:8px;">
  <div style="filter:drop-shadow(0 4px 6px rgba(0,0,0,0.25));">
    <div style="background:#fff; border-radius:30px; padding:3px; position:relative;">
      <div style="position:absolute; bottom:-6px; left:50%; margin-left:-7px; width:14px; height:14px; transform:rotate(45deg); background:#fff; z-index:1; border-radius:2px;"></div>
      <div style="background:${bg}; color:#fff; border-radius:27px; padding:4px 16px; text-align:center; position:relative; z-index:2;">
        <div style="font-size:10px;font-weight:800;letter-spacing:0.06em;opacity:0.95;margin-bottom:1px;">CONFIDENCE</div>
        <div style="font-size:24px;font-weight:900;line-height:1.1;">${pct}%</div>
        <div style="position:absolute; bottom:-7px; left:50%; margin-left:-5px; width:10px; height:10px; transform:rotate(45deg); background:${bg}; z-index:3; border-radius:1px;"></div>
      </div>
    </div>
  </div>
</div>`;
      }

      const el = document.createElement("div");
      el.innerHTML = bubble;

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
        offset: [0, -10],
      })
        .setLngLat([p.lon, p.lat])
        .addTo(map);

      markerRefs.current.push(marker);
    });
  }

  // Fetch live hotspot predictions for every known fishing ground from the backend
  const fetchGroundPredictions = useCallback(async () => {
    setGroundsLoading(true);
    const settled = await Promise.allSettled(
      mockRegularGrounds.map((g) =>
        predictFromPoint({
          lat: g.lat,
          lng: g.lng,
          species,
          n_points: 8,
          radius_km: 20,
        })
          .then((res: any) => {
            const preds: any[] = res?.predictions ?? [];
            if (!preds.length) return { id: g.id, pred: null };
            const scores = preds.map((p: any) => Number(p.score ?? 0));
            const best = Math.max(...scores);
            const confs = preds.map((p: any) => Number(p.confidence_pct ?? 0));
            const avgConf =
              confs.reduce((a: number, b: number) => a + b, 0) / confs.length;
            const sstVals = preds
              .filter((p: any) => p.sst != null)
              .map((p: any) => Number(p.sst));
            const avgSST = sstVals.length
              ? Math.round(
                  (sstVals.reduce((a: number, b: number) => a + b, 0) /
                    sstVals.length) *
                    10,
                ) / 10
              : null;
            const spawning = preds.some((p: any) => p.spawning === true);
            const level: "High" | "Moderate" | "Low" =
              best >= 0.7 ? "High" : best >= 0.4 ? "Moderate" : "Low";
            return {
              id: g.id,
              pred: {
                level,
                score: Math.round(best * 100),
                confidence: Math.round(avgConf),
                sst: avgSST,
                spawning,
              },
            };
          })
          .catch(() => ({ id: g.id, pred: null })),
      ),
    );
    const result: Record<string, any> = {};
    settled.forEach((r) => {
      if (r.status === "fulfilled") result[r.value.id] = r.value.pred;
    });
    groundPredictionsRef.current = result;
    setGroundPredictions(result);
    setGroundsLoading(false);
  }, [species]);

  // Show / hide grounds layer on the Mapbox map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    if (showRegularGrounds && map) {
      // Trigger backend fetch when grounds are first shown (or species changed)
      if (!groundsLoading && Object.keys(groundPredictions).length === 0) {
        fetchGroundPredictions();
      }

      const buildGeoJSON = () => ({
        type: "FeatureCollection" as const,
        features: mockRegularGrounds.map((g) => {
          const pred = groundPredictionsRef.current[g.id];
          return {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [g.lng, g.lat] },
            properties: {
              id: g.id,
              name: g.name,
              level: pred?.level ?? "Pending",
            },
          };
        }),
      });

      if (!map.getSource("regularGrounds")) {
        map.addSource("regularGrounds", {
          type: "geojson",
          data: buildGeoJSON(),
        });
      }

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
              ["get", "level"],
              "High",
              "#22c55e",
              "Moderate",
              "#eab308",
              "Low",
              "#ef4444",
              "#9ca3af", // Pending / unknown → gray
            ],
            "circle-opacity": 0.9,
            "circle-pitch-alignment": "viewport",
          },
          layout: { visibility: "visible" },
        });

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
            visibility: "visible",
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#000000",
            "text-halo-width": 1,
          },
        });

        const onClick = (e: any) => {
          const f = e.features?.[0];
          if (!f) return;
          const id = f.properties?.id as string;
          const ground = mockRegularGrounds.find((g) => g.id === id);
          if (!ground) return;
          const pred = groundPredictionsRef.current[id];
          new (map as any).Popup({
            closeButton: true,
            focusAfterOpen: false,
            className: "fishing-popup",
          })
            .setLngLat(f.geometry.coordinates)
            .setHTML(generatePopupHtml(ground.name, pred))
            .addTo(map);
        };

        map.on("click", "regularGrounds-layer", onClick);
        map.on(
          "mouseenter",
          "regularGrounds-layer",
          () => (map.getCanvas().style.cursor = "pointer"),
        );
        map.on(
          "mouseleave",
          "regularGrounds-layer",
          () => (map.getCanvas().style.cursor = ""),
        );
      } else {
        map.setLayoutProperty("regularGrounds-layer", "visibility", "visible");
        map.setLayoutProperty("regularGrounds-labels", "visibility", "visible");
      }
    } else if (
      !showRegularGrounds &&
      map &&
      map.getLayer("regularGrounds-layer")
    ) {
      map.setLayoutProperty("regularGrounds-layer", "visibility", "none");
      map.setLayoutProperty("regularGrounds-labels", "visibility", "none");
    }
  }, [showRegularGrounds, mapRef]);

  // Re-colour the grounds layer when predictions arrive from the backend
  useEffect(() => {
    if (!mapRef.current || !showRegularGrounds) return;
    const map = mapRef.current.getMap();
    if (!map || !map.getSource("regularGrounds")) return;
    const geojson = {
      type: "FeatureCollection" as const,
      features: mockRegularGrounds.map((g) => {
        const pred = groundPredictions[g.id];
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [g.lng, g.lat] },
          properties: {
            id: g.id,
            name: g.name,
            level: pred?.level ?? "Pending",
          },
        };
      }),
    };
    (map.getSource("regularGrounds") as any).setData(geojson);
  }, [groundPredictions, showRegularGrounds, mapRef]);

  // Popup HTML built from real backend prediction data
  const generatePopupHtml = (name: string, pred: any) => {
    if (!pred) {
      return `<div style="font-family:'Inter',sans-serif;padding:8px;min-width:200px;color:#0f172a;">
        <h3 style="margin:0 0 6px;font-weight:700;font-size:15px;">${name}</h3>
        <p style="margin:0;font-size:12px;color:#64748b;">Fetching prediction…</p></div>`;
    }
    const color =
      pred.level === "High"
        ? "#22c55e"
        : pred.level === "Moderate"
          ? "#eab308"
          : "#ef4444";
    return `
      <div style="font-family:'Inter',sans-serif;padding:6px;min-width:240px;color:#0f172a;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h3 style="margin:0;font-weight:700;font-size:15px;">${name}</h3>
          <span style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:bold;">${pred.level.toUpperCase()}</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <div style="background:#f1f5f9;padding:6px;border-radius:8px;flex:1;text-align:center;">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;">Best Score</div>
            <div style="font-size:16px;font-weight:800;color:${color};">${pred.score}%</div>
          </div>
          <div style="background:#f1f5f9;padding:6px;border-radius:8px;flex:1;text-align:center;">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;">Avg Conf</div>
            <div style="font-size:14px;font-weight:600;color:#334155;">${pred.confidence}%</div>
          </div>
          ${
            pred.sst != null
              ? `<div style="background:#f1f5f9;padding:6px;border-radius:8px;flex:1;text-align:center;">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;">SST</div>
            <div style="font-size:14px;font-weight:600;color:#334155;">${pred.sst}°C</div>
          </div>`
              : ""
          }
        </div>
        <div style="background:#f0fdf4;padding:6px;border-radius:6px;font-size:11px;color:#166534;border:1px solid #bbf7d0;">
          ${pred.spawning ? "🥚 Spawning activity detected in this area" : "No spawning activity detected"}
        </div>
        <div style="margin-top:6px;font-size:10px;color:#94a3b8;text-align:right;">Live ML prediction · ${new Date().toLocaleDateString()}</div>
      </div>`;
  };

  // --- Jaffna Prediction Logic ---
  async function runPrediction(customBbox?: typeof JAFFNA_BBOX) {
    setLoading(true);
    const body = {
      date: null,
      species,
      threshold,
      top_k: 200,
      bbox: customBbox || JAFFNA_BBOX,
      overrides: {},
    };

    try {
      const json = await postRegionPrediction(body);
      const geojson = json.geojson;
      const map = mapRef.current?.getMap();
      if (!map) return;

      hotspotMarkerRefs.current.forEach((m) => m.remove());
      hotspotMarkerRefs.current = [];

      geojson.features.forEach((f: any) => {
        const p = f.properties || {};
        const score = Number(p.prob ?? 0);
        const pct = Math.round(score * 100);
        const level = String(p.hotspot_level ?? "");
        const isSpawning = level.includes("spawn") || score >= 0.95;
        const isDanger = level.includes("danger") || score >= 0.9;

        // Skip markers below threshold to avoid clutter
        if (score < threshold) return;

        let bubble: string;
        if (isSpawning || isDanger) {
          bubble = `
<div style="font-family:system-ui,sans-serif;cursor:pointer;transform:translateX(-50%)">
  <div style="background:#ef4444;color:#fff;border-radius:12px;padding:5px 10px;font-size:11px;font-weight:800;text-align:center;box-shadow:0 4px 16px rgba(239,68,68,.55);white-space:nowrap;border:2px solid rgba(255,255,255,.25)">
    <div style="font-size:9px;opacity:.85;letter-spacing:.06em">&#9651; DANGER ZONE</div>
    <div style="font-size:13px;letter-spacing:.04em">SPAWNING</div>
  </div>
  <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #ef4444;margin:0 auto"></div>
</div>`;
        } else {
          const bg =
            score >= 0.7 ? "#22c55e" : score >= 0.55 ? "#f97316" : "#eab308";
          const glow =
            score >= 0.7
              ? "rgba(34,197,94,.5)"
              : score >= 0.55
                ? "rgba(249,115,22,.5)"
                : "rgba(234,179,8,.4)";
          bubble = `
<div style="font-family:system-ui,sans-serif;cursor:pointer;transform:translateX(-50%)">
  <div style="background:${bg};color:#fff;border-radius:12px;padding:5px 10px;text-align:center;box-shadow:0 4px 16px ${glow};white-space:nowrap;border:2px solid rgba(255,255,255,.25)">
    <div style="font-size:9px;font-weight:700;opacity:.85;letter-spacing:.06em">CONFIDENCE</div>
    <div style="font-size:19px;font-weight:900;line-height:1.1">${pct}%</div>
  </div>
  <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${bg};margin:0 auto"></div>
</div>`;
        }

        const el = document.createElement("div");
        el.innerHTML = bubble;

        const coords = f.geometry?.coordinates;
        if (coords) {
          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([coords[0], coords[1]])
            .addTo(map);

          hotspotMarkerRefs.current.push(marker);
        }
      });

      // We will still keep the underlying circle array as visual backdrop
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
              4,
              0.8,
              6,
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
            "circle-opacity": 0.3,
          },
        });

        // Add Popup for Hotspots
        map.on("click", "fishHotspots-layer", (e: any) => {
          const f = e.features && e.features[0];
          if (!f) return;
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [];
          new (map as any).Popup({ maxWidth: "250px" })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:12px; color:black; font-family: sans-serif; padding: 5px;">
                  <strong style="text-transform: uppercase;">${p.species_code || "Species"}</strong><br/>
                  <div style="margin-top:2px;"><b>Confidence:</b> ${(p.prob * 100).toFixed(1)}%</div>
                  <div style="margin-top:2px; font-size:11px; color:#555;">SST: ${p.sst ?? "n/a"} °C</div>
               </div>`,
            )
            .addTo(map);
        });
        map.on(
          "mouseenter",
          "fishHotspots-layer",
          () => (map.getCanvas().style.cursor = "pointer"),
        );
        map.on(
          "mouseleave",
          "fishHotspots-layer",
          () => (map.getCanvas().style.cursor = ""),
        );
      }

      // If we used a custom bbox (from "Scan Hotspot"), fly to it?
      if (customBbox) {
        // Optional: Provide visual feedback or bounds fit
      }
    } catch (err) {
      console.error("Prediction failed", err);
      showError("Prediction failed: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  // Track selected ground
  const [selectedGroundId, setSelectedGroundId] = useState<string | null>(null);

  return (
    <>
      {/* ── EEZ Legal Notice Popup ─────────────────────────────────────── */}
      {eezPopupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-red-500/60 rounded-2xl shadow-2xl shadow-red-500/20 max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="bg-red-500/20 p-2.5 rounded-xl shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-red-300 uppercase tracking-wide">
                  ⚠ Legal Notice — Outside EEZ
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sri Lanka Exclusive Economic Zone Boundary Violation
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-red-500/20" />

            {/* Body */}
            <div className="space-y-3 text-[12px] text-slate-300 leading-relaxed">
              <p>
                The selected location is{" "}
                <span className="text-red-400 font-bold">
                  outside Sri Lanka's Exclusive Economic Zone (EEZ)
                </span>
                , which extends{" "}
                <span className="font-semibold text-white">
                  200 nautical miles
                </span>{" "}
                from the coastline.
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1.5 text-[11px]">
                <p className="font-bold text-red-300 uppercase tracking-wide text-[10px]">
                  Applicable Laws &amp; Regulations
                </p>
                <p>
                  🔴{" "}
                  <span className="text-slate-200">
                    Fisheries &amp; Aquatic Resources Act No. 2 of 1996
                  </span>{" "}
                  — Sri Lanka
                </p>
                <p>
                  🔴 <span className="text-slate-200">UNCLOS Article 62</span> —
                  Rights of access to EEZ
                </p>
                <p>
                  🔴{" "}
                  <span className="text-slate-200">
                    IOTC (Indian Ocean Tuna Commission)
                  </span>{" "}
                  — Conservation measures
                </p>
                <p>
                  🔴{" "}
                  <span className="text-slate-200">
                    Maritime Zones Law No. 22 of 1976
                  </span>{" "}
                  — Sri Lanka EEZ limits
                </p>
              </div>
              <p className="text-[11px] text-amber-300/80">
                ⚠ Fishing or navigating to fish in this zone without proper
                international licences may result in{" "}
                <strong className="text-white">
                  vessel seizure, fines, or imprisonment
                </strong>{" "}
                under Sri Lankan and international maritime law.
              </p>
              <p className="text-[11px] text-slate-500">
                {eezPopupType === "local"
                  ? "The Local Ground prediction has been disabled for this location."
                  : "The Hotspot Scanner has been disabled for this location."}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={() => setEezPopupOpen(false)}
              className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-red-500/20"
            >
              I Understand — Close
            </button>
          </div>
        </div>
      )}

      {hasDangerZone && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-md rounded-full px-8 py-3 shadow-[0_8px_32px_rgba(239,68,68,0.5)] border-2 border-red-400 flex items-center gap-4">
          <AlertCircle className="h-7 w-7 text-white animate-pulse" />
          <div className="text-white">
            <h4 className="font-extrabold text-sm tracking-widest drop-shadow-md">
              WARNING: HIGH RISK PATH
            </h4>
            <p className="text-xs font-medium text-red-50">
              Experienced sailors only. Proceed with extreme caution.
            </p>
          </div>
        </div>
      )}
      <div
        className={`absolute top-6 left-6 w-96 transition-all duration-300 ease-in-out z-30 font-sans flex flex-col ${isExpanded ? "bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-700/50 rounded-2xl max-h-[580px]" : "bg-transparent pointer-events-none"}`}
      >
        {/* Header Button (Always Visible - but handles its own layout when collapsed) */}
        <div
          className={`flex items-center justify-between p-2 cursor-pointer pointer-events-auto ${!isExpanded ? "bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 w-auto inline-flex" : ""}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
              <Anchor className="h-4 w-4 text-white" />
            </div>
            <div className={`${!isExpanded ? "hidden" : "block"}`}>
              <h3 className="font-bold text-sm tracking-wide text-slate-50">
                Fishing Intelligence
              </h3>
              <p className="text-xs text-slate-400 leading-none">
                AI-Powered Forecasting
              </p>
            </div>
          </div>
          <button
            className={`p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white ${!isExpanded ? "ml-2" : ""}`}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Tabs
              defaultValue="hotspots"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mb-4 p-1 rounded-lg">
                <TabsTrigger
                  value="hotspots"
                  className="text-xs font-semibold text-slate-400 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Hotspot Scanner
                </TabsTrigger>
                <TabsTrigger
                  value="grounds"
                  className="text-xs font-semibold text-slate-400 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Regular Grounds
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hotspots" className="space-y-4">
                {/* Existing Jaffna Controls */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Species
                      </label>
                      <select
                        value={species}
                        onChange={(e) => setSpecies(e.target.value)}
                        className="w-full bg-slate-800 text-white text-sm py-2 px-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none"
                      >
                        <optgroup label="Tuna">
                          <option value="YFT">Yellowfin Tuna</option>
                          <option value="BET">Bigeye Tuna</option>
                          <option value="SKJ">Skipjack Tuna</option>
                          <option value="ALB">Albacore</option>
                          <option value="BLT">Bullet Tuna</option>
                          <option value="KAW">Kawakawa</option>
                          <option value="SBF">Southern Bluefin</option>
                        </optgroup>
                        <optgroup label="Billfish">
                          <option value="SWO">Swordfish</option>
                          <option value="BUM">Blue Marlin</option>
                          <option value="BLM">Black Marlin</option>
                          <option value="MLS">Striped Marlin</option>
                          <option value="SFA">Sailfish</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="COM">Cobia</option>
                          <option value="FRI">Frigate Tuna</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Threshold ({threshold})
                      </label>
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
                    {/* Scan Points selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Scan Points
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {([3, 5, 10, 15, 20] as const).map((n) => (
                          <button
                            key={n}
                            onClick={() => setNPoints(n)}
                            className={`py-1.5 rounded-md text-xs font-bold transition-all ${
                              nPoints === n
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-slate-200"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Radius multiplier */}
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Scan Radius
                        <span className="ml-1.5 text-blue-400 font-black">
                          {(calcScanRadius(nPoints) * radiusMult).toFixed(1)} km
                        </span>
                        <span className="ml-1 text-slate-600">
                          (~{(SCAN_MIN_SPACING_KM * radiusMult).toFixed(0)} km
                          spacing)
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          {
                            mult: 1 as const,
                            label: "Auto",
                            sub: "5 km spacing",
                            active:
                              "bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
                          },
                          {
                            mult: 2 as const,
                            label: "Wide",
                            sub: "10 km spacing",
                            active:
                              "bg-blue-600 text-white shadow-md shadow-blue-600/30",
                          },
                          {
                            mult: 3 as const,
                            label: "Regional",
                            sub: "15 km spacing",
                            active:
                              "bg-violet-600 text-white shadow-md shadow-violet-600/30",
                          },
                        ].map(({ mult, label, sub, active }) => (
                          <button
                            key={mult}
                            onClick={() => setRadiusMult(mult)}
                            className={`py-1.5 rounded-md text-xs font-bold transition-all ${
                              radiusMult === mult
                                ? active
                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200"
                            }`}
                          >
                            <div>{label}</div>
                            <div
                              className={`text-[9px] font-normal opacity-70`}
                            >
                              {sub}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* How it works hint */}
                  {!validating && !predictionResult && (
                    <div className="flex items-start gap-2 bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5">
                      <Database className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Scans{" "}
                        <strong className="text-emerald-300">
                          {nPoints} ocean points
                        </strong>{" "}
                        in a{" "}
                        <strong className="text-blue-300">
                          {(calcScanRadius(nPoints) * radiusMult).toFixed(1)} km
                        </strong>{" "}
                        radius &middot; spacing{" "}
                        <strong className="text-slate-300">
                          ~{(SCAN_MIN_SPACING_KM * radiusMult).toFixed(1)} km
                        </strong>{" "}
                        &middot;{" "}
                        <strong className="text-amber-300">
                          ~
                          {(
                            (Math.PI *
                              Math.pow(
                                calcScanRadius(nPoints) * radiusMult,
                                2,
                              )) /
                            nPoints
                          ).toFixed(1)}{" "}
                          km²
                        </strong>{" "}
                        per point &middot; fetches live
                        <span className="text-emerald-400">
                          {" "}
                          SST &middot; SSH &middot; Chlo &middot; SSS &middot;
                          SSD &middot; Depth
                        </span>{" "}
                        from NOAA / GEBCO &middot; XGBoost model
                      </p>
                    </div>
                  )}

                  {/* Validation steps */}
                  {(validating || validationSteps.length > 0) && (
                    <div className="space-y-1.5 bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                      {startPoint && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-[10px] text-slate-300 font-mono flex-1">
                            Scanning from {startPoint.lat.toFixed(4)}°,{" "}
                            {startPoint.lng.toFixed(4)}°
                          </span>
                          {validating && (
                            <button
                              onClick={cancelPrediction}
                              className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300 hover:text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all"
                            >
                              <XCircle className="h-3 w-3" />
                              Stop
                            </button>
                          )}
                        </div>
                      )}
                      {/* EEZ warning for Hotspot Scanner */}
                      {scanOutsideEEZ && startPoint && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 rounded-lg p-2 mb-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-red-300 uppercase tracking-wide">
                              ⚠ Outside Sri Lanka EEZ — Scanning Disabled
                            </p>
                            <p className="text-[9px] text-red-400/80 mt-0.5 leading-snug">
                              This location is outside Sri Lanka's Exclusive
                              Economic Zone (200 NM). Scanning is blocked to
                              prevent illegal fishing guidance.
                            </p>
                            <button
                              onClick={() => {
                                setEezPopupType("hotspot");
                                setEezPopupOpen(true);
                              }}
                              className="mt-1 text-[9px] text-red-300 underline underline-offset-2 hover:text-red-200"
                            >
                              View legal notice
                            </button>
                          </div>
                        </div>
                      )}
                      {validationSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          {step.status === "running" && (
                            <Loader2 className="h-3.5 w-3.5 text-yellow-400 animate-spin flex-shrink-0 mt-0.5" />
                          )}
                          {step.status === "ok" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          )}
                          {step.status === "fail" && (
                            <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          {step.status === "pending" && (
                            <div className="h-3.5 w-3.5 rounded-full border border-slate-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-[10px] text-slate-300 font-medium">
                              {step.label}
                            </p>
                            {step.detail && (
                              <p className="text-[10px] text-slate-500">
                                {step.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {validationError && (
                        <div className="mt-2 flex items-start gap-2 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-300">
                            {validationError}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prediction Results Panel */}
                  {predictionResult && !validating && (
                    <div className="space-y-3 bg-slate-800/70 rounded-xl p-3 border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Prediction Results
                          </span>
                          {savedScanAt && (
                            <span
                              title={`Saved ${new Date(savedScanAt).toLocaleString()}`}
                              className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-0.5"
                            >
                              <Database className="h-2 w-2" />
                              saved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {predictionResult.total_points} pts ·{" "}
                            {predictionResult.radius_km}km
                            {predictionResult.summary?.mean_spacing_km && (
                              <>
                                {" "}
                                · ~{predictionResult.summary.mean_spacing_km}km
                                apart · ~
                                {(
                                  (Math.PI *
                                    Math.pow(predictionResult.radius_km, 2)) /
                                  predictionResult.total_points
                                ).toFixed(1)}
                                km²/pt
                              </>
                            )}
                          </span>
                          <button
                            onClick={clearPredictedPoints}
                            title="Clear predicted points and delete saved data"
                            className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-md px-2 py-0.5 transition-all text-[10px] font-semibold"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            Clear
                          </button>
                        </div>
                      </div>
                      {/* Best Confidence prominent card */}
                      {predictionResult.summary?.best_confidence_pct !==
                        undefined && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900/80 to-slate-800/60 border border-slate-600/40 rounded-xl px-3 py-2.5">
                          <div>
                            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                              Best Point
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Highest scoring location
                            </div>
                          </div>
                          <div
                            className={`text-4xl font-black leading-none ${
                              predictionResult.summary.best_confidence_pct >= 70
                                ? "text-emerald-400"
                                : predictionResult.summary
                                      .best_confidence_pct >= 40
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {predictionResult.summary.best_confidence_pct}%
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
                          <div className="text-lg font-black text-emerald-400">
                            {predictionResult.summary.high}
                          </div>
                          <div className="text-[9px] text-emerald-300/70 uppercase font-bold">
                            High
                          </div>
                        </div>
                        <div className="bg-yellow-500/10 rounded-lg p-2 text-center border border-yellow-500/20">
                          <div className="text-lg font-black text-yellow-400">
                            {predictionResult.summary.moderate}
                          </div>
                          <div className="text-[9px] text-yellow-300/70 uppercase font-bold">
                            Moderate
                          </div>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
                          <div className="text-lg font-black text-red-400">
                            {predictionResult.summary.low}
                          </div>
                          <div className="text-[9px] text-red-400/70 uppercase font-bold">
                            Low
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-400">
                            Mean Confidence
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            {predictionResult.summary.mean_confidence_pct}%
                            {predictionResult.summary.best_confidence_pct !==
                              undefined && (
                              <span className="text-[9px] text-slate-500">
                                {" "}
                                / best{" "}
                                {predictionResult.summary.best_confidence_pct}%
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full transition-all duration-700"
                            style={{
                              width: `${predictionResult.summary.mean_confidence_pct}%`,
                            }}
                          />
                          {/* Best confidence tick mark */}
                          {predictionResult.summary.best_confidence_pct !==
                            undefined && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/80"
                              style={{
                                left: `${predictionResult.summary.best_confidence_pct}%`,
                              }}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-600">
                          <span>0%</span>
                          <span className="text-slate-500">mean ▲ best</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Ocean confirmation badge */}
                      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-2">
                        <div className="text-blue-400 flex-shrink-0">✅</div>
                        <span className="text-[10px] text-blue-300 leading-snug">
                          <strong className="text-blue-200">
                            {predictionResult.ocean_verified_count ??
                              predictionResult.total_points}
                          </strong>{" "}
                          ocean pts · GEBCO 2025 verified
                          {(predictionResult.land_filtered ?? 0) > 0 && (
                            <span className="text-slate-500">
                              {" "}
                              · {predictionResult.land_filtered} land excluded
                            </span>
                          )}
                          {predictionResult.candidates_generated && (
                            <span className="text-slate-600">
                              {" "}
                              / {predictionResult.candidates_generated} sampled
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Top Points
                        </span>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {predictionResult.predictions
                            .slice(0, 8)
                            .map((p: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-2 py-1.5 border border-slate-700/30"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${p.score >= 0.7 ? "bg-red-400" : p.score >= 0.4 ? "bg-yellow-400" : "bg-slate-500"}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] font-mono text-slate-400 truncate">
                                    {p.lat.toFixed(4)}°, {p.lon.toFixed(4)}°
                                  </div>
                                  <div className="flex gap-2 text-[9px] text-slate-500 mt-0.5 flex-wrap">
                                    {p.sst != null && (
                                      <span>
                                        SST {Number(p.sst).toFixed(1)}°C
                                      </span>
                                    )}
                                    {p.chlo != null && (
                                      <span>
                                        Chl {Number(p.chlo).toFixed(2)}
                                      </span>
                                    )}
                                    {p.gebco_depth_m != null ? (
                                      <span className="text-blue-400/70">
                                        🌊 {Number(p.gebco_depth_m).toFixed(0)}m
                                        deep
                                      </span>
                                    ) : (
                                      p.depth != null && (
                                        <span>
                                          {Math.abs(Number(p.depth)).toFixed(0)}
                                          m
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                  <div
                                    className={`text-[10px] font-black ${p.score >= 0.7 ? "text-red-400" : p.score >= 0.4 ? "text-yellow-400" : "text-slate-500"}`}
                                  >
                                    {p.confidence_pct}%
                                  </div>
                                  {p.spawn_probability != null && (
                                    <div
                                      className={`text-[8px] font-bold px-1 py-0.5 rounded leading-none ${
                                        p.spawning
                                          ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      }`}
                                    >
                                      {p.spawning ? "SPAWN" : "No Spawn"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      {/* Live data sources badge strip */}
                      {predictionResult.predictions[0] && (
                        <div className="pt-2 border-t border-slate-700/50 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide">
                            Live data sources
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {predictionResult.predictions[0].chlo_source && (
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">
                                Chlo: NOAA VIIRS/MODIS
                              </span>
                            )}
                            {predictionResult.predictions[0].sss_source !==
                              undefined && (
                              <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5">
                                SSS: NOAA SMAP/SMOS
                              </span>
                            )}
                            <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded px-1.5 py-0.5">
                              SST: NOAA MUR NRT
                            </span>
                            <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-1.5 py-0.5">
                              Depth: GEBCO 2025
                            </span>
                            <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-1.5 py-0.5">
                              SSH: Copernicus NRT
                            </span>
                          </div>
                          {predictionResult.predictions[0]?.data_date && (
                            <p className="text-[8px] text-slate-600">
                              Data date:{" "}
                              {predictionResult.predictions[0].data_date}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Destination Scan ──────────────────────────────────── */}
                  <div className="space-y-2 mt-2">
                    <div className="space-y-2 bg-slate-900/60 rounded-xl p-2.5 border border-violet-500/20">
                      <p className="text-[9px] text-violet-300/70 uppercase font-bold tracking-wide flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Enter destination coordinates
                      </p>

                      {/* Pick on map button */}
                      <button
                        onClick={() => setPickingDestination((v) => !v)}
                        disabled={validating}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                          pickingDestination
                            ? "bg-violet-500/30 border-violet-400 text-violet-200 animate-pulse"
                            : "bg-slate-800 border-slate-600 text-slate-300 hover:border-violet-500/60 hover:text-violet-300"
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {pickingDestination
                          ? "Click anywhere on the map…"
                          : "Pick on Map"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-px bg-slate-700" />
                        <span className="text-[9px] text-slate-600">
                          or type
                        </span>
                        <div className="flex-1 h-px bg-slate-700" />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1">
                            Latitude (°N)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="e.g. 7.5200"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1">
                            Longitude (°E)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="e.g. 81.8000"
                            value={manualLon}
                            onChange={(e) => setManualLon(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => runFromManual("destination")}
                        disabled={
                          validating ||
                          !manualLat ||
                          !manualLon ||
                          scanOutsideEEZ
                        }
                        className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-violet-500/20"
                      >
                        {validating ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Scanning…</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Scan Around Destination</span>
                          </>
                        )}
                      </button>
                      <p className="text-[9px] text-slate-600 text-center">
                        {nPoints} ocean points scanned around your destination
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="grounds" className="space-y-3">
                {/* Header */}
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg">
                      <Star className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">
                        My Favourite Spot
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        AI catch forecast for your regular ground
                      </p>
                    </div>
                  </div>

                  {/* Spot name + Save button */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                      Spot Name
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Colombo Bank"
                        value={spotName}
                        onChange={(e) => setSpotName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        onClick={handleSaveSpot}
                        disabled={spotsSaving}
                        title="Save spot to My Spots"
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-lg px-2.5 flex items-center gap-1 text-[10px] font-bold transition-colors disabled:opacity-50"
                      >
                        {spotsSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={clearLocalGroundInputs}
                        type="button"
                        title="Clear local ground form"
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 flex items-center gap-1 text-[10px] font-bold transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear
                      </button>
                    </div>
                    {spotsError && (
                      <p className="text-[9px] text-red-400">{spotsError}</p>
                    )}
                  </div>

                  {/* My Spots dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                      My Spots
                    </label>
                    {savedSpots.length === 0 ? (
                      <p className="text-[9px] text-slate-600 italic">
                        No saved spots yet. Enter a name + coordinates and click
                        Save.
                      </p>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setSpotsDropdownOpen((v) => !v)}
                          className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition-colors"
                        >
                          <span className="truncate">
                            {savedSpots.find((s) => s.name === spotName)
                              ? spotName
                              : "Select a saved spot…"}
                          </span>
                          <ChevronDownIcon
                            className={`h-3 w-3 ml-2 shrink-0 transition-transform ${spotsDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {spotsDropdownOpen && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                            {savedSpots.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center group hover:bg-slate-800 transition-colors"
                              >
                                <button
                                  className="flex-1 text-left px-3 py-2 text-xs text-slate-200 truncate"
                                  onClick={() => {
                                    setSpotName(s.name);
                                    setSpotLat(String(s.lat));
                                    setSpotLng(String(s.lng));
                                    setSpotTotalKg(
                                      s.total_kg > 0 ? String(s.total_kg) : "",
                                    );
                                    setSpotsDropdownOpen(false);
                                  }}
                                >
                                  <span className="font-semibold">
                                    {s.name}
                                  </span>
                                  <span className="ml-2 text-slate-500 text-[9px]">
                                    {s.lat.toFixed(3)}, {s.lng.toFixed(3)}
                                  </span>
                                  {s.total_kg > 0 && (
                                    <span className="ml-1 text-emerald-500 text-[9px]">
                                      · {s.total_kg}kg
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSpot(s.id);
                                  }}
                                  className="px-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                                  title="Remove spot"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Departure harbour */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                      Departure Harbour
                    </label>
                    <select
                      value={spotDeparturePort}
                      onChange={(e) => setSpotDeparturePort(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      {DEPARTURE_HARBORS.map((harbor) => (
                        <option key={harbor} value={harbor}>
                          {harbor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lat / Lng */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        placeholder="6.9271"
                        value={spotLat}
                        onChange={(e) => setSpotLat(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        placeholder="79.8612"
                        value={spotLng}
                        onChange={(e) => setSpotLng(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* EEZ warning for Local Ground */}
                  {spotOutsideEEZ && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 rounded-lg p-2.5">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-red-300 uppercase tracking-wide">
                          ⚠ Outside Sri Lanka EEZ — Prediction Disabled
                        </p>
                        <p className="text-[9px] text-red-400/80 mt-0.5 leading-snug">
                          This location is outside Sri Lanka's Exclusive
                          Economic Zone (200 NM). Prediction is blocked to
                          prevent illegal fishing guidance.
                        </p>
                        <button
                          onClick={() => {
                            setEezPopupType("local");
                            setEezPopupOpen(true);
                          }}
                          className="mt-1 text-[9px] text-red-300 underline underline-offset-2 hover:text-red-200"
                        >
                          View legal notice
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Total catch weight */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                      Last Catch Weight (kg)
                      <span className="ml-1 text-emerald-500 font-bold">
                        ★ Key input
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 350"
                        value={spotTotalKg}
                        onChange={(e) => setSpotTotalKg(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                        kg
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-600">
                      Most recent total catch at this spot — drives the AI score
                    </p>
                  </div>

                  {/* Pick from map */}
                  <button
                    onClick={isPickingFromMap ? cancelMapPick : startMapPick}
                    className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isPickingFromMap
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {isPickingFromMap
                      ? "Click on map to pick… (cancel)"
                      : "Pick from Map"}
                  </button>

                  {localGroundError && (
                    <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {localGroundError}
                    </div>
                  )}

                  {/* Predict button */}
                  <button
                    onClick={runLocalGroundPredict}
                    disabled={
                      localGroundLoading ||
                      isPickingFromMap ||
                      !spotLat ||
                      !spotLng ||
                      spotOutsideEEZ
                    }
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wide transition-colors"
                  >
                    {localGroundLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                        Predicting…
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" /> Run Prediction
                      </>
                    )}
                  </button>
                </div>

                {/* Result card */}
                {localGroundPred && (
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          Result
                        </p>
                        <p className="text-sm font-bold text-slate-100 truncate">
                          {localGroundPred.name ?? "Custom Spot"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {localGroundPred.lat.toFixed(4)},{" "}
                          {localGroundPred.lng.toFixed(4)}
                        </p>
                      </div>
                      <div
                        className={`text-center px-3 py-2 rounded-xl border ${
                          localGroundPred.level === "High"
                            ? "bg-green-500/15 border-green-500/30 text-green-400"
                            : localGroundPred.level === "Moderate"
                              ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                              : "bg-red-500/15 border-red-500/30 text-red-400"
                        }`}
                      >
                        <p className="text-2xl font-black">
                          {localGroundPred.score}%
                        </p>
                        <p className="text-[10px] font-bold uppercase">
                          {localGroundPred.level}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          localGroundMarkerRef.current?.remove();
                          localGroundMarkerRef.current = null;
                          setLocalGroundPred(null);
                        }}
                        className="self-start text-slate-500 hover:text-red-400 transition-colors"
                        title="Clear result"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Score bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Hotspot probability</span>
                        <span>{localGroundPred.score}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${
                            localGroundPred.level === "High"
                              ? "bg-green-500"
                              : localGroundPred.level === "Moderate"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${localGroundPred.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Live weather used */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">
                        Live Weather (Open-Meteo)
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-700/50">
                          <Wind className="h-3 w-3 text-blue-400 mx-auto mb-0.5" />
                          <p className="text-[10px] font-bold text-slate-200">
                            {localGroundPred.weather.wind_speed.toFixed(1)}
                          </p>
                          <p className="text-[9px] text-slate-500">m/s</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-700/50">
                          <Gauge className="h-3 w-3 text-purple-400 mx-auto mb-0.5" />
                          <p className="text-[10px] font-bold text-slate-200">
                            {Math.round(localGroundPred.weather.pressure)}
                          </p>
                          <p className="text-[9px] text-slate-500">hPa</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-700/50">
                          <CloudRain className="h-3 w-3 text-cyan-400 mx-auto mb-0.5" />
                          <p className="text-[10px] font-bold text-slate-200">
                            {localGroundPred.weather.precip.toFixed(1)}
                          </p>
                          <p className="text-[9px] text-slate-500">mm</p>
                        </div>
                      </div>
                    </div>

                    {/* Scan hotspot CTA */}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </>
  );
}
