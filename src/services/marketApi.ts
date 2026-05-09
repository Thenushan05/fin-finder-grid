/**
 * Market price prediction API client.
 * Backend: /api/v1/market/*
 */

const BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

const headers = () => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const raw =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (raw) h["Authorization"] = `Bearer ${raw}`;
  } catch {
    /* ignore */
  }
  return h;
};

async function get<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, String(v)),
  );
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`Market API ${path} – ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Market API POST ${path} – ${res.status}`);
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SpeciesMeta {
  code: string;
  name: string;
  base_lkr: number;
  current_price: number;
}

export interface ForecastPoint {
  day: string;
  date: string;
  day_label: string;
  price: number;
  index: number;
}

export interface DayForecast extends ForecastPoint {
  day_idx: number;
}

export interface PredictResponse {
  species: string;
  date: string;
  today_price: number;
  prev_price: number;
  pct_change: number;
  wow_pct: number;
  trend: "Up" | "Down" | "Stable";
  confidence: number;
  action: "Buy" | "Sell" | "Hold";
  monsoon: string;
  festival_name: string | null;
  festival_days: number | null;
  festival_boost: number;
  forecast_7d: DayForecast[];
  model_used: boolean;
}

export interface WeekOutlook {
  week: string;
  start_date: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  trend: "Up" | "Down" | "Stable";
  confidence: number;
  intensity: number;
  festivals: string[];
  daily: { day: string; price: number; index: number }[];
}

export interface SpeciesSummary {
  code: string;
  name: string;
  price: number;
  last_week: number;
  wow_pct: number;
  trend: "Up" | "Down" | "Stable";
  confidence: number;
  action: "Buy" | "Sell" | "Hold";
  sparkline: number[];
}

export interface MarketSummaryResponse {
  date: string;
  monsoon: string;
  festival_name: string | null;
  festival_days: number | null;
  festival_boost: number;
  species: SpeciesSummary[];
}

export interface MultiSpeciesPoint {
  day: string;
  date: string;
  day_label: string;
  [key: string]: string | number; // YFT, YFT_idx, BET, BET_idx, …
}

export interface SeasonalPoint {
  month: string;
  month_n: number;
  price: number;
  monsoon: string;
}

export interface SeasonalResponse {
  species: string;
  year: number;
  monthly: SeasonalPoint[];
  avg_price: number;
  peak_month: string;
  peak_price: number;
  trough_month: string;
  trough_price: number;
  seasonal_range: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface FestivalEvent {
  date: string;
  name: string;
  days_until: number;
  is_past: boolean;
  festival_boost: number;
  price_impact_pct: number;   // ML-computed % uplift for YFT
  monsoon: string;
}

export interface FestivalsResponse {
  today: string;
  lookahead: number;
  festivals: FestivalEvent[];
}

// ── API calls ──────────────────────────────────────────────────────────────────

export const marketApi = {
  /** List all supported species with current prices */
  listSpecies: () => get<{ species: SpeciesMeta[] }>("/api/v1/market/species"),

  /** Predict today's price + 7-day forecast for one species */
  predict: (species: string, date?: string) =>
    post<PredictResponse>("/api/v1/market/predict", {
      species,
      date: date ?? new Date().toISOString().slice(0, 10),
    }),

  /** Multi-day single-species forecast (index=100 at day 0) */
  forecast: (species: string, days = 30) =>
    get<{ species: string; days: number; points: ForecastPoint[] }>(
      "/api/v1/market/forecast",
      { species, days },
    ),

  /** Multi-species overlay forecast */
  multiSpecies: (species: string[], days = 30) =>
    get<{ codes: string[]; days: number; points: MultiSpeciesPoint[] }>(
      "/api/v1/market/multi-species",
      { species: species.join(","), days },
    ),

  /** Summary table for all main species */
  summary: (date?: string) =>
    get<MarketSummaryResponse>("/api/v1/market/summary", date ? { date } : {}),

  /** 4-week rolling outlook for one species */
  weeklyOutlook: (species: string) =>
    get<{ species: string; weeks: WeekOutlook[] }>(
      "/api/v1/market/weekly-outlook",
      { species },
    ),

  /** Seasonal 12-month analysis */
  seasonal: (species: string, year?: number) =>
    get<SeasonalResponse>("/api/v1/market/seasonal", {
      species,
      year: year ?? new Date().getFullYear(),
    }),

  /** Feature importance from XGB sub-model */
  featureImportance: () =>
    get<{ features: FeatureImportance[] }>("/api/v1/market/feature-importance"),

  /** Upcoming Sri Lanka public holidays with ML price impact */
  festivals: (lookahead = 60) =>
    get<FestivalsResponse>("/api/v1/market/festivals", { lookahead }),
};
