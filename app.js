const API_URL = "https://script.google.com/macros/s/AKfycbySN7fmQh46eJkbuXiV9EUHFmzErAYTAY_s4qrYQwjLCUE522ErKYL-gDPPWde_H2_6cw/exec";

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
  document.querySelectorAll(".update-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const type = btn.getAttribute("data-type");
      const inputId = type === "body weight" ? "input-weight" : "input-" + type;
      const inputEl = document.getElementById(inputId);
      handleUpdate(type, inputEl, btn);
    });
  });
}

window.addEventListener("hashchange", setButtonStates);

document.addEventListener("DOMContentLoaded", function () {
  setButtonStates();
  wireUpdateButtons();
  loadDashboard();
});
