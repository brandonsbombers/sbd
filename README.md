# SBD Training Max Tracker

A tiny, no-frills static site that shows your current training maxes (Squat,
Bench, Deadlift) and body weight, lets you push new numbers to your Google
Apps Script API, and shows a percentage breakdown table for each lift.
Hosted for free on GitHub Pages.

This repo contains **only the static frontend**. All data lives in your
Google Sheet and is read/written through your Apps Script API endpoint —
this site never talks to Google Sheets directly and never stores a GitHub
token.

## Files

- `index.html` — dashboard cards + update form
- `squat.html`, `bench.html`, `deadlift.html` — percentage breakdown pages
- `style.css` — dark theme styling
- `config.js` — shared config (Apps Script API URL)
- `app.js` — dashboard load + update logic for the home page
- `percentages.js` — percentage breakdown table logic
- `README.md` — this file

## How the site works

**Home page (`https://brandonsbombers.github.io/sbd/`)**
- On load, the page sends a `GET` request to your Apps Script API.
- It displays `squat`, `bench`, `deadlift`, and `weight` from the
  `dashboard` object in the response. `null` values show as `--`.
- The weight card shows a red down arrow if `weightTrend` is `"down"`,
  a green up arrow if `"up"`, and no arrow if `"none"`.
- The Squat, Bench, and Deadlift cards are tappable and link to their
  percentage breakdown page. The Weight card is not clickable.

**Percentage pages (`squat.html`, `bench.html`, `deadlift.html`)**
- Each page loads fresh from the API every time it opens (or is
  refreshed) — nothing is cached between visits.
- Each shows a two-column table: **Percentage** (100% down to 50%, in 5%
  steps) and **Weight**, calculated from that lift's current training max.
- Weight is rounded to the nearest 2.5 lb, since that's what you'd
  actually load on the bar — not the exact mathematical percentage.
- If a lift has no training max on file yet, the page says so instead of
  showing an empty table.

**Update mode (`https://brandonsbombers.github.io/sbd/#ff`)**
- Adding `#ff` to the end of the *home page* URL enables the four
  "Update" buttons (Dusty Denim `#5B85AA` when disabled, Tiger Orange
  `#F46036` when enabled).
- Clicking Update sends a `POST` request like:

  ```json
  { "secret": "ff", "type": "squat", "value": 135 }
  ```

  Valid `type` values: `squat`, `bench`, `deadlift`, `body weight`.
- The frontend does **not** round anything on update — your Apps Script
  handles barbell rounding for squat/bench/deadlift.

> Note: `#ff` in the URL is a convenience gate to hide the input UI from
> casual visitors, not real security.

## Enabling GitHub Pages

1. Go to the repo on GitHub: `https://github.com/brandonsbombers/sbd`
2. **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, choose **Deploy from a
   branch**. Branch `main`, folder `/ (root)`. **Save**.
4. Live URL: `https://brandonsbombers.github.io/sbd/`

## Deploying updates from Colab

Run the Colab notebook top to bottom. It reads your GitHub token from the
Colab secret `sbd-tracker` (never hard-coded), syncs the repo, rewrites the
site files, and pushes only if something changed.

## Apps Script CORS note

Google Apps Script web apps don't handle CORS preflight (`OPTIONS`)
requests well. To avoid triggering a preflight, the frontend sends POST
requests with `Content-Type: text/plain;charset=utf-8` instead of
`application/json`, even though the body is a JSON string. Your Apps
Script `doPost(e)` should parse the body with:

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
