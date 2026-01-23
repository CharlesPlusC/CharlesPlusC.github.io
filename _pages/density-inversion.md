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

<div id="aurora-activity-bar" class="aurora-activity-bar">
  <div class="aurora-bar-header">
    <span class="aurora-bar-title">Real-Time Solar Wind</span>
    <span class="aurora-bar-update" id="aurora-update-time">Loading...</span>
  </div>
  <div class="aurora-bar-content">
    <div class="aurora-metrics">
      <div class="aurora-metric">
        <div class="aurora-metric-label">Bt</div>
        <div class="aurora-metric-value" id="aurora-bt">--</div>
        <div class="aurora-metric-unit">nT</div>
      </div>
      <div class="aurora-metric bz-metric" id="bz-container">
        <div class="aurora-metric-label">Bz</div>
        <div class="aurora-metric-value" id="aurora-bz">--</div>
        <div class="aurora-metric-unit">nT</div>
      </div>
      <div class="aurora-metric">
        <div class="aurora-metric-label">Speed</div>
        <div class="aurora-metric-value" id="aurora-speed">--</div>
        <div class="aurora-metric-unit">km/s</div>
      </div>
      <div class="aurora-metric">
        <div class="aurora-metric-label">Density</div>
        <div class="aurora-metric-value" id="aurora-density">--</div>
        <div class="aurora-metric-unit">p/cm³</div>
      </div>
    </div>
    <div class="aurora-chart-container">
      <div class="aurora-chart-label">Bz (24h)</div>
      <div id="bz-chart" class="bz-chart"></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header">
    <div class="view-toggle">
      <button class="view-btn" data-view="activity" onclick="setDensityView('activity')">Density Activity</button>
      <button class="view-btn active" data-view="waves" onclick="setDensityView('waves')">Normalized Density Waves</button>
      <button class="view-btn" data-view="absolute" onclick="setDensityView('absolute')">Absolute Densities</button>
    </div>
    <div class="time-period-selector">
      <button class="period-btn" onclick="setHeatmapPeriod('week')">1 Week</button>
      <button class="period-btn" onclick="setHeatmapPeriod('month')">1 Month</button>
      <button class="period-btn active" onclick="setHeatmapPeriod('year')">1 Year</button>
    </div>
  </div>
  <div id="density-activity" class="density-view is-hidden">
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
  <div id="density-waves" class="density-view">
    <div class="joy-division-card">
      <div class="joy-division-meta">Normalized 0-1 per satellite. <span id="joy-division-window">1 year window.</span></div>
      <div id="joy-division-plot" class="joy-division-plot"></div>
      <div id="joy-division-kp" class="joy-division-kp-row"></div>
    </div>
  </div>
  <div id="density-absolute" class="density-view is-hidden">
    <p class="section-note">Gray background shows Kp intensity. Hover for details. Absolute values are INDICATIVE guesses.</p>
    <div id="combined-density-plot" style="width:100%; height:500px;"></div>
  </div>
</div>

<div id="drag-stats" class="drag-stats-panel">
  <div class="stats-header">
    <span class="stats-title">Live Drag Trends</span>
    <span class="stats-update" id="stats-update-time"></span>
  </div>
  <div class="stats-grid">
    <div class="stats-section">
      <div class="stats-section-title">Mean Drag Change</div>
      <div class="stats-trend-row" id="drag-trends">
        <div class="trend-item">
          <span class="trend-period">6h</span>
          <span class="trend-value" id="trend-6h">--</span>
        </div>
        <div class="trend-item">
          <span class="trend-period">24h</span>
          <span class="trend-value" id="trend-24h">--</span>
        </div>
        <div class="trend-item">
          <span class="trend-period">48h</span>
          <span class="trend-value" id="trend-48h">--</span>
        </div>
        <div class="trend-item">
          <span class="trend-period">72h</span>
          <span class="trend-value" id="trend-72h">--</span>
        </div>
      </div>
    </div>
    <div class="stats-section stats-section-wide">
      <div class="stats-section-title">Kp vs Normalized Drag (30 days)</div>
      <div id="kp-drag-correlation-plot" class="correlation-plot"></div>
    </div>
  </div>
</div>

<div class="page-blurb">
  <p>These panels show rough thermospheric density estimates derived from TLE orbital decay rates for 33 debris objects spanning 350-650 km altitude. The normalized "waves" view highlights relative variability across satellites, while the combined plot shows indicative absolute values (treat with caution - ballistic coefficients are guessed). Kp index from GFZ Potsdam and real-time solar wind from NOAA SWPC provide space weather context.</p>
</div>

<script src="/assets/js/density-inversion.js"></script>
