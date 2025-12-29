/**
 * TLE Density Inversion - Card Layout with Sparklines
 */

const SATELLITES = {
  '39212': { name: 'CZ-4C DEB', color: '#2563eb' },
  '48714': { name: 'NOAA 17 DEB', color: '#7c3aed' },
  '64631': { name: 'CZ-6A DEB', color: '#db2777' }
};

let allData = {};
let kpData = null;

document.addEventListener('DOMContentLoaded', loadAllData);

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
    renderCards();
  } else {
    status.textContent = 'No data available';
    status.classList.add('error');
  }
}

function renderCards() {
  const container = document.getElementById('satellite-cards');
  container.innerHTML = '';

  // Add Kp legend at top
  const legend = document.createElement('div');
  legend.className = 'kp-legend';
  legend.innerHTML = `
    <span style="margin-right: 4px;">Kp Index:</span>
    <span class="kp-legend-item"><span class="kp-bar kp-quiet"></span>Quiet</span>
    <span class="kp-legend-item"><span class="kp-bar kp-active"></span>Active</span>
    <span class="kp-legend-item"><span class="kp-bar kp-storm"></span>Storm</span>
    <span class="kp-legend-item"><span class="kp-bar kp-severe"></span>Severe</span>
  `;
  container.appendChild(legend);

  // Create cards for each satellite
  Object.entries(SATELLITES).forEach(([noradId, sat]) => {
    const data = allData[noradId];
    if (!data || !data.times || data.times.length === 0) return;

    const card = document.createElement('div');
    card.className = 'satellite-card';

    const lastPerigee = data.perigees[data.perigees.length - 1];
    const lastUpdate = new Date(data.times[data.times.length - 1]);
    const updateStr = lastUpdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    card.innerHTML = `
      <div class="card-main" onclick="openDetail('${noradId}')">
        <div class="card-info">
          <div class="card-name">
            <span class="card-dot" style="background:${sat.color}"></span>
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
        if (kp >= 7) return 'rgba(220, 38, 38, 0.4)';
        if (kp >= 5) return 'rgba(249, 115, 22, 0.4)';
        if (kp >= 4) return 'rgba(234, 179, 8, 0.35)';
        return 'rgba(34, 197, 94, 0.25)';
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

  // Density line
  traces.push({
    x: filteredTimes,
    y: filteredDensities,
    type: 'scattergl',
    mode: 'lines',
    line: { color: color, width: 1.5 },
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

function openDetail(noradId) {
  const sat = SATELLITES[noradId];
  const data = allData[noradId];

  document.getElementById('detail-title').textContent = `${sat.name} (NORAD ${noradId})`;
  document.getElementById('detail-modal').classList.add('active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    renderDetailChart(noradId, sat.color, data);
    renderAltitudeChart(noradId, data);
  }, 50);
}

function closeDetail() {
  document.getElementById('detail-modal').classList.remove('active');
  document.body.style.overflow = '';
}

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
    marker: { size: 5, color: color, opacity: 0.8 },
    hovertemplate: '%{x|%d %b %Y}<br>ρ = %{y:.2e} kg/m³<extra></extra>'
  });

  const layout = {
    font: { family: 'system-ui, sans-serif', size: 12 },
    margin: { t: 20, r: 60, b: 50, l: 70 },
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
      line: { color: '#f97316', width: 1.5 },
      hovertemplate: '%{x|%d %b}<br>Perigee: %{y:.0f} km<extra></extra>'
    },
    {
      x: times,
      y: data.apogees,
      type: 'scattergl',
      mode: 'lines',
      name: 'Apogee',
      line: { color: '#22c55e', width: 1.5 },
      hovertemplate: '%{x|%d %b}<br>Apogee: %{y:.0f} km<extra></extra>'
    }
  ];

  const layout = {
    font: { family: 'system-ui, sans-serif', size: 12 },
    margin: { t: 10, r: 20, b: 40, l: 70 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
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
