import { useState } from 'react';
import { Button, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationCityIcon from '@mui/icons-material/LocationCity';

function SearchBox({ onSearch, onRefresh, loading, canRefresh }) {
  const [city, setCity] = useState('');
  const [inputError, setInputError] = useState('');

  function handleSubmit(event) {
    event.preventDefault(); // stop the page from reloading
    const trimmed = city.trim();

    if (trimmed === '') {
      setInputError('Please type a city name.');
      return;
    }

    setInputError('');
    onSearch(trimmed);
    setCity('');
  }

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        value={city}
        onChange={(event) => {
          setCity(event.target.value);
          if (inputError) setInputError('');
        }}
        placeholder="Search a city, e.g. Mumbai or Paris, FR"
        error={Boolean(inputError)}
        helperText={inputError || ' '}
        slotProps={{
          htmlInput: { 'aria-label': 'City name', maxLength: 80 },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LocationCityIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        startIcon={<SearchIcon />}
        disabled={loading}
        className="search-button"
      >
        Search
      </Button>
      <Tooltip title="Refresh weather">
        {/* span lets the tooltip work even when the button is disabled */}
        <span>
          <IconButton
            onClick={onRefresh}
            disabled={!canRefresh || loading}
            aria-label="Refresh weather"
            className="refresh-button"
          >
            <RefreshIcon />
          </IconButton>
        </span>
      </Tooltip>
    </form>
  );
}

export default SearchBox;
