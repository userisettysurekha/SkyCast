

// ---------- Basic checks ----------

export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------- Temperature and wind ----------

// The API always gives us Celsius. This is the ONLY place we convert.
export function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

// Returns just the rounded number in the chosen unit, e.g. 31.
export function getTempNumber(celsius, unit) {
  if (!isNumber(celsius)) return null;
  const value = unit === 'F' ? celsiusToFahrenheit(celsius) : celsius;
  // Math.round can return -0, which would display as "-0".
  return Math.round(value) || 0;
}

// Returns a display string, e.g. "31°C" or "88°F".
export function formatTemp(celsius, unit) {
  const value = getTempNumber(celsius, unit);
  return value === null ? '--' : `${value}°${unit}`;
}

// Wind comes in metres per second. Show km/h with °C and mph with °F.
export function formatWind(metresPerSecond, unit) {
  if (!isNumber(metresPerSecond)) return '--';
  if (unit === 'F') {
    return `${Math.round(metresPerSecond * 2.23694)} mph`;
  }
  return `${Math.round(metresPerSecond * 3.6)} km/h`;
}

// ---------- Other values ----------

export function formatVisibility(metres) {
  if (!isNumber(metres)) return '--';
  if (metres >= 1000) {
    const km = metres / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }
  return `${metres} m`;
}

// "pop" (probability of precipitation) is between 0 and 1.
export function formatPop(pop) {
  if (!isNumber(pop)) return null;
  return `${Math.round(pop * 100)}%`;
}

export function getIconUrl(iconCode) {
  if (!iconCode) return null;
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// ---------- Time zones ----------


export function toCityDate(unixSeconds, timezoneOffset = 0) {
  return new Date((unixSeconds + timezoneOffset) * 1000);
}

export function formatCityTime(unixSeconds, timezoneOffset) {
  if (!isNumber(unixSeconds)) return '--';
  return toCityDate(unixSeconds, timezoneOffset || 0).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

export function formatCityHour(unixSeconds, timezoneOffset) {
  if (!isNumber(unixSeconds)) return '--';
  return toCityDate(unixSeconds, timezoneOffset || 0).toLocaleTimeString('en-US', {
    hour: 'numeric',
    timeZone: 'UTC',
  });
}

// Returns the city's local date as "YYYY-MM-DD". Used to group forecast entries.
export function getCityDateKey(unixSeconds, timezoneOffset) {
  return toCityDate(unixSeconds, timezoneOffset || 0).toISOString().slice(0, 10);
}

// Turns "2026-10-24" into readable parts such as "Sat" and "Oct 24".
export function formatDateKey(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  };
}

export function formatUtcOffset(timezoneOffset) {
  if (!isNumber(timezoneOffset)) return '';
  const sign = timezoneOffset >= 0 ? '+' : '-';
  const totalMinutes = Math.abs(timezoneOffset) / 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `UTC${sign}${hours}${minutes ? ':' + String(minutes).padStart(2, '0') : ''}`;
}

// ---------- Daily forecast (High / Low) ----------

const INTERVALS_PER_FULL_DAY = 8; // 24 hours / 3-hour steps


export function buildDailyForecast(list, timezoneOffset, nowSeconds = Date.now() / 1000) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const groups = {};
  const dateOrder = [];

  list.forEach((entry) => {
    if (!isNumber(entry?.dt)) return;
    const dateKey = getCityDateKey(entry.dt, timezoneOffset);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
      dateOrder.push(dateKey);
    }
    groups[dateKey].push(entry);
  });

  const todayKey = getCityDateKey(Math.floor(nowSeconds), timezoneOffset);

  const days = dateOrder.map((dateKey) => {
    const entries = groups[dateKey];
    const temps = entries.map((entry) => entry.main?.temp).filter(isNumber);
    if (temps.length === 0) return null;

    const pops = entries.map((entry) => entry.pop).filter(isNumber);

    // Pick the entry closest to 12:00 noon local time as the "typical" weather.
    let middayEntry = entries[0];
    let smallestGap = Infinity;
    entries.forEach((entry) => {
      const hour = toCityDate(entry.dt, timezoneOffset).getUTCHours();
      const gap = Math.abs(hour - 12);
      if (gap < smallestGap) {
        smallestGap = gap;
        middayEntry = entry;
      }
    });

    const firstHour = toCityDate(entries[0].dt, timezoneOffset).getUTCHours();
    const lastHour = toCityDate(entries[entries.length - 1].dt, timezoneOffset).getUTCHours();

    return {
      dateKey,
      ...formatDateKey(dateKey),
      isToday: dateKey === todayKey,
      isPartial: entries.length < INTERVALS_PER_FULL_DAY,
      intervalCount: entries.length,
      coveredFrom: firstHour,
      coveredTo: lastHour,
      high: Math.max(...temps),
      low: Math.min(...temps),
      maxPop: pops.length > 0 ? Math.max(...pops) : null,
      icon: middayEntry.weather?.[0]?.icon || null,
      description: capitalize(middayEntry.weather?.[0]?.description || ''),
    };
  });

  return days.filter(Boolean);
}

// The next few 3-hour forecast entries for the hourly section.
export function getUpcomingIntervals(list, count = 8, nowSeconds = Date.now() / 1000) {
  if (!Array.isArray(list)) return [];
  // Keep entries from the current 3-hour block onwards.
  return list
    .filter((entry) => isNumber(entry?.dt) && entry.dt >= nowSeconds - 3 * 60 * 60)
    .slice(0, count);
}

// ---------- Air quality ----------

export const AQI_LEVELS = {
  1: { label: 'Good', color: '#22c55e', advice: 'Air quality is satisfactory.' },
  2: { label: 'Fair', color: '#a3e635', advice: 'Acceptable for most people.' },
  3: { label: 'Moderate', color: '#facc15', advice: 'Sensitive people may feel some effects.' },
  4: { label: 'Poor', color: '#fb923c', advice: 'Sensitive groups should limit time outdoors.' },
  5: { label: 'Very Poor', color: '#ef4444', advice: 'Everyone should reduce outdoor activity.' },
};

export const POLLUTANT_NAMES = {
  pm2_5: 'PM2.5',
  pm10: 'PM10',
  o3: 'O₃',
  no2: 'NO₂',
  so2: 'SO₂',
  co: 'CO',
  no: 'NO',
  nh3: 'NH₃',
};

// ---------- UV index ----------

export function getUvCategory(uvi) {
  if (!isNumber(uvi)) return null;
  if (uvi < 3) return { label: 'Low', color: '#22c55e' };
  if (uvi < 6) return { label: 'Moderate', color: '#facc15' };
  if (uvi < 8) return { label: 'High', color: '#fb923c' };
  if (uvi < 11) return { label: 'Very High', color: '#ef4444' };
  return { label: 'Extreme', color: '#a855f7' };
}
