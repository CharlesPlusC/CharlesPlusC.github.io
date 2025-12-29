---
layout: archive
title: "TLE Density Inversion"
permalink: /density-inversion/
author_profile: true
header:
  overlay_image: NASAreentry.png
  overlay_filter: 0.3
---

<link rel="stylesheet" href="/assets/css/density-inversion.css">
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>

<div class="density-header">
  <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Atmospheric Density from TLE Decay Analysis</div>
  <p style="font-size: 13px; margin: 10px 0 0 0; opacity: 0.85;">
    Orbit-effective atmospheric density derived from Two-Line Element (TLE) mean motion derivatives.
    Updated every 8 hours with latest TLE data from Space-Track.
  </p>
</div>

<div class="satellite-selector">
  <span class="selector-label">Select Satellite:</span>
  <div class="satellite-buttons" id="satellite-buttons">
    <!-- Buttons will be generated dynamically -->
  </div>
</div>

<div class="info-panel" id="satellite-info">
  <div class="info-row">
    <span class="info-label">NORAD ID:</span>
    <span class="info-value" id="info-norad">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Name:</span>
    <span class="info-value" id="info-name">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Drag Coefficient (Cd):</span>
    <span class="info-value" id="info-cd">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Area (m²):</span>
    <span class="info-value" id="info-area">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Mass (kg):</span>
    <span class="info-value" id="info-mass">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Data Points:</span>
    <span class="info-value" id="info-points">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Last Updated:</span>
    <span class="info-value" id="info-updated">--</span>
  </div>
</div>

<div id="status" class="status">Loading density data...</div>

<div class="chart-container">
  <div id="density-chart" class="chart"></div>
</div>

<div class="chart-container">
  <div id="altitude-chart" class="chart"></div>
</div>

<div class="method-info">
  <h3>Method</h3>
  <p>
    The atmospheric density is estimated from the secular decay rate of the satellite's mean motion,
    derived from Two-Line Elements (TLEs). The relationship between mean motion derivative and
    atmospheric density is given by:
  </p>
  <div class="equation">
    ρ = (2 · M · ṅ) / (3 · C<sub>d</sub> · A · n · v)
  </div>
  <p>where:</p>
  <ul>
    <li><strong>ρ</strong> - Atmospheric density (kg/m³)</li>
    <li><strong>M</strong> - Satellite mass (kg)</li>
    <li><strong>ṅ</strong> - Mean motion derivative (rad/s²)</li>
    <li><strong>C<sub>d</sub></strong> - Drag coefficient (typically 2.2)</li>
    <li><strong>A</strong> - Cross-sectional area (m²)</li>
    <li><strong>n</strong> - Mean motion (rad/s)</li>
    <li><strong>v</strong> - Orbital velocity (m/s)</li>
  </ul>
  <p>
    <strong>Note:</strong> This provides an "orbit-effective" density which represents an average
    over the orbit. Actual local densities vary with altitude, latitude, and time of day.
  </p>
</div>

<script src="/assets/js/density-inversion.js"></script>
