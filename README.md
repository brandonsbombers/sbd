# SBD / Progress Tracker

A tiny, no-frills static site that tracks training maxes (Squat, Bench,
Deadlift), body weight, and cardio sessions, all backed by a Google Apps
Script API in front of a Google Sheet. Hosted for free on GitHub Pages.

This repo contains **only the static frontend**. All data lives in your
Google Sheet (tabs for lifts and for `Cardio`) and is read/written through
your Apps Script API endpoint — this site never talks to Google Sheets
directly and never stores a GitHub token.

## Files

- `index.html` — dashboard cards, TM update form, cardio log form, weekly/monthly donut charts
- `squat.html`, `bench.html`, `deadlift.html` — percentage breakdown pages
- `style.css` — dark theme styling
- `config.js` — shared config (Apps Script API URL)
- `app.js` — dashboard load, TM updates, cardio logging, donut charts
- `percentages.js` — percentage breakdown table logic
- `README.md` — this file

## Home page layout

- **Top:** four cards — Squat, Bench, Deadlift, Weight. The first three are
  tappable and link to their percentage breakdown page. Weight is not
  clickable.
- **Middle, two columns** (stacks to one column on narrow screens):
  - **Enter New TM** — the original four update rows (Squat, Bench,
    Deadlift, Weight), one Update button each.
  - **Enter Cardio** — Duration (minutes), Distance (miles), and Calories,
    with a single **Log Cardio** button that submits all three at once.
    The date/time is stamped automatically by the Apps Script the moment
    it receives the request — you never enter it.
- **Bottom:** two donut charts, always showing the **current** period only:
  - Weekly cardio minutes vs. a 140 min/week goal (week runs Sun–Sat).
  - Monthly calories vs. a 1400 cal/month goal (calendar month).
  These are read-only and don't link anywhere.

## Update mode (`https://brandonsbombers.github.io/sbd/#ff`)

Adding `#ff` to the URL enables every Update/Log button on the home page
(Dusty Denim `#5B85AA` when disabled, Tiger Orange `#F46036` when enabled).
Without it, all update buttons are disabled — the dashboard and charts are
still fully visible to anyone.

- **TM update** POST body:
  ```json
  { "secret": "ff", "type": "squat", "value": 135 }
  ```
  Valid `type`: `squat`, `bench`, `deadlift`, `body weight`.

- **Cardio log** POST body:
  ```json
  { "secret": "ff", "type": "cardio", "duration": 31, "distance": 2.3, "calories": 459 }
  ```
  `duration` is minutes (decimals OK, e.g. `31.5`). The frontend does not
  round anything — the Apps Script owns all formatting/rounding.

> `#ff` in the URL is a convenience gate to hide the input UI from casual
> visitors, not real security.

## Percentage pages

`squat.html`, `bench.html`, `deadlift.html` each load that lift's current
training max fresh from the API every time the page opens, and show a
Percentage/Weight table from 100% down to 50% in 5% steps. Weight is
rounded to the nearest 2.5 lb (bar-loadable), not the raw math.

## Cardio charts data

The home page calls `GET {API_URL}?action=cardioLog` to fetch every row
from the `Cardio` tab, then sums minutes for the current week (Sun–Sat)
and calories for the current calendar month, entirely in the browser.
See `APPS_SCRIPT_CHANGES.md` for the server-side half of this.

## Enabling GitHub Pages

1. Go to the repo on GitHub: `https://github.com/brandonsbombers/sbd`
2. **Settings** → **Pages**.
3. **Build and deployment** → **Source**: **Deploy from a branch**.
   Branch `main`, folder `/ (root)`. **Save**.
4. Live URL: `https://brandonsbombers.github.io/sbd/`

## Deploying updates from Colab

Run the latest Colab notebook top to bottom. It reads your GitHub token
from the Colab secret `sbd-tracker` (never hard-coded), syncs the repo,
rewrites the site files, stamps a fresh cache-busting version on every
CSS/JS reference, and pushes only if something changed.

## Apps Script CORS note

Google Apps Script web apps don't handle CORS preflight (`OPTIONS`)
requests well. To avoid triggering a preflight, the frontend sends POST
requests with `Content-Type: text/plain;charset=utf-8` instead of
`application/json`, even though the body is a JSON string. `doPost(e)`
should parse the body with:

```javascript
var payload = JSON.parse(e.postData.contents);
```

which works regardless of the declared content type.

## URLs at a glance

- **Home / view:** `https://brandonsbombers.github.io/sbd/`
- **Update mode:** `https://brandonsbombers.github.io/sbd/#ff`
- **Squat percentages:** `https://brandonsbombers.github.io/sbd/squat.html`
- **Bench percentages:** `https://brandonsbombers.github.io/sbd/bench.html`
- **Deadlift percentages:** `https://brandonsbombers.github.io/sbd/deadlift.html`
