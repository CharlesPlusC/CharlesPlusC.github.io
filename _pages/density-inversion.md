---
layout: archive
title: "Thermospheric Density Explorer"
permalink: /density-inversion/
author_profile: true
---

<link rel="stylesheet" href="/assets/css/density-inversion.css">
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>

<div id="status" class="status">Loading density data...</div>

<div class="section">
  <div class="section-header">
    <span class="section-title">Density Activity</span>
    <div class="time-period-selector">
      <button class="period-btn" onclick="setHeatmapPeriod('week')">1 Week</button>
      <button class="period-btn" onclick="setHeatmapPeriod('month')">1 Month</button>
      <button class="period-btn active" onclick="setHeatmapPeriod('year')">1 Year</button>
    </div>
  </div>
  <div id="activity-grid" class="activity-grid"></div>
  <div class="grid-legend">
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
</div>

<div class="section">
  <div class="section-title">All Satellites Comparison</div>
  <div id="compare-chart" class="chart-container"></div>
</div>

<script src="/assets/js/density-inversion.js"></script>
