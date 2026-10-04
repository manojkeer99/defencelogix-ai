import { LogisticsLocation, WeatherData, WeatherImpactLevel, WeatherDailyForecast } from '../types/index.js';

/**
 * Open-Meteo Public Weather API Service
 * 
 * Fetches non-sensitive, public weather telemetry based on geographic coordinates.
 * Includes in-memory caching (15-minute TTL), timeout protection, and automatic
 * graceful fallback to synthetic demo telemetry if offline or rate-limited.
 */

// WMO Weather Interpretation Codes (WW)
const WMO_CODE_MAP: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

export function interpretWmoCode(code: number): string {
  return WMO_CODE_MAP[code] || 'Variable weather';
}

/**
 * Explainable Weather Impact Evaluator for Logistics Decision Support
 * Evaluates operational risk based on extreme temperatures, precipitation, wind, and adverse conditions.
 */
export function evaluateWeatherImpact(
  tempC: number,
  precipMm: number,
  windKmH: number,
  weatherCode: number
): { impact: WeatherImpactLevel; reasons: string[] } {
  const reasons: string[] = [];
  let severeScore = 0;

  // Temperature criteria
  if (tempC <= -20) {
    severeScore += 3;
    reasons.push(`Extreme arctic sub-zero (${tempC}°C) causes cold-viscosity fuel thickening & severe frostbite risk`);
  } else if (tempC <= -10) {
    severeScore += 2;
    reasons.push(`Sub-zero cold (${tempC}°C) mandates Winter Diesel (DHA-50) & wheel traction chain deployment`);
  } else if (tempC >= 42) {
    severeScore += 3;
    reasons.push(`High desert heat (${tempC}°C) triggers thermal fuel tank expansion & engine overheating risk`);
  } else if (tempC >= 38) {
    severeScore += 1;
    reasons.push(`Elevated ambient temperature (${tempC}°C) accelerates equipment thermal stress`);
  }

  // Precipitation criteria
  if (precipMm >= 15) {
    severeScore += 3;
    reasons.push(`Heavy precipitation (${precipMm} mm) creates acute flash-flood / mudslide threat on unpaved roads`);
  } else if (precipMm >= 5) {
    severeScore += 2;
    reasons.push(`Moderate precipitation (${precipMm} mm) degrades convoy traction & increases transit hours`);
  } else if (precipMm > 0) {
    severeScore += 1;
    reasons.push(`Light precipitation (${precipMm} mm) present along transit corridor`);
  }

  // Wind speed criteria
  if (windKmH >= 50) {
    severeScore += 3;
    reasons.push(`Gale-force winds (${windKmH} km/h) ground autonomous cargo UAV sorties & threaten high-profile trucks`);
  } else if (windKmH >= 32) {
    severeScore += 2;
    reasons.push(`Elevated wind speeds (${windKmH} km/h) restrict aerial logistics operations to heavy helicopters only`);
  }

  // Weather code / storm conditions
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    severeScore += 3;
    reasons.push('Thunderstorm & convective lightning hazard detected in sector');
  } else if (weatherCode === 75 || weatherCode === 86 || weatherCode === 67) {
    severeScore += 3;
    reasons.push('Heavy snowfall / freezing rain advisory in effect for mountain passes');
  } else if (weatherCode === 45 || weatherCode === 48) {
    severeScore += 2;
    reasons.push('Dense fog impairs convoy line-of-sight navigation to under 100 meters');
  }

  if (reasons.length === 0) {
    reasons.push('Favorable weather conditions: Clear corridor with nominal operational transit speeds');
  }

  let impact: WeatherImpactLevel = 'LOW';
  if (severeScore >= 4) {
    impact = 'HIGH';
  } else if (severeScore >= 2) {
    impact = 'MEDIUM';
  }

  return { impact, reasons };
}

// In-Memory Weather Cache (15-minute TTL)
interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}

const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generates synthetic baseline weather data as a guaranteed reliable fallback
 */
