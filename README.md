# SBD Training Max Tracker

A tiny, no-frills static site that shows your current training maxes (Squat,
Bench, Deadlift) and body weight, and lets you push new numbers to your
Google Apps Script API. Hosted for free on GitHub Pages.

This repo contains **only the static frontend** (`index.html`, `style.css`,
`app.js`). All data lives in your Google Sheet and is read/written through
your Apps Script API endpoint — this site never talks to Google Sheets
directly and never stores a GitHub token.

## Files

- `index.html` — page structure (dashboard cards + update form)
- `style.css` — dark theme styling
- `app.js` — fetches the dashboard from the API and sends updates
- `README.md` — this file

## How the site works

**Viewing (`https://brandonsbombers.github.io/sbd/`)**
- On load, the page sends a `GET` request to your Apps Script API.
- It displays `squat`, `bench`, `deadlift`, and `weight` from the
  `dashboard` object in the response.
- Any `null` value is shown as `--`.
- The weight card shows a red down arrow if `weightTrend` is `"down"`,
  a green up arrow if `"up"`, and no arrow if `"none"`.

**Updating (`https://brandonsbombers.github.io/sbd/#ff`)**
- Adding `#ff` to the end of the URL enables the four "Update" buttons.
- Without `#ff` in the URL, the buttons are disabled (grey/blue —
  Dusty Denim `#5B85AA`) and cannot be clicked.
- With `#ff` in the URL, the buttons are enabled (orange —
  Tiger Orange `#F46036`).
- Clicking an Update button sends a `POST` request like:

  ```json
  { "secret": "ff", "type": "squat", "value": 135 }
  ```

  Valid `type` values: `squat`, `bench`, `deadlift`, `body weight`.
- The frontend does **not** round anything — your Apps Script handles
  barbell rounding for squat/bench/deadlift.

> Note: `#ff` in the URL is a convenience gate to hide the input UI from
> casual visitors, not real security. Anyone who knows (or guesses) the
> hash, or opens dev tools, can still see/trigger update calls. If you
> need real access control, that has to live in the Apps Script itself
> (e.g. checking the `secret` field server-side, which it looks like you
> already do).

## Enabling GitHub Pages

1. Go to the repo on GitHub: `https://github.com/brandonsbombers/sbd`
2. Click **Settings** → **Pages** (left sidebar).
3. Under **Build and deployment** → **Source**, choose **Deploy from a
   branch**.
4. Set **Branch** to `main` and folder to `/ (root)`. Click **Save**.
5. After a minute or two, GitHub will show your live URL, typically:
   `https://brandonsbombers.github.io/sbd/`

You only need to do this once. After that, every time the Colab notebook
pushes new files to `main`, GitHub Pages redeploys automatically.

## Using the Colab notebook to deploy updates

1. Open the notebook in Google Colab.
2. In the left sidebar, click the key icon (**Secrets**) and add a secret
   named exactly `sbd-tracker` with your GitHub Personal Access Token as
   the value. Make sure notebook access is toggled on for that secret.
3. Run all cells top to bottom. The notebook will:
   - read the token from Colab Secrets (never hard-coded),
   - clone/pull `https://github.com/brandonsbombers/sbd`,
   - (re)write `index.html`, `style.css`, `app.js`, and this `README.md`,
   - commit and push the changes to `main`.
4. GitHub Pages will pick up the new files automatically within a minute
   or so of the push.

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

- **View site:** `https://brandonsbombers.github.io/sbd/`
- **Update mode:** `https://brandonsbombers.github.io/sbd/#ff`
