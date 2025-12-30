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
/* Full-page background animation - edge to edge */
#satellite-bg-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
}

#satellite-bg-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

#satellite-bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(255, 255, 255, 0.55);
  z-index: -1;
  pointer-events: none;
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