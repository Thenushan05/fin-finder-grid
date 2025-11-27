import axios from "axios";

// Base URL: use Vite env if provided, otherwise default to localhost:8000
const BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE,
  timeout: 30_000,
});
// Allow cross-site cookies (httpOnly set by backend)
api.defaults.withCredentials = true;

// Attach Authorization header from localStorage if present (dev fallback)
api.interceptors.request.use((cfg) => {
  try {
    const token = localStorage.getItem("access_token");
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

export default api;
