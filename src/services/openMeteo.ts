// Lightweight in-memory cache + retry/backoff for Open-Meteo requests
const _openMeteoCache: Map<string, { ts: number; data: any }> = new Map();
const OPEN_METEO_CACHE_TTL = 60 * 1000; // 1 minute

export async function fetchOpenMeteo(latitude: number, longitude: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  // Request current weather and hourly variables including wind and precipitation.
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current_weather", "true");
  // Include hourly variables. We request multiple weather fields so the UI can show:
  // - wind speed/direction and gusts
  // - precipitation and precipitation probability (for storms/heavy rain)
  // - weathercode (categorical weather condition)
  // - visibility
  // Note: Wave/swell information is provided by Open-Meteo's Marine API (different endpoint)
  // and may require calling https://marine-api.open-meteo.com/v1/marine for reliable wave data.
  // Adjust variable names if you need specific model layers (e.g., wind_speed_10m vs wind_speed_180m).
  url.searchParams.set(
    "hourly",
    "wind_speed_10m,wind_direction_10m,windgusts_10m,precipitation,precipitation_probability,weathercode,visibility"
  );
  // Keep timestamps in UTC for simplicity; change to local timezone if required.
  url.searchParams.set("timezone", "UTC");

  const key = url.toString();

  const cached = _openMeteoCache.get(key);
  if (cached && Date.now() - cached.ts < OPEN_METEO_CACHE_TTL)
    return cached.data;

  const MAX_RETRIES = 4;
  const BASE_DELAY = 400; // ms
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(key);
      if (!res.ok) {
        // If rate limited or server error, attempt retry
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          lastErr = new Error(`Open-Meteo request failed: ${res.status}`);
          // Honor Retry-After header if present
          const ra = res.headers.get("Retry-After");
          let waitMs = 0;
          if (ra) {
            const raNum = Number(ra);
            if (!Number.isNaN(raNum)) {
              waitMs = raNum * 1000;
            } else {
              // try parse HTTP-date
              const dt = Date.parse(ra);
              if (!Number.isNaN(dt)) waitMs = Math.max(0, dt - Date.now());
            }
          }
          if (waitMs > 0) {
            await new Promise((r) => setTimeout(r, waitMs));
          } else {
            // exponential backoff with jitter
            const backoff = BASE_DELAY * Math.pow(2, attempt);
            const jitter = Math.round(Math.random() * 250);
            await new Promise((r) => setTimeout(r, backoff + jitter));
          }
          // continue to next attempt
        } else {
          throw new Error(`Open-Meteo request failed: ${res.status}`);
        }
      } else {
        const data = await res.json();
        const result = {
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation,
          timezone: data.timezone,
          // current_weather is a compact snapshot (temp, windspeed, winddirection, time)
          current: data.current_weather ?? null,
          // hourly contains arrays for the requested variables (may be null if API doesn't provide them)
          hourly: data.hourly ?? null,
        };

        try {
          _openMeteoCache.set(key, { ts: Date.now(), data: result });
        } catch (e) {
          // ignore cache set errors
        }

        return result;
      }
    } catch (err) {
      lastErr = err;
      // small pause before next retry
      const backoff = BASE_DELAY * Math.pow(2, attempt);
      const jitter = Math.round(Math.random() * 200);
      await new Promise((r) => setTimeout(r, backoff + jitter));
    }
  }

  if (lastErr instanceof Error) throw lastErr;
  throw new Error("Open-Meteo request failed after retries");
}

export type OpenMeteoResult = Awaited<ReturnType<typeof fetchOpenMeteo>>;
