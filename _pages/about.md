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
/* Make navigation fully transparent on landing page */
.masthead {
  background: transparent !important;
  background-color: transparent !important;
  border-bottom: none !important;
  box-shadow: none !important;
}
.masthead__inner-wrap {
  background: transparent !important;
}

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
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.5) 70%, rgba(200, 210, 230, 0.6) 100%);
  z-index: -1;
  pointer-events: none;
}
</style>

<div id="satellite-bg-container">
  <canvas id="satellite-canvas"></canvas>
</div>
<div id="satellite-bg-overlay"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="/assets/js/satellite-drag-viz.js"></script>