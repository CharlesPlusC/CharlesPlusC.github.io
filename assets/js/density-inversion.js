/**
 * TLE Density Inversion Visualization
 * Professional charts with Kp index overlay
 */

const SATELLITES = {
  '39212': {
    name: 'CZ-4C DEB',
    noradId: 39212,
    cd: 2.2,
    area: 1.0,
    mass: 50.0,
    color: '#2563eb'
  },
  '48714': {
    name: 'NOAA 17 DEB',
    noradId: 48714,
    cd: 2.2,
    area: 0.5,
    mass: 25.0,
    color: '#7c3aed'
  },
  '64631': {
    name: 'CZ-6A DEB',
    noradId: 64631,
    cd: 2.2,
    area: 1.0,
    mass: 50.0,
    color: '#db2777'
  }
};

let currentSatellite = null;
let allData = {};
let kpData = null;

// Chart styling constants
const CHART_FONT = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
const GRID_COLOR = 'rgba(0,0,0,0.06)';
const AXIS_COLOR = '#64748b';

document.addEventListener('DOMContentLoaded', function() {
  generateSatelliteButtons();
  loadAllData();
});

function generateSatelliteButtons() {
  const container = document.getElementById('satellite-buttons');
  container.innerHTML = '';

  Object.entries(SATELLITES).forEach(([noradId, sat], index) => {
    const btn = document.createElement('button');
    btn.className = 'sat-btn' + (index === 0 ? ' active' : '');
    btn.setAttribute('data-norad', noradId);
    btn.innerHTML = `<span class="sat-dot" style="background:${sat.color}"></span>${sat.name}`;
    btn.onclick = () => selectSatellite(noradId);
    container.appendChild(btn);
  });
}

async function loadAllData() {
  const status = document.getElementById('status');
  status.textContent = 'Loading data...';
  status.classList.remove('hidden', 'error');

  // Load satellite data
  for (const noradId of Object.keys(SATELLITES)) {
    try {
      const response = await fetch(`/data/density-${noradId}.json`);
      if (response.ok) {
        allData[noradId] = await response.json();
      }
    } catch (err) {
      console.error(`Failed to load data for ${noradId}:`, err);
    }
  }

  // Load Kp data
  try {
    const kpResponse = await fetch('/data/kp-index.json');
    if (kpResponse.ok) {
      kpData = await kpResponse.json();
    }
  } catch (err) {
    console.log('Kp data not available, fetching from NOAA...');
    await fetchKpFromNOAA();
  }

  const loadedCount = Object.keys(allData).filter(id => allData[id]).length;
  if (loadedCount > 0) {
    status.classList.add('hidden');
    const firstWithData = Object.keys(SATELLITES).find(id => allData[id]);
    if (firstWithData) selectSatellite(firstWithData);
  } else {
    status.textContent = 'No data available';
    status.classList.add('error');
  }
}

async function fetchKpFromNOAA() {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    if (response.ok) {
      const data = await response.json();
      kpData = {
        times: data.slice(1).map(d => d[0]),
        values: data.slice(1).map(d => parseFloat(d[1]))
      };
    }
  } catch (err) {
    console.error('Failed to fetch Kp data:', err);
  }
}

function selectSatellite(noradId) {
  currentSatellite = noradId;

  document.querySelectorAll('.sat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-norad') === noradId);
  });

  updateInfoPanel(noradId);

  if (allData[noradId]) {
    renderCharts(noradId);
  }
}

