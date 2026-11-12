function isEditMode() {
  return window.location.hash === "#ff";
}

function setButtonStates() {
  const editMode = isEditMode();
  document.querySelectorAll(".update-btn").forEach(function (btn) {
    btn.disabled = !editMode;
  });
}

function setStatus(msg) {
  const el = document.getElementById("status-msg");
  if (el) el.textContent = msg;
}

function formatValue(v) {
  return v === null || v === undefined ? "--" : v;
}

async function loadDashboard() {
  try {
    const res = await fetch(API_URL, { method: "GET" });
    const data = await res.json();
    if (!data || !data.ok) throw new Error("API returned an error");

    const d = data.dashboard || {};

    document.getElementById("value-squat").textContent = formatValue(d.squat);
    document.getElementById("value-bench").textContent = formatValue(d.bench);
    document.getElementById("value-deadlift").textContent = formatValue(d.deadlift);
    document.getElementById("value-weight").textContent = formatValue(d.weight);

    const trendEl = document.getElementById("weight-trend");
    trendEl.textContent = "";
    trendEl.className = "";

    if (d.weightTrend === "down") {
      trendEl.textContent = " \u25BC";
      trendEl.classList.add("trend-down");
    } else if (d.weightTrend === "up") {
      trendEl.textContent = " \u25B2";
      trendEl.classList.add("trend-up");
    }
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    setStatus("Could not load dashboard data.");
  }
}

async function handleUpdate(type, inputEl, btn) {
  const raw = inputEl.value;

  if (raw === "" || raw === null) {
    setStatus("Enter a value before updating.");
    return;
  }

  const payload = {
    secret: "ff",
    type: type,
    value: Number(raw)
  };

  btn.disabled = true;
  setStatus("Updating " + type + "...");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data && data.ok) {
      setStatus("Updated " + type + " successfully.");
      inputEl.value = "";
      await loadDashboard();
    } else {
      setStatus("Update failed: " + (data && data.error ? data.error : "unknown error"));
    }
  } catch (err) {
    console.error(err);
    setStatus("Update failed. Check your connection and try again.");
  } finally {
    setButtonStates();
  }
}

function wireUpdateButtons() {
  document.querySelectorAll(".update-btn[data-type]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const type = btn.getAttribute("data-type");
      const inputId = type === "body weight" ? "input-weight" : "input-" + type;
      const inputEl = document.getElementById(inputId);
      handleUpdate(type, inputEl, btn);
    });
  });
}

async function handleCardioLog(durationEl, distanceEl, caloriesEl, btn) {
  const duration = durationEl.value;
  const distance = distanceEl.value;
  const calories = caloriesEl.value;

  if (duration === "" || distance === "" || calories === "") {
    setStatus("Enter duration, distance, and calories before logging.");
    return;
  }

  const payload = {
    secret: "ff",
    type: "cardio",
    duration: Number(duration),
    distance: Number(distance),
    calories: Number(calories)
  };

  btn.disabled = true;
  setStatus("Logging cardio...");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data && data.ok) {
      setStatus("Cardio logged successfully.");
      durationEl.value = "";
      distanceEl.value = "";
      caloriesEl.value = "";
      loadCardioCharts();
    } else {
      setStatus("Log failed: " + (data && data.error ? data.error : "unknown error"));
    }
  } catch (err) {
    console.error(err);
    setStatus("Log failed. Check your connection and try again.");
  } finally {
    setButtonStates();
  }
}

function wireCardioButton() {
  const btn = document.getElementById("log-cardio-btn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    handleCardioLog(
      document.getElementById("input-cardio-duration"),
      document.getElementById("input-cardio-distance"),
      document.getElementById("input-cardio-calories"),
      btn
    );
  });
}

function getWeekBounds(now) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // back up to Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 7); // exclusive upper bound, next Sunday
  return [start, end];
}

function getMonthBounds(now) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return [start, end];
}

function renderDonut(containerId, value, goal, unit) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const totalLaps = goal > 0 ? value / goal : 0;
  const fullLaps = Math.floor(totalLaps);
  const remainder = totalLaps - fullLaps; // 0..1 fraction of the lap in progress

  let baseOffset;
  let overlayCircle = "";

  if (fullLaps === 0) {
    // Under goal: single partial arc, same as before.
    const pct = Math.min(remainder, 1);
    baseOffset = circumference * (1 - pct);
  } else {
    // Goal reached at least once: base ring is a full solid circle,
    // and a second "lap" ring sweeps from the top to show progress
    // into the next 100%, Apple Watch-style.
    baseOffset = 0;
    if (remainder > 0) {
      const overlayOffset = circumference * (1 - remainder);
      overlayCircle =
        '<circle class="donut-overlay" cx="70" cy="70" r="' + radius +
        '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + overlayOffset + '"></circle>';
    }
  }

  const roundedValue = Math.round(value * 10) / 10;
  const displayValue = Number.isInteger(roundedValue) ? roundedValue : roundedValue.toFixed(1);

  container.innerHTML =
    '<svg viewBox="0 0 140 140" class="donut-svg">' +
      '<circle class="donut-track" cx="70" cy="70" r="' + radius + '"></circle>' +
      '<circle class="donut-progress" cx="70" cy="70" r="' + radius +
        '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + baseOffset + '"></circle>' +
      overlayCircle +
    "</svg>" +
    '<div class="donut-label">' + displayValue + " / " + goal + " " + unit + "</div>";
}

async function loadCardioCharts() {
  try {
    const res = await fetch(API_URL + "?action=cardioLog", { method: "GET" });
    const data = await res.json();
    if (!data || !data.ok) throw new Error("API returned an error for cardio log");

    const rows = data.rows || [];
    const now = new Date();
    const [weekStart, weekEnd] = getWeekBounds(now);
    const [monthStart, monthEnd] = getMonthBounds(now);

    let weeklyMinutes = 0;
    let monthlyCalories = 0;

    rows.forEach(function (row) {
      const d = new Date(row.date);
      if (isNaN(d.getTime())) return;

      if (d >= weekStart && d < weekEnd) {
        weeklyMinutes += Number(row.durationMinutes) || 0;
      }
      if (d >= monthStart && d < monthEnd) {
        monthlyCalories += Number(row.calories) || 0;
      }
    });

    renderDonut("weekly-donut", weeklyMinutes, 140, "min");
    renderDonut("monthly-donut", monthlyCalories, 14000, "cal");
  } catch (err) {
    console.error("Failed to load cardio charts:", err);
  }
}

window.addEventListener("hashchange", setButtonStates);

document.addEventListener("DOMContentLoaded", function () {
  setButtonStates();
  wireUpdateButtons();
  wireCardioButton();
  loadDashboard();
  loadCardioCharts();
});