export function getSyntheticWeatherFallback(location: LogisticsLocation): WeatherData {
  let precip = 0;
  let wind = 15;
  let code = 0;

  if (location.weatherCondition.includes('Blizzard') || location.weatherCondition.includes('Snow')) {
    code = 75;
    precip = 8.5;
    wind = 42;
  } else if (location.weatherCondition.includes('Monsoon') || location.weatherCondition.includes('Rain')) {
    code = 63;
    precip = 12.0;
    wind = 28;
  } else if (location.weatherCondition.includes('Sandstorm')) {
    code = 3;
    precip = 0;
    wind = 48;
  } else if (location.weatherCondition.includes('Fog')) {
    code = 45;
    precip = 0.5;
    wind = 8;
  }

  const { impact, reasons } = evaluateWeatherImpact(location.temperatureC, precip, wind, code);

  return {
    locationId: location.id,
    locationName: location.name,
    coordinates: location.coordinates,
    temperatureC: location.temperatureC,
    windSpeedKmH: wind,
    windDirectionDeg: 210,
    precipitationMm: precip,
    humidityPercent: location.weatherCondition.includes('Rain') ? 85 : 45,
    weatherCode: code,
    weatherCondition: location.weatherCondition,
    weatherImpact: impact,
    impactReasoning: reasons,
    source: 'SYNTHETIC_FALLBACK',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Fetch public weather telemetry from Open-Meteo with caching and graceful fallback
 */
export async function fetchWeatherForLocation(location: LogisticsLocation): Promise<WeatherData> {
  const cacheKey = `${location.id}-${location.coordinates.lat.toFixed(2)}-${location.coordinates.lng.toFixed(2)}`;
  const now = Date.now();

  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.coordinates.lat}&longitude=${location.coordinates.lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const json = await res.json();
    const current = json.current;
    if (!current) {
      throw new Error('Invalid Open-Meteo response structure');
    }

    const tempC = Math.round(current.temperature_2m);
    const windSpeed = Math.round(current.wind_speed_10m);
    const windDir = Math.round(current.wind_direction_10m || 0);
    const precip = Number((current.precipitation || 0).toFixed(1));
    const humidity = Math.round(current.relative_humidity_2m || 50);
    const code = current.weather_code || 0;
    const condition = interpretWmoCode(code);

    const { impact, reasons } = evaluateWeatherImpact(tempC, precip, windSpeed, code);

    // Parse daily forecast if available
    const dailyForecast: WeatherDailyForecast[] = [];
    if (json.daily && Array.isArray(json.daily.time)) {
      for (let i = 0; i < Math.min(5, json.daily.time.length); i++) {
        dailyForecast.push({
          date: json.daily.time[i],
          tempMax: Math.round(json.daily.temperature_2m_max[i]),
          tempMin: Math.round(json.daily.temperature_2m_min[i]),
          precipSum: Number((json.daily.precipitation_sum[i] || 0).toFixed(1)),
          weatherCode: json.daily.weather_code[i] || 0,
          condition: interpretWmoCode(json.daily.weather_code[i] || 0)
        });
      }
    }

    const weatherData: WeatherData = {
      locationId: location.id,
      locationName: location.name,
      coordinates: location.coordinates,
      temperatureC: tempC,
      windSpeedKmH: windSpeed,
      windDirectionDeg: windDir,
      precipitationMm: precip,
      humidityPercent: humidity,
      weatherCode: code,
      weatherCondition: condition,
      weatherImpact: impact,
      impactReasoning: reasons,
      source: 'OPEN_METEO_API',
      lastUpdated: new Date().toISOString(),
      dailyForecast
    };

    weatherCache.set(cacheKey, {
      data: weatherData,
      expiresAt: now + CACHE_TTL_MS
    });

    return weatherData;
  } catch (err: any) {
    // Graceful fallback to synthetic data
    console.warn(`[WeatherService] Notice: Open-Meteo live API fallback for ${location.name}: ${err?.message || 'offline'}. Using synthetic baseline.`);
    const fallback = getSyntheticWeatherFallback(location);
    // Cache fallback briefly (2 minutes) to prevent immediate repeated failed attempts
    weatherCache.set(cacheKey, {
      data: fallback,
      expiresAt: now + 120000
    });
    return fallback;
  }
}

/**
 * Batch fetch weather for all locations concurrently
 */
export async function fetchWeatherForAllLocations(locations: LogisticsLocation[]): Promise<WeatherData[]> {
  return Promise.all(locations.map(loc => fetchWeatherForLocation(loc)));
}
