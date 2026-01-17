import { fetchOpenMeteo } from "./openMeteo";
import { fetchMarineData } from "./openMeteoMarine";

export interface SeaCondition {
  condition: "calm" | "choppy" | "rough";
  fuelMultiplier: number;
  speedMultiplier: number;
  safetyLevel: "low" | "medium" | "high";
  description: string;
  windSpeed: number;
  waveHeight: number;
  visibility?: number;
  timestamp: Date;
}

export interface WeatherData {
  windSpeed: number; // m/s
  windDirection: number; // degrees
  windGusts: number; // m/s
  waveHeight: number; // meters
  waveDirection?: number; // degrees
  visibility?: number; // meters
  precipitation?: number; // mm
  weatherCode?: number;
  timestamp: Date;
}

/**
 * Determines sea condition based on wind speed and wave height using marine weather standards
 */
export function determineSeaCondition(
  windSpeed: number,
  waveHeight: number,
  visibility?: number
): SeaCondition["condition"] {
  // Using Beaufort Scale and Douglas Sea State Scale for classification

  // Rough conditions (dangerous for small to medium vessels)
  if (windSpeed >= 10.8 || waveHeight >= 2.5) {
    // Beaufort 6+ (Strong breeze) or Douglas 4+ (Moderate sea)
    return "rough";
  }

  // Choppy conditions (challenging but manageable)
  if (windSpeed >= 5.5 || waveHeight >= 1.0) {
    // Beaufort 4+ (Moderate breeze) or Douglas 3+ (Slight sea)
    return "choppy";
  }

  // Calm conditions (ideal for fishing)
  return "calm";
}

/**
 * Calculates fuel consumption multiplier based on sea conditions
 */
export function getFuelMultiplier(
  condition: SeaCondition["condition"]
): number {
  switch (condition) {
    case "rough":
      return 1.35; // 35% increase - vessel fights waves and wind
    case "choppy":
      return 1.18; // 18% increase - moderate resistance
    case "calm":
    default:
      return 1.0; // baseline consumption
  }
}

/**
 * Calculates speed reduction multiplier based on sea conditions
 */
export function getSpeedMultiplier(
  condition: SeaCondition["condition"]
): number {
  switch (condition) {
    case "rough":
      return 0.65; // 35% speed reduction - safety and efficiency
    case "choppy":
      return 0.82; // 18% speed reduction - moderate impact
    case "calm":
    default:
      return 1.0; // normal cruising speed
  }
}

/**
 * Gets safety level and description for sea conditions
 */
export function getConditionDetails(
  condition: SeaCondition["condition"],
  windSpeed: number,
  waveHeight: number
) {
  switch (condition) {
    case "rough":
      return {
        safetyLevel: "high" as const,
        description: `Dangerous conditions - ${windSpeed.toFixed(
          1
        )}m/s winds, ${waveHeight.toFixed(1)}m waves. Experienced crew only.`,
      };
    case "choppy":
      return {
        safetyLevel: "medium" as const,
        description: `Moderate conditions - ${windSpeed.toFixed(
          1
        )}m/s winds, ${waveHeight.toFixed(1)}m waves. Use caution.`,
      };
    case "calm":
    default:
      return {
        safetyLevel: "low" as const,
        description: `Ideal conditions - ${windSpeed.toFixed(
          1
        )}m/s winds, ${waveHeight.toFixed(1)}m waves. Perfect for fishing.`,
      };
  }
}

/**
 * Fetches current weather and marine data for a location
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    // Fetch both weather and marine data in parallel
    const [weatherData, marineData] = await Promise.all([
      fetchOpenMeteo(latitude, longitude),
      fetchMarineData(latitude, longitude, {
        hourly: ["wave_height", "wave_direction", "wind_speed_10m"],
      }),
    ]);

    // Extract current data
    const current = weatherData.current;
    const hourly = weatherData.hourly;
    const marineHourly = marineData.hourly;

    // Get current hour data (first entry is typically current)
    const currentHourIndex = 0;

    const windSpeed =
      current?.windspeed ||
      hourly?.wind_speed_10m?.[currentHourIndex] ||
      marineHourly?.wind_speed_10m?.[currentHourIndex] ||
      0;

    const windDirection =
      current?.winddirection ||
      hourly?.wind_direction_10m?.[currentHourIndex] ||
      0;

    const windGusts =
      hourly?.windgusts_10m?.[currentHourIndex] || windSpeed * 1.3;

    const waveHeight =
      marineHourly?.wave_height?.[currentHourIndex] ||
      (marineHourly?.wave_height?.length > 0
        ? Number(marineHourly.wave_height[0])
        : null) ||
      0;

    const waveDirection =
      marineHourly?.wave_direction?.[currentHourIndex] ||
      (marineHourly?.wave_direction?.length > 0
        ? Number(marineHourly.wave_direction[0])
        : null);

    const visibility =
      hourly?.visibility?.[currentHourIndex] ||
      (hourly?.visibility?.length > 0 ? Number(hourly.visibility[0]) : null);

    const precipitation =
      hourly?.precipitation?.[currentHourIndex] ||
      (hourly?.precipitation?.length > 0
        ? Number(hourly.precipitation[0])
        : null);

    const weatherCode =
      hourly?.weathercode?.[currentHourIndex] ||
      (hourly?.weathercode?.length > 0 ? Number(hourly.weathercode[0]) : null);

    return {
      windSpeed: Number(windSpeed) || 0,
      windDirection: Number(windDirection) || 0,
      windGusts: Number(windGusts) || 0,
      waveHeight: Number(waveHeight) || 0,
      waveDirection: waveDirection ? Number(waveDirection) : undefined,
      visibility: visibility ? Number(visibility) : undefined,
      precipitation: precipitation ? Number(precipitation) : undefined,
      weatherCode: weatherCode ? Number(weatherCode) : undefined,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Failed to fetch weather data:", error);

    // Return default calm conditions on error
    return {
      windSpeed: 3.0, // default light breeze
      windDirection: 0,
      windGusts: 4.0,
      waveHeight: 0.5, // default slight waves
      timestamp: new Date(),
    };
  }
}

/**
 * Gets complete sea condition analysis for a location
 */
