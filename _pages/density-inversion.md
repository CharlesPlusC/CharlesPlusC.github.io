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

<div class="density-note">
  <p><strong>Note:</strong> Absolute density values are approximate. These plots illustrate the <em>relative</em> response of thermospheric density to space weather conditions. The Kp index measures geomagnetic activity on a 0-9 scale, where higher values indicate stronger disturbances from solar wind interactions.</p>
</div>

<div id="status" class="status">Loading data...</div>

<div id="satellite-cards"></div>

<div id="detail-modal" class="detail-modal">
  <div class="detail-content">
    <div class="detail-header">
      <h3 id="detail-title">Satellite Details</h3>
      <button class="detail-close" onclick="closeDetail()">&times;</button>
    </div>
    <div id="detail-chart" class="detail-chart"></div>
    <div id="detail-altitude-chart" class="detail-altitude-chart"></div>
  </div>
</div>

<script src="/assets/js/density-inversion.js"></script>
