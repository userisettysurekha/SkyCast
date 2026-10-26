

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
    
  }
}
