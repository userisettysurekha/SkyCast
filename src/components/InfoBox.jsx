import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import {
  capitalize,
  formatCityTime,
  formatTemp,
  formatUtcOffset,
  formatVisibility,
  formatWind,
  getIconUrl,
  getTempNumber,
  isNumber,
} from '../utils/weather';


function StatItem({ icon, label, value }) {
  return (
    <div className="stat-item">
      <span className="stat-icon">{icon}</span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

function InfoBox({ weather, unit, fetchedAt }) {
  if (!weather) return null;

  const condition = weather.weather?.[0] || {};
  const timezone = weather.timezone || 0;
  const tempNumber = getTempNumber(weather.main?.temp, unit);
  const iconUrl = getIconUrl(condition.icon);
  const country = weather.sys?.country;

  return (
    <section className="card info-card">
      <div className="info-top">
        <div>
          <p className="eyebrow">Current weather</p>
          <h1 className="city-name">
            {weather.name || 'Unknown location'}
            {country && <span className="country-badge">{country}</span>}
          </h1>
          <p className="local-time">
            Local time {formatCityTime(Math.floor(Date.now() / 1000), timezone)} · {formatUtcOffset(timezone)}
          </p>

          <div className="temp-row">
            <span className="big-temp">{tempNumber === null ? '--' : tempNumber}</span>
            <span className="big-unit">°{unit}</span>
          </div>
          <p className="condition-text">{capitalize(condition.description) || 'No description'}</p>
          <p className="feels-like">Feels like {formatTemp(weather.main?.feels_like, unit)}</p>
        </div>

        {iconUrl && (
          <div className="hero-icon-wrap">
            <img src={iconUrl} alt={condition.description || 'weather icon'} className="hero-icon" />
          </div>
        )}
      </div>

      <div className="stats-grid">
        <StatItem icon={<ThermostatIcon />} label="Feels like" value={formatTemp(weather.main?.feels_like, unit)} />
        <StatItem
          icon={<WaterDropIcon />}
          label="Humidity"
          value={isNumber(weather.main?.humidity) ? `${weather.main.humidity}%` : '--'}
        />
        <StatItem icon={<AirIcon />} label="Wind" value={formatWind(weather.wind?.speed, unit)} />
        <StatItem
          icon={<SpeedIcon />}
          label="Pressure"
          value={isNumber(weather.main?.pressure) ? `${weather.main.pressure} hPa` : '--'}
        />
        {isNumber(weather.visibility) && (
          <StatItem icon={<VisibilityIcon />} label="Visibility" value={formatVisibility(weather.visibility)} />
        )}
        {isNumber(weather.sys?.sunrise) && (
          <StatItem icon={<WbSunnyIcon />} label="Sunrise" value={formatCityTime(weather.sys.sunrise, timezone)} />
        )}
        {isNumber(weather.sys?.sunset) && (
          <StatItem icon={<WbTwilightIcon />} label="Sunset" value={formatCityTime(weather.sys.sunset, timezone)} />
        )}
      </div>

      <p className="updated-text">
        Observed at {formatCityTime(weather.dt, timezone)} local time
        {fetchedAt && ` · Last updated ${fetchedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} (your time)`}
      </p>
    </section>
  );
}

export default InfoBox;
