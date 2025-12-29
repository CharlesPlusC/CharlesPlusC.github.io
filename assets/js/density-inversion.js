/**
 * TLE Density Inversion Visualization
 * Displays atmospheric density derived from TLE mean motion derivatives
 */

// Satellite configuration
// Note: Area and mass are estimates for debris objects - adjust as needed
const SATELLITES = {
  '39212': {
    name: 'CZ-4C DEB',
    noradId: 39212,
    cd: 2.2,
    area: 1.0,     // Estimated debris cross-section (m²)
    mass: 50.0,    // Estimated debris mass (kg)
    color: '#0ea5e9'
  },
  '48714': {
    name: 'NOAA 17 DEB',
    noradId: 48714,
    cd: 2.2,
    area: 0.5,     // Estimated debris cross-section (m²)
    mass: 25.0,    // Estimated debris mass (kg)
    color: '#8b5cf6'
  },
  '64631': {
    name: 'CZ-6A DEB',
    noradId: 64631,
    cd: 2.2,
    area: 1.0,     // Estimated debris cross-section (m²)
    mass: 50.0,    // Estimated debris mass (kg)
    color: '#f59e0b'
  }
};

let currentSatellite = null;
let allData = {};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  generateSatelliteButtons();
  loadAllSatelliteData();
});

function generateSatelliteButtons() {
  const container = document.getElementById('satellite-buttons');
  container.innerHTML = '';

  Object.entries(SATELLITES).forEach(([noradId, sat], index) => {
    const btn = document.createElement('button');
    btn.className = 'sat-btn' + (index === 0 ? ' active' : '');
    btn.setAttribute('data-norad', noradId);
    btn.textContent = sat.name;
    btn.onclick = () => selectSatellite(noradId);
    container.appendChild(btn);
  });
}

async function loadAllSatelliteData() {
  const status = document.getElementById('status');
  status.textContent = 'Loading density data...';
  status.classList.remove('hidden', 'error');

  let loadedCount = 0;
  const totalSatellites = Object.keys(SATELLITES).length;

  for (const noradId of Object.keys(SATELLITES)) {
    try {
      const response = await fetch(`/data/density-${noradId}.json`);
      if (response.ok) {
        allData[noradId] = await response.json();
        loadedCount++;
      }
    } catch (err) {
      console.error(`Failed to load data for ${noradId}:`, err);
    }
  }

  if (loadedCount > 0) {
    status.classList.add('hidden');
    // Select the first satellite with data
    const firstWithData = Object.keys(SATELLITES).find(id => allData[id]);
    if (firstWithData) {
      selectSatellite(firstWithData);
    }
  } else {
    status.textContent = 'No density data available. Data will be generated on the next scheduled update.';
    status.classList.add('error');
  }
}

function selectSatellite(noradId) {
  currentSatellite = noradId;

  // Update button states
  document.querySelectorAll('.sat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-norad') === noradId);
  });

  // Update info panel
  updateInfoPanel(noradId);

  // Update charts
  if (allData[noradId]) {
    renderCharts(noradId);
  } else {
    document.getElementById('status').textContent = `No data available for ${SATELLITES[noradId].name}`;
    document.getElementById('status').classList.remove('hidden');
    document.getElementById('status').classList.add('error');
  }
}

function updateInfoPanel(noradId) {
  const sat = SATELLITES[noradId];
  const data = allData[noradId];

  document.getElementById('info-norad').textContent = noradId;
  document.getElementById('info-name').textContent = sat.name;
  document.getElementById('info-cd').textContent = sat.cd.toFixed(1);
  document.getElementById('info-area').textContent = sat.area.toFixed(4);
  document.getElementById('info-mass').textContent = sat.mass.toFixed(1);

  if (data) {
    document.getElementById('info-points').textContent = data.times.length;
    document.getElementById('info-updated').textContent = new Date(data.generated_at).toLocaleString();
  } else {
    document.getElementById('info-points').textContent = '--';
    document.getElementById('info-updated').textContent = '--';
  }
}

function renderCharts(noradId) {
  const sat = SATELLITES[noradId];
  const data = allData[noradId];

  if (!data || !data.times || data.times.length === 0) {
    return;
  }

  // Parse dates
  const times = data.times.map(t => new Date(t));

  // Calculate date range for last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Density Chart
  const densityTrace = {
    x: times,
    y: data.densities,
    type: 'scatter',
    mode: 'markers',
    name: 'Density',
    marker: {
      size: 4,
      color: sat.color,
      opacity: 0.7
    },
    hovertemplate: '%{x|%Y-%m-%d %H:%M}<br>Density: %{y:.2e} kg/m³<extra></extra>'
  };

  const densityLayout = {
    title: {
      text: 'Orbit-Effective Atmospheric Density',
      font: { size: 16 }
    },
    xaxis: {
      title: 'Time (UTC)',
      range: [sixMonthsAgo, now],
      rangeslider: { visible: true },
      rangeselector: {
        buttons: [
          { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
          { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
          { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
          { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
          { step: 'all', label: 'All' }
        ]
      }
    },
    yaxis: {
      title: 'Density (kg/m³)',
      type: 'log',
      exponentformat: 'e'
    },
    margin: { t: 60, r: 40, b: 60, l: 80 },
    hovermode: 'closest',
    showlegend: false
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  };

  Plotly.newPlot('density-chart', [densityTrace], densityLayout, config);

  // Altitude Chart (Perigee and Apogee)
  const perigeeTrace = {
    x: times,
    y: data.perigees,
    type: 'scatter',
    mode: 'markers',
    name: 'Perigee',
    marker: {
      size: 3,
      color: '#f97316',
      opacity: 0.7
    },
    hovertemplate: '%{x|%Y-%m-%d %H:%M}<br>Perigee: %{y:.1f} km<extra></extra>'
  };

  const apogeeTrace = {
    x: times,
    y: data.apogees,
    type: 'scatter',
    mode: 'markers',
    name: 'Apogee',
    marker: {
      size: 3,
      color: '#22c55e',
      opacity: 0.7
    },
    hovertemplate: '%{x|%Y-%m-%d %H:%M}<br>Apogee: %{y:.1f} km<extra></extra>'
  };

  const altitudeLayout = {
    title: {
      text: 'Orbital Altitude History',
      font: { size: 16 }
    },
    xaxis: {
      title: 'Time (UTC)',
      range: [sixMonthsAgo, now],
      rangeslider: { visible: true },
      rangeselector: {
        buttons: [
          { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
          { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
          { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
          { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
          { step: 'all', label: 'All' }
        ]
      }
    },
    yaxis: {
      title: 'Altitude (km)'
    },
    margin: { t: 60, r: 40, b: 60, l: 80 },
    hovermode: 'closest',
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)'
    }
  };

  Plotly.newPlot('altitude-chart', [perigeeTrace, apogeeTrace], altitudeLayout, config);
}
