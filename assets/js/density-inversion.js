/**
 * TLE Density Inversion - Minimal Dashboard
 * Activity Grid + All Satellites Chart
 */

// Satellites ordered by perigee altitude (lowest to highest) - fixed ordering
// Note: CZ-6A DEB (64631) and NOAA 17 DEB (48714) removed - no longer in active TLE catalog (likely decayed)
const SATELLITES = {
  // Original satellites
  '22': { name: 'Explorer 7', color: '#0ea5e9', order: 1, flag: '🇺🇸', altitude: 433 },
  '43476': { name: 'GRACE-FO-A', color: '#2563eb', order: 2, flag: '🇺🇸🇩🇪', altitude: 448 },
  '43877': { name: 'Kanopus-V 6', color: '#7c3aed', order: 3, flag: '🇷🇺', altitude: 456 },
  '62407': { name: 'Electron Kick Stage R/B', color: '#64748b', order: 4, flag: '🇳🇿', altitude: 462 },
  '54695': { name: 'Jilin-1 Gaofen 03D48', color: '#f43f5e', order: 5, flag: '🇨🇳', altitude: 468 },
  '54686': { name: 'Dongpo 08', color: '#14b8a6', order: 6, flag: '🇨🇳', altitude: 470 },
  '60012': { name: 'Object A', color: '#6366f1', order: 7, flag: '🇺🇳', altitude: 526 },
  '39212': { name: 'CZ-4C DEB', color: '#db2777', order: 8, flag: '🇨🇳', altitude: 596 },
  // New debris objects (350-650 km altitude spread)
  '50058': { name: 'COSMOS 1408 DEB (50058)', color: '#ef4444', order: 9, flag: '🇷🇺', altitude: 355 },
  '50621': { name: 'COSMOS 1408 DEB (50621)', color: '#f97316', order: 10, flag: '🇷🇺', altitude: 370 },
  '34488': { name: 'IRIDIUM 33 DEB (34488)', color: '#f59e0b', order: 11, flag: '🇺🇸', altitude: 385 },
  '34693': { name: 'IRIDIUM 33 DEB (34693)', color: '#eab308', order: 12, flag: '🇺🇸', altitude: 390 },
  '33815': { name: 'COSMOS 2251 DEB (33815)', color: '#84cc16', order: 13, flag: '🇷🇺', altitude: 400 },
  '33821': { name: 'COSMOS 2251 DEB (33821)', color: '#22c55e', order: 14, flag: '🇷🇺', altitude: 415 },
  '50404': { name: 'COSMOS 1408 DEB (50404)', color: '#10b981', order: 15, flag: '🇷🇺', altitude: 428 },
  '33818': { name: 'COSMOS 2251 DEB (33818)', color: '#14b8a6', order: 16, flag: '🇷🇺', altitude: 438 },
  '35622': { name: 'IRIDIUM 33 DEB (35622)', color: '#06b6d4', order: 17, flag: '🇺🇸', altitude: 450 },
  '40996': { name: 'IRIDIUM 33 DEB (40996)', color: '#0891b2', order: 18, flag: '🇺🇸', altitude: 465 },
  '34088': { name: 'IRIDIUM 33 DEB (34088)', color: '#0284c7', order: 19, flag: '🇺🇸', altitude: 475 },
  '33960': { name: 'IRIDIUM 33 DEB (33960)', color: '#2563eb', order: 20, flag: '🇺🇸', altitude: 487 },
  '33799': { name: 'COSMOS 2251 DEB (33799)', color: '#4f46e5', order: 21, flag: '🇷🇺', altitude: 502 },
  '35744': { name: 'IRIDIUM 33 DEB (35744)', color: '#7c3aed', order: 22, flag: '🇺🇸', altitude: 518 },
  '33860': { name: 'IRIDIUM 33 DEB (33860)', color: '#9333ea', order: 23, flag: '🇺🇸', altitude: 527 },
  '34077': { name: 'IRIDIUM 33 DEB (34077)', color: '#a855f7', order: 24, flag: '🇺🇸', altitude: 532 },
  '34652': { name: 'IRIDIUM 33 DEB (34652)', color: '#c026d3', order: 25, flag: '🇺🇸', altitude: 542 },
  '33881': { name: 'IRIDIUM 33 DEB (33881)', color: '#db2777', order: 26, flag: '🇺🇸', altitude: 553 },
  '34366': { name: 'IRIDIUM 33 DEB (34366)', color: '#e11d48', order: 27, flag: '🇺🇸', altitude: 560 },
  '35051': { name: 'IRIDIUM 33 DEB (35051)', color: '#be123c', order: 28, flag: '🇺🇸', altitude: 575 },
  '33773': { name: 'IRIDIUM 33 DEB (33773)', color: '#9f1239', order: 29, flag: '🇺🇸', altitude: 588 },
  '35620': { name: 'IRIDIUM 33 DEB (35620)', color: '#881337', order: 30, flag: '🇺🇸', altitude: 598 },
  '33776': { name: 'IRIDIUM 33 DEB (33776)', color: '#71717a', order: 31, flag: '🇺🇸', altitude: 602 },
  '38228': { name: 'IRIDIUM 33 DEB (38228)', color: '#525252', order: 32, flag: '🇺🇸', altitude: 628 },
  '35680': { name: 'IRIDIUM 33 DEB (35680)', color: '#44403c', order: 33, flag: '🇺🇸', altitude: 642 }
};