function updateInfoPanel(noradId) {
  const sat = SATELLITES[noradId];
  const data = allData[noradId];

  document.getElementById('info-norad').textContent = noradId;
  document.getElementById('info-name').textContent = sat.name;

  if (data && data.times && data.times.length > 0) {
    const lastPerigee = data.perigees[data.perigees.length - 1];
    document.getElementById('info-perigee').textContent = `${lastPerigee.toFixed(0)} km`;
    document.getElementById('info-points').textContent = data.times.length.toLocaleString();

    const startDate = new Date(data.times[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const endDate = new Date(data.times[data.times.length - 1]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('info-range').textContent = `${startDate} — ${endDate}`;
  }
}

function renderCharts(noradId) {
  const sat = SATELLITES[noradId];
  const data = allData[noradId];

  if (!data || !data.times || data.times.length === 0) return;

  const times = data.times.map(t => new Date(t));
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Common layout settings
  const commonLayout = {
    font: { family: CHART_FONT, size: 12 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    margin: { t: 50, r: 80, b: 50, l: 70 },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: 'white',
      bordercolor: '#e2e8f0',
      font: { family: CHART_FONT, size: 12 }
    }
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d']
  };

  // === DENSITY CHART ===
  const traces = [];

  // Main density trace
  traces.push({
    x: times,
    y: data.densities,
    type: 'scattergl',
    mode: 'markers',
    name: 'Density',
    marker: {
      size: 5,
      color: sat.color,
      opacity: 0.8
    },
    hovertemplate: '<b>%{x|%d %b %Y %H:%M}</b><br>ρ = %{y:.2e} kg/m³<extra></extra>'
  });

  // Kp index as bar chart on secondary axis
  if (kpData && kpData.times && kpData.times.length > 0) {
    const kpTimes = kpData.times.map(t => new Date(t.replace(' ', 'T') + 'Z'));
    const kpColors = kpData.values.map(kp => {
      if (kp >= 7) return 'rgba(220, 38, 38, 0.6)';      // Red - severe
      if (kp >= 5) return 'rgba(249, 115, 22, 0.6)';     // Orange - storm
      if (kp >= 4) return 'rgba(234, 179, 8, 0.5)';      // Yellow - active
      return 'rgba(34, 197, 94, 0.4)';                    // Green - quiet
    });

    traces.push({
      x: kpTimes,
      y: kpData.values,
      type: 'bar',
      name: 'Kp Index',
      yaxis: 'y2',
      marker: { color: kpColors },
      opacity: 0.7,
      hovertemplate: '<b>Kp = %{y:.1f}</b><extra></extra>',
      width: 3 * 3600 * 1000 // 3 hours in ms
    });
  }

  const densityLayout = {
    ...commonLayout,
    title: {
      text: '<b>Orbit-Effective Atmospheric Density</b>',
      font: { size: 15, color: '#1e293b' },
      x: 0,
      xanchor: 'left'
    },
    xaxis: {
      title: { text: '', standoff: 10 },
      gridcolor: GRID_COLOR,
      linecolor: '#e2e8f0',
      tickfont: { color: AXIS_COLOR },
      range: [sixMonthsAgo, now],
      rangeslider: {
        visible: true,
        thickness: 0.06,
        bgcolor: '#f8fafc',
        bordercolor: '#e2e8f0'
      },
      rangeselector: {
        buttons: [
          { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
          { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
          { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
          { step: 'all', label: 'All' }
        ],
        font: { size: 11 },
        bgcolor: '#f8fafc',
        activecolor: '#e2e8f0',
        x: 0,
        y: 1.12
      }
    },
    yaxis: {
      title: { text: 'Density (kg/m³)', font: { color: sat.color }, standoff: 10 },
      type: 'log',
      gridcolor: GRID_COLOR,
      linecolor: '#e2e8f0',
      tickfont: { color: AXIS_COLOR },
      exponentformat: 'e',
      showgrid: true
    },
    yaxis2: {
      title: { text: 'Kp Index', font: { color: '#64748b' }, standoff: 5 },
      overlaying: 'y',
      side: 'right',
      range: [0, 9],
      gridcolor: 'transparent',
      tickfont: { color: '#64748b' },
      dtick: 3
    },
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1.12,
      orientation: 'h',
      bgcolor: 'rgba(255,255,255,0.9)',
      font: { size: 11 }
    },
    shapes: kpData ? [
      // Storm threshold line at Kp=5
      {
        type: 'line',
        xref: 'paper',
        yref: 'y2',
        x0: 0, x1: 1,
        y0: 5, y1: 5,
        line: { color: 'rgba(249, 115, 22, 0.5)', width: 1, dash: 'dot' }
      }
    ] : []
  };

  Plotly.newPlot('density-chart', traces, densityLayout, config);

  // === ALTITUDE CHART ===
  const perigeeTrace = {
    x: times,
    y: data.perigees,
    type: 'scattergl',
    mode: 'lines+markers',
    name: 'Perigee',
    line: { color: '#f97316', width: 1.5 },
    marker: { size: 4, color: '#f97316' },
    hovertemplate: '<b>%{x|%d %b %Y}</b><br>Perigee: %{y:.1f} km<extra></extra>'
  };

  const apogeeTrace = {
    x: times,
    y: data.apogees,
    type: 'scattergl',
    mode: 'lines+markers',
    name: 'Apogee',
    line: { color: '#22c55e', width: 1.5 },
    marker: { size: 4, color: '#22c55e' },
    hovertemplate: '<b>%{x|%d %b %Y}</b><br>Apogee: %{y:.1f} km<extra></extra>'
  };

  const altitudeLayout = {
    ...commonLayout,
    title: {
      text: '<b>Orbital Altitude History</b>',
      font: { size: 15, color: '#1e293b' },
      x: 0,
      xanchor: 'left'
    },
    xaxis: {
      title: { text: '', standoff: 10 },
      gridcolor: GRID_COLOR,
      linecolor: '#e2e8f0',
      tickfont: { color: AXIS_COLOR },
      range: [sixMonthsAgo, now],
      rangeslider: {
        visible: true,
        thickness: 0.06,
        bgcolor: '#f8fafc',
        bordercolor: '#e2e8f0'
      },
      rangeselector: {
        buttons: [
          { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
          { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
          { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
          { step: 'all', label: 'All' }
        ],
        font: { size: 11 },
        bgcolor: '#f8fafc',
        activecolor: '#e2e8f0',
        x: 0,
        y: 1.12
      }
    },
    yaxis: {
      title: { text: 'Altitude (km)', standoff: 10 },
      gridcolor: GRID_COLOR,
      linecolor: '#e2e8f0',
      tickfont: { color: AXIS_COLOR }
    },
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1.12,
      orientation: 'h',
      bgcolor: 'rgba(255,255,255,0.9)',
      font: { size: 11 }
    }
  };

  Plotly.newPlot('altitude-chart', [perigeeTrace, apogeeTrace], altitudeLayout, config);
}
