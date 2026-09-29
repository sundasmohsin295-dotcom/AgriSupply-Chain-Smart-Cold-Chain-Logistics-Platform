/**
 * Real External API Integration: Open-Meteo Live Transit Weather Service
 * 
 * Queries live meteorological conditions across active cold-chain transit corridors
 * (Multan, Okara, Lahore, Karachi) without requiring third-party API keys.
 * Calculates dynamic ambient thermal risk factors for refrigerated reefer units.
 * Features 15-minute local caching, offline fallback, and AbortSignal timeouts.
 */

import { RouteWeatherCondition } from '../types';

interface OpenMeteoCurrentResponse {
  latitude: number;
  longitude: number;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
}

const CACHE_KEY_PREFIX = 'agrisupply_weather_cache_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const CORRIDOR_HUBS: { id: string; name: string; lat: number; lng: number }[] = [
  { id: 'multan', name: 'Multan Farm Intake', lat: 29.9715, lng: 71.4930 },
  { id: 'okara', name: 'Okara Logistics Depot', lat: 30.8100, lng: 73.4500 },
  { id: 'lahore', name: 'Lahore Central Terminal', lat: 31.5204, lng: 74.3587 },
  { id: 'karachi', name: 'Karachi Port Terminal', lat: 24.8607, lng: 67.0011 }
];

function getWeatherDescription(code: number): string {
  // WMO Weather interpretation codes
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Mainly Clear / Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy / Hazy';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Cold Precipitation';
  if (code >= 80 && code <= 82) return 'Heavy Rain';
  if (code >= 95) return 'Thunderstorm';
  return 'Fair Weather';
}

function calculateTransitThermalRisk(tempC: number, humidity: number): 'LOW' | 'MODERATE' | 'SEVERE_THERMAL_LOAD' {
  if (tempC >= 36.0 || (tempC >= 32.0 && humidity >= 70)) {
    return 'SEVERE_THERMAL_LOAD'; // High external ambient stress on reefer insulation
  }
  if (tempC >= 28.0) {
    return 'MODERATE';
  }
  return 'LOW';
}

class WeatherIntegrationService {
  private cache: Map<string, { data: RouteWeatherCondition; cachedAt: number }> = new Map();

  /**
   * Fetch live weather for a specific corridor hub with caching and offline fallback
   */
  public async getHubWeather(
    hubId: string,
    lat: number,
    lng: number,
    hubName: string
  ): Promise<RouteWeatherCondition> {
    const cacheKey = `${hubId}_${lat}_${lng}`;
    const now = Date.now();

    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    // Check localStorage fallback cache
    try {
      const persisted = localStorage.getItem(CACHE_KEY_PREFIX + cacheKey);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (now - parsed.cachedAt < CACHE_TTL_MS) {
          this.cache.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    } catch {
      // LocalStorage access may be restricted
    }

    // Network Request to real Open-Meteo API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Weather API HTTP ${res.status}`);

      const json: OpenMeteoCurrentResponse = await res.json();
      if (!json.current) throw new Error('Missing current weather data');

      const tempC = json.current.temperature_2m;
      const humidity = json.current.relative_humidity_2m;
      const riskLevel = calculateTransitThermalRisk(tempC, humidity);

      const condition: RouteWeatherCondition = {
        locationName: hubName,
        latitude: lat,
        longitude: lng,
        temperatureC: tempC,
        humidityPercent: humidity,
        windSpeedKmh: json.current.wind_speed_10m,
        weatherCode: json.current.weather_code,
        weatherDescription: getWeatherDescription(json.current.weather_code),
        isDay: json.current.is_day === 1,
        transitRiskLevel: riskLevel,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLive: true
      };

      // Save to cache
      const cacheEntry = { data: condition, cachedAt: now };
      this.cache.set(cacheKey, cacheEntry);
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + cacheKey, JSON.stringify(cacheEntry));
      } catch {
        // storage quota
      }

      return condition;
    } catch (err) {
      console.warn(`[WeatherService] Live API unavailable for ${hubName}, utilizing fallback:`, err);

      // Return stale cache if available
      if (cached) {
        return { ...cached.data, isLive: false };
      }

      // Offline baseline synthetic fallback matching seasonal regional norms
      const baselineTemp = hubId === 'multan' ? 32.5 : hubId === 'karachi' ? 30.2 : 28.4;
      const fallbackCondition: RouteWeatherCondition = {
        locationName: hubName,
        latitude: lat,
        longitude: lng,
        temperatureC: baselineTemp,
        humidityPercent: 62.0,
        windSpeedKmh: 14.5,
        weatherCode: 1,
        weatherDescription: 'Clear / Regional Norm (Offline Baseline)',
        isDay: true,
        transitRiskLevel: calculateTransitThermalRisk(baselineTemp, 62.0),
        lastUpdated: 'Offline Cache',
        isLive: false
      };

      return fallbackCondition;
    }
  }

  /**
   * Fetch weather for all key transit corridor hubs concurrently
   */
  public async getAllCorridorWeather(): Promise<RouteWeatherCondition[]> {
    return Promise.all(
      CORRIDOR_HUBS.map((hub) => this.getHubWeather(hub.id, hub.lat, hub.lng, hub.name))
    );
  }
}

export const weatherService = new WeatherIntegrationService();
