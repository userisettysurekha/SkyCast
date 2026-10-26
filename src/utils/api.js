import { getErrorForStatus, getMissingKeyError, getNetworkError } from './errors';

// Vite reads this from .env.local. It is never logged or saved anywhere.
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org';

export function hasApiKey() {
  return Boolean(API_KEY && API_KEY.trim() && API_KEY !== 'your_api_key_here');
}

// Shared helper: builds the URL, calls fetch and handles errors.
async function requestJson(path, params, searchedCity) {
  if (!hasApiKey()) {
    throw getMissingKeyError();
  }

  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set('appid', API_KEY.trim());

  let response;
  try {
    response = await fetch(url);
  } catch {
    // fetch only throws when the request never reached the server.
    throw getNetworkError();
  }

  if (!response.ok) {
    throw getErrorForStatus(response.status, searchedCity);
  }

  return response.json();
}

// Current weather for a city name, e.g. "London" or "Paris, FR".
export function fetchCurrentWeather(city) {
  return requestJson('/data/2.5/weather', { q: city, units: 'metric' }, city);
}

// 5-day forecast in 3-hour steps (40 entries) for a location.
export function fetchForecast(lat, lon) {
  return requestJson('/data/2.5/forecast', { lat, lon, units: 'metric' });
}

// Current air pollution for a location (AQI on a 1-5 scale).
export function fetchAirPollution(lat, lon) {
  return requestJson('/data/2.5/air_pollution', { lat, lon });
}
