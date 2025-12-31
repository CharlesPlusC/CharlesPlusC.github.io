/**
 * TLE Density Inversion - Infographic Style Dashboard
 * Features: Overview cards, GitHub-style Activity Grid, All Satellites Comparison
 */

const SATELLITES = {
  '43476': { name: 'GRACE-FO-A', color: '#2563eb', order: 1 },
  '43877': { name: 'Kanopus-V 6', color: '#7c3aed', order: 2 },
  '39212': { name: 'CZ-4C DEB', color: '#db2777', order: 3 },
  '48714': { name: 'NOAA 17 DEB', color: '#059669', order: 4 },
  '64631': { name: 'CZ-6A DEB', color: '#d97706', order: 5 }
};

let allData = {};
let kpData = null;
let currentTab = 'overview';
let heatmapPeriod = 'month';

document.addEventListener('DOMContentLoaded', loadAllData);

// ===== Data Loading =====
async function loadAllData() {
  const status = document.getElementById('status');

  // Load satellite data
  for (const noradId of Object.keys(SATELLITES)) {
    try {
      const response = await fetch(`/data/density-${noradId}.json`);
      if (response.ok) allData[noradId] = await response.json();
    } catch (err) {
      console.error(`Failed to load ${noradId}:`, err);
    }
  }

  // Load Kp data
  try {
    const kpResponse = await fetch('/data/kp-index.json');
    if (kpResponse.ok) kpData = await kpResponse.json();
  } catch (err) {
    console.log('Kp data not available');
  }

  const loadedCount = Object.keys(allData).filter(id => allData[id]?.times?.length).length;

  if (loadedCount > 0) {
    status.classList.add('hidden');
    updateHeroStats();
    renderCards();
  } else {
    status.textContent = 'No data available';
    status.classList.add('error');
  }
}

// ===== Hero Stats =====
function updateHeroStats() {
  // Current Kp
  if (kpData && kpData.values && kpData.values.length > 0) {
    const latestKp = kpData.values[kpData.values.length - 1];
    document.getElementById('stat-kp').textContent = latestKp.toFixed(1);

    // Space weather status
    let activity = 'Quiet';
    if (latestKp >= 7) activity = 'Severe';
    else if (latestKp >= 5) activity = 'Storm';
    else if (latestKp >= 4) activity = 'Active';
    document.getElementById('stat-activity').textContent = activity;
  }
}

