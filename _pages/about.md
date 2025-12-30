---
permalink: /
title: ""
excerpt: "About me"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

<style>
/* Full-page background animation */
#satellite-bg-container {
  position: fixed !important;
  top: 56px !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: calc(100vh - 56px) !important;
  z-index: -1;
  overflow: hidden;
  margin: 0 !important;
  padding: 0 !important;
}

#satellite-bg-container canvas {
  display: block !important;
  width: 100vw !important;
  height: calc(100vh - 56px) !important;
}

#satellite-bg-overlay {
  position: fixed !important;
  top: 56px !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: calc(100vh - 56px) !important;
  background: rgba(255, 255, 255, 0.55);
  z-index: -1;
  pointer-events: none;
  margin: 0 !important;
  padding: 0 !important;
}
</style>

<div id="satellite-bg-container">
  <canvas id="satellite-canvas"></canvas>
</div>
<div id="satellite-bg-overlay"></div>

My work is about inferring causes from effects in satellite data. Instead of starting from a fully specified model and pushing it forward, I work backwards from precise orbit, tracking, and relative-motion data to reconstruct the forces, geometry, and dynamics that produced what we observe. That includes radiation pressure and thermal re-radiation, drag and attitude-dependent effects, and collective behaviour seen across satellite constellations.

If you're interested in collaboration, operational applications, or the underlying methods, feel free to get in touch.

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="/assets/js/satellite-drag-viz.js"></script>