export async function getSeaCondition(
  latitude: number,
  longitude: number
): Promise<SeaCondition> {
  const weatherData = await fetchWeatherData(latitude, longitude);

  const condition = determineSeaCondition(
    weatherData.windSpeed,
    weatherData.waveHeight,
    weatherData.visibility
  );
  const fuelMultiplier = getFuelMultiplier(condition);
  const speedMultiplier = getSpeedMultiplier(condition);
  const { safetyLevel, description } = getConditionDetails(
    condition,
    weatherData.windSpeed,
    weatherData.waveHeight
  );

  return {
    condition,
    fuelMultiplier,
    speedMultiplier,
    safetyLevel,
    description,
    windSpeed: weatherData.windSpeed,
    waveHeight: weatherData.waveHeight,
    visibility: weatherData.visibility,
    timestamp: weatherData.timestamp,
  };
}

/**
 * Gets average sea conditions for a route with multiple waypoints
 */
export async function getRouteSeaConditions(
  coordinates: Array<{ lat: number; lng: number }>
): Promise<SeaCondition> {
  // Sample key points along the route (start, middle, end)
  const samplePoints: Array<{ lat: number; lng: number }> = [];

  if (coordinates.length <= 3) {
    samplePoints.push(...coordinates);
  } else {
    samplePoints.push(coordinates[0]); // start
    samplePoints.push(coordinates[Math.floor(coordinates.length / 2)]); // middle
    samplePoints.push(coordinates[coordinates.length - 1]); // end
  }

  try {
    // Get conditions for sample points
    const conditionsPromises = samplePoints.map((coord) =>
      getSeaCondition(coord.lat, coord.lng)
    );

    const allConditions = await Promise.all(conditionsPromises);

    // Calculate averages
    const avgWindSpeed =
      allConditions.reduce((sum, c) => sum + c.windSpeed, 0) /
      allConditions.length;
    const avgWaveHeight =
      allConditions.reduce((sum, c) => sum + c.waveHeight, 0) /
      allConditions.length;
    const avgVisibility =
      allConditions.reduce((sum, c) => sum + (c.visibility || 10000), 0) /
      allConditions.length;

    // Determine worst condition along route (most conservative approach)
    const worstCondition = allConditions.reduce((worst, current) => {
      const conditionSeverity = { calm: 0, choppy: 1, rough: 2 };
      return conditionSeverity[current.condition] >
        conditionSeverity[worst.condition]
        ? current
        : worst;
    });

    // Use worst condition but with averaged data
    const condition = worstCondition.condition;
    const fuelMultiplier = getFuelMultiplier(condition);
    const speedMultiplier = getSpeedMultiplier(condition);
    const { safetyLevel, description } = getConditionDetails(
      condition,
      avgWindSpeed,
      avgWaveHeight
    );

    return {
      condition,
      fuelMultiplier,
      speedMultiplier,
      safetyLevel,
      description,
      windSpeed: avgWindSpeed,
      waveHeight: avgWaveHeight,
      visibility: avgVisibility,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Failed to get route conditions:", error);

    // Return default moderate conditions on error
    return {
      condition: "choppy",
      fuelMultiplier: 1.18,
      speedMultiplier: 0.82,
      safetyLevel: "medium",
      description:
        "Unable to fetch current conditions - using moderate sea state estimates",
      windSpeed: 6.0,
      waveHeight: 1.2,
      timestamp: new Date(),
    };
  }
}

/**
 * Weather condition codes from Open-Meteo API
 */
export const WeatherCodes: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};
