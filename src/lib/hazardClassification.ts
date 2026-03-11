// Hazard classification logic combining wind, waves, and weather conditions
// Returns a unified risk level for marine navigation

export type HazardLevel = "LOW" | "MEDIUM" | "HIGH" | "DANGER";

/** Represents a weather hazard event selectable on the map */
export interface WeatherHazard {
  lat: number;
  lng: number;
  type: string; // e.g. "storm" | "tornado" | "squall"
  severity: string; // e.g. "high" | "medium" | "low"
  windSpeed?: number; // in knots
  waveHeight?: number; // in metres
}

export interface HazardResult {
  level: HazardLevel;
  score: number;
  color: string;
  bgColor: string;
  description: string;
  reasons?: string[];
}

/**
 * Map Open-Meteo WMO Weather interpretation codes to risk scores
 * Reference: https://open-meteo.com/en/docs
 *
 * Code ranges:
 * 0 - Clear sky
 * 1-3 - Mainly clear, partly cloudy, overcast
 * 45,48 - Fog
 * 51-67 - Rain (drizzle to heavy)
 * 71-77 - Snow
 * 80-82 - Rain showers
 * 85-86 - Snow showers
 * 95-99 - Thunderstorm
 */
export function getWeatherRisk(weatherCode: number | null | undefined): number {
  if (weatherCode == null) return 0;

  // Thunderstorms → DANGER level (score 3)
  if (weatherCode >= 95) return 3;

  // Heavy rain, freezing rain, heavy showers → HIGH level (score 2)
  if (
    (weatherCode >= 63 && weatherCode <= 67) || // Heavy/freezing rain
    weatherCode === 82 || // Violent rain showers
    weatherCode >= 85 // Snow showers
  )
    return 2;

  // Light to moderate rain, drizzle → MEDIUM level (score 1)
  if (
    (weatherCode >= 51 && weatherCode <= 61) || // Drizzle to moderate rain
    (weatherCode >= 80 && weatherCode <= 81) // Light rain showers
  )
    return 1;

  // Clear, cloudy, fog → LOW level (score 0)
  return 0;
}

/**
 * Calculate wind risk score based on km/h thresholds
 */
export function getWindRisk(windKmh: number | null | undefined): number {
  if (windKmh == null) return 0;
  if (windKmh < 20) return 0; // Low
  if (windKmh < 40) return 1; // Medium
  if (windKmh < 60) return 2; // High
  return 3; // Danger
}

/**
 * Calculate wave risk score based on height in meters
 */
export function getWaveRisk(waveM: number | null | undefined): number {
  if (waveM == null) return 0;
  if (waveM < 1) return 0; // Low
  if (waveM < 2) return 1; // Medium
  if (waveM < 3) return 2; // High
  return 3; // Danger
}

/**
 * Calculate ocean current risk score based on velocity in m/s
 */
export function getCurrentRisk(currentMs: number | null | undefined): number {
  if (currentMs == null) return 0;
  if (currentMs < 0.3) return 0; // Low
  if (currentMs < 0.8) return 1; // Medium
  if (currentMs < 1.5) return 2; // High
  return 3; // Danger
}

/**
 * Combine wind, wave, and weather condition into a unified hazard level
 * Uses the maximum score across all factors
 */
export function calculateHazardLevel(
  windKmh: number | null | undefined,
  waveM: number | null | undefined,
  weatherCode: number | null | undefined,
  currentMs?: number | null | undefined,
): HazardResult {
  const windScore = getWindRisk(windKmh);
  const waveScore = getWaveRisk(waveM);
  const condScore = getWeatherRisk(weatherCode);
  const currentScore = getCurrentRisk(currentMs);

  const maxScore = Math.max(windScore, waveScore, condScore, currentScore);

  const reasons: string[] = [];
  if (windScore > 0) {
    const windLabel =
      windScore === 1
        ? "Medium (20-40 km/h)"
        : windScore === 2
          ? "High (40-60 km/h)"
          : "Danger (>60 km/h)";
    reasons.push(`Wind: ${windKmh?.toFixed(0) ?? "N/A"} km/h (${windLabel})`);
  }
  if (waveScore > 0) {
    const waveLabel =
      waveScore === 1
        ? "Medium (1-2 m)"
        : waveScore === 2
          ? "High (2-3 m)"
          : "Danger (>3 m)";
    reasons.push(`Waves: ${waveM?.toFixed(1) ?? "N/A"} m (${waveLabel})`);
  }
  if (condScore > 0) {
    reasons.push(`Weather: ${getWeatherDescription(weatherCode)}`);
  }
  if (currentScore > 0) {
    const curLabel =
      currentScore === 1
        ? "Medium (0.3-0.8 m/s)"
        : currentScore === 2
          ? "High (0.8-1.5 m/s)"
          : "Danger (>1.5 m/s)";
    reasons.push(
      `Current: ${currentMs?.toFixed(2) ?? "N/A"} m/s (${curLabel})`,
    );
  }

  switch (maxScore) {
    case 0:
      return {
        level: "LOW",
        score: 0,
        color: "text-green-700",
        bgColor: "bg-green-400",
        description: "Safe conditions",
      };
    case 1:
      return {
        level: "MEDIUM",
        score: 1,
        color: "text-yellow-700",
        bgColor: "bg-yellow-400",
        description: "Moderate risk - caution advised",
      };
    case 2:
      return {
        level: "HIGH",
        score: 2,
        color: "text-orange-700",
        bgColor: "bg-orange-500",
        description: "High risk - experienced sailors only",
        reasons,
      };
    default:
      return {
        level: "DANGER",
        score: 3,
        color: "text-red-700",
        bgColor: "bg-red-600",
        description: "Dangerous - avoid navigation",
        reasons,
      };
  }
}

/**
 * Get a human-readable weather description from WMO code
 */
export function getWeatherDescription(
  weatherCode: number | null | undefined,
): string {
  if (weatherCode == null) return "Unknown";

  if (weatherCode === 0) return "Clear sky";
  if (weatherCode <= 3) return "Partly cloudy";
  if (weatherCode <= 48) return "Fog";
  if (weatherCode <= 57) return "Drizzle";
  if (weatherCode <= 67) return "Rain";
  if (weatherCode <= 77) return "Snow";
  if (weatherCode <= 82) return "Showers";
  if (weatherCode <= 86) return "Snow showers";
  if (weatherCode <= 99) return "Thunderstorm";

  return "Unknown";
}
