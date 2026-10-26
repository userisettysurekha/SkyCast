import { Button, Chip } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

function SearchHistory({ history, onSelect, onRemove, onClear, disabled }) {
  if (history.length === 0) {
    return (
      <div className="history-bar">
        <HistoryIcon className="history-icon" fontSize="small" />
        <span className="muted-small">Your recent searches will appear here.</span>
      </div>
    );
  }

  return (
    <div className="history-bar">
      <HistoryIcon className="history-icon" fontSize="small" />
      <div className="history-chips">
        {history.map((city) => (
          <Chip
            key={city}
            label={city}
            onClick={() => onSelect(city)}
            onDelete={() => onRemove(city)}
            disabled={disabled}
            variant="outlined"
            className="history-chip"
          />
        ))}
      </div>
      <Button size="small" color="inherit" onClick={onClear} className="clear-history">
        Clear all
      </Button>
    </div>
  );
}

export default SearchHistory;
