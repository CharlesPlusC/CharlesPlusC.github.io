/**
 * TLE Density Inversion - Minimal Dashboard
 * Activity Grid + All Satellites Chart
 */

// Satellites ordered by perigee altitude (lowest to highest) - fixed ordering
const SATELLITES = {
  '64631': { name: 'CZ-6A DEB', color: '#d97706', order: 1, flag: '🇨🇳', altitude: 367 },
  '48714': { name: 'NOAA 17 DEB', color: '#059669', order: 2, flag: '🇺🇸', altitude: 420 },
  '22': { name: 'Explorer 7', color: '#0ea5e9', order: 3, flag: '🇺🇸', altitude: 433 },
  '43476': { name: 'GRACE-FO-A', color: '#2563eb', order: 4, flag: '🇺🇸🇩🇪', altitude: 448 },
  '43877': { name: 'Kanopus-V 6', color: '#7c3aed', order: 5, flag: '🇷🇺', altitude: 456 },
  '62407': { name: 'Electron Kick Stage R/B', color: '#64748b', order: 6, flag: '🇳🇿', altitude: 462 },
  '54695': { name: 'Jilin-1 Gaofen 03D48', color: '#f43f5e', order: 7, flag: '🇨🇳', altitude: 468 },
  '54686': { name: 'Dongpo 08', color: '#14b8a6', order: 8, flag: '🇨🇳', altitude: 470 },
  '60012': { name: 'Object A', color: '#6366f1', order: 9, flag: '🇺🇳', altitude: 526 },
  '39212': { name: 'CZ-4C DEB', color: '#db2777', order: 10, flag: '🇨🇳', altitude: 596 }
};

