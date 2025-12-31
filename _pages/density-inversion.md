---
layout: archive
title: "Thermospheric Density Explorer"
permalink: /density-inversion/
author_profile: true
---

<link rel="stylesheet" href="/assets/css/density-inversion.css">
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>

<div class="stats-bar">
  <div class="stat-item">
    <span id="stat-kp" class="stat-number">--</span>
    <span class="stat-label">Current Kp Index</span>
  </div>
  <div class="stat-item">
    <span class="stat-number">5</span>
    <span class="stat-label">Satellites Tracked</span>
  </div>
  <div class="stat-item">
    <span id="stat-activity" class="stat-number">--</span>
    <span class="stat-label">Space Weather</span>
  </div>
</div>

<div id="status" class="status">Loading density data...</div>

<div class="section">
  <div class="section-title">Density Activity</div>
  <div class="time-period-selector">
    <span class="period-label">Time Period:</span>
    <button class="period-btn" onclick="setHeatmapPeriod('week')">1 Week</button>
    <button class="period-btn active" onclick="setHeatmapPeriod('month')">1 Month</button>
    <button class="period-btn" onclick="setHeatmapPeriod('year')">1 Year</button>
  </div>
  <div id="activity-grid" class="activity-grid"></div>
  <div class="grid-legend">
    <span class="legend-label">Less</span>
    <div class="legend-boxes">
      <div class="legend-box" style="background: #161b22;"></div>
      <div class="legend-box" style="background: #0e4429;"></div>
      <div class="legend-box" style="background: #006d32;"></div>
      <div class="legend-box" style="background: #26a641;"></div>
      <div class="legend-box" style="background: #39d353;"></div>
    </div>
    <span class="legend-label">More</span>
  </div>
</div>

<div class="section">
  <div class="section-title">All Satellites Comparison</div>
  <div class="kp-scale">
    <div class="kp-scale-bar">
      <div class="kp-segment kp-quiet"><span>Quiet</span><small>Kp 0-3</small></div>
      <div class="kp-segment kp-active"><span>Active</span><small>Kp 4</small></div>
      <div class="kp-segment kp-storm"><span>Storm</span><small>Kp 5-6</small></div>
      <div class="kp-segment kp-severe"><span>Severe</span><small>Kp 7-9</small></div>
    </div>
  </div>
  <div id="compare-chart" class="chart-container"></div>
</div>

<script src="/assets/js/density-inversion.js"></script>
