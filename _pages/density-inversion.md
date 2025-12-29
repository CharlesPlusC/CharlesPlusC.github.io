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
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>

<div class="density-header">
  <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Atmospheric Density from TLE Decay Analysis</div>
  <p style="font-size: 13px; margin: 10px 0 0 0; opacity: 0.85;">
    Orbit-effective atmospheric density derived from Two-Line Element (TLE) mean motion derivatives.
    Updated every 8 hours.
  </p>
</div>

<div class="satellite-selector">
  <span class="selector-label">Select Satellite:</span>
  <div class="satellite-buttons" id="satellite-buttons"></div>
</div>

<div class="info-panel" id="satellite-info">
  <div class="info-row">
    <span class="info-label">NORAD ID</span>
    <span class="info-value" id="info-norad">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Name</span>
    <span class="info-value" id="info-name">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Perigee Altitude</span>
    <span class="info-value" id="info-perigee">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Data Points</span>
    <span class="info-value" id="info-points">--</span>
  </div>
  <div class="info-row">
    <span class="info-label">Date Range</span>
    <span class="info-value" id="info-range">--</span>
  </div>
</div>

<div id="status" class="status">Loading density data...</div>

<div class="chart-container">
  <div id="density-chart" class="chart"></div>
</div>

<div class="chart-container">
  <div id="altitude-chart" class="chart"></div>
</div>

<script src="/assets/js/density-inversion.js"></script>