let allData = {};
let kpData = null;
let heatmapPeriod = 'year';
let densityView = 'activity';
let unifiedYScale = false;  // Toggle for unified y-axis across all charts

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
  timeText.textContent = 'Kp current as of ' + kpTime.toLocaleString('en-US', {
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
  if (densityView === 'waves') {
    renderJoyDivisionPlot();
  }
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

function toggleUnifiedYScale() {
  unifiedYScale = !unifiedYScale;

  // Update button state
  const btn = document.getElementById('unified-scale-btn');
  if (btn) {
    btn.classList.toggle('active', unifiedYScale);
    btn.textContent = unifiedYScale ? 'Unified Y-Scale: On' : 'Unified Y-Scale: Off';
  }

  // Re-render satellite cards with new scale setting
  renderSatelliteCards();
}

window.toggleUnifiedYScale = toggleUnifiedYScale;

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

function getJoyDivisionWindow() {
  switch (heatmapPeriod) {
    case 'week':
      return { days: 7, label: '1 week window.' };
    case 'month':
      return { days: 30, label: '1 month window.' };
    case 'year':
    default:
      return { days: 365, label: '1 year window.' };
  }
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

function fillMissingValues(values) {
  const filled = values.slice();
  const isValid = value => value !== null && Number.isFinite(value);
  const firstIndex = filled.findIndex(isValid);

  if (firstIndex === -1) {
    return filled;
  }

  for (let i = 0; i < firstIndex; i++) {
    filled[i] = filled[firstIndex];
  }

  let lastIndex = firstIndex;
  let lastValue = filled[firstIndex];

  for (let i = firstIndex + 1; i < filled.length; i++) {
    const value = filled[i];
    if (!isValid(value)) continue;

    const gap = i - lastIndex;
    if (gap > 1) {
      const step = (value - lastValue) / gap;
      for (let j = 1; j < gap; j++) {
        filled[lastIndex + j] = lastValue + step * j;
      }
    }

    lastIndex = i;
    lastValue = value;
  }

  for (let i = lastIndex + 1; i < filled.length; i++) {
    filled[i] = lastValue;
  }

  return filled;
}

function normalizeSeries(values) {
  const valid = values.filter(v => v !== null && Number.isFinite(v));
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
  const windowConfig = getJoyDivisionWindow();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (windowConfig.days - 1));

  const entries = Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .filter(([noradId]) => allData[noradId]?.times?.length);

  if (entries.length === 0) {
    container.textContent = 'Loading density data...';
    return;
  }

  const windowLabel = document.getElementById('joy-division-window');
  if (windowLabel) {
    windowLabel.textContent = windowConfig.label;
  }

  const dates = buildDateRange(startDate, now);
  const spacing = 0.25;
  const amplitude = 0.85;
  const traces = [];
  const total = entries.length;

  const ridges = entries.map(([noradId], index) => {
    const data = allData[noradId];
    const daily = buildDailySeries(data, dates, startDate, now);
    const filled = fillMissingValues(daily);
    const normalized = normalizeSeries(filled);
    const offset = (total - index - 1) * spacing;
    const y = normalized.map(value => (value === null ? null : offset + value * amplitude));
    return { offset, y };
  });

  for (let i = 0; i < ridges.length; i++) {
    const ridge = ridges[i];
    const hasValues = ridge.y.some(value => value !== null && Number.isFinite(value));
    if (!hasValues) continue;

    traces.push({
      x: dates,
      y: dates.map(() => ridge.offset),
      mode: 'lines',
      line: { color: 'rgba(0,0,0,0)' },
      hoverinfo: 'skip',
      showlegend: false
    });

    traces.push({
      x: dates,
      y: ridge.y,
      mode: 'lines',
      line: {
        color: '#e2e8f0',
        width: 1.4,
        shape: 'spline',
        smoothing: 0.35
      },
      fill: 'tonexty',
      fillcolor: '#0b0f1a',
      connectgaps: true,
      hoverinfo: 'skip',
      showlegend: false
    });
  }

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

  // Compute global min/max for unified y-scale
  let globalMinDensity = Infinity;
  let globalMaxDensity = -Infinity;

  if (unifiedYScale) {
    Object.entries(SATELLITES).forEach(([noradId]) => {
      const data = allData[noradId];
      if (!data || !data.times || data.times.length === 0) return;

      for (let i = 0; i < data.times.length; i++) {
        const dt = new Date(data.times[i]);
        if (dt < sixMonthsAgo || dt > now) continue;
        const d = data.densities[i];
        if (d > 0) {
          globalMinDensity = Math.min(globalMinDensity, d);
          globalMaxDensity = Math.max(globalMaxDensity, d);
        }
      }
    });
  }

  const yAxisRange = unifiedYScale && globalMinDensity < Infinity
    ? [Math.log10(globalMinDensity * 0.8), Math.log10(globalMaxDensity * 1.2)]
    : null;

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
          <span class="card-name">
            ${sat.flag ? `<span class="card-flag">${sat.flag}</span>` : ''}
            ${sat.name}
          </span>
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
      setTimeout(() => renderCardChart(noradId, sat.color, data, sixMonthsAgo, now, yAxisRange), 10);
    });
}

