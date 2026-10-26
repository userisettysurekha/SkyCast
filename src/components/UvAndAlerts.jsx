import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorMessage from './ErrorMessage';
import { formatCityTime, getUvCategory, isNumber, toCityDate } from '../utils/weather';

function formatAlertTime(unixSeconds, timezone) {
  if (!isNumber(unixSeconds)) return '--';
  const day = toCityDate(unixSeconds, timezone).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return `${day}, ${formatCityTime(unixSeconds, timezone)}`;
}

function UvAndAlerts({ extras, error, onRetry }) {
  // 401 here means the key works for the free APIs but is not subscribed to
  // One Call 3.0. We explain this instead of showing an error.
  if (error && error.type === 'auth') {
    return (
      <section className="card">
        <h2 className="section-title">UV index & weather alerts</h2>
        <div className="limitation-box">
          <InfoOutlinedIcon />
          <p>
            UV index and official weather alerts are only available through OpenWeatherMap’s <b>One Call API 3.0</b>,
            which needs a separate “One Call by Call” subscription. Your API key does not have access to it, so this
            section is turned off. Everything else in SkyCast works normally.
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <h2 className="section-title">UV index & weather alerts</h2>
        <ErrorMessage error={error} onRetry={onRetry} compact />
      </section>
    );
  }

  if (!extras) return null;

  const timezone = extras.timezone_offset || 0;
  const uvi = extras.current?.uvi;
  const uvCategory = getUvCategory(uvi);
  const alerts = Array.isArray(extras.alerts) ? extras.alerts : [];

  return (
    <section className="card">
      <h2 className="section-title">UV index & weather alerts</h2>

      {uvCategory ? (
        <div className="uv-row">
          <div className="aqi-circle" style={{ borderColor: uvCategory.color, color: uvCategory.color }}>
            {Math.round(uvi * 10) / 10}
          </div>
          <div>
            <p className="aqi-label" style={{ color: uvCategory.color }}>
              {uvCategory.label}
            </p>
            <p className="muted-small">Current UV index (WHO scale)</p>
          </div>
        </div>
      ) : (
        <p className="empty-text">UV index is not available for this location.</p>
      )}

      <h3 className="sub-title">Official alerts</h3>
      {alerts.length === 0 ? (
        <p className="empty-text">No active alerts were reported by the API for this location.</p>
      ) : (
        <div className="alert-list">
          {alerts.map((alert, index) => (
            <details key={`${alert.event}-${index}`} className="alert-item">
              <summary>
                <WarningAmberIcon fontSize="small" />
                <span>{alert.event || 'Weather alert'}</span>
              </summary>
              <p className="muted-small">
                Issued by {alert.sender_name || 'unknown source'} · {formatAlertTime(alert.start, timezone)} to{' '}
                {formatAlertTime(alert.end, timezone)}
              </p>
              {alert.description && <p className="alert-description">{alert.description}</p>}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

export default UvAndAlerts;
