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
  <p>Atmospheric density derived from satellite orbital decay. Density spikes correlate with geomagnetic storms.</p>
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
