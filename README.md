# SkyCast – Weather Dashboard

SkyCast is a responsive weather dashboard built with **React**, **Vite**, **Material UI** and the **OpenWeatherMap API**. It was built for the SapphireIQ Frontend Development Internship.

## Features

- Current weather: city and country, temperature, description, icon, feels-like, humidity, wind, pressure, visibility, sunrise and sunset, observation time and last-updated time
- City search, refresh button, and a default city on the first visit (later visits open the last searched city)
- Next 24 hours in 3-hour steps (horizontally scrollable on phones)
- 5-day forecast with **estimated** High / Low and chance of rain, grouped by the city's local date
- Air quality (OpenWeatherMap 1–5 index) with pollutant levels
- UV index and official weather alerts **if** your key has One Call API 3.0 access; otherwise a clear explanation
- Compare up to three cities
- Recent search history (click to search again, remove one, clear all, no duplicates)
- °C / °F toggle that applies everywhere (wind switches between km/h and mph)
- Friendly messages for invalid cities, network problems, bad API keys, rate limits and server errors, with Retry where it helps

## Requirements

- Node.js 20.19 or newer (`node -v` to check)
- A free OpenWeatherMap API key from https://home.openweathermap.org/api_keys

## Setup

```bash
cd skycast
npm install
```

Create the API key file (copy the example and edit it):

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local
# macOS / Linux
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder:

```
VITE_OPENWEATHER_API_KEY=paste_your_real_key_here
```

New OpenWeatherMap keys can take a while (often up to 2 hours) to activate. Until then you will see a "401" API key message.

## Run

```bash
npm run dev        # start the development server (http://localhost:5173)
npm run build      # production build into dist/
npm run preview    # preview the production build
npm test           # unit tests for forecast and formatting logic
```

Restart `npm run dev` whenever you change `.env.local`.

## Project structure

```
skycast/
├── index.html
├── package.json
├── vite.config.js
├── .env.example          placeholder only – copy to .env.local
├── .gitignore            excludes node_modules, dist and .env.local
├── public/
│   └── skycast-icon.svg
├── src/
│   ├── main.jsx          MUI theme + renders <App />
│   ├── App.jsx           state, data loading, page layout
│   ├── index.css         global colours and background
│   ├── styles.css        component styles and responsive layout
│   ├── components/
│   │   ├── SearchBox.jsx
│   │   ├── SearchHistory.jsx
│   │   ├── InfoBox.jsx           current weather
│   │   ├── HourlyForecast.jsx
│   │   ├── Forecast.jsx          5-day High / Low
│   │   ├── AirQuality.jsx
│   │   ├── UvAndAlerts.jsx
│   │   ├── CityComparison.jsx
│   │   └── ErrorMessage.jsx
│   └── utils/
│       ├── api.js        all OpenWeatherMap requests
│       ├── errors.js     HTTP status -> friendly message
│       ├── storage.js    safe localStorage helpers
│       └── weather.js    formatting, time zones, forecast calculations
└── tests/
    └── weather.test.js
```

## How it works

1. **Search.** `App.jsx` calls `fetchCurrentWeather(city)` (`/data/2.5/weather`). The response includes the city's latitude and longitude.
2. **Everything else in parallel.** Using those coordinates, the app requests the forecast (`/data/2.5/forecast`), air pollution (`/data/2.5/air_pollution`) and One Call 3.0 (`/data/3.0/onecall`) together with `Promise.allSettled`. If one of them fails, only that section shows an error; the rest still works.
3. **Stale responses are ignored.** Every search gets a number. If an older search finishes after a newer one, its result is thrown away.
4. **Units.** Every request asks for metric units, and the raw Celsius values are stored. Conversion to °F happens only in `formatTemp()` at display time, so no value is ever converted twice.

### How the daily High / Low is calculated

The free forecast gives 40 readings, one every 3 hours (5 days).

1. Each reading's time (UTC) is shifted by the city's time-zone offset to get the city's **local date** (e.g. `2026-10-24`).
2. Readings are grouped by that date.
3. **High** = the highest `main.temp` in the group; **Low** = the lowest.
4. Chance of rain = the highest `pop` in the group.
5. The icon/description come from the reading closest to 12 noon.
6. A day with fewer than 8 readings (usually today and the last day) is marked **Partial**, showing which hours it covers.

These are estimates: the true maximum can happen between two 3-hour readings. The app never adds or subtracts degrees to make High and Low look different, and it does not use the current-weather `temp_min`/`temp_max`.

## API limitations

| Feature | Endpoint | Free key? |
|---|---|---|
| Current weather | `/data/2.5/weather` | Yes |
| 5-day / 3-hour forecast | `/data/2.5/forecast` | Yes |
| Air pollution | `/data/2.5/air_pollution` | Yes |
| UV index + alerts | `/data/3.0/onecall` | Needs the separate "One Call by Call" subscription |

- Without One Call 3.0 access the UV/alerts card explains this, and the app stops calling that endpoint for the rest of the session.
- Hourly data is in 3-hour steps, not every hour.
- OpenWeatherMap's AQI is a 1–5 scale and is not the same as the US or Indian AQI.
- Free plan rate limits apply (about 60 calls/minute). Each city search uses up to 4 calls.

## Security note

The API key is read from `import.meta.env.VITE_OPENWEATHER_API_KEY` and kept in `.env.local`, which Git ignores. The key is never written to localStorage or logged.

However, **any `VITE_` variable is bundled into the JavaScript sent to the browser**, and it appears in request URLs in the browser's Network tab. Anyone using the deployed site can find it. For a real production app, put the key on a small backend (for example an Express server or a serverless function) that calls OpenWeatherMap and returns the data, so the key never reaches the browser.
