import axios from "axios";
import tokenService from "./tokenService";

// Base URL: use Vite env if provided, otherwise default to localhost:8001
const BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8001";

const api = axios.create({
  baseURL: BASE,
  timeout: 300_000, // 5 minutes for Copernicus data fetching
});
// Allow cross-site cookies (httpOnly set by backend)
api.defaults.withCredentials = true;

// Attach Authorization header from localStorage if present (dev fallback)
api.interceptors.request.use((cfg) => {
  try {
    const token = tokenService.getToken();
    if (token && cfg.headers) cfg.headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {
    // ignore in SSR/other environments
  }
  return cfg;
});

export async function postRegionPrediction(body: any) {
  // Ensure a date is present (backend will accept null, but many pipelines
  // expect date-derived features). If caller didn't provide a date, set
  // it to today's YYYYMMDD so YEAR/MONTH can be derived server-side.
  const payload = { ...body };
  if (payload.date === null || payload.date === undefined) {
    const now = new Date();
    const yyyy = now.getUTCFullYear().toString();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    payload.date = `${yyyy}${mm}${dd}`;
  }

  // Map common frontend weather key to backend expected names
  if (
    payload.overrides &&
    payload.overrides.sea_level_height_msl !== undefined
  ) {
    // copy to `ssh` which the backend expects
    payload.overrides.ssh = Number(payload.overrides.sea_level_height_msl);
  }

  // Check if request has bbox - use predict-region endpoint
  if (payload && payload.bbox) {
    // Region-based prediction with bbox (longer timeout for Copernicus API)
    const res = await api.post("/api/v1/hotspots/predict-region", payload, {
      timeout: 300_000, // 5 minutes
    });
    return res.data;
  }

  // The backend expects an array of GridCell objects at `/api/v1/hotspots/predict`.
  // Accept either an array input or a single-object input and convert to array.
  let sendBody: any = payload;
  if (Array.isArray(body)) {
    sendBody = body;
  } else if (payload && payload.cells && Array.isArray(payload.cells)) {
    sendBody = payload.cells;
  } else if (
    payload &&
    (payload.lat !== undefined || payload.lon !== undefined)
  ) {
    sendBody = [{ lat: Number(payload.lat), lon: Number(payload.lon) }];
  } else {
    // fallback: send the whole payload as-is (may produce a 422 if invalid)
    sendBody = payload;
  }

  const res = await api.post("/api/v1/hotspots/predict", sendBody);
  return res.data;
}

// --- Auth API helpers ---
export async function authLogin(email: string, password: string) {
  const res = await api.post("/api/v1/auth/token", { email, password });
  return res.data;
}

export async function authRegister(
  name: string | null,
  email: string,
  password: string
) {
  // include full name as `name` to be available server-side if desired
  const res = await api.post("/api/v1/auth/register", {
    name,
    email,
    password,
  });
  return res.data;
}

export async function authRefresh() {
  const res = await api.post("/api/v1/auth/refresh");
  return res.data;
}

export async function authLogout() {
  const res = await api.post("/api/v1/auth/logout");
  return res.data;
}

export async function authMe() {
  const res = await api.get("/api/v1/auth/me");
  return res.data;
}

// --- Maintenance API helpers ---
export async function getVessels() {
  const res = await api.get("/api/v1/maintenance/vessels");
  return res.data.vessels;
}

export async function getVessel(vesselId: string) {
  const res = await api.get(`/api/v1/maintenance/vessels/${vesselId}`);
  return res.data;
}

export async function createVessel(vessel: any) {
  const res = await api.post("/api/v1/maintenance/vessels", vessel);
  return res.data;
}

export async function updateVessel(vesselId: string, vessel: any) {
  const res = await api.put(`/api/v1/maintenance/vessels/${vesselId}`, vessel);
  return res.data;
}

export async function deleteVessel(vesselId: string) {
  const res = await api.delete(`/api/v1/maintenance/vessels/${vesselId}`);
  return res.data;
}

export async function updateSystemStatus(
  vesselId: string,
  systemId: string,
  status: string
) {
  const res = await api.patch(
    `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/status`,
    { status }
  );
  return res.data;
}

export async function createMaintenanceTask(
  vesselId: string,
  systemId: string,
  task: string,
  due: string,
  priority: string
) {
  const res = await api.post(
    `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/tasks`,
    { systemId, task, due, priority }
  );
  return res.data;
}

export async function updateMaintenanceTask(
  vesselId: string,
  systemId: string,
  taskId: string,
  updates: any
) {
  const res = await api.patch(
    `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/tasks/${taskId}`,
    updates
  );
  return res.data;
}

export async function deleteMaintenanceTask(
  vesselId: string,
  systemId: string,
  taskId: string
) {
  const res = await api.delete(
    `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/tasks/${taskId}`
  );
  return res.data;
}

export async function createServiceLog(
  vesselId: string,
  systemId: string,
  date: string,
  technician: string,
  notes: string,
  cost?: string
) {
  const res = await api.post(
    `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/service-logs`,
    { systemId, date, technician, notes, cost }
  );
  return res.data;
}

export async function getHotspotsToday(
  params: { species?: string; threshold?: number; top_k?: number } = {}
) {
  const q: any = {};
  if (params.species) q.species = params.species;
  if (params.threshold !== undefined) q.threshold = params.threshold;
  if (params.top_k !== undefined) q.top_k = params.top_k;
  const res = await api.get("/api/hotspots/today", { params: q });
  return res.data;
}

export async function getDepth(lat: number, lon: number) {
  const res = await api.get("/api/depth", { params: { lat, lon } });
  return res.data;
}

// --- Fuel Consumption API helpers ---
export async function calculateFuelConsumption({
  start_lat,
  start_lon,
  end_lat,
  end_lon,
  vessel_id,
}: {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  vessel_id?: string;
}) {
  const res = await api.post("/api/v1/fuel/calculate-fuel-consumption", {
    start_lat,
    start_lon,
    end_lat,
    end_lon,
    vessel_id,
  });
  return res.data;
}

export async function getFuelVessels() {
  const res = await api.get("/api/v1/fuel/vessels");
  return res.data;
}

export async function calculateMultipleStopsFuel({
  coordinates,
  vessel_id,
}: {
  coordinates: Array<{ lat: number; lng: number }>;
  vessel_id?: string;
}) {
  // Calculate fuel consumption for a multi-stop trip
  const calculations = [];
  let totalDistance = 0;
  let totalFuel = 0;
  let totalCost = 0;
  let totalDuration = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];

    const result = await calculateFuelConsumption({
      start_lat: start.lat,
      start_lon: start.lng,
      end_lat: end.lat,
      end_lon: end.lng,
      vessel_id,
    });

    calculations.push(result);
    totalDistance += result.distance_km;
    totalFuel += result.fuel_consumption_liters;
    totalCost += result.fuel_cost_usd;
    totalDuration += result.estimated_trip_duration_hours;
  }

  return {
    segments: calculations,
    totals: {
      distance_km: totalDistance,
      fuel_consumption_liters: totalFuel,
      fuel_cost_usd: totalCost,
      estimated_trip_duration_hours: totalDuration,
    },
  };
}

export default api;