// ===== Tab Switching =====
function switchTab(tabName) {
  currentTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.viz-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-${tabName}`).classList.add('active');

  // Render chart for new tab
  setTimeout(() => {
    if (tabName === 'heatmap') renderActivityGrid();
    else if (tabName === 'compare') renderAllSatellitesComparison();
  }, 50);
}

window.switchTab = switchTab;

// ===== Heatmap Period Selector =====
function setHeatmapPeriod(period) {
  heatmapPeriod = period;

  // Update button states
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  renderActivityGrid();
}

window.setHeatmapPeriod = setHeatmapPeriod;

// ===== Card Rendering =====
function renderCards() {
  const container = document.getElementById('satellite-cards');
  container.innerHTML = '';

  // Create cards for each satellite
  Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([noradId, sat]) => {
      const data = allData[noradId];
      if (!data || !data.times || data.times.length === 0) return;

      const card = document.createElement('div');
      card.className = 'satellite-card';
      card.style.setProperty('--sat-color', sat.color);

      const lastPerigee = data.perigees[data.perigees.length - 1];
      const lastUpdate = new Date(data.times[data.times.length - 1]);
      const updateStr = lastUpdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      card.innerHTML = `
        <div class="card-gradient"></div>
        <div class="card-main" onclick="openDetail('${noradId}')">
          <div class="card-info">
            <div class="card-name">
              <span class="card-dot" style="background:${sat.color}; color:${sat.color}"></span>
              ${sat.name}
            </div>
            <div class="card-stats">
              <div class="card-stat">
                <span class="stat-label">Altitude</span>
                <span class="stat-value">${lastPerigee.toFixed(0)} km</span>
              </div>
              <div class="card-stat">
                <span class="stat-label">Updated</span>
                <span class="stat-value">${updateStr}</span>
              </div>
            </div>
          </div>
          <div class="card-sparkline" id="spark-${noradId}"></div>
          <button class="card-expand" onclick="event.stopPropagation(); openDetail('${noradId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>
      `;

      container.appendChild(card);

      // Render sparkline after card is in DOM
      setTimeout(() => renderSparkline(noradId, sat.color), 10);
    });
}

function renderSparkline(noradId, color) {
  const data = allData[noradId];
  const container = document.getElementById(`spark-${noradId}`);
  if (!container || !data) return;

  // Get last 6 months of data
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const times = data.times.map(t => new Date(t));
  const filteredIndices = times.map((t, i) => t >= sixMonthsAgo ? i : -1).filter(i => i >= 0);

  const filteredTimes = filteredIndices.map(i => times[i]);
  const filteredDensities = filteredIndices.map(i => data.densities[i]);

  const traces = [];

  // Kp background bars
  if (kpData && kpData.times) {
    const kpTimes = kpData.times.map(t => new Date(t.replace(' ', 'T') + 'Z'));
    const filteredKpIndices = kpTimes.map((t, i) => t >= sixMonthsAgo ? i : -1).filter(i => i >= 0);

    if (filteredKpIndices.length > 0) {
      const fKpTimes = filteredKpIndices.map(i => kpTimes[i]);
      const fKpValues = filteredKpIndices.map(i => kpData.values[i]);
      const kpColors = fKpValues.map(kp => {
        if (kp >= 7) return 'rgba(220, 38, 38, 0.5)';
        if (kp >= 5) return 'rgba(249, 115, 22, 0.5)';
        if (kp >= 4) return 'rgba(234, 179, 8, 0.45)';
        return 'rgba(34, 197, 94, 0.35)';
      });

      traces.push({
        x: fKpTimes,
        y: fKpValues,
        type: 'bar',
        yaxis: 'y2',
        marker: { color: kpColors },
        hoverinfo: 'skip',
        width: 3 * 3600 * 1000
      });
    }
  }

  // Density line (no fill for better Kp visibility)
  traces.push({
    x: filteredTimes,
    y: filteredDensities,
    type: 'scattergl',
    mode: 'lines',
    line: { color: color, width: 2 },
    hoverinfo: 'skip'
  });

  const layout = {
    margin: { t: 5, r: 5, b: 5, l: 5 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    xaxis: {
      showgrid: false,
      showticklabels: false,
      zeroline: false,
      fixedrange: true
    },
    yaxis: {
      showgrid: false,
      showticklabels: false,
      zeroline: false,
      type: 'log',
      fixedrange: true
    },
    yaxis2: {
      showgrid: false,
      showticklabels: false,
      zeroline: false,
      overlaying: 'y',
      range: [0, 9],
      fixedrange: true
    },
    showlegend: false,
    hovermode: false
  };

  Plotly.newPlot(container, traces, layout, {
    displayModeBar: false,
    staticPlot: true,
    responsive: true
  });
}

// ===== GitHub-style Activity Grid =====
function renderActivityGrid() {
  const container = document.getElementById('activity-grid');
  if (!container) return;

  container.innerHTML = '';

  // Calculate date range based on period
  const now = new Date();
  let startDate = new Date(now);
  let cellWidth, cellGap, numDays;

  switch (heatmapPeriod) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      numDays = 7;
      cellWidth = 40;
      cellGap = 4;
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      numDays = 365;
      cellWidth = 11;
      cellGap = 2;
      break;
    case 'month':
    default:
      startDate.setMonth(startDate.getMonth() - 1);
      numDays = 30;
      cellWidth = 18;
      cellGap = 3;
      break;
  }

  // Generate date array
  const dates = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Process each satellite
  Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([noradId, sat]) => {
      const data = allData[noradId];
      if (!data || !data.times) return;

      // Bin densities by day
      const dayBins = {};
      data.times.forEach((t, i) => {
        const dayKey = new Date(t).toISOString().split('T')[0];
        if (!dayBins[dayKey]) dayBins[dayKey] = [];
        dayBins[dayKey].push(data.densities[i]);
      });

      // Get min/max for normalization
      const allDensities = data.densities.filter(d => d > 0);
      const logMin = Math.log10(Math.min(...allDensities));
      const logMax = Math.log10(Math.max(...allDensities));

      // Create row
      const row = document.createElement('div');
      row.className = 'activity-row';

      const label = document.createElement('div');
      label.className = 'activity-label';
      label.textContent = sat.name;
      row.appendChild(label);

      const cells = document.createElement('div');
      cells.className = 'activity-cells';
      cells.style.gap = `${cellGap}px`;

      dates.forEach(date => {
        const cell = document.createElement('div');
        cell.className = 'activity-cell';
        cell.style.width = `${cellWidth}px`;
        cell.style.height = `${cellWidth}px`;

        let level = 0;
        if (dayBins[date] && dayBins[date].length > 0) {
          const avgDensity = dayBins[date].reduce((a, b) => a + b, 0) / dayBins[date].length;
          const logVal = Math.log10(avgDensity);
          const normalized = (logVal - logMin) / (logMax - logMin);

          if (normalized > 0.8) level = 4;
          else if (normalized > 0.6) level = 3;
          else if (normalized > 0.4) level = 2;
          else if (normalized > 0.2) level = 1;
          else level = 0;

          cell.title = `${date}\nDensity: ${avgDensity.toExponential(2)} kg/m³`;
        } else {
          cell.title = `${date}\nNo data`;
        }

        cell.setAttribute('data-level', level);
        cells.appendChild(cell);
      });

      row.appendChild(cells);
      container.appendChild(row);
    });

  // Update cell sizes in CSS dynamically
  const style = document.createElement('style');
  style.textContent = `
    .activity-cell {
      width: ${cellWidth}px !important;
      height: ${cellWidth}px !important;
    }
  `;
  container.appendChild(style);
}

// ===== All Satellites Comparison =====
function renderAllSatellitesComparison() {
  const container = document.getElementById('compare-chart');
  if (!container) return;

  // Get last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const traces = [];

  // Kp bars first (background)
  if (kpData && kpData.times) {
    const kpTimes = kpData.times.map(t => new Date(t.replace(' ', 'T') + 'Z'));
    const kpColors = kpData.values.map(kp => {
      if (kp >= 7) return 'rgba(220, 38, 38, 0.3)';
      if (kp >= 5) return 'rgba(249, 115, 22, 0.3)';
      if (kp >= 4) return 'rgba(234, 179, 8, 0.25)';
      return 'rgba(34, 197, 94, 0.2)';
    });

    traces.push({
      x: kpTimes,
      y: kpData.values,
      type: 'bar',
      name: 'Kp Index',
      yaxis: 'y2',
      marker: { color: kpColors },
      hovertemplate: 'Kp: %{y:.1f}<extra></extra>',
      width: 3 * 3600 * 1000
    });
  }

  // Add all satellites
  Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([noradId, sat]) => {
      const data = allData[noradId];
      if (!data || !data.times) return;

      traces.push({
        x: data.times.map(t => new Date(t)),
        y: data.densities,
        type: 'scattergl',
        mode: 'lines',
        name: sat.name,
        line: { color: sat.color, width: 2 },
        hovertemplate: `${sat.name}<br>%{x|%d %b %Y}<br>ρ = %{y:.2e}<extra></extra>`
      });
    });

  const layout = {
    font: { family: 'system-ui, sans-serif', size: 12 },
    margin: { t: 30, r: 60, b: 50, l: 80 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    xaxis: {
      gridcolor: 'rgba(0,0,0,0.05)',
      range: [sixMonthsAgo, now]
    },
    yaxis: {
      title: 'Density (kg/m³)',
      type: 'log',
      gridcolor: 'rgba(0,0,0,0.05)',
      exponentformat: 'e'
    },
    yaxis2: {
      title: 'Kp',
      overlaying: 'y',
      side: 'right',
      range: [0, 9],
      dtick: 3,
      gridcolor: 'transparent'
    },
    legend: {
      x: 0.5,
      xanchor: 'center',
      y: 1.12,
      orientation: 'h',
      bgcolor: 'rgba(255,255,255,0.9)'
    },
    hovermode: 'x unified'
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  });
}

// ===== Detail Modal =====
function openDetail(noradId) {
  const sat = SATELLITES[noradId];
  const data = allData[noradId];

  document.getElementById('detail-title').textContent = `${sat.name} (NORAD ${noradId})`;
  document.getElementById('detail-modal').classList.add('active');
  document.body.style.overflow = 'hidden';

  // Update detail stats
  const lastPerigee = data.perigees[data.perigees.length - 1];
  document.getElementById('detail-altitude').textContent = `${lastPerigee.toFixed(1)} km`;

  // Average density (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentDensities = data.times
    .map((t, i) => ({ time: new Date(t), density: data.densities[i] }))
    .filter(d => d.time >= thirtyDaysAgo)
    .map(d => d.density);

  if (recentDensities.length > 0) {
    const avgDensity = recentDensities.reduce((a, b) => a + b, 0) / recentDensities.length;
    document.getElementById('detail-density').textContent = avgDensity.toExponential(2);
  }

  // Decay rate (perigee change over last 30 days)
  const recentPerigees = data.times
    .map((t, i) => ({ time: new Date(t), perigee: data.perigees[i] }))
    .filter(d => d.time >= thirtyDaysAgo);

  if (recentPerigees.length >= 2) {
    const first = recentPerigees[0].perigee;
    const last = recentPerigees[recentPerigees.length - 1].perigee;
    const daysDiff = (recentPerigees[recentPerigees.length - 1].time - recentPerigees[0].time) / (1000 * 60 * 60 * 24);
    const decayRate = ((last - first) / daysDiff).toFixed(2);
    document.getElementById('detail-decay').textContent = `${decayRate} km/day`;
  }

  setTimeout(() => {
    renderDetailChart(noradId, sat.color, data);
    renderAltitudeChart(noradId, data);
  }, 50);
}

window.openDetail = openDetail;

function closeDetail() {
  document.getElementById('detail-modal').classList.remove('active');
  document.body.style.overflow = '';
}

window.closeDetail = closeDetail;

// Close on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetail();
});

// Close on backdrop click
document.getElementById('detail-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'detail-modal') closeDetail();
});

function renderDetailChart(noradId, color, data) {
  const container = document.getElementById('detail-chart');

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const times = data.times.map(t => new Date(t));
  const traces = [];

  // Kp bars
  if (kpData && kpData.times) {
    const kpTimes = kpData.times.map(t => new Date(t.replace(' ', 'T') + 'Z'));
    const kpColors = kpData.values.map(kp => {
      if (kp >= 7) return 'rgba(220, 38, 38, 0.5)';
      if (kp >= 5) return 'rgba(249, 115, 22, 0.5)';
      if (kp >= 4) return 'rgba(234, 179, 8, 0.4)';
      return 'rgba(34, 197, 94, 0.3)';
    });

    traces.push({
      x: kpTimes,
      y: kpData.values,
      type: 'bar',
      name: 'Kp Index',
      yaxis: 'y2',
      marker: { color: kpColors },
      hovertemplate: 'Kp: %{y:.1f}<extra></extra>',
      width: 3 * 3600 * 1000
    });
  }

  // Density scatter
  traces.push({
    x: times,
    y: data.densities,
    type: 'scattergl',
    mode: 'markers',
    name: 'Density',
    marker: { size: 6, color: color, opacity: 0.8 },
    hovertemplate: '%{x|%d %b %Y}<br>ρ = %{y:.2e} kg/m³<extra></extra>'
  });

  const layout = {
    font: { family: 'system-ui, sans-serif', size: 12 },
    margin: { t: 20, r: 60, b: 50, l: 80 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    xaxis: {
      gridcolor: 'rgba(0,0,0,0.05)',
      range: [sixMonthsAgo, now],
      rangeslider: { visible: true, thickness: 0.08 }
    },
    yaxis: {
      title: 'Density (kg/m³)',
      type: 'log',
      gridcolor: 'rgba(0,0,0,0.05)',
      exponentformat: 'e'
    },
    yaxis2: {
      title: 'Kp',
      overlaying: 'y',
      side: 'right',
      range: [0, 9],
      dtick: 3,
      gridcolor: 'transparent'
    },
    showlegend: false,
    hovermode: 'x unified'
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  });
}

function renderAltitudeChart(noradId, data) {
  const container = document.getElementById('detail-altitude-chart');

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const times = data.times.map(t => new Date(t));

  const traces = [
    {
      x: times,
      y: data.perigees,
      type: 'scattergl',
      mode: 'lines',
      name: 'Perigee',
      line: { color: '#f97316', width: 2 },
      hovertemplate: '%{x|%d %b}<br>Perigee: %{y:.0f} km<extra></extra>'
    },
    {
      x: times,
      y: data.apogees,
      type: 'scattergl',
      mode: 'lines',
      name: 'Apogee',
      line: { color: '#22c55e', width: 2 },
      hovertemplate: '%{x|%d %b}<br>Apogee: %{y:.0f} km<extra></extra>'
    }
  ];

  const layout = {
    font: { family: 'system-ui, sans-serif', size: 12 },
    margin: { t: 10, r: 20, b: 40, l: 80 },
    paper_bgcolor: '#f8fafc',
    plot_bgcolor: '#f8fafc',
    xaxis: {
      gridcolor: 'rgba(0,0,0,0.05)',
      range: [sixMonthsAgo, now]
    },
    yaxis: {
      title: 'Altitude (km)',
      gridcolor: 'rgba(0,0,0,0.05)'
    },
    showlegend: true,
    legend: { x: 1, xanchor: 'right', y: 1, orientation: 'h' },
    hovermode: 'x unified'
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: false
  });
}
