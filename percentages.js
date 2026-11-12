function roundToNearestPlate(value) {
  return Math.round(value / 2.5) * 2.5;
}

function formatWeight(w) {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

function setStatus(msg) {
  const el = document.getElementById("status-msg");
  if (el) el.textContent = msg;
}

async function loadPercentages(liftKey) {
  const tableBody = document.getElementById("pct-table-body");

  try {
    const res = await fetch(API_URL, { method: "GET" });
    const data = await res.json();
    if (!data || !data.ok) throw new Error("API returned an error");

    const d = data.dashboard || {};
    const tm = d[liftKey];

    tableBody.innerHTML = "";

    if (tm === null || tm === undefined) {
      setStatus("No training max on file yet for this lift.");
      return;
    }

    setStatus("");

    for (let pct = 100; pct >= 50; pct -= 5) {
      const rawWeight = tm * (pct / 100);
      const weight = roundToNearestPlate(rawWeight);

      const row = document.createElement("tr");

      const pctCell = document.createElement("td");
      pctCell.textContent = pct + "%";

      const weightCell = document.createElement("td");
      weightCell.textContent = formatWeight(weight);

      row.appendChild(pctCell);
      row.appendChild(weightCell);
      tableBody.appendChild(row);
    }
  } catch (err) {
    console.error("Failed to load percentages:", err);
    setStatus("Could not load data.");
  }
}
