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
  .location-input {
    margin: 20px 0;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .location-input input {
    padding: 8px 12px;
    margin: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .location-input button {
    padding: 8px 20px;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin: 5px;
  }

  .location-input button:hover {
    background: #0052a3;
  }

  .status {
    margin: 10px 0;
    padding: 10px;
    background: #e8f4f8;
    border-radius: 4px;
    font-size: 14px;
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

  .satellite-name {
    font-weight: 600;
    color: #2c3e50;
  }

  .frequency {
    font-family: monospace;
    color: #27ae60;
  }

  .elevation {
    font-weight: 500;
  }

  .duration {
    color: #7f8c8d;
  }

  .loading {
    text-align: center;
    padding: 40px;
    font-size: 16px;
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

<div class="location-input">
  <strong>Observer Location:</strong><br>
  <input type="number" id="lat" placeholder="Latitude" step="0.0001" value="51.5074">
  <input type="number" id="lon" placeholder="Longitude" step="0.0001" value="-0.1278">
  <input type="number" id="alt" placeholder="Altitude (m)" step="1" value="0">
  <button onclick="updatePasses()">Update Passes</button>
  <button onclick="getGeolocation()">Use My Location</button>
</div>

<div id="status" class="status">Loading satellite data...</div>

<div id="passes-container"></div>

<script src="https://cdn.jsdelivr.net/npm/satellite.js@5.0.0/dist/satellite.min.js"></script>

<script>
// NOAA APT Satellites
const satellites = [
  { name: 'NOAA 15', frequency: '137.620 MHz', noradId: 25338 },
  { name: 'NOAA 18', frequency: '137.9125 MHz', noradId: 28654 },
  { name: 'NOAA 19', frequency: '137.100 MHz', noradId: 33591 }
];

let tleData = {};

// Fetch TLE data from Celestrak
async function fetchTLEData() {
  try {
    const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle');
    const text = await response.text();
    const lines = text.trim().split('\n');

    for (let i = 0; i < lines.length; i += 3) {
      const name = lines[i].trim();
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];

      // Extract NORAD ID from line 1
      const noradId = parseInt(line1.substring(2, 7));

      tleData[noradId] = {
        name: name,
        tle1: line1,
        tle2: line2
      };
    }

    return true;
  } catch (error) {
    console.error('Error fetching TLE data:', error);
    return false;
  }
}

// Calculate passes for a satellite
function calculatePasses(satrec, observerLat, observerLon, observerAlt, daysAhead = 7) {
  const passes = [];
  const now = new Date();
  const endTime = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const minElevation = 10; // Minimum elevation in degrees
  const timeStep = 60; // Check every 60 seconds

  let inPass = false;
  let passStart = null;
  let passEnd = null;
  let maxElevation = 0;
  let maxElevationTime = null;

  for (let time = new Date(now); time <= endTime; time.setSeconds(time.getSeconds() + timeStep)) {
    const positionAndVelocity = window.satellite.propagate(satrec, time);

    if (positionAndVelocity.position && !positionAndVelocity.position.x) continue;

    const gmst = window.satellite.gstime(time);
    const observerGd = {
      latitude: observerLat * (Math.PI / 180),
      longitude: observerLon * (Math.PI / 180),
      height: observerAlt / 1000
    };

    const positionEci = positionAndVelocity.position;
    const lookAngles = window.satellite.ecfToLookAngles(
      observerGd,
      window.satellite.eciToEcf(positionEci, gmst)
    );

    const elevation = lookAngles.elevation * (180 / Math.PI);

    if (elevation >= minElevation) {
      if (!inPass) {
        inPass = true;
        passStart = new Date(time);
        maxElevation = elevation;
        maxElevationTime = new Date(time);
      }

      if (elevation > maxElevation) {
        maxElevation = elevation;
        maxElevationTime = new Date(time);
      }
    } else if (inPass) {
      inPass = false;
      passEnd = new Date(time);

      const duration = Math.round((passEnd - passStart) / 1000 / 60);

      passes.push({
        start: passStart,
        end: passEnd,
        maxElevation: Math.round(maxElevation * 10) / 10,
        duration: duration,
        maxElevationTime: maxElevationTime
      });

      maxElevation = 0;
    }
  }

  return passes;
}

// Format date and time
function formatDateTime(date) {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return date.toLocaleString('en-US', options);
}

function formatTime(date) {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return date.toLocaleString('en-US', options);
}

// Display passes
function displayPasses(allPasses) {
  const container = document.getElementById('passes-container');
  container.innerHTML = '';

  satellites.forEach((sat, index) => {
    const passes = allPasses[sat.noradId] || [];

    const section = document.createElement('div');
    section.className = 'satellite-section';

    const header = document.createElement('div');
    header.className = 'satellite-header';
    header.innerHTML = `<h3 style="margin: 0;">${sat.name} - ${sat.frequency}</h3>`;
    section.appendChild(header);

    if (passes.length === 0) {
      const noPassesDiv = document.createElement('div');
      noPassesDiv.className = 'no-passes';
      noPassesDiv.textContent = 'No passes above 10° elevation in the next 7 days';
      section.appendChild(noPassesDiv);
    } else {
      const table = document.createElement('table');
      table.className = 'pass-table';

      table.innerHTML = `
        <thead>
          <tr>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Max Elevation</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${passes.map(pass => `
            <tr>
              <td>${formatDateTime(pass.start)}</td>
              <td>${formatTime(pass.end)}</td>
              <td class="elevation">${pass.maxElevation}°</td>
              <td class="duration">${pass.duration} min</td>
            </tr>
          `).join('')}
        </tbody>
      `;

      section.appendChild(table);
    }

    container.appendChild(section);
  });
}

// Update passes based on observer location
async function updatePasses() {
  const lat = parseFloat(document.getElementById('lat').value);
  const lon = parseFloat(document.getElementById('lon').value);
  const alt = parseFloat(document.getElementById('alt').value);

  if (isNaN(lat) || isNaN(lon) || isNaN(alt)) {
    showStatus('Please enter valid coordinates', true);
    return;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    showStatus('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180', true);
    return;
  }

  showStatus('Calculating passes...');

  const allPasses = {};

  satellites.forEach(sat => {
    const tle = tleData[sat.noradId];
    if (tle) {
      const satrec = window.satellite.twoline2satrec(tle.tle1, tle.tle2);
      allPasses[sat.noradId] = calculatePasses(satrec, lat, lon, alt);
    }
  });

  displayPasses(allPasses);
  showStatus(`Showing passes for next 7 days from location: ${lat.toFixed(4)}°, ${lon.toFixed(4)}° at ${alt}m altitude`);
}

// Get geolocation
function getGeolocation() {
  if (!navigator.geolocation) {
    showStatus('Geolocation is not supported by your browser', true);
    return;
  }

  showStatus('Getting your location...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      document.getElementById('lat').value = position.coords.latitude.toFixed(4);
      document.getElementById('lon').value = position.coords.longitude.toFixed(4);
      document.getElementById('alt').value = Math.round(position.coords.altitude || 0);
      updatePasses();
    },
    (error) => {
      showStatus('Unable to get your location: ' + error.message, true);
    }
  );
}

// Show status message
function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = isError ? 'status error' : 'status';
}

// Initialize
async function init() {
  showStatus('Fetching satellite data from Celestrak...');

  const success = await fetchTLEData();

  if (success) {
    showStatus('Satellite data loaded. Calculating passes...');
    await updatePasses();
  } else {
    showStatus('Error loading satellite data. Please refresh the page.', true);
  }
}

// Run on page load
init();
</script>

<div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 4px; font-size: 13px; color: #7f8c8d;">
  <strong>About this page:</strong><br>
  This page shows upcoming passes of NOAA APT (Automatic Picture Transmission) satellites that can be received with simple radio equipment.
  Passes are calculated in real-time using current TLE data from <a href="https://celestrak.org" target="_blank">Celestrak</a>.
  Only passes with maximum elevation above 10° are shown, as lower passes may have poor signal quality.
  Default location is set to London, UK. Use your browser's location or enter custom coordinates.
</div>
