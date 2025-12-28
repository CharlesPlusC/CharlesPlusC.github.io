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

<script>
// NOAA APT Satellites
const satellites = [
  { name: 'NOAA 15', frequency: '137.620 MHz', noradId: 25338 },
  { name: 'NOAA 18', frequency: '137.9125 MHz', noradId: 28654 },
  { name: 'NOAA 19', frequency: '137.100 MHz', noradId: 33591 }
];

// Fetch satellite passes from Skyfield API
async function fetchSatellitePasses(lat, lon, alt, days = 7) {
  try {
    // Determine API base URL (production or local development)
    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : '';

    const apiUrl = `${apiBase}/api/satellite_passes?lat=${lat}&lon=${lon}&alt=${alt}&days=${days}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown API error');
    }

    return data;
  } catch (error) {
    console.error('Error fetching satellite passes:', error);
    throw error;
  }
}

// Format ISO date string to readable format
function formatDateTime(isoString) {
  const date = new Date(isoString);
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

function formatTime(isoString) {
  const date = new Date(isoString);
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return date.toLocaleString('en-US', options);
}

// Display passes
function displayPasses(satellitesData) {
  const container = document.getElementById('passes-container');
  container.innerHTML = '';

  satellites.forEach((sat) => {
    const satData = satellitesData[sat.noradId];
    if (!satData) return;

    const passes = satData.passes || [];

    const section = document.createElement('div');
    section.className = 'satellite-section';

    const header = document.createElement('div');
    header.className = 'satellite-header';
    header.innerHTML = `<h3 style="margin: 0;">${satData.name} - ${satData.frequency}</h3>`;
    section.appendChild(header);

    if (satData.error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'no-passes';
      errorDiv.style.color = '#cc0000';
      errorDiv.textContent = `Error: ${satData.error}`;
      section.appendChild(errorDiv);
    } else if (passes.length === 0) {
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
              <td class="elevation">${pass.max_elevation}°</td>
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

  showStatus('Calculating passes using Skyfield...');

  try {
    const data = await fetchSatellitePasses(lat, lon, alt);
    displayPasses(data.satellites);
    showStatus(`Showing passes for next 7 days from location: ${lat.toFixed(4)}°, ${lon.toFixed(4)}° at ${alt}m altitude`);
  } catch (error) {
    showStatus(`Error calculating passes: ${error.message}`, true);
  }
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
  showStatus('Calculating satellite passes using Skyfield (Python library)...');

  try {
    await updatePasses();
  } catch (error) {
    showStatus('Error calculating satellite passes. Please refresh the page or try again later. Check browser console for details.', true);
  }
}

// Run on page load
init();
</script>

<div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 4px; font-size: 13px; color: #7f8c8d;">
  <strong>About this page:</strong><br>
  This page shows upcoming passes of NOAA APT (Automatic Picture Transmission) satellites that can be received with simple radio equipment.
  Passes are calculated using <a href="https://rhodesmill.org/skyfield/" target="_blank">Skyfield</a>, a professional-grade Python astronomy library that provides highly accurate satellite predictions.
  Fresh TLE (Two-Line Element) orbital data is fetched from <a href="https://celestrak.org" target="_blank">Celestrak</a> on each request.
  Only passes with maximum elevation above 10° are shown, as lower passes may have poor signal quality.
  Default location is set to London, UK. Use your browser's location or enter custom coordinates.<br><br>
  <strong>Technical:</strong> Pass predictions are calculated server-side using Skyfield's precise SGP4 propagator and astronomical calculations.
  This provides superior accuracy compared to client-side JavaScript implementations, especially for elevation angles and timing.
</div>
