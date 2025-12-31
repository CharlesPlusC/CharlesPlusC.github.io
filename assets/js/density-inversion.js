/**
 * TLE Density Inversion - Infographic Style Dashboard
 * Features: Overview cards, Heatmap, Kp Correlation, Satellite Comparison
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
    populateCompareSelectors();
  } else {
    status.textContent = 'No data available';
    status.classList.add('error');
  }
}

// ===== Hero Stats =====
function updateHeroStats() {
  // Total data points
  let totalPoints = 0;
  Object.values(allData).forEach(data => {
    if (data?.times) totalPoints += data.times.length;
  });
  document.getElementById('stat-datapoints').textContent = totalPoints.toLocaleString();

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
    if (tabName === 'heatmap') renderHeatmap();
    else if (tabName === 'correlation') renderCorrelation();
    else if (tabName === 'compare') updateComparison();
  }, 50);
}

// Make switchTab globally accessible
window.switchTab = switchTab;

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

  // Density line with gradient effect
  traces.push({
    x: filteredTimes,
    y: filteredDensities,
    type: 'scattergl',
    mode: 'lines',
    line: { color: color, width: 2.5 },
    fill: 'tozeroy',
    fillcolor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
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

// ===== Heatmap Visualization =====
function renderHeatmap() {
  const container = document.getElementById('heatmap-chart');
  if (!container) return;

  // Get last 3 months of data for cleaner heatmap
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Collect all satellite data into a matrix
  const satNames = [];
  const satColors = [];
  const allZ = [];

  Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([noradId, sat]) => {
      const data = allData[noradId];
      if (!data || !data.times) return;

      satNames.push(sat.name);
      satColors.push(sat.color);

      // Normalize density to 0-1 range for this satellite
      const densities = data.densities;
      const times = data.times.map(t => new Date(t));

      // Filter to last 3 months and bin by day
      const dayBins = {};
      times.forEach((t, i) => {
        if (t >= threeMonthsAgo) {
          const dayKey = t.toISOString().split('T')[0];
          if (!dayBins[dayKey]) dayBins[dayKey] = [];
          dayBins[dayKey].push(densities[i]);
        }
      });

      // Average density per day and normalize
      const minD = Math.min(...densities.filter(d => d > 0));
      const maxD = Math.max(...densities);
      const logMin = Math.log10(minD);
      const logMax = Math.log10(maxD);

      const normalizedRow = [];
      const sortedDays = Object.keys(dayBins).sort();
      sortedDays.forEach(day => {
        const avgDensity = dayBins[day].reduce((a, b) => a + b, 0) / dayBins[day].length;
        const logVal = Math.log10(avgDensity);
        const normalized = (logVal - logMin) / (logMax - logMin);
        normalizedRow.push(normalized);
      });

      allZ.push(normalizedRow);
    });

  // Create x-axis dates
  const firstSatData = allData[Object.keys(allData)[0]];
  const times = firstSatData.times.map(t => new Date(t)).filter(t => t >= threeMonthsAgo);
  const dayBins = {};
  times.forEach(t => {
    const dayKey = t.toISOString().split('T')[0];
    dayBins[dayKey] = true;
  });
  const xDates = Object.keys(dayBins).sort();

  const trace = {
    z: allZ,
    x: xDates,
    y: satNames,
    type: 'heatmap',
    colorscale: [
      [0, '#1e3a5f'],
      [0.25, '#2563eb'],
      [0.5, '#60a5fa'],
      [0.75, '#fbbf24'],
      [1, '#ef4444']
    ],
    showscale: true,
    colorbar: {
      title: 'Relative Density',
      titleside: 'right',
      tickvals: [0, 0.5, 1],
      ticktext: ['Low', 'Medium', 'High']
    },
    hovertemplate: '%{y}<br>%{x}<br>Relative: %{z:.2f}<extra></extra>'
  };

  const layout = {
    font: { family: 'system-ui, sans-serif', size: 12 },
    margin: { t: 30, r: 120, b: 60, l: 120 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    xaxis: {
      title: 'Date',
      tickangle: -45,
      nticks: 15
    },
    yaxis: {
      title: '',
      tickfont: { size: 13, weight: 600 }
    }
  };

  Plotly.newPlot(container, [trace], layout, {
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  });
}

// ===== Kp Correlation Plot =====
function renderCorrelation() {
  const container = document.getElementById('correlation-chart');
  if (!container || !kpData) return;

  // Prepare Kp data lookup
  const kpLookup = {};
  kpData.times.forEach((t, i) => {
    const date = new Date(t.replace(' ', 'T') + 'Z');
    const dayKey = date.toISOString().split('T')[0];
    if (!kpLookup[dayKey]) kpLookup[dayKey] = [];
    kpLookup[dayKey].push(kpData.values[i]);
  });

  // Average Kp per day
  Object.keys(kpLookup).forEach(day => {
    kpLookup[day] = kpLookup[day].reduce((a, b) => a + b, 0) / kpLookup[day].length;
  });

  const traces = [];
  let allKpVals = [];
  let allDensityVals = [];

  Object.entries(SATELLITES).forEach(([noradId, sat]) => {
    const data = allData[noradId];
    if (!data || !data.times) return;

    const kpValues = [];
    const densityValues = [];

    data.times.forEach((t, i) => {
      const date = new Date(t);
      const dayKey = date.toISOString().split('T')[0];
      if (kpLookup[dayKey] !== undefined) {
        kpValues.push(kpLookup[dayKey]);
        densityValues.push(data.densities[i]);
        allKpVals.push(kpLookup[dayKey]);
        allDensityVals.push(data.densities[i]);
      }
    });

    traces.push({
      x: kpValues,
      y: densityValues,
      mode: 'markers',
      type: 'scattergl',
      name: sat.name,
      marker: {
        color: sat.color,
        size: 6,
        opacity: 0.6
      },
      hovertemplate: `${sat.name}<br>Kp: %{x:.1f}<br>ρ: %{y:.2e} kg/m³<extra></extra>`
    });
  });

  // Calculate correlation coefficient
  if (allKpVals.length > 0) {
    const logDensity = allDensityVals.map(d => Math.log10(d));
    const n = allKpVals.length;
    const sumX = allKpVals.reduce((a, b) => a + b, 0);
    const sumY = logDensity.reduce((a, b) => a + b, 0);
    const sumXY = allKpVals.reduce((acc, x, i) => acc + x * logDensity[i], 0);
    const sumX2 = allKpVals.reduce((acc, x) => acc + x * x, 0);
    const sumY2 = logDensity.reduce((acc, y) => acc + y * y, 0);

    const r = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    document.getElementById('insight-correlation').textContent = r.toFixed(3);
    document.getElementById('insight-response').textContent = '~3-6 hrs';

    // Peak increase estimate
    const highKpDensities = allDensityVals.filter((_, i) => allKpVals[i] >= 5);
    const lowKpDensities = allDensityVals.filter((_, i) => allKpVals[i] < 3);
    if (highKpDensities.length > 0 && lowKpDensities.length > 0) {
      const avgHigh = highKpDensities.reduce((a, b) => a + b, 0) / highKpDensities.length;
      const avgLow = lowKpDensities.reduce((a, b) => a + b, 0) / lowKpDensities.length;
      const increase = ((avgHigh / avgLow - 1) * 100).toFixed(0);
      document.getElementById('insight-peak').textContent = `+${increase}%`;
    }
  }

  const layout = {
    font: { family: 'system-ui, sans-serif', size: 12 },
    margin: { t: 30, r: 30, b: 60, l: 80 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    xaxis: {
      title: 'Kp Index (Geomagnetic Activity)',
      gridcolor: 'rgba(0,0,0,0.08)',
      range: [0, 9]
    },
    yaxis: {
      title: 'Thermospheric Density (kg/m³)',
      type: 'log',
      gridcolor: 'rgba(0,0,0,0.08)',
      exponentformat: 'e'
    },
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: '#e2e8f0',
      borderwidth: 1
    },
    hovermode: 'closest'
  };

  Plotly.newPlot(container, traces, layout, {
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  });
}

// ===== Comparison View =====
function populateCompareSelectors() {
  const select1 = document.getElementById('compare-sat1');
  const select2 = document.getElementById('compare-sat2');

  const satList = Object.entries(SATELLITES)
    .sort((a, b) => a[1].order - b[1].order);

  satList.forEach(([noradId, sat], index) => {
    const option1 = document.createElement('option');
    option1.value = noradId;
    option1.textContent = sat.name;
    select1.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = noradId;
    option2.textContent = sat.name;
    select2.appendChild(option2);
  });

  // Default selections
  if (satList.length >= 2) {
    select1.value = satList[0][0];
    select2.value = satList[1][0];
  }
}

function updateComparison() {
  const container = document.getElementById('compare-chart');
  if (!container) return;

  const sat1Id = document.getElementById('compare-sat1').value;
  const sat2Id = document.getElementById('compare-sat2').value;

  const sat1 = SATELLITES[sat1Id];
  const sat2 = SATELLITES[sat2Id];
  const data1 = allData[sat1Id];
  const data2 = allData[sat2Id];

  if (!data1 || !data2) return;

  // Get last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const traces = [];

  // Kp bars
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

  // Satellite 1
  traces.push({
    x: data1.times.map(t => new Date(t)),
    y: data1.densities,
    type: 'scattergl',
    mode: 'lines',
    name: sat1.name,
    line: { color: sat1.color, width: 2 },
    hovertemplate: `${sat1.name}<br>%{x|%d %b %Y}<br>ρ = %{y:.2e}<extra></extra>`
  });

  // Satellite 2
  traces.push({
    x: data2.times.map(t => new Date(t)),
    y: data2.densities,
    type: 'scattergl',
    mode: 'lines',
    name: sat2.name,
    line: { color: sat2.color, width: 2 },
    hovertemplate: `${sat2.name}<br>%{x|%d %b %Y}<br>ρ = %{y:.2e}<extra></extra>`
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

// Make updateComparison globally accessible
window.updateComparison = updateComparison;

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
      fill: 'tonexty',
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
