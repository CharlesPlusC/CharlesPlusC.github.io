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
.masthead,
.masthead__inner-wrap,
.masthead__menu,
.greedy-nav,
.greedy-nav__toggle,
.visible-links,
.hidden-links {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Navigation text black */
.greedy-nav a {
  color: #000 !important;
}

.masthead__menu-item a,
.masthead__menu-item--lg a {
  color: #000 !important;
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

/* Space stats strip - sits quietly at the foot of the landing viewport */
#space-stats {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 2.75rem;
  padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom));
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
  font-variant-numeric: tabular-nums;
}

#space-stats.is-ready { opacity: 1; }

.space-stat {
  text-align: center;
  line-height: 1.25;
}

.space-stat-value {
  display: block;
  font-size: 1.4rem;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: -0.01em;
}

.space-stat-label {
  display: block;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #6b7280;
  white-space: nowrap;
}

.space-stat-note {
  align-self: center;
  font-size: 0.6rem;
  color: #9ca3af;
  max-width: 11rem;
  line-height: 1.35;
  pointer-events: auto;
}

@media (max-width: 640px) {
  #space-stats { gap: 1.5rem; padding-bottom: calc(0.6rem + env(safe-area-inset-bottom)); }
  .space-stat-value { font-size: 1.1rem; }
  .space-stat-label { font-size: 0.55rem; letter-spacing: 0.06em; }
  .space-stat-note { display: none; }
}
</style>

<div id="satellite-bg-container">
  <canvas id="satellite-canvas"></canvas>
</div>
<div id="satellite-bg-overlay"></div>

<div id="space-stats" aria-live="polite">
  <div class="space-stat">
    <span class="space-stat-value" id="stat-launched">–</span>
    <span class="space-stat-label">Launched (30d)</span>
  </div>
  <div class="space-stat">
    <span class="space-stat-value" id="stat-reentered">–</span>
    <span class="space-stat-label">Reentered (30d)</span>
  </div>
  <div class="space-stat">
    <span class="space-stat-value" id="stat-onorbit">–</span>
    <span class="space-stat-label">Tracked on orbit</span>
  </div>
  <p class="space-stat-note" id="stat-note"></p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="/assets/js/satellite-drag-viz.js"></script>
<script src="/assets/js/space-stats.js"></script>