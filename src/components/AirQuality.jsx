import ErrorMessage from './ErrorMessage';
import { AQI_LEVELS, POLLUTANT_NAMES, isNumber } from '../utils/weather';

// Order in which pollutants are shown (most commonly discussed first).
const POLLUTANT_ORDER = ['pm2_5', 'pm10', 'o3', 'no2', 'so2', 'co', 'no', 'nh3'];

function AirQuality({ airData, error, onRetry }) {
  if (error) {
    return (
      <section className="card">
        <h2 className="section-title">Air quality</h2>
        <ErrorMessage error={error} onRetry={onRetry} compact />
      </section>
    );
  }

  const reading = airData?.list?.[0];
  const aqi = reading?.main?.aqi;
  const level = AQI_LEVELS[aqi];

  // Missing or unexpected data: say so instead of guessing a value.
  if (!reading || !level) {
    return (
      <section className="card">
        <h2 className="section-title">Air quality</h2>
        <p className="empty-text">Air quality data is not available for this location right now.</p>
      </section>
    );
  }

  const components = reading.components || {};

  return (
    <section className="card">
      <div className="section-header">
        <h2 className="section-title">Air quality</h2>
        <span className="muted-small">OpenWeatherMap index (1–5)</span>
      </div>

      <div className="aqi-main">
        <div className="aqi-circle" style={{ borderColor: level.color, color: level.color }}>
          {aqi}
        </div>
        <div>
          <p className="aqi-label" style={{ color: level.color }}>
            {level.label}
          </p>
          <p className="muted-small">{level.advice}</p>
        </div>
      </div>

      <div className="aqi-scale" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={step === aqi ? 'active' : ''}
            style={{ background: AQI_LEVELS[step].color }}
            title={`${step} - ${AQI_LEVELS[step].label}`}
          />
        ))}
      </div>

      <div className="pollutant-grid">
        {POLLUTANT_ORDER.filter((key) => isNumber(components[key])).map((key) => (
          <div key={key} className="pollutant">
            <p className="pollutant-name">{POLLUTANT_NAMES[key]}</p>
            <p className="pollutant-value">
              {components[key].toFixed(1)} <small>µg/m³</small>
            </p>
          </div>
        ))}
      </div>

      <p className="footnote">
        This is OpenWeatherMap’s 1–5 scale (1 = Good, 5 = Very Poor). It is not the same as the 0–500 US AQI or
        India’s National AQI.
      </p>
    </section>
  );
}

export default AirQuality;
