import { useState } from 'react';
import { Button, CircularProgress, IconButton, TextField, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ErrorMessage from './ErrorMessage';
import { fetchCurrentWeather } from '../utils/api';
import { capitalize, formatTemp, formatWind, getIconUrl, isNumber } from '../utils/weather';

const MAX_CITIES = 3;

function CityComparison({ unit, currentCityName }) {
  // Each item is the raw API response (Celsius). Conversion happens only when displaying.
  const [cities, setCities] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFull = cities.length >= MAX_CITIES;

  async function addCity(cityName) {
    const trimmed = cityName.trim();
    if (!trimmed || isFull) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentWeather(trimmed);
      // Avoid adding the same city twice (OpenWeatherMap city id is unique).
      const alreadyAdded = cities.some((city) => city.id === data.id);
      if (alreadyAdded) {
        setError({ type: 'not-found', message: `${data.name} is already in the comparison.` });
      } else {
        setCities((previous) => [...previous, data].slice(0, MAX_CITIES));
        setInput('');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function removeCity(id) {
    setCities((previous) => previous.filter((city) => city.id !== id));
    setError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    addCity(input);
  }

  return (
    <section className="card">
      <div className="section-header">
        <h2 className="section-title">Compare cities</h2>
        <span className="muted-small">
          {cities.length}/{MAX_CITIES} cities
        </span>
      </div>

      <form className="compare-form" onSubmit={handleSubmit}>
        <TextField
          size="small"
          fullWidth
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isFull ? 'Remove a city to add another' : 'Add a city to compare'}
          disabled={isFull || loading}
          slotProps={{ htmlInput: { 'aria-label': 'City to compare', maxLength: 80 } }}
        />
        <Button
          type="submit"
          variant="outlined"
          color="secondary"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          disabled={isFull || loading || !input.trim()}
        >
          Add
        </Button>
        {currentCityName && (
          <Button
            variant="text"
            color="secondary"
            onClick={() => addCity(currentCityName)}
            disabled={isFull || loading}
            className="add-current"
          >
            Add current
          </Button>
        )}
      </form>

      {error && (
        <div className="compare-error">
          <ErrorMessage error={error} compact />
        </div>
      )}

      {cities.length === 0 ? (
        <p className="empty-text">Add up to three cities to compare them side by side.</p>
      ) : (
        <div className="compare-grid">
          {cities.map((city) => {
            const condition = city.weather?.[0] || {};
            const iconUrl = getIconUrl(condition.icon);
            return (
              <article key={city.id} className="compare-card">
                <Tooltip title="Remove city">
                  <IconButton
                    size="small"
                    className="compare-remove"
                    onClick={() => removeCity(city.id)}
                    aria-label={`Remove ${city.name}`}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <p className="compare-name">
                  {city.name}
                  {city.sys?.country ? `, ${city.sys.country}` : ''}
                </p>
                <div className="compare-temp-row">
                  {iconUrl && <img src={iconUrl} alt={condition.description || ''} />}
                  <span className="compare-temp">{formatTemp(city.main?.temp, unit)}</span>
                </div>
                <p className="compare-desc">{capitalize(condition.description) || '--'}</p>

                <dl className="compare-details">
                  <div>
                    <dt>Feels like</dt>
                    <dd>{formatTemp(city.main?.feels_like, unit)}</dd>
                  </div>
                  <div>
                    <dt>Humidity</dt>
                    <dd>{isNumber(city.main?.humidity) ? `${city.main.humidity}%` : '--'}</dd>
                  </div>
                  <div>
                    <dt>Wind</dt>
                    <dd>{formatWind(city.wind?.speed, unit)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CityComparison;
