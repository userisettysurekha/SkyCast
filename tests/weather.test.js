// Run with: npm test
// Tests the pure helper functions using made-up forecast data (no API calls).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyForecast,
  celsiusToFahrenheit,
  formatCityTime,
  formatTemp,
  formatWind,
  formatVisibility,
  getCityDateKey,
  getUpcomingIntervals,
  getUvCategory,
} from '../src/utils/weather.js';
import { getErrorForStatus } from '../src/utils/errors.js';

const IST = 19800; // India, UTC+5:30

// Builds 40 fake 3-hour forecast entries like the real API.
function makeForecastList(startUnix, temps) {
  return temps.map((temp, index) => ({
    dt: startUnix + index * 3 * 3600,
    main: { temp },
    pop: index % 5 === 0 ? 0.4 : 0.1,
    weather: [{ icon: '01d', description: 'clear sky' }],
  }));
}

test('temperature conversion is applied exactly once', () => {
  assert.equal(celsiusToFahrenheit(0), 32);
  assert.equal(celsiusToFahrenheit(100), 212);
  assert.equal(formatTemp(30, 'C'), '30°C');
  assert.equal(formatTemp(30, 'F'), '86°F');
  assert.equal(formatTemp(-0.3, 'C'), '0°C'); // no "-0"
  assert.equal(formatTemp(undefined, 'C'), '--');
});

test('wind and visibility formatting', () => {
  assert.equal(formatWind(10, 'C'), '36 km/h');
  assert.equal(formatWind(10, 'F'), '22 mph');
  assert.equal(formatWind(null, 'C'), '--');
  assert.equal(formatVisibility(10000), '10 km');
  assert.equal(formatVisibility(2500), '2.5 km');
  assert.equal(formatVisibility(800), '800 m');
});

test('city local time uses the city offset, not the computer time zone', () => {
  // 2026-10-23 00:00 UTC is 05:30 in India
  const unix = Date.UTC(2026, 9, 23, 0, 0) / 1000;
  assert.equal(formatCityTime(unix, IST), '5:30 AM');
  assert.equal(formatCityTime(unix, -18000), '7:00 PM'); // UTC-5
  // 20:00 UTC on Oct 23 is already Oct 24 in India
  const lateUnix = Date.UTC(2026, 9, 23, 20, 0) / 1000;
  assert.equal(getCityDateKey(lateUnix, IST), '2026-10-24');
  assert.equal(getCityDateKey(lateUnix, 0), '2026-10-23');
});

test('daily forecast groups by local date and computes High/Low from intervals', () => {
  // "Now" = 2026-10-23 16:00 IST. First entry 17:30 IST (12:00 UTC).
  const now = Date.UTC(2026, 9, 23, 10, 30) / 1000;
  const start = Date.UTC(2026, 9, 23, 12, 0) / 1000;
  const temps = Array.from({ length: 40 }, (_, i) => 20 + (i % 8)); // 20..27 repeating
  temps[10] = 35.4; // a hot reading on the next day
  const list = makeForecastList(start, temps);

  const days = buildDailyForecast(list, IST, now);

  // Entries at 17:30, 20:30, 23:30 IST belong to Oct 23 (today, partial)
  assert.equal(days[0].dateKey, '2026-10-23');
  assert.equal(days[0].isToday, true);
  assert.equal(days[0].isPartial, true);
  assert.equal(days[0].intervalCount, 3);
  assert.equal(days[0].high, 22);
  assert.equal(days[0].low, 20);

  // Next day is a full day of 8 entries
  assert.equal(days[1].dateKey, '2026-10-24');
  assert.equal(days[1].isPartial, false);
  assert.equal(days[1].intervalCount, 8);
  assert.equal(days[1].high, 35.4);
  assert.equal(days[1].isToday, false);

  // Every entry is counted exactly once
  const total = days.reduce((sum, day) => sum + day.intervalCount, 0);
  assert.equal(total, 40);

  // Max precipitation probability is used
  assert.equal(days[1].maxPop, 0.4);

  // High/Low are never artificially changed: equal temps stay equal
  const flat = buildDailyForecast(makeForecastList(start, Array(40).fill(25)), IST, now);
  flat.forEach((day) => assert.equal(day.high, day.low));
});

test('daily forecast handles missing fields safely', () => {
  assert.deepEqual(buildDailyForecast(undefined, 0), []);
  assert.deepEqual(buildDailyForecast([], 0), []);
  const broken = [{ dt: 1760000000 }, { dt: 1760010800, main: { temp: 10 } }, null];
  const days = buildDailyForecast(broken, 0, 1760000000);
  assert.equal(days.length, 1);
  assert.equal(days[0].high, 10);
  assert.equal(days[0].description, '');
});

test('upcoming intervals skip old entries and limit the count', () => {
  const start = 1760000000;
  const list = makeForecastList(start, Array(40).fill(20));
  const now = start + 7 * 3600; // two entries are well in the past
  const upcoming = getUpcomingIntervals(list, 8, now);
  assert.equal(upcoming.length, 8);
  assert.ok(upcoming[0].dt >= now - 3 * 3600);
});

test('UV categories follow the WHO scale', () => {
  assert.equal(getUvCategory(1.5).label, 'Low');
  assert.equal(getUvCategory(5).label, 'Moderate');
  assert.equal(getUvCategory(7).label, 'High');
  assert.equal(getUvCategory(9).label, 'Very High');
  assert.equal(getUvCategory(11.2).label, 'Extreme');
  assert.equal(getUvCategory(undefined), null);
});

test('HTTP errors become friendly messages', () => {
  assert.equal(getErrorForStatus(401).type, 'auth');
  const notFound = getErrorForStatus(404, 'Atlantis');
  assert.equal(notFound.type, 'not-found');
  assert.match(notFound.message, /Atlantis/);
  assert.equal(getErrorForStatus(429).type, 'rate-limit');
  assert.equal(getErrorForStatus(503).type, 'server');
  assert.equal(getErrorForStatus(418).type, 'unknown');
});
