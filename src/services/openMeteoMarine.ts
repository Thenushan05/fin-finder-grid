// Wrapper for Open-Meteo Marine API to fetch wave / swell information
// Docs: https://open-meteo.com/en/docs/marine-api

// Simple in-memory cache to avoid repeated identical requests in a short window
const _marineCache: Map<string, { ts: number; data: any }> = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function fetchMarineData(
  latitude: number,
  longitude: number,
  options?: {
    hourly?: string[] | string;
    daily?: string[] | string;
    timezone?: string;
  }
) {
  const url = new URL("https://marine-api.open-meteo.com/v1/marine");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));

  const hourly = options?.hourly ?? ["wave_height", "wave_direction"];
  const daily = options?.daily;
  const timezone = options?.timezone ?? "UTC";

  if (Array.isArray(hourly)) url.searchParams.set("hourly", hourly.join(","));
  else url.searchParams.set("hourly", String(hourly));

  if (daily) {
    if (Array.isArray(daily)) url.searchParams.set("daily", daily.join(","));
    else url.searchParams.set("daily", String(daily));
  }

  url.searchParams.set("timezone", timezone);

  const key = url.toString();

  // Return cached result when recent
  const cached = _marineCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  // Retry with exponential backoff for rate limits / server errors
  const MAX_RETRIES = 4;
  const BASE_DELAY = 500; // ms
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(key);
      if (!res.ok) {
        // Retry on 429 and 5xx
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          lastErr = new Error(`Marine API request failed: ${res.status}`);
          // fall through to retry below
        } else {
          throw new Error(`Marine API request failed: ${res.status}`);
        }
      } else {
        const data = await res.json();

        const result = {
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation,
          timezone: data.timezone,
          timezoneAbbreviation: data.timezone_abbreviation ?? null,
          utcOffsetSeconds: data.utc_offset_seconds ?? null,
          hourly: data.hourly ?? null,
          daily: data.daily ?? null,
          // raw payload available if needed
          raw: data,
        };

        // cache the response
        try {
          _marineCache.set(key, { ts: Date.now(), data: result });
        } catch (e) {
          // ignore cache set errors
        }

        return result;
      }
    } catch (err) {
      lastErr = err;
    }

    // If this was the last attempt, break and throw below
    if (attempt === MAX_RETRIES) break;

    // Wait with exponential backoff + jitter
    const backoff = BASE_DELAY * Math.pow(2, attempt);
    const jitter = Math.round(Math.random() * 200);
    await new Promise((r) => setTimeout(r, backoff + jitter));
  }

  // If we reach here, all retries failed
  if (lastErr instanceof Error) throw lastErr;
  throw new Error("Marine API request failed after retries");
}

export type MarineResult = Awaited<ReturnType<typeof fetchMarineData>>;

// Example usage (async context):
// const m = await fetchMarineData(54.544587, 10.227487, { daily: 'wave_height_max', hourly: ['wave_height','wave_direction'], timezone: 'auto' });
// const hourly = m.hourly; // contains arrays for time, wave_height, wave_direction
// const daily = m.daily; // contains daily aggregates like wave_height_max

/**
 * Convenience helper to fetch hourly sea surface temperature (SST) for a location.
 * Returns parsed Date objects for timestamps and numeric SST values (or nulls when missing).
 */
export async function fetchSeaSurfaceTemperature(
  latitude: number,
  longitude: number,
  options?: { timezone?: string }
) {
  const timezone = options?.timezone ?? "UTC";
  const m = await fetchMarineData(latitude, longitude, {
    hourly: ["sea_surface_temperature"],
    timezone,
  });

  const hourly = m.hourly ?? null;

  if (!hourly || !Array.isArray(hourly.time)) {
    return {
      time: [] as Date[],
      sea_surface_temperature: [] as Array<number | null>,
      rawHourly: hourly,
      meta: {
        latitude: m.latitude,
        longitude: m.longitude,
        timezone: m.timezone,
        utcOffsetSeconds: m.utcOffsetSeconds,
      },
    };
  }

  // Map time values to Date objects. Handle ISO strings and unix timestamps (seconds or milliseconds).
  const parseTimeValue = (t: any) => {
    if (t === null || t === undefined) return null;
    // numeric-like strings or numbers
    const n = Number(t);
    if (!Number.isNaN(n)) {
      // Heuristic: values < 1e12 are seconds, >=1e12 are milliseconds
      if (n < 1e12) return new Date(n * 1000);
      return new Date(n);
    }
    // Fallback: string parse (ISO 8601)
    try {
      return new Date(String(t));
    } catch (e) {
      return null;
    }
  };

  // Keep parsed time entries (possibly null) to preserve index alignment with SST array
  const times: Array<Date | null> = hourly.time.map((t: any) =>
    parseTimeValue(t)
  );

  const sstValues: Array<number | null> = Array.isArray(
    hourly.sea_surface_temperature
  )
    ? hourly.sea_surface_temperature.map((v: any) =>
        v === null || v === undefined || v === "" ? null : Number(v)
      )
    : [];

  return {
    time: times,
    sea_surface_temperature: sstValues,
    rawHourly: hourly,
    meta: {
      latitude: m.latitude,
      longitude: m.longitude,
      timezone: m.timezone,
      utcOffsetSeconds: m.utcOffsetSeconds,
    },
  };
}

// Example usage:
// (async () => {
//   const sst = await fetchSeaSurfaceTemperature(54.544587, 10.227487, { timezone: 'UTC' });
//   console.log('First 5 SST values:', sst.time.slice(0,5), sst.sea_surface_temperature.slice(0,5));
// })();
