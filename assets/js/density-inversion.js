/**
 * TLE Density Inversion - Minimal Dashboard
 * Activity Grid + All Satellites Chart
 */

const SATELLITES = {
  '43476': { name: 'GRACE-FO-A', color: '#2563eb', order: 1 },
  '43877': { name: 'Kanopus-V 6', color: '#7c3aed', order: 2 },
  '39212': { name: 'CZ-4C DEB', color: '#db2777', order: 3 },
  '48714': { name: 'NOAA 17 DEB', color: '#059669', order: 4 },
  '64631': { name: 'CZ-6A DEB', color: '#d97706', order: 5 },
  '22': { name: 'Explorer 7', color: '#0ea5e9', order: 6 },
  '54686': { name: 'Dongpo 08', color: '#14b8a6', order: 7 },
  '54695': { name: 'Jilin-1 Gaofen 03D48', color: '#f43f5e', order: 8 },
  '60012': { name: 'Object A', color: '#6366f1', order: 9 },
  '62407': { name: 'Electron Kick Stage R/B', color: '#64748b', order: 10 }
};

let allData = {};
let kpData = null;
let heatmapPeriod = 'year';
let densityView = 'activity';

document.addEventListener('DOMContentLoaded', () => {
  setDensityView('activity');
  loadAllData();
});

async function loadAllData() {
  const status = document.getElementById('status');

  for (const noradId of Object.keys(SATELLITES)) {
    try {
      const response = await fetch(`/data/density-${noradId}.json`);
      if (response.ok) {
        allData[noradId] = await response.json();
      }
    } catch (err) {
      console.error(`Failed to load ${noradId}:`, err);
    }
  }

  try {
    const kpResponse = await fetch('/data/kp-index.json');
    if (kpResponse.ok) {
      kpData = await kpResponse.json();
    }
  } catch (err) {
    console.log('Kp data not available');
  }

  updateSpaceWeatherIndicator();

  const loadedCount = Object.keys(allData).filter(id => allData[id]?.times?.length).length;

  if (loadedCount > 0) {
    // Find most recent timestamp
    let latestTime = null;
    Object.values(allData).forEach(data => {
      if (data.times && data.times.length > 0) {
        const dataLatest = new Date(data.times[data.times.length - 1]);
        if (!latestTime || dataLatest > latestTime) {
          latestTime = dataLatest;
        }
      }
    });

    if (latestTime) {
      status.textContent = 'Updated ' + latestTime.toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) + ' \u2022 Refreshes every 6 hours';
      status.classList.remove('hidden');
    } else {
      status.classList.add('hidden');
    }

    renderActivityGrid();
    renderSatelliteCards();
    if (densityView === 'waves') {
      renderJoyDivisionPlot();
    }
  } else {
    status.textContent = 'No data available';
    status.classList.add('error');
  }
}

function getKpDescriptor(kpValue) {
  if (kpValue >= 7) return { level: 'severe', label: 'Severe Storm' };
  if (kpValue >= 5) return { level: 'storm', label: 'Storm' };
  if (kpValue >= 4) return { level: 'active', label: 'Active' };
  return { level: 'quiet', label: 'Quiet' };
}

