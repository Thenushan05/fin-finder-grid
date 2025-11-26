import axios from "axios";

// Base URL: use Vite env if provided, otherwise default to localhost:8000
const BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE,
  timeout: 30_000,
});

export async function postRegionPrediction(body: any) {
  const res = await api.post("/api/hotspots/region", body);
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
