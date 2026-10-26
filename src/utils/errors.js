// Turns an HTTP status code from OpenWeatherMap into a friendly error.
// `type` lets the UI decide what to show (for example a "Retry" button).

export class WeatherError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'WeatherError';
    this.type = type;
  }
}

export function getErrorForStatus(status, searchedCity) {
  if (status === 401) {
    return new WeatherError(
      'Your API key was rejected (401). Check that VITE_OPENWEATHER_API_KEY in .env.local is correct and activated. New keys can take up to a couple of hours to start working.',
      'auth'
    );
  }

  if (status === 404) {
    const cityText = searchedCity ? `"${searchedCity}"` : 'that city';
    return new WeatherError(
      `We couldn't find ${cityText}. Check the spelling, or try adding a country code, for example "Paris, FR".`,
      'not-found'
    );
  }

  if (status === 429) {
    return new WeatherError(
      'Too many requests (429). The free plan limits how often you can call the API. Please wait a minute and try again.',
      'rate-limit'
    );
  }

  if (status >= 500) {
    return new WeatherError(
      `The weather service is having problems right now (error ${status}). Please try again shortly.`,
      'server'
    );
  }

  return new WeatherError(`Something went wrong while loading weather data (error ${status}).`, 'unknown');
}

export function getNetworkError() {
  return new WeatherError(
    'Network error: could not reach the weather service. Check your internet connection and try again.',
    'network'
  );
}

export function getMissingKeyError() {
  return new WeatherError(
    'No API key found. Create a file named .env.local in the project folder with VITE_OPENWEATHER_API_KEY=your_key, then restart "npm run dev".',
    'no-key'
  );
}