function updateSpaceWeatherIndicator() {
  const banner = document.getElementById('space-weather-banner');
  if (!banner) return;

  const statusText = banner.querySelector('.space-weather-text');
  const kpChip = banner.querySelector('.space-weather-kp');
  const timeText = banner.querySelector('.space-weather-time');

  if (!statusText || !kpChip || !timeText) return;

  if (!kpData || !kpData.times || !kpData.values || kpData.times.length === 0) {
    statusText.textContent = 'Awaiting Kp data';
    kpChip.textContent = 'Kp --';
    timeText.textContent = 'Updated --';
    banner.setAttribute('data-level', 'quiet');
    return;
  }

  const lastIndex = kpData.times.length - 1;
  const kpValue = kpData.values[lastIndex];
  const descriptor = getKpDescriptor(kpValue);
  const kpTime = new Date(kpData.times[lastIndex].replace(' ', 'T') + 'Z');

  banner.setAttribute('data-level', descriptor.level);
  statusText.textContent = `${descriptor.label} Conditions`;
  kpChip.textContent = `Kp ${kpValue.toFixed(1)}`;
  timeText.textContent = 'Updated ' + kpTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function setHeatmapPeriod(period) {
  heatmapPeriod = period;
  document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  renderActivityGrid();
}

window.setHeatmapPeriod = setHeatmapPeriod;

function setDensityView(view) {
  densityView = view;

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  const activity = document.getElementById('density-activity');
  const waves = document.getElementById('density-waves');
  if (activity) activity.classList.toggle('is-hidden', view !== 'activity');
  if (waves) waves.classList.toggle('is-hidden', view !== 'waves');

  const timeSelector = document.querySelector('.time-period-selector');
  if (timeSelector) timeSelector.classList.toggle('is-hidden', view !== 'activity');

  if (view === 'waves') {
    renderJoyDivisionPlot();
    if (window.Plotly) {
      const container = document.getElementById('joy-division-plot');
      if (container) {
        requestAnimationFrame(() => Plotly.Plots.resize(container));
      }
    }
  }
}

window.setDensityView = setDensityView;

function renderActivityGrid() {
  const container = document.getElementById('activity-grid');
  if (!container) return;

  container.innerHTML = '';

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let numDays;
  switch (heatmapPeriod) {
    case 'week': numDays = 7; break;
    case 'month': numDays = 30; break;
    case 'year': default: numDays = 365; break;
  }

  // Generate dates from oldest to newest
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Render satellite rows
  Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([noradId, sat]) => {
      const data = allData[noradId];
      if (!data || !data.times || data.times.length === 0) return;

      // Bin densities by day
      const dayBins = {};
      data.times.forEach((t, i) => {
        const dayKey = new Date(t).toISOString().split('T')[0];
        if (!dayBins[dayKey]) dayBins[dayKey] = [];
        dayBins[dayKey].push(data.densities[i]);
      });

      // Get densities ONLY from the visible time period for normalization
      const visibleDensities = [];
      dates.forEach(date => {
        if (dayBins[date]) {
          visibleDensities.push(...dayBins[date]);
        }
      });

      if (visibleDensities.length === 0) return;

      // Log scale normalization per satellite, per time period
      const positiveDensities = visibleDensities.filter(d => d > 0);
      if (positiveDensities.length === 0) return;

      const logMin = Math.log10(Math.min(...positiveDensities));
      const logMax = Math.log10(Math.max(...positiveDensities));
      const logRange = logMax - logMin;

      const row = document.createElement('div');
      row.className = 'activity-row';

      const label = document.createElement('div');
      label.className = 'activity-label';
      label.textContent = sat.name;
      row.appendChild(label);

      const cells = document.createElement('div');
      cells.className = 'activity-cells';

      dates.forEach(date => {
        const cell = document.createElement('div');
        cell.className = 'activity-cell';

        let level = 0;
        if (dayBins[date] && dayBins[date].length > 0) {
          const avgDensity = dayBins[date].reduce((a, b) => a + b, 0) / dayBins[date].length;
          const logVal = Math.log10(avgDensity);
          const normalized = logRange > 0 ? (logVal - logMin) / logRange : 0.5;

          if (normalized > 0.8) level = 4;
          else if (normalized > 0.6) level = 3;
          else if (normalized > 0.4) level = 2;
          else if (normalized > 0.2) level = 1;
          else level = 1;

          cell.title = `${date}: ${avgDensity.toExponential(2)} kg/m³`;
        }

        cell.setAttribute('data-level', level);
        cells.appendChild(cell);
      });

      row.appendChild(cells);
      container.appendChild(row);
    });

  // Add Kp index row
  if (kpData && kpData.times && kpData.values) {
    const kpByDay = {};
    kpData.times.forEach((t, i) => {
      const dayKey = t.split(' ')[0];
      if (!kpByDay[dayKey]) kpByDay[dayKey] = [];
      kpByDay[dayKey].push(kpData.values[i]);
    });

    const kpRow = document.createElement('div');
    kpRow.className = 'activity-row kp-row';

    const kpLabel = document.createElement('div');
    kpLabel.className = 'activity-label';
    kpLabel.textContent = 'Kp Index';
    kpRow.appendChild(kpLabel);

    const kpCells = document.createElement('div');
    kpCells.className = 'activity-cells';

    dates.forEach(date => {
      const cell = document.createElement('div');
      cell.className = 'activity-cell kp-cell';

      let level = 0;
      if (kpByDay[date] && kpByDay[date].length > 0) {
        const maxKp = Math.max(...kpByDay[date]);
        if (maxKp >= 7) level = 4;
        else if (maxKp >= 5) level = 3;
        else if (maxKp >= 4) level = 2;
        else if (maxKp >= 1) level = 1;

        cell.title = `${date}: Kp ${maxKp.toFixed(1)}`;
      }

      cell.setAttribute('data-level', level);
      kpCells.appendChild(cell);
    });

    kpRow.appendChild(kpCells);
    container.appendChild(kpRow);
  }
}

