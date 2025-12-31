---
layout: archive
title: "Thermospheric Density Explorer"
permalink: /density-inversion/
author_profile: true
---

<link rel="stylesheet" href="/assets/css/density-inversion.css">
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>

<!-- Hero Stats Section -->
<div class="hero-stats">
  <div class="hero-stat">
    <div class="hero-stat-icon">🛰️</div>
    <div class="hero-stat-value" id="stat-satellites">5</div>
    <div class="hero-stat-label">Satellites Tracked</div>
  </div>
  <div class="hero-stat">
    <div class="hero-stat-icon">🌡️</div>
    <div class="hero-stat-value" id="stat-kp">--</div>
    <div class="hero-stat-label">Current Kp Index</div>
  </div>
  <div class="hero-stat">
    <div class="hero-stat-icon">⚡</div>
    <div class="hero-stat-value" id="stat-activity">--</div>
    <div class="hero-stat-label">Space Weather</div>
  </div>
</div>

<!-- Navigation Tabs -->
<div class="viz-tabs">
  <button class="viz-tab active" onclick="switchTab('overview')">
    <span class="tab-icon">📈</span>
    <span class="tab-text">Overview</span>
  </button>
  <button class="viz-tab" onclick="switchTab('heatmap')">
    <span class="tab-icon">🗺️</span>
    <span class="tab-text">Activity Grid</span>
  </button>
  <button class="viz-tab" onclick="switchTab('compare')">
    <span class="tab-icon">⚖️</span>
    <span class="tab-text">Compare All</span>
  </button>
</div>

<!-- Tab Content -->
<div id="tab-overview" class="tab-content active">
  <div class="section-header">
    <h2>Live Satellite Tracking</h2>
    <p>Thermospheric density derived from TLE orbital decay analysis</p>
  </div>

  <div class="kp-scale">
    <div class="kp-scale-title">Geomagnetic Activity Scale</div>
    <div class="kp-scale-bar">
      <div class="kp-segment kp-quiet"><span>Quiet</span><small>Kp 0-3</small></div>
      <div class="kp-segment kp-active"><span>Active</span><small>Kp 4</small></div>
      <div class="kp-segment kp-storm"><span>Storm</span><small>Kp 5-6</small></div>
      <div class="kp-segment kp-severe"><span>Severe</span><small>Kp 7-9</small></div>
    </div>
  </div>

  <div id="satellite-cards"></div>
</div>

<div id="tab-heatmap" class="tab-content">
  <div class="section-header">
    <h2>Density Activity Grid</h2>
    <p>GitHub-style visualization of atmospheric density variations</p>
  </div>

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

<div id="tab-compare" class="tab-content">
  <div class="section-header">
    <h2>All Satellites Comparison</h2>
    <p>Compare density measurements across all tracked satellites</p>
  </div>
  <div class="chart-container">
    <div id="compare-chart" class="full-chart"></div>
  </div>
</div>

<div id="status" class="status">Loading data...</div>

<!-- Detail Modal -->
<div id="detail-modal" class="detail-modal">
  <div class="detail-content">
    <div class="detail-header">
      <h3 id="detail-title">Satellite Details</h3>
      <button class="detail-close" onclick="closeDetail()">&times;</button>
    </div>
    <div class="detail-stats">
      <div class="detail-stat">
        <div class="detail-stat-label">Current Altitude</div>
        <div class="detail-stat-value" id="detail-altitude">--</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Avg Density (30d)</div>
        <div class="detail-stat-value" id="detail-density">--</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Orbit Decay Rate</div>
        <div class="detail-stat-value" id="detail-decay">--</div>
      </div>
    </div>
    <div id="detail-chart" class="detail-chart"></div>
    <div id="detail-altitude-chart" class="detail-altitude-chart"></div>
  </div>
</div>

<script src="/assets/js/density-inversion.js"></script>
