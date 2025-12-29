---
permalink: /
title: "Spaceflight Dynamics and Geodesy Research Student"
excerpt: "About me"
author_profile: true
header:
  image: NASAreentry.png
  height: 120px
redirect_from:
  - /about/
  - /about.html
---

My work is about inferring causes from effects in satellite data. Instead of starting from a fully specified model and pushing it forward, I work backwards from precise orbit, tracking, and relative-motion data to reconstruct the forces, geometry, and dynamics that produced what we observe. That includes radiation pressure and thermal re-radiation, drag and attitude-dependent effects, and collective behaviour seen across satellite constellations.

If you're interested in collaboration, operational applications, or the underlying methods, feel free to get in touch.

<link rel="stylesheet" href="/assets/css/satellite-drag-viz.css">

<div id="drag-viz-container">
  <div id="viz-canvas-wrapper">
    <canvas id="satellite-canvas"></canvas>
  </div>
  <div id="viz-controls">
    <div class="control-group">
      <label>Flow Velocity</label>
      <input type="range" id="velocity-slider" min="5000" max="9000" value="7000" step="100">
      <span id="velocity-value">7000 m/s</span>
    </div>
    <div id="drag-graph-container">
      <canvas id="drag-graph"></canvas>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="/assets/js/satellite-drag-viz.js"></script>