function buildDateRange(startDate, endDate) {
  const dates = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  cursor.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function buildDailySeries(data, dates, startDate, endDate) {
  const dayBins = {};

  data.times.forEach((t, i) => {
    const dt = new Date(t);
    if (dt < startDate || dt > endDate) return;
    const dayKey = dt.toISOString().split('T')[0];
    if (!dayBins[dayKey]) dayBins[dayKey] = [];
    dayBins[dayKey].push(data.densities[i]);
  });

  return dates.map(date => {
    const key = date.toISOString().split('T')[0];
    const vals = dayBins[key];
    if (!vals || vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
}

function normalizeSeries(values) {
  const valid = values.filter(v => v !== null && Number.isFinite(v) && v > 0);
  if (valid.length === 0) {
    return values.map(() => null);
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min;

  return values.map(value => {
    if (value === null || !Number.isFinite(value)) return null;
    if (range === 0) return 0.5;
    return (value - min) / range;
  });
}

function renderJoyDivisionPlot() {
  const container = document.getElementById('joy-division-plot');
  if (!container) return;

  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 6);

  const entries = Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .filter(([noradId]) => allData[noradId]?.times?.length);

  if (entries.length === 0) {
    container.textContent = 'Loading density data...';
    return;
  }

  const dates = buildDateRange(startDate, now);
  const spacing = 0.55;
  const amplitude = 0.85;
  const traces = [];
  const total = entries.length;

  entries.forEach(([noradId], index) => {
    const data = allData[noradId];
    const daily = buildDailySeries(data, dates, startDate, now);
    const normalized = normalizeSeries(daily);
    const offset = (total - index - 1) * spacing;
    const y = normalized.map(value => (value === null ? null : offset + value * amplitude));

    traces.push({
      x: dates,
      y,
      mode: 'lines',
      line: {
        color: 'rgba(226, 232, 240, 0.9)',
        width: 1.3,
        shape: 'spline',
        smoothing: 0.35
      },
      hoverinfo: 'skip',
      showlegend: false
    });
  });

  const layout = {
    margin: { t: 10, r: 10, b: 10, l: 10 },
    paper_bgcolor: '#0b0f1a',
    plot_bgcolor: '#0b0f1a',
    xaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: false
    },
    yaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      range: [-0.2, (total - 1) * spacing + amplitude + 0.2]
    },
    showlegend: false
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: false
  });
}

function renderSatelliteCards() {
  const container = document.getElementById('satellite-cards');
  if (!container) return;

  container.innerHTML = '';

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([noradId, sat]) => {
      const data = allData[noradId];
      if (!data || !data.times || data.times.length === 0) return;

      const lastIdx = data.times.length - 1;
      const lastAltitude = data.perigees ? data.perigees[lastIdx] : null;
      const lastUpdate = new Date(data.times[lastIdx]);
      const updateStr = lastUpdate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const card = document.createElement('div');
      card.className = 'satellite-card';

      card.innerHTML = `
        <div class="card-header">
          <span class="card-dot" style="background: ${sat.color}"></span>
          <span class="card-name">${sat.name}</span>
          <div class="card-stats">
            ${lastAltitude ? `
            <div class="card-stat">
              <div class="card-stat-label">Altitude</div>
              <div class="card-stat-value">${lastAltitude.toFixed(0)} km</div>
            </div>
            ` : ''}
            <div class="card-stat">
              <div class="card-stat-label">Last Updated</div>
              <div class="card-stat-value">${updateStr}</div>
            </div>
          </div>
        </div>
        <div class="card-chart" id="chart-${noradId}"></div>
      `;

      container.appendChild(card);

      // Render chart after card is in DOM
      setTimeout(() => renderCardChart(noradId, sat.color, data, sixMonthsAgo, now), 10);
    });
}

