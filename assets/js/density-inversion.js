/**
 * TLE Density Inversion - Minimal Dashboard
 * Activity Grid + All Satellites Chart
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
let heatmapPeriod = 'year';

document.addEventListener('DOMContentLoaded', loadAllData);

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
  } else {
    status.textContent = 'No data available';
    status.classList.add('error');
  }
}

function setHeatmapPeriod(period) {
  heatmapPeriod = period;
  document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  renderActivityGrid();
}

window.setHeatmapPeriod = setHeatmapPeriod;

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

  // Kp background bands (full height, color indicates intensity)
  if (kpData && kpData.times) {
    const kpTimes = kpData.times.map(t => new Date(t.replace(' ', 'T') + 'Z'));
    const kpColors = kpData.values.map(kp => {
      if (kp >= 7) return 'rgba(239, 68, 68, 0.25)';
      if (kp >= 5) return 'rgba(249, 115, 22, 0.25)';
      if (kp >= 4) return 'rgba(234, 179, 8, 0.2)';
      return 'rgba(34, 197, 94, 0.15)';
    });

    traces.push({
      x: kpTimes,
      y: kpData.values.map(() => 1),  // All bars same height
      type: 'bar',
      yaxis: 'y2',
      marker: { color: kpColors },
      hoverinfo: 'skip',
      width: 3 * 3600 * 1000
    });
  }

  // Density line
  traces.push({
    x: data.times.map(t => new Date(t)),
    y: data.densities,
    type: 'scattergl',
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
