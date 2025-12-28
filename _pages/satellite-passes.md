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
  .location-info {
    margin: 20px 0;
    padding: 15px;
    background: #e8f4f8;
    border-radius: 8px;
    text-align: center;
  }

  .status {
    margin: 10px 0;
    padding: 10px;
    background: #e8f4f8;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
  }

  .error {
    background: #ffe8e8;
    color: #cc0000;
  }

  .pass-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .pass-table th {
    background: #2c3e50;
    color: white;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
  }

  .pass-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #ecf0f1;
    font-size: 13px;
  }

  .pass-table tr:hover {
    background: #f8f9fa;
  }

  .elevation {
    font-weight: 500;
  }

  .duration {
    color: #7f8c8d;
  }

  .satellite-section {
    margin-bottom: 40px;
  }

  .satellite-header {
    background: #34495e;
    color: white;
    padding: 15px;
    margin: 20px 0 0 0;
    border-radius: 4px 4px 0 0;
  }

  .no-passes {
    padding: 20px;
    text-align: center;
    color: #7f8c8d;
    background: #f8f9fa;
    border-radius: 0 0 4px 4px;
  }
</style>

<div id="location-info" class="location-info">
  <strong>Select Location:</strong><br>
  <select id="location-select" onchange="loadSatellitePasses()" style="padding: 8px 12px; font-size: 14px; margin: 10px 0; border-radius: 4px; border: 1px solid #ddd;">
    <option value="london">London, UK</option>
    <option value="paris">Paris, France</option>
    <option value="boulder">Boulder, CO, USA</option>
    <option value="los-angeles">Los Angeles, CA, USA</option>
    <option value="reykjavik">Reykjavik, Iceland</option>
    <option value="brussels">Brussels, Belgium</option>
    <option value="lisbon">Lisbon, Portugal</option>
    <option value="biarritz">Biarritz, France</option>
    <option value="new-york">New York, NY, USA</option>
  </select><br>
  <small id="location-coords"></small>
</div>

<div id="status" class="status">Loading satellite pass predictions...</div>

<div id="passes-container"></div>

<script>
/* Fetch pre-calculated satellite passes from static JSON file */
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
      loc.name + ' \u2022 ' + loc.lat.toFixed(4) + '\u00B0, ' + loc.lon.toFixed(4) + '\u00B0 \u2022 ' + loc.alt + 'm elevation';
    displayPasses(data.satellites);
    var genTime = new Date(data.generated_at);
    var timeStr = genTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    showStatus('Pass predictions generated at ' + timeStr + '. Updates automatically every 6 hours.');
  } catch (error) {
    showStatus('Error: ' + error.message + '. Please refresh the page or try again later.', true);
    console.error('Error loading satellite passes:', error);
  }
}

function formatDateTime(isoString) {
  var date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function formatTime(isoString) {
  var date = new Date(isoString);
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
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
    var section = document.createElement('div');
    section.className = 'satellite-section';
    var header = document.createElement('div');
    header.className = 'satellite-header';
    header.innerHTML = '<h3 style="margin: 0;">' + satData.name + ' - ' + satData.frequency + '</h3>';
    section.appendChild(header);
    if (satData.error) {
      var errorDiv = document.createElement('div');
      errorDiv.className = 'no-passes';
      errorDiv.style.color = '#cc0000';
      errorDiv.textContent = 'Error: ' + satData.error;
      section.appendChild(errorDiv);
    } else if (passes.length === 0) {
      var noPassesDiv = document.createElement('div');
      noPassesDiv.className = 'no-passes';
      noPassesDiv.textContent = 'No passes above 10\u00B0 elevation in the next 7 days';
      section.appendChild(noPassesDiv);
    } else {
      var table = document.createElement('table');
      table.className = 'pass-table';
      var tableHTML = '<thead><tr><th>Start Time</th><th>End Time</th><th>Max Elevation</th><th>Duration</th></tr></thead><tbody>';
      for (var j = 0; j < passes.length; j++) {
        var pass = passes[j];
        tableHTML += '<tr><td>' + formatDateTime(pass.start) + '</td><td>' + formatTime(pass.end) + '</td><td class="elevation">' + pass.max_elevation + '\u00B0</td><td class="duration">' + pass.duration + ' min</td></tr>';
      }
      tableHTML += '</tbody>';
      table.innerHTML = tableHTML;
      section.appendChild(table);
    }
    container.appendChild(section);
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

<div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 4px; font-size: 13px; color: #7f8c8d;">
  <strong>About this page:</strong><br>
  This page shows upcoming passes of NOAA APT (Automatic Picture Transmission) satellites that can be received with simple radio equipment.
  Pass predictions are calculated using <a href="https://rhodesmill.org/skyfield/" target="_blank">Skyfield</a>, a professional-grade Python astronomy library.
  Fresh TLE (Two-Line Element) orbital data is fetched from <a href="https://celestrak.org" target="_blank">Celestrak</a> and predictions are recalculated automatically every 6 hours via GitHub Actions.
  Only passes with maximum elevation above 10° are shown, as lower passes may have poor signal quality.<br><br>
  <strong>Technical:</strong> This page is completely static - no backend API required. All calculations are performed by a GitHub Actions workflow using Skyfield's precise SGP4 propagator and saved to a JSON file. The page simply displays the pre-calculated results. Updates happen automatically in the background.
</div>