function renderCardChart(noradId, color, data, startDate, endDate, yAxisRange = null) {
  const container = document.getElementById(`chart-${noradId}`);
  if (!container) return;

  const traces = [];

  // Get ALL density data (not filtered) for rangeslider to work properly
  const allDensityTimes = [];
  const allDensityValues = [];
  for (let i = 0; i < data.times.length; i++) {
    const dt = new Date(data.times[i]);
    if (Number.isNaN(dt.getTime())) continue;
    allDensityTimes.push(dt);
    allDensityValues.push(data.densities[i]);
  }

  // Kp background bands (full height, color indicates intensity)
  if (kpData && kpData.times) {
    const kpTimes = [];
    const kpValues = [];
    kpData.times.forEach((t, i) => {
      const dt = new Date(t.replace(' ', 'T') + 'Z');
      if (Number.isNaN(dt.getTime())) return;
      kpTimes.push(dt);
      kpValues.push(kpData.values[i]);
    });

    const kpColors = kpValues.map(kp => {
      // Kp index is already logarithmic, so linear mapping preserves that relationship
      // Map Kp (0-9) to grayscale alpha for consistent visual scaling
      const normalizedKp = Math.min(Math.max(kp, 0), 9) / 9;
      const alpha = 0.05 + 0.35 * normalizedKp;
      return `rgba(100, 100, 100, ${alpha.toFixed(3)})`;
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

  // Density line - use all data for rangeslider functionality
  traces.push({
    x: allDensityTimes,
    y: allDensityValues,
    type: 'scatter',
    mode: 'lines',
    line: { color: color, width: 2 },
    hovertemplate: '%{x|%d %b %Y %H:%M}<br><b>%{y:.2e}</b> kg/m³<extra></extra>'
  });

  const layout = {
    font: { family: 'system-ui, -apple-system, sans-serif', size: 10 },
    margin: { t: 5, r: 40, b: 45, l: 50 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    xaxis: {
      gridcolor: 'rgba(0,0,0,0.05)',
      range: [startDate, endDate],
      rangeslider: {
        visible: true,
        thickness: 0.08,
        bgcolor: '#f8fafc',
        bordercolor: '#e2e8f0',
        borderwidth: 1
      },
      // Spike line for crosshair cursor
      showspikes: true,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikecolor: '#64748b',
      spikethickness: 1,
      spikedash: 'dot'
    },
    yaxis: {
      type: 'log',
      gridcolor: 'rgba(0,0,0,0.05)',
      exponentformat: 'e',
      range: yAxisRange,  // Use unified range if provided
      // Spike line for crosshair cursor
      showspikes: true,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikecolor: '#64748b',
      spikethickness: 1,
      spikedash: 'dot'
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
    hovermode: 'x unified',  // Shows values at cursor position
    hoverlabel: {
      bgcolor: 'white',
      bordercolor: '#e2e8f0',
      font: { size: 11 }
    }
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: false
  });
}

/**
 * Real-Time Solar Wind Data from NOAA SWPC
 * Updates every 10 minutes
 */

const NOAA_MAG_URL = 'https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json';
const NOAA_PLASMA_URL = 'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json';
const AURORA_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

let auroraRefreshTimer = null;

async function loadAuroraData() {
  try {
    const [magResponse, plasmaResponse] = await Promise.all([
      fetch(NOAA_MAG_URL),
      fetch(NOAA_PLASMA_URL)
    ]);

    if (!magResponse.ok || !plasmaResponse.ok) {
      throw new Error('Failed to fetch NOAA data');
    }

    const magData = await magResponse.json();
    const plasmaData = await plasmaResponse.json();

    // Parse magnetic field data (skip header row)
    // Format: [time_tag, bx_gsm, by_gsm, bz_gsm, lon_gsm, lat_gsm, bt]
    const magRecords = magData.slice(1).map(row => ({
      time: new Date(row[0]),
      bx: parseFloat(row[1]),
      by: parseFloat(row[2]),
      bz: parseFloat(row[3]),
      bt: parseFloat(row[6])
    })).filter(r => !isNaN(r.bz) && !isNaN(r.bt));

    // Parse plasma data (skip header row)
    // Format: [time_tag, density, speed, temperature]
    const plasmaRecords = plasmaData.slice(1).map(row => ({
      time: new Date(row[0]),
      density: parseFloat(row[1]),
      speed: parseFloat(row[2]),
      temperature: parseFloat(row[3])
    })).filter(r => !isNaN(r.speed));

    updateAuroraDisplay(magRecords, plasmaRecords);
    renderBzChart(magRecords);

  } catch (err) {
    console.error('Failed to load aurora data:', err);
    document.getElementById('aurora-update-time').textContent = 'Data unavailable';
  }
}

function updateAuroraDisplay(magRecords, plasmaRecords) {
  // Get most recent valid values
  const latestMag = magRecords[magRecords.length - 1];
  const latestPlasma = plasmaRecords[plasmaRecords.length - 1];

  // Update Bt
  const btEl = document.getElementById('aurora-bt');
  if (btEl && latestMag) {
    btEl.textContent = latestMag.bt.toFixed(1);
  }

  // Update Bz with color coding
  const bzEl = document.getElementById('aurora-bz');
  const bzContainer = document.getElementById('bz-container');
  if (bzEl && bzContainer && latestMag) {
    const bz = latestMag.bz;
    bzEl.textContent = bz.toFixed(1);

    // Remove existing classes
    bzContainer.classList.remove('bz-positive', 'bz-negative', 'bz-strong-negative');

    // Color code based on Bz value
    // Negative Bz (southward) is favorable for aurora
    if (bz <= -10) {
      bzContainer.classList.add('bz-strong-negative');
    } else if (bz < 0) {
      bzContainer.classList.add('bz-negative');
    } else {
      bzContainer.classList.add('bz-positive');
    }
  }

  // Update Speed with color coding
  const speedEl = document.getElementById('aurora-speed');
  const speedContainer = speedEl?.closest('.aurora-metric');
  if (speedEl && latestPlasma) {
    const speed = latestPlasma.speed;
    speedEl.textContent = Math.round(speed);

    if (speedContainer) {
      speedContainer.classList.remove('speed-elevated', 'speed-high');
      if (speed >= 600) {
        speedContainer.classList.add('speed-high');
      } else if (speed >= 450) {
        speedContainer.classList.add('speed-elevated');
      }
    }
  }

  // Update Density
  const densityEl = document.getElementById('aurora-density');
  if (densityEl && latestPlasma) {
    densityEl.textContent = latestPlasma.density.toFixed(1);
  }

  // Update timestamp
  const updateEl = document.getElementById('aurora-update-time');
  if (updateEl && latestMag) {
    const updateTime = latestMag.time;
    updateEl.textContent = 'Updated ' + updateTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' • Refreshes every 10 min';
  }
}

function renderBzChart(magRecords) {
  const container = document.getElementById('bz-chart');
  if (!container || !window.Plotly) return;

  // Filter to last 24 hours
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recent = magRecords.filter(r => r.time >= twentyFourHoursAgo);

  if (recent.length === 0) return;

  const times = recent.map(r => r.time);
  const bzValues = recent.map(r => r.bz);

  const trace = {
    x: times,
    y: bzValues,
    type: 'scatter',
    mode: 'lines',
    fill: 'tozeroy',
    line: {
      color: 'rgba(148, 163, 184, 0.8)',
      width: 1.5
    },
    fillcolor: 'rgba(99, 102, 241, 0.15)',
    hovertemplate: '%{x|%H:%M}<br>Bz: %{y:.1f} nT<extra></extra>'
  };

  // Add a zero reference line
  const zeroLine = {
    x: [times[0], times[times.length - 1]],
    y: [0, 0],
    type: 'scatter',
    mode: 'lines',
    line: {
      color: 'rgba(148, 163, 184, 0.3)',
      width: 1,
      dash: 'dot'
    },
    hoverinfo: 'skip',
    showlegend: false
  };

  const layout = {
    margin: { t: 5, r: 10, b: 20, l: 35 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    xaxis: {
      showgrid: false,
      tickformat: '%H:%M',
      tickfont: { size: 9, color: 'rgba(148, 163, 184, 0.7)' },
      nticks: 6
    },
    yaxis: {
      showgrid: true,
      gridcolor: 'rgba(148, 163, 184, 0.1)',
      tickfont: { size: 9, color: 'rgba(148, 163, 184, 0.7)' },
      zeroline: false
    },
    showlegend: false,
    hovermode: 'x unified'
  };

  Plotly.newPlot(container, [zeroLine, trace], layout, {
    responsive: true,
    displayModeBar: false
  });
}

function startAuroraRefresh() {
  // Load immediately
  loadAuroraData();

  // Set up interval refresh
  if (auroraRefreshTimer) {
    clearInterval(auroraRefreshTimer);
  }
  auroraRefreshTimer = setInterval(loadAuroraData, AURORA_REFRESH_INTERVAL);
}

// Start aurora data loading when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  startAuroraRefresh();
});
