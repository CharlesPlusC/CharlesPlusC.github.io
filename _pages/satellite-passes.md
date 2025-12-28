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
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: white;
    border-radius: 12px 12px 0 0;
    font-size: 18px;
    font-weight: 600;
  }
  .satellite-name .freq {
    font-size: 13px;
    font-weight: 400;
    opacity: 0.8;
    background: rgba(255,255,255,0.15);
    padding: 4px 10px;
    border-radius: 20px;
  }
  .passes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 0 0 12px 12px;
  }
  .pass-card {
    background: white;
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border-left: 4px solid #94a3b8;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .pass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .pass-card.excellent { border-left-color: #22c55e; }
  .pass-card.good { border-left-color: #eab308; }
  .pass-card.fair { border-left-color: #f97316; }
  .pass-date {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 6px;
  }
  .pass-time {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;
  }
  .pass-stats {
    display: flex;
    gap: 16px;
  }
  .pass-stat {
    flex: 1;
  }
  .pass-stat-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
    margin-bottom: 2px;
  }
  .pass-stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #334155;
  }
  .pass-stat-value.elev-excellent { color: #16a34a; }
  .pass-stat-value.elev-good { color: #ca8a04; }
  .pass-stat-value.elev-fair { color: #ea580c; }
  .quality-badge {
    display: inline-block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    margin-left: 8px;
  }
  .quality-badge.excellent { background: #dcfce7; color: #166534; }
  .quality-badge.good { background: #fef9c3; color: #854d0e; }
  .quality-badge.fair { background: #ffedd5; color: #9a3412; }
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
    color: #64748b;
    padding: 8px 0 4px 4px;
    border-bottom: 1px solid #e2e8f0;
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

<div id="status" class="status">Loading satellite pass predictions...</div>

<div id="passes-container"></div>

<script>
async function loadSatellitePasses() {
  try {
    showStatus('Loading pass predictions...');
    var locationSlug = document.getElementById('location-select').value;
    var response = await fetch('/data/passes-' + locationSlug + '.json');
    if (!response.ok) {
      throw new Error('Failed to load pass data (HTTP ' + response.status + ')');
    }
    var data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Unknown error in passes data');
    }
    var loc = data.location;
    document.getElementById('location-coords').textContent =
      loc.lat.toFixed(2) + '\u00B0N, ' + Math.abs(loc.lon).toFixed(2) + '\u00B0' + (loc.lon < 0 ? 'W' : 'E') + ' \u2022 ' + loc.alt + 'm elevation';
    displayPasses(data.satellites);
    var genTime = new Date(data.generated_at);
    var timeStr = genTime.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
    showStatus('Updated ' + timeStr + ' \u2022 Refreshes every 6 hours');
  } catch (error) {
    showStatus('Error: ' + error.message, true);
    console.error('Error loading satellite passes:', error);
  }
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
    var satData = sortedSats[i][1];
    var passes = satData.passes || [];

    var group = document.createElement('div');
    group.className = 'satellite-group';

    var header = document.createElement('div');
    header.className = 'satellite-name';
    header.innerHTML = satData.name + '<span class="freq">' + satData.frequency + '</span>';
    group.appendChild(header);

    if (satData.error) {
      var errorDiv = document.createElement('div');
      errorDiv.className = 'no-passes';
      errorDiv.style.color = '#dc2626';
      errorDiv.textContent = 'Error: ' + satData.error;
      group.appendChild(errorDiv);
    } else if (passes.length === 0) {
      var noPassesDiv = document.createElement('div');
      noPassesDiv.className = 'no-passes';
      noPassesDiv.textContent = 'No passes above 10\u00B0 elevation in the next 7 days';
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
        card.className = 'pass-card ' + quality;

        var qualityLabel = quality === 'excellent' ? 'Excellent' : (quality === 'good' ? 'Good' : 'Fair');

        card.innerHTML =
          '<div class="pass-time">' + formatTime(pass.start) + ' \u2013 ' + formatTime(pass.end) +
          '<span class="quality-badge ' + quality + '">' + qualityLabel + '</span></div>' +
          '<div class="pass-stats">' +
            '<div class="pass-stat"><div class="pass-stat-label">Max Elevation</div><div class="pass-stat-value elev-' + quality + '">' + pass.max_elevation.toFixed(1) + '\u00B0</div></div>' +
            '<div class="pass-stat"><div class="pass-stat-label">Duration</div><div class="pass-stat-value">' + pass.duration + ' min</div></div>' +
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
  <strong>About this page:</strong>
  This page shows upcoming passes of NOAA APT (Automatic Picture Transmission) satellites that can be received with simple radio equipment.
  Pass predictions are calculated using <a href="https://rhodesmill.org/skyfield/" target="_blank">Skyfield</a> with TLE data from <a href="https://celestrak.org" target="_blank">Celestrak</a>.
  <br><br>
  <strong>Quality Guide:</strong>
  <span style="color: #16a34a;">Excellent (45°+)</span> = overhead pass, best signal quality.
  <span style="color: #ca8a04;">Good (25-45°)</span> = reliable reception.
  <span style="color: #ea580c;">Fair (10-25°)</span> = lower signal, may have noise.
</div>
