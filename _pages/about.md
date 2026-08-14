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

/* Space stats bar.
   Frosted panel rather than bare text: the strip floats over the animation,
   whose colour varies, so the text needs its own ground to stay legible. */
#space-stats {
  position: fixed;
  bottom: 0;
  /* Pin both edges rather than width:100% - with content-box sizing the
     padding would otherwise push the bar wider than the viewport. */
  left: 0;
  right: 0;
  box-sizing: border-box;
  z-index: 2;
  padding: 0.8rem 1rem calc(0.65rem + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  backdrop-filter: blur(16px) saturate(150%);
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 -1px 28px rgba(15, 23, 42, 0.05);
  pointer-events: none;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

#space-stats.is-ready {
  opacity: 1;
  transform: none;
}

/* Where the blur is unavailable, lean on opacity instead. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  #space-stats { background: rgba(255, 255, 255, 0.94); }
}

@media (prefers-reduced-motion: reduce) {
  #space-stats { transition: opacity 0.2s ease; transform: none; }
}

.space-stats-row {
  display: flex;
  justify-content: center;
  max-width: 40rem;
  margin: 0 auto;
}

.space-stat {
  flex: 1 1 0;
  min-width: 0;
  box-sizing: border-box;
  text-align: center;
  padding: 0 0.9rem;
  border-left: 1px solid rgba(15, 23, 42, 0.09);
}

.space-stat:first-child { border-left: 0; }

.space-stat-value {
  display: block;
  font-size: clamp(1.35rem, 3vw, 1.7rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.022em;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.space-stat-label {
  display: block;
  margin-top: 0.32rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  color: #475569;
}

.space-stat-sub {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.625rem;
  line-height: 1.3;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.space-stats-source {
  margin: 0.5rem 0 0;
  text-align: center;
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
}

@media (max-width: 560px) {
  #space-stats { padding: 0.7rem 0.5rem calc(0.55rem + env(safe-area-inset-bottom)); }
  .space-stat { padding: 0 0.5rem; }
  .space-stat-label { font-size: 0.55rem; letter-spacing: 0.08em; }
  .space-stat-sub { font-size: 0.55rem; }
  .space-stats-source { display: none; }
}
</style>

<div id="satellite-bg-container">
  <canvas id="satellite-canvas"></canvas>
</div>
<div id="satellite-bg-overlay"></div>

<div id="space-stats" aria-live="polite">
  <div class="space-stats-row">
    <div class="space-stat">
      <span class="space-stat-value" id="stat-launched">–</span>
      <span class="space-stat-label">Launched</span>
      <span class="space-stat-sub">last 30 days</span>
    </div>
    <div class="space-stat">
      <span class="space-stat-value" id="stat-reentered">–</span>
      <span class="space-stat-label">Reentered</span>
      <span class="space-stat-sub">last 30 days</span>
    </div>
    <div class="space-stat">
      <span class="space-stat-value" id="stat-onorbit">–</span>
      <span class="space-stat-label">On orbit</span>
      <span class="space-stat-sub" id="stat-onorbit-sub">tracked objects</span>
    </div>
  </div>
  <p class="space-stats-source">Source: CelesTrak &middot; updated daily</p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="/assets/js/satellite-drag-viz.js"></script>
<script src="/assets/js/space-stats.js"></script>