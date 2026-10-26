import { getErrorForStatus, getMissingKeyError, getNetworkError } from './errors';


const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org';

export function hasApiKey() {
  return Boolean(API_KEY && API_KEY.trim() && API_KEY !== 'your_api_key_here');
}


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
    
    throw getNetworkError();
  }

  if (!response.ok) {
    throw getErrorForStatus(response.status, searchedCity);
  }

  return response.json();
}


export function fetchCurrentWeather(city) {
  return requestJson('/data/2.5/weather', { q: city, units: 'metric' }, city);
}


export function fetchForecast(lat, lon) {
  return requestJson('/data/2.5/forecast', { lat, lon, units: 'metric' });
}


export function fetchAirPollution(lat, lon) {
  return requestJson('/data/2.5/air_pollution', { lat, lon });
}
