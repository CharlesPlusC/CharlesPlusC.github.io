/**
 * TLE Density Inversion - Simple Dashboard
 * Single page: Stats, Activity Grid, All Satellites Chart
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
let heatmapPeriod = 'month';

document.addEventListener('DOMContentLoaded', loadAllData);

async function loadAllData() {
  const status = document.getElementById('status');

  // Load satellite data
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

  // Load Kp data
  try {
    const kpResponse = await fetch('/data/kp-index.json');
    if (kpResponse.ok) {
      kpData = await kpResponse.json();
    }
  } catch (err) {
    console.log('Kp data not available');
  }

  const loadedCount = Object.keys(allData).filter(id => allData[id]?.times?.length).length;

  if (loadedCount > 0) {
    status.classList.add('hidden');
    updateStats();
    renderActivityGrid();
    renderComparisonChart();
  } else {
    status.textContent = 'No data available';
    status.classList.add('error');
  }
}

function updateStats() {
  if (kpData && kpData.values && kpData.values.length > 0) {
    const latestKp = kpData.values[kpData.values.length - 1];
    document.getElementById('stat-kp').textContent = latestKp.toFixed(1);

    let activity = 'Quiet';
    if (latestKp >= 7) activity = 'Severe';
    else if (latestKp >= 5) activity = 'Storm';
    else if (latestKp >= 4) activity = 'Active';
    document.getElementById('stat-activity').textContent = activity;
  }
}

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

function renderActivityGrid() {
  const container = document.getElementById('activity-grid');
  if (!container) return;

  container.innerHTML = '';

  // Calculate date range based on period
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let numDays;
  switch (heatmapPeriod) {
    case 'week':
      numDays = 7;
      break;
    case 'year':
      numDays = 365;
      break;
    case 'month':
    default:
      numDays = 30;
      break;
  }

  // Generate date array (from oldest to newest)
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Process each satellite
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

      // Get min/max for normalization (use all data for consistent scale)
      const allDensities = data.densities.filter(d => d > 0);
      if (allDensities.length === 0) return;

      const logMin = Math.log10(Math.min(...allDensities));
      const logMax = Math.log10(Math.max(...allDensities));
      const logRange = logMax - logMin;

      // Create row
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
          else level = 1; // Show at least level 1 if we have data

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
}

function renderComparisonChart() {
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
        hovertemplate: `${sat.name}<br>%{x|%d %b %Y}<br>Density: %{y:.2e}<extra></extra>`
      });
    });

  const layout = {
    font: { family: 'system-ui, -apple-system, sans-serif', size: 12 },
    margin: { t: 20, r: 50, b: 40, l: 70 },
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
      y: 1.1,
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
