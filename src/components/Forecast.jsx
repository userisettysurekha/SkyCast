import { Tooltip } from '@mui/material';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorMessage from './ErrorMessage';
import { buildDailyForecast, formatPop, formatTemp, getIconUrl } from '../utils/weather';

// Shows "covers 3 PM - 9 PM" style text for partial days.
function formatHourLabel(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour} ${suffix}`;
}

function Forecast({ forecast, unit, error, onRetry }) {
  if (error) {
    return (
      <section className="card">
        <h2 className="section-title">5-day forecast</h2>
        <ErrorMessage error={error} onRetry={onRetry} compact />
      </section>
    );
  }

  if (!forecast) return null;

  const days = buildDailyForecast(forecast.list, forecast.city?.timezone || 0);

  return (
    <section className="card">
      <div className="section-header">
        <h2 className="section-title">5-day forecast</h2>
        <Tooltip
          arrow
          title="High and Low are the highest and lowest of the 3-hourly forecast temperatures for each day. The real daily maximum or minimum can happen between two readings, so these are estimates."
        >
          <span className="estimate-badge">
            <InfoOutlinedIcon fontSize="inherit" /> Estimated High / Low
          </span>
        </Tooltip>
      </div>

      {days.length === 0 ? (
        <p className="empty-text">No forecast data is available for this location.</p>
      ) : (
        <div className="forecast-grid">
          {days.map((day) => {
            const iconUrl = getIconUrl(day.icon);
            const pop = formatPop(day.maxPop);

            return (
              <article key={day.dateKey} className={`forecast-day ${day.isToday ? 'is-today' : ''}`}>
                <p className="forecast-weekday">{day.isToday ? 'Today' : day.weekday}</p>
                <p className="forecast-date">{day.shortDate}</p>

                {iconUrl && <img src={iconUrl} alt={day.description} className="forecast-icon" />}
                <p className="forecast-desc">{day.description}</p>

                <div className="high-low">
                  <span className="high">
                    <small>H</small> {formatTemp(day.high, unit)}
                  </span>
                  <span className="low">
                    <small>L</small> {formatTemp(day.low, unit)}
                  </span>
                </div>

                {pop && (
                  <p className="pop-text">
                    <UmbrellaIcon fontSize="inherit" /> {pop}
                  </p>
                )}

                {day.isPartial && (
                  <p className="partial-note">
                    Partial:{' '}
                    {day.coveredFrom === day.coveredTo
                      ? `${formatHourLabel(day.coveredFrom)} only`
                      : `${formatHourLabel(day.coveredFrom)}–${formatHourLabel(day.coveredTo)} only`}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="footnote">
        Forecast data comes in 3-hour steps, so these High and Low values are estimates and may miss the true
        daily extremes. Days marked “Partial” only include the hours still covered by the forecast. Dates use the
        city’s local time zone.
      </p>
    </section>
  );
}

export default Forecast;