function renderCardChart(noradId, color, data, startDate, endDate) {
  const container = document.getElementById(`chart-${noradId}`);
  if (!container) return;

  const traces = [];

  const densityTimes = [];
  const densityValues = [];
  for (let i = 0; i < data.times.length; i++) {
    const dt = new Date(data.times[i]);
    if (Number.isNaN(dt.getTime())) continue;
    if (dt < startDate || dt > endDate) continue;
    densityTimes.push(dt);
    densityValues.push(data.densities[i]);
  }

  // Kp background bands (full height, color indicates intensity)
  if (kpData && kpData.times) {
    const kpTimes = [];
    const kpValues = [];
    kpData.times.forEach((t, i) => {
      const dt = new Date(t.replace(' ', 'T') + 'Z');
      if (Number.isNaN(dt.getTime())) return;
      if (dt < startDate || dt > endDate) return;
      kpTimes.push(dt);
      kpValues.push(kpData.values[i]);
    });

    const kpColors = kpValues.map(kp => {
      if (kp >= 7) return 'rgba(239, 68, 68, 0.25)';
      if (kp >= 5) return 'rgba(249, 115, 22, 0.25)';
      if (kp >= 4) return 'rgba(234, 179, 8, 0.2)';
      return 'rgba(34, 197, 94, 0.15)';
    });

    traces.push({
      x: kpTimes,
      y: kpValues.map(() => 1),  // All bars same height
      type: 'bar',
      yaxis: 'y2',
      marker: { color: kpColors },
      hoverinfo: 'skip',
      width: 3 * 3600 * 1000
    });
  }

  // Density line
  traces.push({
    x: densityTimes,
    y: densityValues,
    type: 'scatter',
    mode: 'lines',
    line: { color: color, width: 2 },
    hovertemplate: '%{x|%d %b %Y}<br>%{y:.2e} kg/m³<extra></extra>'
  });

  const layout = {
    font: { family: 'system-ui, -apple-system, sans-serif', size: 10 },
    margin: { t: 5, r: 40, b: 25, l: 50 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    xaxis: {
      gridcolor: 'rgba(0,0,0,0.05)',
      range: [startDate, endDate]
    },
    yaxis: {
      type: 'log',
      gridcolor: 'rgba(0,0,0,0.05)',
      exponentformat: 'e'
    },
    yaxis2: {
      overlaying: 'y',
      side: 'right',
      range: [0, 1],
      showticklabels: false,
      showgrid: false,
      zeroline: false
    },
    showlegend: false,
    hovermode: 'x'
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: false
  });
}
