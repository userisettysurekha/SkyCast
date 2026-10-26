import { Alert, AlertTitle, Button } from '@mui/material';

// Titles shown for each kind of error from utils/errors.js
const TITLES = {
  'no-key': 'API key missing',
  auth: 'API key problem',
  'not-found': 'City not found',
  'rate-limit': 'Slow down a little',
  network: 'Connection problem',
  server: 'Weather service unavailable',
  unknown: 'Something went wrong',
};

// Errors where trying again can actually help.
const RETRYABLE = ['rate-limit', 'network', 'server', 'unknown'];

function ErrorMessage({ error, onRetry, compact = false }) {
  if (!error) return null;

  const title = TITLES[error.type] || TITLES.unknown;
  const severity = error.type === 'not-found' ? 'warning' : 'error';
  const showRetry = onRetry && RETRYABLE.includes(error.type);

  return (
    <Alert
      severity={severity}
      variant="outlined"
      className="error-alert"
      action={
        showRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : null
      }
    >
      {!compact && <AlertTitle>{title}</AlertTitle>}
      {error.message}
    </Alert>
  );
}

export default ErrorMessage;
