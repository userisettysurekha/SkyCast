import UmbrellaIcon from '@mui/icons-material/Umbrella';
import ErrorMessage from './ErrorMessage';
import {
  capitalize,
  formatCityHour,
  formatPop,
  formatTemp,
  getCityDateKey,
  getIconUrl,
  getUpcomingIntervals,
} from '../utils/weather';

function HourlyForecast({ forecast, unit, error, onRetry }) {
  if (error) {
    return (
      <section className="card">
        <h2 className="section-title">Next 24 hours</h2>
        <ErrorMessage error={error} onRetry={onRetry} compact />
      </section>
    );
  }

  if (!forecast) return null;

  const timezone = forecast.city?.timezone || 0;
  const intervals = getUpcomingIntervals(forecast.list, 8);
  const todayKey = getCityDateKey(Math.floor(Date.now() / 1000), timezone);

  return (
    <section className="card">
      <div className="section-header">
        <h2 className="section-title">Next 24 hours</h2>
        <span className="muted-small">3-hour steps · local time</span>
      </div>

      {intervals.length === 0 ? (
        <p className="empty-text">No upcoming forecast intervals are available.</p>
      ) : (
        <div className="hourly-scroll">
          {intervals.map((entry) => {
            const condition = entry.weather?.[0] || {};
            const iconUrl = getIconUrl(condition.icon);
            const pop = formatPop(entry.pop);
            const isTomorrow = getCityDateKey(entry.dt, timezone) !== todayKey;

            return (
              <article key={entry.dt} className="hour-card">
                <p className="hour-time">{formatCityHour(entry.dt, timezone)}</p>
                <p className="hour-day">{isTomorrow ? 'Next day' : 'Today'}</p>
                {iconUrl && <img src={iconUrl} alt={condition.description || ''} className="hour-icon" />}
                <p className="hour-temp">{formatTemp(entry.main?.temp, unit)}</p>
                <p className="hour-desc">{capitalize(condition.description)}</p>
                {pop && (
                  <p className="pop-text">
                    <UmbrellaIcon fontSize="inherit" /> {pop}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default HourlyForecast;
