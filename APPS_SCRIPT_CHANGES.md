# Apps Script changes needed for the Cardio tracker

This is **not** run from Colab — it's a set of changes to make directly in
your existing Apps Script project (the one behind your `/exec` URL), since
Claude doesn't have visibility into your current script. Merge these into
what you already have; don't just paste over your existing `doGet`/`doPost`.

## 1. Create the `Cardio` tab (optional — the script can also do this for you)

If you want to create it yourself: add a tab named exactly `Cardio` with a
header row:

| Date | Duration | Distance | Calories |
|------|----------|----------|----------|

If you skip this, the `logCardio` function below creates the tab and header
row automatically the first time someone logs a cardio session.

## 2. Add these two new functions anywhere in the script

```javascript
function logCardio(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Cardio');
  if (!sheet) {
    sheet = ss.insertSheet('Cardio');
    sheet.appendRow(['Date', 'Duration', 'Distance', 'Calories']);
  }

  var duration = Number(payload.duration);
  var distance = Number(payload.distance);
  var calories = Number(payload.calories);

  if (isNaN(duration) || isNaN(distance) || isNaN(calories)) {
    return jsonResponse({ ok: false, error: 'duration, distance, and calories must be numbers' });
  }

  var tz = ss.getSpreadsheetTimeZone();
  var now = new Date();
  var newRow = sheet.getLastRow() + 1;

  // Date: real Date value, formatted to match your example (M/d/yyyy HH:mm:ss)
  var dateCell = sheet.getRange(newRow, 1);
  dateCell.setValue(now);
  dateCell.setNumberFormat('M/d/yyyy HH:mm:ss');

  // Duration: stored as a Sheets duration value (minutes -> fraction of a day)
  var durationCell = sheet.getRange(newRow, 2);
  durationCell.setValue(duration / 1440);
  durationCell.setNumberFormat('[h]:mm:ss');

  // Distance: plain text, e.g. "2.3 mi"
  sheet.getRange(newRow, 3).setValue(distance + ' mi');

  // Calories: plain number
  sheet.getRange(newRow, 4).setValue(calories);

  return jsonResponse({ ok: true });
}

function cardioLogResponse() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Cardio');

  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ ok: true, rows: [] });
  }

  var tz = ss.getSpreadsheetTimeZone();
  var numValues = sheet.getDataRange().getValues();       // for real Date / number cells
  var displayValues = sheet.getDataRange().getDisplayValues(); // for formatted text like "0:31:00" or "2.3 mi"

  var rows = [];

  for (var i = 1; i < numValues.length; i++) {
    var dateCell = numValues[i][0];
    var dateStr = (dateCell instanceof Date)
      ? Utilities.formatDate(dateCell, tz, "yyyy-MM-dd'T'HH:mm:ss")
      : String(dateCell);

    // Duration comes back as a displayed "H:MM:SS" string regardless of
    // whether Sheets internally treats it as a Date or a number.
    var durationDisplay = String(displayValues[i][1] || '0:00:00');
    var durationParts = durationDisplay.split(':').map(Number);
    var durationMinutes = 0;
    if (durationParts.length === 3) {
      durationMinutes = durationParts[0] * 60 + durationParts[1] + durationParts[2] / 60;
    } else if (durationParts.length === 2) {
      durationMinutes = durationParts[0] + durationParts[1] / 60;
    }

    var distanceDisplay = String(displayValues[i][2] || '');
    var distanceMiles = parseFloat(distanceDisplay) || 0;

    var calories = Number(numValues[i][3]) || 0;

    rows.push({
      date: dateStr,
      durationMinutes: Math.round(durationMinutes * 100) / 100,
      distanceMiles: distanceMiles,
      calories: calories
    });
  }

  return jsonResponse({ ok: true, rows: rows });
}
```

If you don't already have a `jsonResponse` helper, add this too:

```javascript
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

If you already have an equivalent helper under a different name, just call
that one instead of `jsonResponse` in the two functions above.

## 3. Wire it into your existing `doGet(e)`

Add a branch at the **top** of your existing `doGet(e)` function, before
your current dashboard logic runs:

```javascript
function doGet(e) {
  if (e.parameter.action === 'cardioLog') {
    return cardioLogResponse();
  }

  // ... your existing dashboard-building code stays here, unchanged ...
}
```

## 4. Wire it into your existing `doPost(e)`

Add a branch inside your existing `doPost(e)`, after you've parsed the
payload and checked the `secret`, but before your existing
squat/bench/deadlift/body weight handling:

```javascript
function doPost(e) {
  var payload = JSON.parse(e.postData.contents);

  if (payload.secret !== 'ff') {
    return jsonResponse({ ok: false, error: 'Invalid secret' });
  }

  if (payload.type === 'cardio') {
    return logCardio(payload);
  }

  // ... your existing squat / bench / deadlift / body weight logic stays here ...
}
```

## 5. Re-deploy

Apps Script web apps don't pick up code changes automatically — after
saving, go to **Deploy → Manage deployments → (pencil icon) → New version
→ Deploy**. Your `/exec` URL stays the same; you're just pushing a new
version behind it.

## 6. Quick test

After redeploying, test in a browser or with `curl`:

- `GET  {your /exec URL}?action=cardioLog` → should return
  `{"ok":true,"rows":[]}` on a fresh Cardio tab, or your logged rows.
- From the site itself: open the home page with `#ff`, fill in Duration /
  Distance / Calories, click **Log Cardio**, then check the `Cardio` tab
  for a new row and refresh the page to see the donut charts move.
