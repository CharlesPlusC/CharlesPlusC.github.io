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
  .location-coords { opacity: 0.9; font-size: 13px; }
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
  .filter-group { display: flex; align-items: center; gap: 10px; }
  .filter-label { font-size: 13px; color: #64748b; font-weight: 500; }
  .filter-value { font-size: 14px; font-weight: 600; color: #1e293b; min-width: 50px; }
  .filter-group input[type="range"] { width: 120px; cursor: pointer; }
  .filter-group select { padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; cursor: pointer; }
  .stats-bar {
    display: flex;
    gap: 24px;
    padding: 12px 20px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .stat-item { display: flex; align-items: center; gap: 8px; }
  .stat-number { font-size: 20px; font-weight: 700; color: #1e293b; }
  .stat-label { font-size: 12px; color: #64748b; }
  .status {
    margin: 15px 0;
    padding: 12px 20px;
    background: #f0f4f8;
    border-radius: 8px;
    font-size: 13px;
    text-align: center;
    color: #64748b;
  }
  .status.error { background: #fef2f2; color: #dc2626; }
  .satellite-group { margin: 30px 0; }
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
  .satellite-name .pass-count { margin-left: auto; font-size: 13px; font-weight: 500; opacity: 0.9; }
  .passes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 0 0 12px 12px;
  }
  .pass-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .pass-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }
  .pass-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .pass-date { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .pass-time { font-size: 22px; font-weight: 700; color: #1e293b; }
  .quality-badge {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 600;
  }
  .quality-badge.excellent { background: #dcfce7; color: #166534; }
  .quality-badge.good { background: #fef9c3; color: #854d0e; }
  .quality-badge.fair { background: #ffedd5; color: #9a3412; }
  .sky-chart {
    width: 100%;
    aspect-ratio: 1;
    max-width: 200px;
    margin: 12px auto;
    position: relative;
  }
  .sky-chart svg { width: 100%; height: 100%; }
  .pass-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
  }
  .pass-info-item { text-align: center; }
  .pass-info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  .pass-info-value { font-size: 14px; font-weight: 600; color: #334155; }
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
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #475569;
    padding: 16px 0 8px 4px;
    border-bottom: 2px solid #e2e8f0;
    margin-top: 8px;
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
    document.getElementById('location-coords').textContent =
      data.location.lat.toFixed(2) + '\u00B0N, ' + Math.abs(data.location.lon).toFixed(2) + '\u00B0' + (data.location.lon < 0 ? 'W' : 'E');
    updateFilters();
    var genTime = new Date(data.generated_at);
    showStatus('Updated ' + genTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' \u2022 Refreshes every 6 hours');
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
  var totalPasses = 0, excellentPasses = 0;

  var entries = Object.entries(allData.satellites);
  for (var i = 0; i < entries.length; i++) {
    var noradId = entries[i][0], satData = entries[i][1];
    if (satFilter !== 'all' && satFilter !== noradId) continue;
    var filteredPasses = [];
    var passes = satData.passes || [];
    for (var j = 0; j < passes.length; j++) {
      var pass = passes[j];
      if (new Date(pass.start) <= cutoffDate && pass.max_elevation >= elevFilter) {
        filteredPasses.push(pass);
        totalPasses++;
        if (pass.max_elevation >= 45) excellentPasses++;
      }
    }
    filteredData[noradId] = { name: satData.name, frequency: satData.frequency, passes: filteredPasses };
  }

  document.getElementById('stats-bar').innerHTML =
    '<div class="stat-item"><span class="stat-number">' + totalPasses + '</span><span class="stat-label">passes</span></div>' +
    '<div class="stat-item"><span class="stat-number" style="color:#16a34a">' + excellentPasses + '</span><span class="stat-label">excellent</span></div>' +
    '<div class="stat-item"><span class="stat-number">' + daysFilter + '</span><span class="stat-label">days</span></div>';

  displayPasses(filteredData);
}

function createSkyChart(pass, satColor) {
  var size = 200, cx = size/2, cy = size/2, r = size/2 - 10;

  var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg">';

  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r*2/3) + '" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r/3) + '" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>';

  svg += '<line x1="' + cx + '" y1="' + (cy-r) + '" x2="' + cx + '" y2="' + (cy+r) + '" stroke="#e2e8f0" stroke-width="1"/>';
  svg += '<line x1="' + (cx-r) + '" y1="' + cy + '" x2="' + (cx+r) + '" y2="' + cy + '" stroke="#e2e8f0" stroke-width="1"/>';

  svg += '<text x="' + cx + '" y="12" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">N</text>';
  svg += '<text x="' + cx + '" y="' + (size-4) + '" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S</text>';
  svg += '<text x="8" y="' + (cy+4) + '" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">W</text>';
  svg += '<text x="' + (size-8) + '" y="' + (cy+4) + '" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">E</text>';

  svg += '<text x="' + (cx+4) + '" y="' + (cy - r + 14) + '" font-size="8" fill="#94a3b8">0\u00B0</text>';
  svg += '<text x="' + (cx+4) + '" y="' + (cy - r*2/3 + 10) + '" font-size="8" fill="#94a3b8">30\u00B0</text>';
  svg += '<text x="' + (cx+4) + '" y="' + (cy - r/3 + 10) + '" font-size="8" fill="#94a3b8">60\u00B0</text>';
  svg += '<text x="' + (cx+4) + '" y="' + (cy + 4) + '" font-size="8" fill="#94a3b8">90\u00B0</text>';

  if (pass.track && pass.track.length > 1) {
    var pathData = '';
    for (var i = 0; i < pass.track.length; i++) {
      var az = pass.track[i][0], el = pass.track[i][1];
      var azRad = (az - 90) * Math.PI / 180;
      var dist = r * (90 - el) / 90;
      var x = cx + dist * Math.cos(azRad);
      var y = cy + dist * Math.sin(azRad);
      pathData += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    svg += '<path d="' + pathData + '" fill="none" stroke="' + satColor + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>';

    var startAz = pass.track[0][0], startEl = pass.track[0][1];
    var startRad = (startAz - 90) * Math.PI / 180;
    var startDist = r * (90 - startEl) / 90;
    var startX = cx + startDist * Math.cos(startRad);
    var startY = cy + startDist * Math.sin(startRad);
    svg += '<circle cx="' + startX.toFixed(1) + '" cy="' + startY.toFixed(1) + '" r="5" fill="' + satColor + '"/>';

    var endAz = pass.track[pass.track.length-1][0], endEl = pass.track[pass.track.length-1][1];
    var endRad = (endAz - 90) * Math.PI / 180;
    var endDist = r * (90 - endEl) / 90;
    var endX = cx + endDist * Math.cos(endRad);
    var endY = cy + endDist * Math.sin(endRad);
    svg += '<circle cx="' + endX.toFixed(1) + '" cy="' + endY.toFixed(1) + '" r="4" fill="white" stroke="' + satColor + '" stroke-width="2"/>';
  } else {
    svg += '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" font-size="24" font-weight="700" fill="' + satColor + '">' + pass.max_elevation.toFixed(0) + '\u00B0</text>';
    svg += '<text x="' + cx + '" y="' + (cy+14) + '" text-anchor="middle" font-size="9" fill="#94a3b8">max elevation</text>';
  }

  svg += '</svg>';
  return svg;
}

function getQuality(el) { return el >= 45 ? 'excellent' : (el >= 25 ? 'good' : 'fair'); }
function formatDate(iso) {
  var d = new Date(iso), today = new Date(), tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(iso) { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); }
function getDayKey(iso) { return new Date(iso).toDateString(); }

function displayPasses(satellitesData) {
  var container = document.getElementById('passes-container');
  container.innerHTML = '';
  var colors = { '25338': '#3b82f6', '28654': '#10b981', '33591': '#f59e0b' };

  var sortedSats = Object.entries(satellitesData).sort(function(a,b) { return parseInt(a[0]) - parseInt(b[0]); });

  for (var i = 0; i < sortedSats.length; i++) {
    var noradId = sortedSats[i][0], satData = sortedSats[i][1];
    var passes = satData.passes || [];
    var satClass = noradId === '25338' ? 'noaa15' : (noradId === '28654' ? 'noaa18' : 'noaa19');
    var satColor = colors[noradId] || '#6b7280';

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
        var qualityLabel = quality === 'excellent' ? 'Excellent' : (quality === 'good' ? 'Good' : 'Fair');

        card.innerHTML =
          '<div class="pass-card-header">' +
            '<div><div class="pass-date">' + formatDate(pass.start) + '</div><div class="pass-time">' + formatTime(pass.start) + '</div></div>' +
            '<span class="quality-badge ' + quality + '">' + qualityLabel + '</span>' +
          '</div>' +
          '<div class="sky-chart">' + createSkyChart(pass, satColor) + '</div>' +
          '<div class="pass-info">' +
            '<div class="pass-info-item"><div class="pass-info-label">Max Elev</div><div class="pass-info-value">' + pass.max_elevation.toFixed(0) + '\u00B0</div></div>' +
            '<div class="pass-info-item"><div class="pass-info-label">Duration</div><div class="pass-info-value">' + pass.duration + ' min</div></div>' +
            '<div class="pass-info-item"><div class="pass-info-label">Start</div><div class="pass-info-value">' + formatTime(pass.start) + '</div></div>' +
            '<div class="pass-info-item"><div class="pass-info-label">End</div><div class="pass-info-value">' + formatTime(pass.end) + '</div></div>' +
          '</div>';

        grid.appendChild(card);
      }
      group.appendChild(grid);
    }
    container.appendChild(group);
  }
}

function showStatus(msg, isError) {
  var s = document.getElementById('status');
  s.textContent = msg;
  s.className = isError ? 'status error' : 'status';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSatellitePasses);
} else {
  loadSatellitePasses();
}
</script>

<div class="about-section">
  <strong>About:</strong> NOAA APT satellites transmit weather images at 137 MHz. The sky chart shows the satellite's path across the sky from your location - the outer ring is the horizon (0°), the center is directly overhead (90°). A filled dot marks the start, an open dot marks the end.
  <br><br>
  <strong>Quality:</strong>
  <span style="color:#16a34a">Excellent (45°+)</span> = passes near overhead, best signal |
  <span style="color:#ca8a04">Good (25-45°)</span> = reliable reception |
  <span style="color:#ea580c">Fair (10-25°)</span> = low on horizon, may have noise
</div>
