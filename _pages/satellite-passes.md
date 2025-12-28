---
layout: archive
title: "NOAA APT Satellite Passes"
permalink: /satellite-passes/
author_profile: true
header:
  overlay_image: NASAreentry.png
  overlay_filter: 0.3
---

<style>
  .location-picker {
    margin: 20px 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    text-align: center;
    color: white;
  }
  .location-picker select {
    padding: 10px 20px;
    font-size: 16px;
    border-radius: 8px;
    border: none;
    margin: 10px 0;
    cursor: pointer;
    background: white;
    color: #333;
  }
  .location-coords {
    opacity: 0.9;
    font-size: 13px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin: 20px 0;
    align-items: center;
  }
  .filter-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .filter-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
  .filter-value {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    min-width: 50px;
  }
  .filter-group input[type="range"] {
    width: 120px;
    cursor: pointer;
  }
  .filter-group select {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    font-size: 13px;
    cursor: pointer;
  }
  .stats-bar {
    display: flex;
    gap: 24px;
    padding: 12px 20px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .stat-number {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
  }
  .stat-label {
    font-size: 12px;
    color: #64748b;
  }
  .timeline-section {
    margin: 30px 0;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .timeline-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
  }
  .timeline-day {
    margin-bottom: 20px;
  }
  .timeline-day-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 8px;
  }
  .timeline-track {
    position: relative;
    height: 36px;
    background: #f1f5f9;
    border-radius: 6px;
    overflow: hidden;
  }
  .timeline-hours {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    pointer-events: none;
  }
  .timeline-hour {
    flex: 1;
    border-right: 1px solid #e2e8f0;
    font-size: 9px;
    color: #94a3b8;
    padding: 2px 4px;
  }
  .timeline-pass {
    position: absolute;
    top: 4px;
    bottom: 4px;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    min-width: 20px;
  }
  .timeline-pass:hover {
    transform: scaleY(1.15);
    z-index: 10;
  }
  .timeline-pass.noaa15 { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .timeline-pass.noaa18 { background: linear-gradient(135deg, #10b981, #059669); }
  .timeline-pass.noaa19 { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .timeline-legend {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    justify-content: center;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
  }
  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .legend-dot.noaa15 { background: #3b82f6; }
  .legend-dot.noaa18 { background: #10b981; }
  .legend-dot.noaa19 { background: #f59e0b; }
  .status {
    margin: 15px 0;
    padding: 12px 20px;
    background: #f0f4f8;
    border-radius: 8px;
    font-size: 13px;
    text-align: center;
    color: #64748b;
  }
  .status.error {
    background: #fef2f2;
    color: #dc2626;
  }
  .satellite-group {
    margin: 30px 0;
  }
  .satellite-name {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    color: white;
    border-radius: 12px 12px 0 0;
    font-size: 18px;
    font-weight: 600;
  }
  .satellite-name.noaa15 { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .satellite-name.noaa18 { background: linear-gradient(135deg, #10b981, #059669); }
  .satellite-name.noaa19 { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .satellite-name .freq {
    font-size: 13px;
    font-weight: 400;
    opacity: 0.9;
    background: rgba(255,255,255,0.2);
    padding: 4px 10px;
    border-radius: 20px;
  }
  .satellite-name .pass-count {
    margin-left: auto;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.9;
  }
  .passes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 0 0 12px 12px;
  }
  .pass-card {
    background: white;
    border-radius: 10px;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: transform 0.15s, box-shadow 0.15s;
    position: relative;
    overflow: hidden;
  }
  .pass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
  .pass-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .pass-date {
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .pass-time {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
  }
  .quality-badge {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
  }
  .quality-badge.excellent { background: #dcfce7; color: #166534; }
  .quality-badge.good { background: #fef9c3; color: #854d0e; }
  .quality-badge.fair { background: #ffedd5; color: #9a3412; }
  .elevation-arc {
    height: 50px;
    margin: 8px 0 12px;
    position: relative;
  }
  .arc-bg {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 50px;
    border: 2px dashed #e2e8f0;
    border-bottom: none;
    border-radius: 50px 50px 0 0;
  }
  .arc-fill {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 50px;
    border-radius: 50px 50px 0 0;
    overflow: hidden;
  }
  .arc-fill-inner {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, #22c55e, #86efac);
    border-radius: 50px 50px 0 0;
  }
  .arc-fill-inner.good { background: linear-gradient(to top, #eab308, #fde047); }
  .arc-fill-inner.fair { background: linear-gradient(to top, #f97316, #fdba74); }
  .arc-label {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }
  .arc-horizon {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #cbd5e1;
  }
  .arc-degrees {
    position: absolute;
    font-size: 9px;
    color: #94a3b8;
  }
  .arc-degrees.left { left: 0; bottom: 4px; }
  .arc-degrees.right { right: 0; bottom: 4px; }
  .arc-degrees.top { left: 50%; top: -2px; transform: translateX(-50%); }
  .pass-stats {
    display: flex;
    gap: 16px;
  }
  .pass-stat {
    flex: 1;
    text-align: center;
  }
  .pass-stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
  }
  .pass-stat-value {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
  }
  .no-passes {
    padding: 40px 20px;
    text-align: center;
    color: #94a3b8;
    background: #f8fafc;
    border-radius: 0 0 12px 12px;
    font-size: 14px;
  }
  .day-divider {
    grid-column: 1 / -1;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    padding: 12px 0 4px 4px;
    border-bottom: 1px solid #e2e8f0;
    margin-top: 4px;
  }
  .day-divider:first-child { margin-top: 0; }
  .about-section {
    margin-top: 40px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
  }
  .about-section strong { color: #475569; }
  .about-section a { color: #667eea; }
</style>

<div class="location-picker">
  <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Select your location</div>
  <select id="location-select" onchange="loadSatellitePasses()">
    <option value="london">London, UK</option>
    <option value="paris">Paris, France</option>
    <option value="boulder">Boulder, CO, USA</option>
    <option value="los-angeles">Los Angeles, CA, USA</option>
    <option value="reykjavik">Reykjavik, Iceland</option>
    <option value="brussels">Brussels, Belgium</option>
    <option value="lisbon">Lisbon, Portugal</option>
    <option value="biarritz">Biarritz, France</option>
    <option value="new-york">New York, NY, USA</option>
  </select>
  <div id="location-coords" class="location-coords"></div>
</div>

<div class="filters">
  <div class="filter-group">
    <span class="filter-label">Days ahead:</span>
    <input type="range" id="days-filter" min="1" max="7" value="3" oninput="updateFilters()">
    <span id="days-value" class="filter-value">3</span>
  </div>
  <div class="filter-group">
    <span class="filter-label">Min elevation:</span>
    <select id="elevation-filter" onchange="updateFilters()">
      <option value="10">10° (All)</option>
      <option value="20">20°+</option>
      <option value="30">30°+</option>
      <option value="45">45°+ (Best)</option>
    </select>
  </div>
  <div class="filter-group">
    <span class="filter-label">Satellite:</span>
    <select id="satellite-filter" onchange="updateFilters()">
      <option value="all">All satellites</option>
      <option value="25338">NOAA 15</option>
      <option value="28654">NOAA 18</option>
      <option value="33591">NOAA 19</option>
    </select>
  </div>
</div>

<div id="stats-bar" class="stats-bar"></div>

<div id="status" class="status">Loading satellite pass predictions...</div>

<div id="timeline-container"></div>

<div id="passes-container"></div>

<script>
var allData = null;

async function loadSatellitePasses() {
  try {
    showStatus('Loading pass predictions...');
    var locationSlug = document.getElementById('location-select').value;
    var response = await fetch('/data/passes-' + locationSlug + '.json');
    if (!response.ok) throw new Error('Failed to load (HTTP ' + response.status + ')');
    var data = await response.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');

    allData = data;
    var loc = data.location;
    document.getElementById('location-coords').textContent =
      loc.lat.toFixed(2) + '\u00B0N, ' + Math.abs(loc.lon).toFixed(2) + '\u00B0' + (loc.lon < 0 ? 'W' : 'E');

    updateFilters();

    var genTime = new Date(data.generated_at);
    var timeStr = genTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    showStatus('Updated ' + timeStr + ' \u2022 Refreshes every 6 hours');
  } catch (error) {
    showStatus('Error: ' + error.message, true);
  }
}

function updateFilters() {
  if (!allData) return;
  var daysFilter = parseInt(document.getElementById('days-filter').value);
  var elevFilter = parseInt(document.getElementById('elevation-filter').value);
  var satFilter = document.getElementById('satellite-filter').value;

  document.getElementById('days-value').textContent = daysFilter;

  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysFilter);

  var filteredData = {};
  var totalPasses = 0;
  var excellentPasses = 0;

  var entries = Object.entries(allData.satellites);
  for (var i = 0; i < entries.length; i++) {
    var noradId = entries[i][0];
    var satData = entries[i][1];

    if (satFilter !== 'all' && satFilter !== noradId) continue;

    var filteredPasses = [];
    var passes = satData.passes || [];
    for (var j = 0; j < passes.length; j++) {
      var pass = passes[j];
      var passDate = new Date(pass.start);
      if (passDate <= cutoffDate && pass.max_elevation >= elevFilter) {
        filteredPasses.push(pass);
        totalPasses++;
        if (pass.max_elevation >= 45) excellentPasses++;
      }
    }

    filteredData[noradId] = {
      name: satData.name,
      frequency: satData.frequency,
      passes: filteredPasses
    };
  }

  document.getElementById('stats-bar').innerHTML =
    '<div class="stat-item"><span class="stat-number">' + totalPasses + '</span><span class="stat-label">passes</span></div>' +
    '<div class="stat-item"><span class="stat-number" style="color:#16a34a">' + excellentPasses + '</span><span class="stat-label">excellent</span></div>' +
    '<div class="stat-item"><span class="stat-number">' + daysFilter + '</span><span class="stat-label">days</span></div>';

  renderTimeline(filteredData, daysFilter);
  displayPasses(filteredData);
}

function renderTimeline(satellitesData, days) {
  var container = document.getElementById('timeline-container');
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var html = '<div class="timeline-section"><div class="timeline-title">Pass Timeline</div>';

  for (var d = 0; d < days; d++) {
    var dayDate = new Date(today);
    dayDate.setDate(dayDate.getDate() + d);
    var dayEnd = new Date(dayDate);
    dayEnd.setDate(dayEnd.getDate() + 1);

    var dayLabel = d === 0 ? 'Today' : (d === 1 ? 'Tomorrow' : dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

    html += '<div class="timeline-day"><div class="timeline-day-label">' + dayLabel + '</div><div class="timeline-track"><div class="timeline-hours">';
    for (var h = 0; h < 24; h += 3) {
      html += '<div class="timeline-hour">' + (h < 10 ? '0' : '') + h + '</div>';
    }
    html += '</div>';

    var satEntries = Object.entries(satellitesData);
    for (var i = 0; i < satEntries.length; i++) {
      var noradId = satEntries[i][0];
      var satData = satEntries[i][1];
      var satClass = noradId === '25338' ? 'noaa15' : (noradId === '28654' ? 'noaa18' : 'noaa19');
      var satLabel = noradId === '25338' ? '15' : (noradId === '28654' ? '18' : '19');

      var passes = satData.passes || [];
      for (var j = 0; j < passes.length; j++) {
        var pass = passes[j];
        var passStart = new Date(pass.start);
        var passEnd = new Date(pass.end);

        if (passStart >= dayDate && passStart < dayEnd) {
          var startMins = passStart.getHours() * 60 + passStart.getMinutes();
          var endMins = passEnd.getHours() * 60 + passEnd.getMinutes();
          var leftPct = (startMins / 1440) * 100;
          var widthPct = Math.max(((endMins - startMins) / 1440) * 100, 1.5);

          html += '<div class="timeline-pass ' + satClass + '" style="left:' + leftPct + '%;width:' + widthPct + '%" title="' + satData.name + ' ' + formatTime(pass.start) + ' - ' + pass.max_elevation.toFixed(0) + '\u00B0">' + satLabel + '</div>';
        }
      }
    }
    html += '</div></div>';
  }

  html += '<div class="timeline-legend">' +
    '<div class="legend-item"><div class="legend-dot noaa15"></div>NOAA 15</div>' +
    '<div class="legend-item"><div class="legend-dot noaa18"></div>NOAA 18</div>' +
    '<div class="legend-item"><div class="legend-dot noaa19"></div>NOAA 19</div>' +
    '</div></div>';

  container.innerHTML = html;
}

function getQuality(elevation) {
  if (elevation >= 45) return 'excellent';
  if (elevation >= 25) return 'good';
  return 'fair';
}

function formatDate(isoString) {
  var date = new Date(isoString);
  var today = new Date();
  var tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoString) {
  var date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getDayKey(isoString) {
  return new Date(isoString).toDateString();
}

function displayPasses(satellitesData) {
  var container = document.getElementById('passes-container');
  container.innerHTML = '';

  var sortedSats = Object.entries(satellitesData).sort(function(a, b) {
    return parseInt(a[0]) - parseInt(b[0]);
  });

  for (var i = 0; i < sortedSats.length; i++) {
    var noradId = sortedSats[i][0];
    var satData = sortedSats[i][1];
    var passes = satData.passes || [];
    var satClass = noradId === '25338' ? 'noaa15' : (noradId === '28654' ? 'noaa18' : 'noaa19');

    var group = document.createElement('div');
    group.className = 'satellite-group';

    var header = document.createElement('div');
    header.className = 'satellite-name ' + satClass;
    header.innerHTML = satData.name + '<span class="freq">' + satData.frequency + '</span><span class="pass-count">' + passes.length + ' passes</span>';
    group.appendChild(header);

    if (passes.length === 0) {
      var noPassesDiv = document.createElement('div');
      noPassesDiv.className = 'no-passes';
      noPassesDiv.textContent = 'No passes match current filters';
      group.appendChild(noPassesDiv);
    } else {
      var grid = document.createElement('div');
      grid.className = 'passes-grid';

      var currentDay = '';
      for (var j = 0; j < passes.length; j++) {
        var pass = passes[j];
        var dayKey = getDayKey(pass.start);
        var quality = getQuality(pass.max_elevation);

        if (dayKey !== currentDay) {
          currentDay = dayKey;
          var divider = document.createElement('div');
          divider.className = 'day-divider';
          divider.textContent = formatDate(pass.start);
          grid.appendChild(divider);
        }

        var card = document.createElement('div');
        card.className = 'pass-card';

        var elevPct = Math.min(pass.max_elevation / 90, 1) * 100;
        var qualityLabel = quality === 'excellent' ? 'Excellent' : (quality === 'good' ? 'Good' : 'Fair');

        card.innerHTML =
          '<div class="pass-card-header">' +
            '<div><div class="pass-date">' + formatDate(pass.start) + '</div>' +
            '<div class="pass-time">' + formatTime(pass.start) + '</div></div>' +
            '<span class="quality-badge ' + quality + '">' + qualityLabel + '</span>' +
          '</div>' +
          '<div class="elevation-arc">' +
            '<div class="arc-bg"></div>' +
            '<div class="arc-fill"><div class="arc-fill-inner ' + quality + '" style="height:' + elevPct + '%"></div></div>' +
            '<div class="arc-horizon"></div>' +
            '<div class="arc-label">' + pass.max_elevation.toFixed(0) + '\u00B0</div>' +
            '<div class="arc-degrees left">0\u00B0</div>' +
            '<div class="arc-degrees right">0\u00B0</div>' +
            '<div class="arc-degrees top">90\u00B0</div>' +
          '</div>' +
          '<div class="pass-stats">' +
            '<div class="pass-stat"><div class="pass-stat-label">Duration</div><div class="pass-stat-value">' + pass.duration + ' min</div></div>' +
            '<div class="pass-stat"><div class="pass-stat-label">Ends</div><div class="pass-stat-value">' + formatTime(pass.end) + '</div></div>' +
          '</div>';

        grid.appendChild(card);
      }
      group.appendChild(grid);
    }
    container.appendChild(group);
  }
}

function showStatus(message, isError) {
  var status = document.getElementById('status');
  status.textContent = message;
  status.className = isError ? 'status error' : 'status';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSatellitePasses);
} else {
  loadSatellitePasses();
}
</script>

<div class="about-section">
  <strong>About:</strong> NOAA APT satellites transmit weather images at 137 MHz that can be received with simple equipment.
  Predictions use <a href="https://rhodesmill.org/skyfield/" target="_blank">Skyfield</a> with TLE data from <a href="https://celestrak.org" target="_blank">Celestrak</a>.
  <br><br>
  <strong>Quality:</strong>
  <span style="color:#16a34a">Excellent (45°+)</span> = overhead, best signal |
  <span style="color:#ca8a04">Good (25-45°)</span> = reliable |
  <span style="color:#ea580c">Fair (10-25°)</span> = may have noise
</div>
