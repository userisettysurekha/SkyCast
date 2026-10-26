import { useEffect, useRef, useState } from 'react';
import { CircularProgress, LinearProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SearchBox from './components/SearchBox';
import SearchHistory from './components/SearchHistory';
import InfoBox from './components/InfoBox';
import HourlyForecast from './components/HourlyForecast';
import Forecast from './components/Forecast';
import AirQuality from './components/AirQuality';
import CityComparison from './components/CityComparison';
import ErrorMessage from './components/ErrorMessage';
import { fetchAirPollution, fetchCurrentWeather, fetchForecast } from './utils/api';
import { loadFromStorage, saveToStorage } from './utils/storage';

const DEFAULT_CITY = 'Hyderabad, IN';
const MAX_HISTORY = 8;

function App() {
  const [unit, setUnit] = useState(() => (loadFromStorage('skycast-unit', 'C') === 'F' ? 'F' : 'C'));
  const [history, setHistory] = useState(() => {
    const saved = loadFromStorage('skycast-history', []);
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string') : [];
  });

  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airData, setAirData] = useState(null);

  const [error, setError] = useState(null);
  const [forecastError, setForecastError] = useState(null);
  const [airError, setAirError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);

  const latestRequestId = useRef(0);

  useEffect(() => {
    saveToStorage('skycast-unit', unit);
  }, [unit]);

  useEffect(() => {
    saveToStorage('skycast-history', history);
  }, [history]);

  useEffect(() => {
    const firstCity = loadFromStorage('skycast-history', [])[0] || DEFAULT_CITY;
    loadWeather(firstCity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addToHistory(cityLabel) {
    setHistory((previous) => {
      const withoutDuplicate = previous.filter((item) => item.toLowerCase() !== cityLabel.toLowerCase());
      return [cityLabel, ...withoutDuplicate].slice(0, MAX_HISTORY);
    });
  }

  function removeFromHistory(cityLabel) {
    setHistory((previous) => previous.filter((item) => item !== cityLabel));
  }

  async function loadWeather(city) {
    const searchText = city.trim();
    if (!searchText) return;

    latestRequestId.current += 1;
    const requestId = latestRequestId.current;

    setLoading(true);
    setError(null);
    setLastSearch(searchText);

    try {
      // Step 1: Fetch current weather and obtain the city's coordinates.
      const weather = await fetchCurrentWeather(searchText);
      if (requestId !== latestRequestId.current) return;

      const lat = weather.coord?.lat;
      const lon = weather.coord?.lon;

      if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error('The weather service returned a location without coordinates.');
      }

      // Step 2: Fetch the forecast and air quality independently.
      const [forecastResult, airResult] = await Promise.allSettled([
        fetchForecast(lat, lon),
        fetchAirPollution(lat, lon),
      ]);

      if (requestId !== latestRequestId.current) return;

      setCurrentWeather(weather);
      setFetchedAt(new Date());

      setForecast(forecastResult.status === 'fulfilled' ? forecastResult.value : null);
      setForecastError(forecastResult.status === 'rejected' ? forecastResult.reason : null);

      setAirData(airResult.status === 'fulfilled' ? airResult.value : null);
      setAirError(airResult.status === 'rejected' ? airResult.reason : null);

      const country = weather.sys?.country;
      addToHistory(country ? `${weather.name}, ${country}` : weather.name);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      setError(err.type ? err : { type: 'unknown', message: err.message || 'Something went wrong.' });
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }

  function refreshWeather() {
    if (currentWeather) {
      const country = currentWeather.sys?.country;
      loadWeather(country ? `${currentWeather.name}, ${country}` : currentWeather.name);
    } else if (lastSearch) {
      loadWeather(lastSearch);
    }
  }

  const currentCityLabel = currentWeather
    ? `${currentWeather.name}${currentWeather.sys?.country ? `, ${currentWeather.sys.country}` : ''}`
    : '';

  return (
    <div className="app">
      {loading && currentWeather && <LinearProgress className="top-progress" color="secondary" />}

      <header className="app-header">
        <div className="brand">
          <img src="/SkyCast/skycast-icon.svg" alt="" className="brand-logo" />
          <div>
            <p className="brand-name">SkyCast</p>
            <p className="brand-tagline">Weather at a glance</p>
          </div>
        </div>

        <ToggleButtonGroup
          value={unit}
          exclusive
          size="small"
          onChange={(event, newUnit) => {
            if (newUnit) setUnit(newUnit);
          }}
          aria-label="Temperature unit"
          className="unit-toggle"
        >
          <ToggleButton value="C" aria-label="Celsius">
            °C
          </ToggleButton>
          <ToggleButton value="F" aria-label="Fahrenheit">
            °F
          </ToggleButton>
        </ToggleButtonGroup>
      </header>

      <main className="container">
        <SearchBox
          onSearch={loadWeather}
          onRefresh={refreshWeather}
          loading={loading}
          canRefresh={Boolean(currentWeather || lastSearch)}
        />

        <SearchHistory
          history={history}
          onSelect={loadWeather}
          onRemove={removeFromHistory}
          onClear={() => setHistory([])}
          disabled={loading}
        />

        {error && (
          <div className="main-error">
            <ErrorMessage error={error} onRetry={() => loadWeather(lastSearch)} />
            {currentWeather && (
              <p className="muted-small still-showing">Still showing the last loaded city: {currentCityLabel}</p>
            )}
          </div>
        )}

        {loading && !currentWeather && (
          <div className="card loading-card">
            <CircularProgress color="secondary" />
            <p>Loading weather for {lastSearch}…</p>
          </div>
        )}

        {!loading && !currentWeather && !error && (
          <div className="card empty-card">
            <p className="empty-title">Search for a city to get started</p>
            <p className="muted-small">Try “London”, “Tokyo” or “Chennai, IN”.</p>
          </div>
        )}

        {currentWeather && (
          <div className="dashboard">
            <div className="area-current">
              <InfoBox weather={currentWeather} unit={unit} fetchedAt={fetchedAt} />
            </div>

            <div className="area-side">
              <AirQuality airData={airData} error={airError} onRetry={refreshWeather} />
            </div>

            <div className="area-hourly">
              <HourlyForecast forecast={forecast} unit={unit} error={forecastError} onRetry={refreshWeather} />
            </div>

            <div className="area-daily">
              <Forecast forecast={forecast} unit={unit} error={forecastError} onRetry={refreshWeather} />
            </div>
          </div>
        )}

        <CityComparison unit={unit} currentCityName={currentCityLabel} />
      </main>

      <footer className="app-footer">
        <p>
          Weather data from{' '}
          <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">
            OpenWeatherMap
          </a>
          . Built with React, Vite and Material UI for the SapphireIQ Frontend Development Internship.
        </p>
      </footer>
    </div>
  );
}

export default App;
