---
layout: archive
title: "Meteor-M Weather Satellite Passes"
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
  .next-pass-banner {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    margin: 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .next-pass-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
  .next-pass-info { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .next-pass-sat { font-size: 15px; font-weight: 600; }
  .next-pass-countdown { font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .next-pass-time { font-size: 13px; opacity: 0.8; }
  .next-pass-elev { font-size: 12px; padding: 4px 10px; background: rgba(255,255,255,0.15); border-radius: 12px; }
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
  .view-toggle {
    display: flex;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 3px;
    margin-left: auto;
  }
  .view-btn {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    border: none;
    background: none;
    color: #64748b;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s;
  }
  .view-btn.active { background: white; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
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
  .satellite-group { margin: 20px 0; }
  .satellite-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    color: white;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: opacity 0.15s;
  }
  .satellite-header:hover { opacity: 0.9; }
  .satellite-header.meteor-n2-3 { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .satellite-header.meteor-n2-4 { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
  .satellite-header .freq {
    font-size: 12px;
    font-weight: 400;
    opacity: 0.9;
    background: rgba(255,255,255,0.2);
    padding: 3px 8px;
    border-radius: 12px;
  }
  .satellite-header .pass-count { margin-left: auto; font-size: 12px; font-weight: 500; opacity: 0.9; }
  .satellite-header .toggle-icon {
    font-size: 12px;
    transition: transform 0.2s;
    margin-left: 8px;
  }
  .satellite-header.collapsed .toggle-icon { transform: rotate(-90deg); }
  .passes-container {
    max-height: 2000px;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    background: #f8fafc;
    border-radius: 0 0 12px 12px;
  }
  .passes-container.collapsed { max-height: 0; }
  .passes-list { padding: 12px; }
  .chrono-list {
    background: #f8fafc;
    border-radius: 12px;
    padding: 12px;
  }
  .pass-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: white;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: box-shadow 0.15s;
  }
  .pass-row:hover { box-shadow: 0 3px 8px rgba(0,0,0,0.1); }
  .pass-row:last-child { margin-bottom: 0; }
  .pass-datetime {
    min-width: 120px;
  }
  .pass-date { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .pass-time { font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px; }
  .daynight {
    font-size: 14px;
    opacity: 0.7;
  }
  .daynight.day { color: #f59e0b; }
  .daynight.twilight { color: #f97316; }
  .daynight.night { color: #6366f1; }
  .sat-badge {
    font-size: 9px;
    font-weight: 600;
    padding: 3px 6px;
    border-radius: 4px;
    color: white;
    flex-shrink: 0;
  }
  .sat-badge.meteor-n2-3 { background: #3b82f6; }
  .sat-badge.meteor-n2-4 { background: #8b5cf6; }
  .sky-chart-small {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
  }
  .sky-chart-small svg { width: 100%; height: 100%; }
  .pass-details {
    display: flex;
    gap: 16px;
    flex: 1;
    align-items: center;
  }
  .pass-stat { text-align: center; min-width: 50px; }
  .pass-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  .pass-stat-value { font-size: 14px; font-weight: 600; color: #334155; }
  .quality-badge {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .quality-badge.excellent { background: #dbeafe; color: #1e40af; }
  .quality-badge.good { background: #fef9c3; color: #854d0e; }
  .quality-badge.fair { background: #f1f5f9; color: #64748b; }
  .day-divider {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    padding: 12px 4px 6px;
    margin-top: 4px;
  }
  .day-divider:first-child { margin-top: 0; padding-top: 4px; }
  .no-passes {
    padding: 30px 20px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }
  @media (max-width: 600px) {
    .pass-details { gap: 10px; }
    .pass-stat { min-width: 40px; }
    .pass-datetime { min-width: 100px; }
    .next-pass-countdown { font-size: 22px; }
    .view-toggle { margin-left: 0; width: 100%; justify-content: center; }
  }
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

<div id="next-pass-banner" class="next-pass-banner" style="display:none;"></div>

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
      <option value="57166">Meteor-M N2-3</option>
      <option value="59051">Meteor-M N2-4</option>
    </select>
  </div>
  <div class="view-toggle">
    <button class="view-btn active" id="view-grouped" onclick="setView('grouped')">By Satellite</button>
    <button class="view-btn" id="view-chrono" onclick="setView('chrono')">Chronological</button>
  </div>
</div>

<div id="stats-bar" class="stats-bar"></div>
<div id="status" class="status">Loading satellite pass predictions...</div>
<div id="passes-container"></div>

<script>
var allData = null;
var expandedSats = {};
var currentView = 'grouped';
var countdownInterval = null;

/* Calculate solar elevation for day/night indicator */
function getSunElevation(date, lat, lon) {
  var rad = Math.PI / 180;
  var dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  var declination = -23.45 * Math.cos(rad * 360 / 365 * (dayOfYear + 10));
  var hourAngle = (date.getUTCHours() + date.getUTCMinutes() / 60 - 12) * 15 + lon;
  var sinElev = Math.sin(lat * rad) * Math.sin(declination * rad) +
                Math.cos(lat * rad) * Math.cos(declination * rad) * Math.cos(hourAngle * rad);
  return Math.asin(sinElev) / rad;
}

function getDayNight(date, lat, lon) {
  var elev = getSunElevation(date, lat, lon);
  if (elev > 0) return { type: 'day', icon: '\u2600' };
  if (elev > -6) return { type: 'twilight', icon: '\u25D1' };
  return { type: 'night', icon: '\u263D' };
}

function formatCountdown(ms) {
  if (ms < 0) return 'now';
  var totalSecs = Math.floor(ms / 1000);
  var hours = Math.floor(totalSecs / 3600);
  var mins = Math.floor((totalSecs % 3600) / 60);
  var secs = totalSecs % 60;
  if (hours > 0) return hours + 'h ' + mins + 'm';
  if (mins > 0) return mins + 'm ' + secs + 's';
  return secs + 's';
}

function updateNextPassBanner() {
  if (!allData) return;
  var now = new Date();
  var nextPass = null;
  var nextSatName = '';
  var nextNoradId = '';

  var entries = Object.entries(allData.satellites);
  for (var i = 0; i < entries.length; i++) {
    var noradId = entries[i][0], satData = entries[i][1];
    var passes = satData.passes || [];
    for (var j = 0; j < passes.length; j++) {
      var passTime = new Date(passes[j].start);
      if (passTime > now && (!nextPass || passTime < new Date(nextPass.start))) {
        nextPass = passes[j];
        nextSatName = satData.name;
        nextNoradId = noradId;
      }
    }
  }

  var banner = document.getElementById('next-pass-banner');
  if (!nextPass) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'flex';
  var passTime = new Date(nextPass.start);
  var timeUntil = passTime - now;
  var quality = nextPass.max_elevation >= 45 ? 'Excellent' : (nextPass.max_elevation >= 25 ? 'Good' : 'Fair');

  banner.innerHTML =
    '<div><div class="next-pass-label">Next Pass</div><div class="next-pass-sat">' + nextSatName + '</div></div>' +
    '<div class="next-pass-info">' +
      '<div class="next-pass-countdown">' + formatCountdown(timeUntil) + '</div>' +
      '<div class="next-pass-time">' + formatTime(nextPass.start) + ' \u2022 ' + formatDate(nextPass.start) + '</div>' +
      '<div class="next-pass-elev">' + nextPass.max_elevation.toFixed(0) + '\u00B0 ' + quality + '</div>' +
    '</div>';
}

function setView(view) {
  currentView = view;
  document.getElementById('view-grouped').className = 'view-btn' + (view === 'grouped' ? ' active' : '');
  document.getElementById('view-chrono').className = 'view-btn' + (view === 'chrono' ? ' active' : '');
  updateFilters();
}

async function loadSatellitePasses() {
  try {
    showStatus('Loading pass predictions...');
    var locationSlug = document.getElementById('location-select').value;
    var response = await fetch('/data/passes-' + locationSlug + '.json');
    if (!response.ok) throw new Error('Failed to load (HTTP ' + response.status + ')');
    var data = await response.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');
    allData = data;
    /* expand all by default */
    var entries = Object.entries(data.satellites);
    for (var i = 0; i < entries.length; i++) { expandedSats[entries[i][0]] = true; }
    document.getElementById('location-coords').textContent =
      data.location.lat.toFixed(2) + '\u00B0N, ' + Math.abs(data.location.lon).toFixed(2) + '\u00B0' + (data.location.lon < 0 ? 'W' : 'E');
    updateFilters();
    updateNextPassBanner();
    /* update countdown every second */
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(updateNextPassBanner, 1000);
    var genTime = new Date(data.generated_at);
    showStatus('Updated ' + genTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' \u2022 Refreshes every 6 hours');
  } catch (error) {
    showStatus('Error: ' + error.message, true);
  }
}

function toggleSatellite(noradId) {
  expandedSats[noradId] = !expandedSats[noradId];
  var header = document.querySelector('[data-sat="' + noradId + '"]');
  var container = document.querySelector('[data-passes="' + noradId + '"]');
  if (header && container) {
    if (expandedSats[noradId]) {
      header.classList.remove('collapsed');
      container.classList.remove('collapsed');
    } else {
      header.classList.add('collapsed');
      container.classList.add('collapsed');
    }
  }
}

function updateFilters() {
  if (!allData) return;
  var daysFilter = parseInt(document.getElementById('days-filter').value);
  var elevFilter = parseInt(document.getElementById('elevation-filter').value);
  var satFilter = document.getElementById('satellite-filter').value;
  document.getElementById('days-value').textContent = daysFilter;

  var now = new Date();
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
      var passEnd = new Date(pass.end);
      var passStart = new Date(pass.start);
      if (passEnd > now && passStart <= cutoffDate && pass.max_elevation >= elevFilter) {
        filteredPasses.push(pass);
        totalPasses++;
        if (pass.max_elevation >= 45) excellentPasses++;
      }
    }
    filteredData[noradId] = { name: satData.name, frequency: satData.frequency, passes: filteredPasses };
  }

  document.getElementById('stats-bar').innerHTML =
    '<div class="stat-item"><span class="stat-number">' + totalPasses + '</span><span class="stat-label">passes</span></div>' +
    '<div class="stat-item"><span class="stat-number" style="color:#1e40af">' + excellentPasses + '</span><span class="stat-label">excellent</span></div>' +
    '<div class="stat-item"><span class="stat-number">' + daysFilter + '</span><span class="stat-label">days</span></div>';

  if (currentView === 'chrono') {
    displayPassesChronological(filteredData);
  } else {
    displayPasses(filteredData);
  }
}

function createSkyChartSmall(pass, satColor) {
  var size = 60, cx = size/2, cy = size/2, r = size/2 - 4;

  var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg">';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r/2) + '" fill="none" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2,2"/>';

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
    svg += '<path d="' + pathData + '" fill="none" stroke="' + satColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

    var startAz = pass.track[0][0], startEl = pass.track[0][1];
    var startRad = (startAz - 90) * Math.PI / 180;
    var startDist = r * (90 - startEl) / 90;
    var startX = cx + startDist * Math.cos(startRad);
    var startY = cy + startDist * Math.sin(startRad);
    svg += '<circle cx="' + startX.toFixed(1) + '" cy="' + startY.toFixed(1) + '" r="3" fill="' + satColor + '"/>';

    var endAz = pass.track[pass.track.length-1][0], endEl = pass.track[pass.track.length-1][1];
    var endRad = (endAz - 90) * Math.PI / 180;
    var endDist = r * (90 - endEl) / 90;
    var endX = cx + endDist * Math.cos(endRad);
    var endY = cy + endDist * Math.sin(endRad);
    svg += '<circle cx="' + endX.toFixed(1) + '" cy="' + endY.toFixed(1) + '" r="2.5" fill="white" stroke="' + satColor + '" stroke-width="1.5"/>';
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

function displayPassesChronological(satellitesData) {
  var container = document.getElementById('passes-container');
  container.innerHTML = '';
  var colors = { '57166': '#3b82f6', '59051': '#8b5cf6' };
  var lat = allData.location.lat, lon = allData.location.lon;

  /* Collect all passes with satellite info */
  var allPasses = [];
  var entries = Object.entries(satellitesData);
  for (var i = 0; i < entries.length; i++) {
    var noradId = entries[i][0], satData = entries[i][1];
    var passes = satData.passes || [];
    for (var j = 0; j < passes.length; j++) {
      allPasses.push({
        pass: passes[j],
        noradId: noradId,
        satName: satData.name,
        satColor: colors[noradId] || '#6b7280'
      });
    }
  }

  /* Sort by start time */
  allPasses.sort(function(a, b) { return new Date(a.pass.start) - new Date(b.pass.start); });

  if (allPasses.length === 0) {
    container.innerHTML = '<div class="no-passes">No passes match current filters</div>';
    return;
  }

  var list = document.createElement('div');
  list.className = 'chrono-list';
  var currentDay = '';

  for (var k = 0; k < allPasses.length; k++) {
    var item = allPasses[k];
    var pass = item.pass;
    var dayKey = getDayKey(pass.start);
    var quality = getQuality(pass.max_elevation);
    var passDate = new Date(pass.start);
    var dn = getDayNight(passDate, lat, lon);
    var satClass = item.noradId === '57166' ? 'meteor-n2-3' : 'meteor-n2-4';

    if (dayKey !== currentDay) {
      currentDay = dayKey;
      var divider = document.createElement('div');
      divider.className = 'day-divider';
      divider.textContent = formatDate(pass.start);
      list.appendChild(divider);
    }

    var row = document.createElement('div');
    row.className = 'pass-row';
    var qualityLabel = quality === 'excellent' ? 'Excellent' : (quality === 'good' ? 'Good' : 'Fair');

    row.innerHTML =
      '<div class="pass-datetime"><div class="pass-date">' + formatDate(pass.start) + '</div><div class="pass-time">' + formatTime(pass.start) + '<span class="daynight ' + dn.type + '" title="' + dn.type + '">' + dn.icon + '</span></div></div>' +
      '<span class="sat-badge ' + satClass + '">' + item.satName.replace('Meteor-M ', '') + '</span>' +
      '<div class="sky-chart-small">' + createSkyChartSmall(pass, item.satColor) + '</div>' +
      '<div class="pass-details">' +
        '<div class="pass-stat"><div class="pass-stat-label">Max</div><div class="pass-stat-value">' + pass.max_elevation.toFixed(0) + '\u00B0</div></div>' +
        '<div class="pass-stat"><div class="pass-stat-label">Dur</div><div class="pass-stat-value">' + pass.duration + 'm</div></div>' +
        '<div class="pass-stat"><div class="pass-stat-label">End</div><div class="pass-stat-value">' + formatTime(pass.end) + '</div></div>' +
      '</div>' +
      '<span class="quality-badge ' + quality + '">' + qualityLabel + '</span>';

    list.appendChild(row);
  }

  container.appendChild(list);
}

function displayPasses(satellitesData) {
  var container = document.getElementById('passes-container');
  container.innerHTML = '';
  var colors = { '57166': '#3b82f6', '59051': '#8b5cf6' };
  var lat = allData.location.lat, lon = allData.location.lon;

  var sortedSats = Object.entries(satellitesData).sort(function(a,b) { return parseInt(a[0]) - parseInt(b[0]); });

  for (var i = 0; i < sortedSats.length; i++) {
    var noradId = sortedSats[i][0], satData = sortedSats[i][1];
    var passes = satData.passes || [];
    var satClass = noradId === '57166' ? 'meteor-n2-3' : 'meteor-n2-4';
    var satColor = colors[noradId] || '#6b7280';
    var isExpanded = expandedSats[noradId] !== false;

    var group = document.createElement('div');
    group.className = 'satellite-group';

    var header = document.createElement('div');
    header.className = 'satellite-header ' + satClass + (isExpanded ? '' : ' collapsed');
    header.setAttribute('data-sat', noradId);
    header.onclick = function(id) { return function() { toggleSatellite(id); }; }(noradId);
    header.innerHTML = '<span class="toggle-icon">\u25BC</span>' + satData.name + '<span class="freq">' + satData.frequency + '</span><span class="pass-count">' + passes.length + ' passes</span>';
    group.appendChild(header);

    var passesDiv = document.createElement('div');
    passesDiv.className = 'passes-container' + (isExpanded ? '' : ' collapsed');
    passesDiv.setAttribute('data-passes', noradId);

    if (passes.length === 0) {
      passesDiv.innerHTML = '<div class="no-passes">No passes match current filters</div>';
    } else {
      var list = document.createElement('div');
      list.className = 'passes-list';
      var currentDay = '';

      for (var j = 0; j < passes.length; j++) {
        var pass = passes[j];
        var dayKey = getDayKey(pass.start);
        var quality = getQuality(pass.max_elevation);
        var passDate = new Date(pass.start);
        var dn = getDayNight(passDate, lat, lon);

        if (dayKey !== currentDay) {
          currentDay = dayKey;
          var divider = document.createElement('div');
          divider.className = 'day-divider';
          divider.textContent = formatDate(pass.start);
          list.appendChild(divider);
        }

        var row = document.createElement('div');
        row.className = 'pass-row';
        var qualityLabel = quality === 'excellent' ? 'Excellent' : (quality === 'good' ? 'Good' : 'Fair');

        row.innerHTML =
          '<div class="pass-datetime"><div class="pass-date">' + formatDate(pass.start) + '</div><div class="pass-time">' + formatTime(pass.start) + '<span class="daynight ' + dn.type + '" title="' + dn.type + '">' + dn.icon + '</span></div></div>' +
          '<div class="sky-chart-small">' + createSkyChartSmall(pass, satColor) + '</div>' +
          '<div class="pass-details">' +
            '<div class="pass-stat"><div class="pass-stat-label">Max</div><div class="pass-stat-value">' + pass.max_elevation.toFixed(0) + '\u00B0</div></div>' +
            '<div class="pass-stat"><div class="pass-stat-label">Dur</div><div class="pass-stat-value">' + pass.duration + 'm</div></div>' +
            '<div class="pass-stat"><div class="pass-stat-label">End</div><div class="pass-stat-value">' + formatTime(pass.end) + '</div></div>' +
          '</div>' +
          '<span class="quality-badge ' + quality + '">' + qualityLabel + '</span>';

        list.appendChild(row);
      }
      passesDiv.appendChild(list);
    }
    group.appendChild(passesDiv);
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
