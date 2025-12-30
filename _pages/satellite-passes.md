---
layout: archive
title: "Meteor-M Weather Satellite Passes"
permalink: /satellite-passes/
author_profile: true
---

<link rel="stylesheet" href="/assets/css/satellite-passes.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/satellite.js/4.0.0/satellite.min.js"></script>

<div class="location-picker">
  <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Select your location</div>
  <div class="location-row">
    <select id="location-select" onchange="loadSatellitePasses()">
      <option value="london">London, UK</option>
      <option value="paris">Paris, France</option>
      <option value="boulder">Boulder, CO, USA</option>
      <option value="los-angeles">Los Angeles, CA, USA</option>
      <option value="reykjavik">Reykjavik, Iceland</option>
      <option value="brussels">Brussels, Belgium</option>
      <option value="lisbon">Lisbon, Portugal</option>
      <option value="biarritz">Biarritz, France</option>
      <option value="new-york">New York, NY, USA</option>
      <option value="custom" disabled style="display:none;">My Location</option>
    </select>
    <span class="or-divider">or</span>
    <button class="geolocate-btn" id="geolocate-btn" onclick="useMyLocation()">
      <span class="icon">&#x1F4CD;</span> Use my location
    </button>
  </div>
  <div id="location-coords" class="location-coords"></div>
</div>

<div id="next-pass-banner" class="next-pass-banner" style="display:none;"></div>

<div class="filters">
  <div class="filter-group">
    <span class="filter-label">Days ahead:</span>
    <input type="range" id="days-filter" min="1" max="7" value="3" oninput="updateFilters()">
    <span id="days-value" class="filter-value">3</span>
  </div>
  <div class="filter-group">
    <span class="filter-label">Min elevation:</span>
    <select id="elevation-filter" onchange="updateFilters()">
      <option value="0">0° (All)</option>
      <option value="10">10°+</option>
      <option value="20">20°+</option>
      <option value="30">30°+</option>
      <option value="45">45°+ (Best)</option>
    </select>
  </div>
  <div class="filter-group">
    <span class="filter-label">Satellite:</span>
    <select id="satellite-filter" onchange="updateFilters()">
      <option value="all">All satellites</option>
      <option value="57166">Meteor-M N2-3</option>
      <option value="59051">Meteor-M N2-4</option>
    </select>
  </div>
  <div class="view-toggle">
    <button class="view-btn active" id="view-grouped" onclick="setView('grouped')">By Satellite</button>
    <button class="view-btn" id="view-chrono" onclick="setView('chrono')">Chronological</button>
  </div>
</div>

<div id="stats-bar" class="stats-bar"></div>
<div id="status" class="status">Loading satellite pass predictions...</div>
<div id="passes-container"></div>

<script src="/assets/js/satellite-passes.js"></script>
