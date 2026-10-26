// Small helpers for localStorage. Only non-sensitive things are stored here:
// the temperature unit and the recent search history. Never the API key.

export function loadFromStorage(key, fallbackValue) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved === null ? fallbackValue : JSON.parse(saved);
  } catch {
    // Private mode or corrupted data: just use the default.
    return fallbackValue;
  }
}

export function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked. The app still works without it.
  }
}
