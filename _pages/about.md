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
.hero-section {
  position: relative;
  min-height: 400px;
  margin: -1.5em -1.5em 2em -1.5em;
  padding: 3em 2em;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.hero-background canvas {
  width: 100% !important;
  height: 100% !important;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.7) 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 700px;
}

.hero-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1rem 0;
  letter-spacing: -0.03em;
  line-height: 1.2;
  border: none;
  padding: 0;
}

.hero-content p {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #334155;
  margin-bottom: 1.5rem;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white !important;
  text-decoration: none !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}

.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
  color: white !important;
  background-size: 100% 0 !important;
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 350px;
    padding: 2em 1.5em;
    margin: -1.5em -1em 2em -1em;
  }
  .hero-content h2 {
    font-size: 1.5rem;
  }
  .hero-content p {
    font-size: 1rem;
  }
}
</style>

<div class="hero-section">
  <div class="hero-background">
    <canvas id="satellite-canvas"></canvas>
  </div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h2>Inferring Causes from Effects in Satellite Data</h2>
    <p>I work backwards from precise orbit, tracking, and relative-motion data to reconstruct the forces, geometry, and dynamics that produced what we observe. That includes radiation pressure and thermal re-radiation, drag and attitude-dependent effects, and collective behaviour seen across satellite constellations.</p>
    <a href="mailto:charles.constant.22@ucl.ac.uk" class="hero-cta">
      <i class="fas fa-envelope"></i> Get in Touch
    </a>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="/assets/js/satellite-drag-viz.js"></script>