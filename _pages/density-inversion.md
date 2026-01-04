---
layout: archive
title: "Thermospheric Density Explorer"
permalink: /density-inversion/
author_profile: true
---

<link rel="stylesheet" href="/assets/css/density-inversion.css">
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>

<div id="status" class="status">Loading density data...</div>

<div id="space-weather-banner" class="space-weather-banner" data-level="quiet">
  <div class="space-weather-label">Current Space Weather</div>
  <div class="space-weather-content">
    <div class="space-weather-status">
      <span class="space-weather-dot"></span>
      <span class="space-weather-text">Loading...</span>
    </div>
    <div class="space-weather-meta">
      <span class="space-weather-chip space-weather-kp">Kp --</span>
      <span class="space-weather-time">Updated --</span>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header">
    <div class="view-toggle">
      <button class="view-btn active" data-view="activity" onclick="setDensityView('activity')">Density Activity</button>
      <button class="view-btn" data-view="waves" onclick="setDensityView('waves')">Normalized Density Waves</button>
    </div>
    <div class="time-period-selector">
      <button class="period-btn" onclick="setHeatmapPeriod('week')">1 Week</button>
      <button class="period-btn" onclick="setHeatmapPeriod('month')">1 Month</button>
      <button class="period-btn active" onclick="setHeatmapPeriod('year')">1 Year</button>
    </div>
  </div>
  <div id="density-activity" class="density-view">
    <div id="activity-grid" class="activity-grid"></div>
    <div class="legends-row">
      <div class="grid-legend">
        <span class="legend-title">Density:</span>
        <span class="legend-label">Low</span>
        <div class="legend-boxes">
          <div class="legend-box" style="background: #161b22;"></div>
          <div class="legend-box" style="background: #0e4429;"></div>
          <div class="legend-box" style="background: #006d32;"></div>
          <div class="legend-box" style="background: #26a641;"></div>
          <div class="legend-box" style="background: #39d353;"></div>
        </div>
        <span class="legend-label">High</span>
      </div>
      <div class="grid-legend">
        <span class="legend-title">Kp Index:</span>
        <div class="legend-boxes">
          <div class="legend-box" style="background: #22c55e;"></div>
          <span class="legend-label">Quiet</span>
        </div>
        <div class="legend-boxes">
          <div class="legend-box" style="background: #eab308;"></div>
          <span class="legend-label">Active</span>
        </div>
        <div class="legend-boxes">
          <div class="legend-box" style="background: #f97316;"></div>
          <span class="legend-label">Storm</span>
        </div>
        <div class="legend-boxes">
          <div class="legend-box" style="background: #ef4444;"></div>
          <span class="legend-label">Severe</span>
        </div>
      </div>
    </div>
  </div>
  <div id="density-waves" class="density-view is-hidden">
    <div class="joy-division-card">
      <div class="joy-division-meta">Normalized 0-1 per satellite. <span id="joy-division-window">1 year window.</span></div>
      <div id="joy-division-plot" class="joy-division-plot"></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Satellite Details</div>
  <div id="satellite-cards" class="satellite-cards"></div>
</div>

<div class="page-blurb">
  <p>These panels show TLE-derived thermospheric density estimates for each satellite along with the current Kp geomagnetic index. The grid and plots highlight day-to-day variability and recent trends so you can connect space weather activity to drag-driven density changes. Density is computed from Celestrak TLEs, and Kp is sourced from GFZ Potsdam.</p>
</div>

<script src="/assets/js/density-inversion.js"></script>