let allData = {};
let kpData = null;
let heatmapPeriod = 'year';
let densityView = 'waves';

document.addEventListener('DOMContentLoaded', () => {
  setDensityView('waves');
  loadAllData();
});

async function loadAllData() {
  const status = document.getElementById('status');

  // Load all satellite data in PARALLEL for speed
  const satellitePromises = Object.keys(SATELLITES).map(async (noradId) => {
    try {
      const response = await fetch(`/data/density-${noradId}.json`);
      if (response.ok) {
        allData[noradId] = await response.json();
      }
    } catch (err) {
      console.error(`Failed to load ${noradId}:`, err);
    }
  });

  // Load Kp data in parallel with satellite data
  const kpPromise = fetch('/data/kp-index.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => { kpData = data; })
    .catch(() => console.log('Kp data not available'));

  // Wait for all to complete
  await Promise.all([...satellitePromises, kpPromise]);

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
    // Always render Joy Division plot since it's the default view
    // and needs kpData which is now loaded
    renderJoyDivisionPlot();
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

  // Prefer estimated Kp (near real-time) over official 3-hourly Kp
  if (estimatedKp && estimatedKp.value !== undefined) {
    const kpValue = estimatedKp.value;
    const descriptor = getKpDescriptor(kpValue);
    const kpTime = estimatedKp.time;

    banner.setAttribute('data-level', descriptor.level);
    statusText.textContent = `${descriptor.label} Conditions`;
    kpChip.textContent = `Kp ${kpValue.toFixed(1)}`;
    kpChip.title = 'Estimated Kp (1-minute resolution)';
    timeText.textContent = 'Est. Kp as of ' + kpTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return;
  }

  // Fall back to official 3-hourly Kp if estimated not available
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
  kpChip.title = 'Official 3-hourly Kp';
  timeText.textContent = 'Kp as of ' + kpTime.toLocaleString('en-US', {
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


function getVisibleSatellites() {
  // Returns all satellite entries sorted by order
  return Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order);
}

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

  // Use DocumentFragment for batch DOM operations
  const fragment = document.createDocumentFragment();

  // Render satellite rows (filtered by visibility toggle)
  getVisibleSatellites().forEach(([noradId, sat]) => {
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
      fragment.appendChild(row);
    });

  // Append all satellite rows at once
  container.appendChild(fragment);

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

function renderJoyDivisionKpBar(startDate, endDate, numDays) {
  const container = document.getElementById('joy-division-kp');
  console.log('renderJoyDivisionKpBar called:', {
    hasContainer: !!container,
    hasKpData: !!kpData,
    kpTimesLength: kpData?.times?.length,
    numDays
  });
  if (!container || !kpData || !kpData.times || !kpData.values) {
    console.log('Early return - missing data');
    if (container) container.innerHTML = '';
    return;
  }

  // Build date strings for the range (same approach as activity grid)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dateStrings = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dateStrings.push(d.toISOString().split('T')[0]);
  }

  // Bin Kp values by day using simple string keys (no timezone issues)
  const kpByDay = {};
  kpData.times.forEach((t, i) => {
    const dayKey = t.split(' ')[0];  // "2025-01-01 00:00:00.000" -> "2025-01-01"
    if (!kpByDay[dayKey]) kpByDay[dayKey] = [];
    if (kpData.values[i] !== null) {
      kpByDay[dayKey].push(kpData.values[i]);
    }
  });

  // Generate cells for each day
  const cells = dateStrings.map(dateStr => {
    const dayKp = kpByDay[dateStr];
    let level = 0;
    let maxKp = 0;

    if (dayKp && dayKp.length > 0) {
      maxKp = Math.max(...dayKp);
      if (maxKp >= 7) level = 4;
      else if (maxKp >= 5) level = 3;
      else if (maxKp >= 4) level = 2;
      else if (maxKp >= 1) level = 1;
    }

    return { dateStr, kp: maxKp, level };
  });

  console.log('Kp bar cells generated:', cells.length, 'cells with Kp data:', cells.filter(c => c.kp > 0).length);

  const cellsHtml = cells.map(cell => {
    return `<div class="joy-division-kp-cell" data-level="${cell.level}" title="${cell.dateStr}: Kp ${cell.kp.toFixed(1)}"></div>`;
  }).join('');

  container.innerHTML = `
    <span class="joy-division-kp-label">Kp Index</span>
    <div class="joy-division-kp-cells">${cellsHtml}</div>
  `;
  console.log('Kp bar innerHTML set, container children:', container.children.length);
}

function renderJoyDivisionPlot() {
  const container = document.getElementById('joy-division-plot');
  if (!container) return;

  const now = new Date();
  const windowConfig = getJoyDivisionWindow();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (windowConfig.days - 1));

  const entries = getVisibleSatellites()
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

  // Render Kp bar at the bottom (3-hourly for week/month, daily for year)
  renderJoyDivisionKpBar(startDate, now, windowConfig.days);

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

// Combined density plot - all satellites on one chart, colored by altitude
function renderCombinedDensityPlot() {
  const container = document.getElementById('combined-density-plot');
  if (!container) return;

  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Get visible satellites sorted by altitude
  const visibleSatellites = getVisibleSatellites()
    .filter(([noradId]) => allData[noradId]?.times?.length > 0)
    .sort((a, b) => a[1].altitude - b[1].altitude);

  if (visibleSatellites.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#64748b;">Loading density data...</p>';
    return;
  }

  const traces = [];

  // Add Kp background if available
  if (kpData && kpData.times) {
    const kpTimes = [];
    const kpValues = [];
    kpData.times.forEach((t, i) => {
      const dt = new Date(t.replace(' ', 'T') + 'Z');
      if (Number.isNaN(dt.getTime()) || dt < twoMonthsAgo || dt > now) return;
      kpTimes.push(dt);
      kpValues.push(kpData.values[i]);
    });

    const kpColors = kpValues.map(kp => {
      const normalizedKp = Math.min(Math.max(kp, 0), 9) / 9;
      const alpha = 0.03 + 0.15 * normalizedKp;
      return `rgba(100, 100, 100, ${alpha.toFixed(3)})`;
    });

    traces.push({
      x: kpTimes,
      y: kpValues.map(() => 1),
      type: 'bar',
      yaxis: 'y2',
      marker: { color: kpColors },
      hoverinfo: 'skip',
      width: 3 * 3600 * 1000,
      showlegend: false
    });
  }

  // Add each satellite as a trace, colored by altitude
  visibleSatellites.forEach(([noradId, sat]) => {
    const data = allData[noradId];
    const altitude = sat.altitude;
    const color = altitudeToColor(altitude);

    // Filter data to time range
    const times = [];
    const densities = [];
    for (let i = 0; i < data.times.length; i++) {
      const dt = new Date(data.times[i]);
      if (dt >= twoMonthsAgo && dt <= now) {
        times.push(dt);
        densities.push(data.densities[i]);
      }
    }

    if (times.length === 0) return;

    traces.push({
      x: times,
      y: densities,
      type: 'scatter',
      mode: 'lines',
      name: `${sat.name} (${altitude} km)`,
      line: { color: color, width: 1.5 },
      opacity: 0.8,
      hovertemplate: `<b>${sat.name}</b><br>Alt: ${altitude} km<br>%{x|%d %b %Y}<br>Density: %{y:.2e} kg/m³<extra></extra>`
    });
  });

  // Create colorbar trace (invisible scatter with colorscale)
  const altitudes = visibleSatellites.map(([, sat]) => sat.altitude);
  traces.push({
    x: [null],
    y: [null],
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 0,
      color: [ALT_MIN, ALT_MAX],
      colorscale: [
        [0, 'rgb(68, 1, 84)'],
        [0.2, 'rgb(72, 40, 120)'],
        [0.4, 'rgb(49, 104, 142)'],
        [0.5, 'rgb(38, 130, 142)'],
        [0.6, 'rgb(31, 158, 137)'],
        [0.8, 'rgb(109, 205, 89)'],
        [1, 'rgb(253, 231, 37)']
      ],
      colorbar: {
        title: { text: 'Altitude (km)', side: 'right' },
        tickvals: [350, 400, 450, 500, 550, 600, 650],
        len: 0.8,
        thickness: 15,
        x: 1.02
      },
      showscale: true
    },
    showlegend: false,
    hoverinfo: 'skip'
  });

  const layout = {
    font: { family: 'system-ui, -apple-system, sans-serif', size: 11 },
    margin: { t: 20, r: 80, b: 60, l: 60 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    xaxis: {
      gridcolor: 'rgba(0,0,0,0.05)',
      title: { text: 'Date', standoff: 10 },
      range: [twoMonthsAgo, now],
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
      title: { text: 'Density (kg/m³)', standoff: 5 },
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
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: 'white',
      bordercolor: '#e2e8f0',
      font: { size: 11 }
    }
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  });
}

// Keep old function name for compatibility but redirect
function renderSatelliteCards() {
  renderCombinedDensityPlot();
}


/**
 * Real-Time Solar Wind & Kp Data from NOAA SWPC
 * Updates every 10 minutes
 */

const NOAA_MAG_URL = 'https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json';
const NOAA_PLASMA_URL = 'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json';
const NOAA_KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
const NOAA_KP_ESTIMATED_URL = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
const REALTIME_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

let realtimeRefreshTimer = null;
let estimatedKp = null;  // Store latest estimated Kp for banner display

async function loadRealtimeData() {
  try {
    const [magResponse, plasmaResponse, kpResponse, kpEstResponse] = await Promise.all([
      fetch(NOAA_MAG_URL),
      fetch(NOAA_PLASMA_URL),
      fetch(NOAA_KP_URL),
      fetch(NOAA_KP_ESTIMATED_URL)
    ]);

    if (!magResponse.ok || !plasmaResponse.ok) {
      throw new Error('Failed to fetch NOAA solar wind data');
    }

    const magData = await magResponse.json();
    const plasmaData = await plasmaResponse.json();

    // Process estimated Kp (1-minute resolution, near real-time)
    if (kpEstResponse.ok) {
      const kpEstJson = await kpEstResponse.json();
      updateEstimatedKp(kpEstJson);
    }

    // Process official 3-hourly Kp data for historical charts
    if (kpResponse.ok) {
      const kpJson = await kpResponse.json();
      updateRealtimeKp(kpJson);
    }

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
    console.error('Failed to load realtime data:', err);
    document.getElementById('aurora-update-time').textContent = 'Data unavailable';
  }
}

function updateEstimatedKp(kpEstJson) {
  // Estimated Kp format: [{time_tag, kp_index, estimated_kp, kp}, ...]
  // Get the most recent entry
  if (!kpEstJson || kpEstJson.length === 0) return;

  const latest = kpEstJson[kpEstJson.length - 1];
  if (!latest || latest.estimated_kp === undefined) return;

  estimatedKp = {
    time: new Date(latest.time_tag),
    value: latest.estimated_kp,
    kpIndex: latest.kp_index
  };

  // Update space weather banner with estimated Kp
  updateSpaceWeatherIndicator();

  console.log(`Estimated Kp: ${estimatedKp.value.toFixed(2)} at ${estimatedKp.time.toISOString()}`);
}

function updateRealtimeKp(kpJson) {
  // NOAA Kp format: [["time_tag", "Kp", "a_running", "station_count"], [...], ...]
  // Skip header row
  const kpRecords = kpJson.slice(1).map(row => ({
    time: row[0],  // "YYYY-MM-DD HH:MM:SS.000"
    kp: parseFloat(row[1])
  })).filter(r => !isNaN(r.kp));

  if (kpRecords.length === 0) return;

  // Merge with existing kpData or create new
  if (!kpData) {
    kpData = { times: [], values: [], source: 'NOAA SWPC' };
  }

  // Convert existing times to Set for deduplication
  const existingTimes = new Set(kpData.times);

  // Add new Kp records
  let addedCount = 0;
  kpRecords.forEach(record => {
    // Normalize time format to match GFZ format
    const timeStr = record.time.replace('T', ' ').slice(0, 23);
    if (!existingTimes.has(timeStr)) {
      kpData.times.push(timeStr);
      kpData.values.push(record.kp);
      existingTimes.add(timeStr);
      addedCount++;
    }
  });

  // Sort by time
  if (addedCount > 0) {
    const combined = kpData.times.map((t, i) => ({ t, v: kpData.values[i] }));
    combined.sort((a, b) => a.t.localeCompare(b.t));
    kpData.times = combined.map(x => x.t);
    kpData.values = combined.map(x => x.v);

    console.log(`Added ${addedCount} new Kp values from NOAA (total: ${kpData.times.length})`);

    // Re-render plots that show Kp data
    if (densityView === 'waves') {
      renderJoyDivisionPlot();
    }
    renderCombinedDensityPlot();
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

function startRealtimeRefresh() {
  // Load immediately (solar wind + Kp)
  loadRealtimeData();

  // Set up interval refresh
  if (realtimeRefreshTimer) {
    clearInterval(realtimeRefreshTimer);
  }
  realtimeRefreshTimer = setInterval(loadRealtimeData, REALTIME_REFRESH_INTERVAL);
}

// Start realtime data loading (solar wind + Kp) when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  startRealtimeRefresh();
});

// Altitude-based color mapping (350-650 km range)
const ALT_MIN = 350;
const ALT_MAX = 650;

function altitudeToColor(altitude) {
  // Normalize altitude to 0-1 range
  const t = Math.max(0, Math.min(1, (altitude - ALT_MIN) / (ALT_MAX - ALT_MIN)));

  // Viridis-like colorscale: purple -> blue -> teal -> green -> yellow
  const colors = [
    [68, 1, 84],      // 0.0 - dark purple
    [72, 40, 120],    // 0.2 - purple
    [62, 74, 137],    // 0.3 - blue-purple
    [49, 104, 142],   // 0.4 - blue
    [38, 130, 142],   // 0.5 - teal
    [31, 158, 137],   // 0.6 - teal-green
    [53, 183, 121],   // 0.7 - green
    [109, 205, 89],   // 0.8 - yellow-green
    [180, 222, 44],   // 0.9 - yellow
    [253, 231, 37]    // 1.0 - bright yellow
  ];

  const idx = t * (colors.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.min(lower + 1, colors.length - 1);
  const blend = idx - lower;

  const r = Math.round(colors[lower][0] + blend * (colors[upper][0] - colors[lower][0]));
  const g = Math.round(colors[lower][1] + blend * (colors[upper][1] - colors[lower][1]));
  const b = Math.round(colors[lower][2] + blend * (colors[upper][2] - colors[lower][2]));

  return `rgb(${r},${g},${b})`;
}
