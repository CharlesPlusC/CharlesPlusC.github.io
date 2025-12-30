/**
 * Satellite Drag & SRP Visualization
 * Elegant flowing particle trails inspired by wind maps
 */

(function() {
  'use strict';

  let scene, camera, renderer, controls;
  let satellite = null;
  let satelliteMeshes = [];
  let flowLines = [];
  let sunRayGroup = null;

  // Parameters
  let velocity = 7000;
  let sunLat = 23;
  let sunLon = 45;

  // Physics
  const RHO = 1e-12;
  const CD = 2.2;
  const AREA = 10.0;

  // History
  let dragHistory = [];
  let srpHistory = [];
  let lastTime = performance.now();
  const MAX_HISTORY = 600;

  // SRP tables
  let srpTables = { X: null, Y: null, Z: null };

  // Flow line settings
  const NUM_LINES = 120;
  const TRAIL_LENGTH = 40;

  const canvas = document.getElementById('satellite-canvas');
  const dragGraph = document.getElementById('drag-graph');
  const srpGraph = document.getElementById('srp-graph');
  const velocitySlider = document.getElementById('velocity-slider');
  const velocityValue = document.getElementById('velocity-value');
  const sunLatSlider = document.getElementById('sun-lat-slider');
  const sunLatValue = document.getElementById('sun-lat-value');
  const sunLonSlider = document.getElementById('sun-lon-slider');
  const sunLonValue = document.getElementById('sun-lon-value');

  if (!canvas) return;

  // Check if we're in background mode (no controls)
  const isBackgroundMode = !velocitySlider;

  init();
  loadSRPTables();
  animate();

  function init() {
    scene = new THREE.Scene();
    // Use darker background for hero section, lighter for standalone viz
    scene.background = isBackgroundMode ? new THREE.Color(0x0f172a) : new THREE.Color(0x0f172a);

    // In background mode, use full viewport dimensions
    let width, height;
    if (isBackgroundMode) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height, false); // false = don't set CSS style
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // In background mode, ensure canvas fills container
    if (isBackgroundMode) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }

    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 40;

    // Auto-rotate in background mode
    if (isBackgroundMode) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5; // Slow rotation
      controls.enableZoom = false;
      controls.enablePan = false;
    }

    // Soft, pleasant lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
    keyLight.position.set(5, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.25);
    fillLight.position.set(-8, 5, -5);
    scene.add(fillLight);

    loadSatellite();
    createFlowLines();

    sunRayGroup = new THREE.Group();
    if (!isBackgroundMode) {
      scene.add(sunRayGroup);
    }

    // Events - only bind if controls exist
    if (velocitySlider) {
      velocitySlider.addEventListener('input', (e) => {
        velocity = parseInt(e.target.value);
        velocityValue.textContent = velocity + ' m/s';
      });
    }

    if (sunLatSlider) {
      sunLatSlider.addEventListener('input', (e) => {
        sunLat = parseInt(e.target.value);
        sunLatValue.textContent = sunLat + '°';
        updateSunRays();
      });
    }

    if (sunLonSlider) {
      sunLonSlider.addEventListener('input', (e) => {
        sunLon = parseInt(e.target.value);
        sunLonValue.textContent = sunLon + '°';
        updateSunRays();
      });
    }

    window.addEventListener('resize', onResize);
    setTimeout(onResize, 50);
  }

  function loadSatellite() {
    const loader = new THREE.OBJLoader();
    loader.load('/data/gps2f_boxwing.obj', (obj) => {
      satellite = obj;
      satelliteMeshes = [];

      const busMat = new THREE.MeshPhongMaterial({
        color: 0xd8dce3,
        specular: 0x888888,
        shininess: 60
      });

      const panelMat = new THREE.MeshPhongMaterial({
        color: 0x1e3a6e,
        specular: 0x445577,
        shininess: 30
      });

      satellite.traverse((child) => {
        if (child.isMesh) {
          satelliteMeshes.push(child);
          child.material = child.name.includes('Arr') ? panelMat : busMat;
        }
      });

      // Center and scale
      const box = new THREE.Box3().setFromObject(satellite);
      const center = box.getCenter(new THREE.Vector3());
      satellite.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const scale = 5 / Math.max(size.x, size.y, size.z);
      satellite.scale.setScalar(scale);

      // Rotate 90° around Y so panel flat faces are perpendicular to flow (X axis)
      satellite.rotation.y = Math.PI / 2;

      scene.add(satellite);
      setTimeout(updateSunRays, 100);
    }, undefined, createFallbackSatellite);
  }

  function createFallbackSatellite() {
    const group = new THREE.Group();
    satelliteMeshes = [];

    const busMat = new THREE.MeshPhongMaterial({ color: 0xd8dce3, specular: 0x888888, shininess: 60 });
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1e3a6e, specular: 0x445577, shininess: 30 });

    const bus = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), busMat);
    satelliteMeshes.push(bus);
    group.add(bus);

    // Panels that will face flow after rotation
    const panelGeo = new THREE.BoxGeometry(0.1, 7, 2.5);
    [-4, 4].forEach(x => {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(x, 0, 0);
      satelliteMeshes.push(panel);
      group.add(panel);
    });

    group.rotation.y = Math.PI / 2;
    satellite = group;
    scene.add(satellite);
    setTimeout(updateSunRays, 100);
  }

  function createFlowLines() {
    for (let i = 0; i < NUM_LINES; i++) {
      const line = createFlowLine(i / NUM_LINES);
      flowLines.push(line);
      scene.add(line.mesh);
    }
  }

  function createFlowLine(offset) {
    // Trail positions
    const positions = new Float32Array(TRAIL_LENGTH * 3);
    const colors = new Float32Array(TRAIL_LENGTH * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      linewidth: 1
    });

    const mesh = new THREE.Line(geometry, material);

    // Initialize trail
    const startX = 18 - offset * 35;
    const y = (Math.random() - 0.5) * 14;
    const z = (Math.random() - 0.5) * 14;

    const trail = [];
    for (let j = 0; j < TRAIL_LENGTH; j++) {
      trail.push(new THREE.Vector3(startX + j * 0.3, y, z));
    }

    return {
      mesh,
      trail,
      velocity: new THREE.Vector3(-1, 0, 0),
      reflected: false,
      age: 0,
      baseColor: new THREE.Color().setHSL(0.55 + Math.random() * 0.08, 0.6, 0.55)
    };
  }

  function resetFlowLine(line) {
    const startX = 20 + Math.random() * 5;
    const y = (Math.random() - 0.5) * 14;
    const z = (Math.random() - 0.5) * 14;

    for (let j = 0; j < TRAIL_LENGTH; j++) {
      line.trail[j].set(startX + j * 0.2, y, z);
    }

    line.velocity.set(-1, 0, 0);
    line.reflected = false;
    line.age = 0;
    line.baseColor.setHSL(0.55 + Math.random() * 0.08, 0.6, 0.55);
  }

  function updateFlowLines(delta) {
    if (!satellite) return;

    const speed = (velocity / 7000) * 22 * delta;

    const satBox = new THREE.Box3().setFromObject(satellite);
    const satCenter = satBox.getCenter(new THREE.Vector3());
    const satSize = satBox.getSize(new THREE.Vector3());
    satBox.expandByScalar(0.2);

    flowLines.forEach(line => {
      line.age += delta;

      // Move head of trail
      const head = line.trail[0];
      head.addScaledVector(line.velocity, speed);

      // Collision detection
      if (!line.reflected && satBox.containsPoint(head)) {
        line.reflected = true;
        line.age = 0;

        // Reflection
        const rel = head.clone().sub(satCenter);
        const ax = Math.abs(rel.x) / (satSize.x || 1);
        const ay = Math.abs(rel.y) / (satSize.y || 1);
        const az = Math.abs(rel.z) / (satSize.z || 1);

        const normal = new THREE.Vector3();
        if (ax >= ay && ax >= az) normal.set(Math.sign(rel.x), 0, 0);
        else if (ay >= ax && ay >= az) normal.set(0, Math.sign(rel.y), 0);
        else normal.set(0, 0, Math.sign(rel.z));

        const v = line.velocity;
        const d = v.dot(normal);
        v.sub(normal.clone().multiplyScalar(2 * d));

        // Scatter
        v.x += (Math.random() - 0.5) * 0.5;
        v.y += (Math.random() - 0.5) * 0.5;
        v.z += (Math.random() - 0.5) * 0.5;
        v.normalize();

        // Change to warm color
        line.baseColor.setHSL(0.08 + Math.random() * 0.05, 0.8, 0.55);
      }

      // Cascade trail positions (each point follows the one ahead)
      for (let j = TRAIL_LENGTH - 1; j > 0; j--) {
        line.trail[j].copy(line.trail[j - 1]);
      }

      // Update geometry
      const positions = line.mesh.geometry.attributes.position.array;
      const colors = line.mesh.geometry.attributes.color.array;

      for (let j = 0; j < TRAIL_LENGTH; j++) {
        const idx = j * 3;
        positions[idx] = line.trail[j].x;
        positions[idx + 1] = line.trail[j].y;
        positions[idx + 2] = line.trail[j].z;

        // Gradient: bright at head, fading toward tail
        const t = j / (TRAIL_LENGTH - 1);
        const fade = Math.pow(1 - t, 1.5);

        // Fade out after reflection
        const reflectFade = line.reflected ? Math.max(0, 1 - line.age * 0.4) : 1;
        const alpha = fade * reflectFade;

        colors[idx] = line.baseColor.r * alpha + (1 - alpha) * 0.95;
        colors[idx + 1] = line.baseColor.g * alpha + (1 - alpha) * 0.97;
        colors[idx + 2] = line.baseColor.b * alpha + (1 - alpha) * 0.98;
      }

      line.mesh.geometry.attributes.position.needsUpdate = true;
      line.mesh.geometry.attributes.color.needsUpdate = true;

      // Reset if out of bounds
      if (head.x < -20 || head.x > 30 || Math.abs(head.y) > 18 || Math.abs(head.z) > 18) {
        resetFlowLine(line);
      }
    });
  }

  function updateSunRays() {
    if (!satellite) return;

    while (sunRayGroup.children.length) sunRayGroup.remove(sunRayGroup.children[0]);

    const latRad = sunLat * Math.PI / 180;
    const lonRad = sunLon * Math.PI / 180;
    const sunDir = new THREE.Vector3(
      Math.cos(latRad) * Math.cos(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.sin(lonRad)
    ).normalize();

    const box = new THREE.Box3().setFromObject(satellite);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const rayMat = new THREE.LineBasicMaterial({ color: 0xffc940, transparent: true, opacity: 0.5 });

    let count = 0, attempts = 0;
    while (count < 50 && attempts < 200) {
      attempts++;
      const face = Math.floor(Math.random() * 6);
      const u = Math.random() - 0.5, v = Math.random() - 0.5;

      let pt = new THREE.Vector3(), n = new THREE.Vector3();
      switch(face) {
        case 0: pt.set(size.x/2, u*size.y, v*size.z); n.set(1,0,0); break;
        case 1: pt.set(-size.x/2, u*size.y, v*size.z); n.set(-1,0,0); break;
        case 2: pt.set(u*size.x, size.y/2, v*size.z); n.set(0,1,0); break;
        case 3: pt.set(u*size.x, -size.y/2, v*size.z); n.set(0,-1,0); break;
        case 4: pt.set(u*size.x, v*size.y, size.z/2); n.set(0,0,1); break;
        case 5: pt.set(u*size.x, v*size.y, -size.z/2); n.set(0,0,-1); break;
      }
      pt.add(center);

      if (n.dot(sunDir) > 0.1) {
        const geo = new THREE.BufferGeometry().setFromPoints([
          pt, pt.clone().add(sunDir.clone().multiplyScalar(12))
        ]);
        sunRayGroup.add(new THREE.Line(geo, rayMat));
        count++;
      }
    }
  }

  function calculateDrag() {
    return 0.5 * RHO * velocity * velocity * CD * AREA * 1e6;
  }

  function loadSRPTables() {
    ['X','Y','Z'].forEach(c => {
      fetch(`/data/gps2f_nb_force_rot_${c}.grd`)
        .then(r => r.text())
        .then(t => { srpTables[c] = parseGRD(t); })
        .catch(() => {});
    });
  }

  function parseGRD(text) {
    const lines = text.trim().split('\n');
    if (lines[0] !== 'DSAA') return null;
    const [nx, ny] = lines[1].split(/\s+/).map(Number);
    const [xmin, xmax] = lines[2].split(/\s+/).map(Number);
    const [ymin, ymax] = lines[3].split(/\s+/).map(Number);
    const values = [];
    for (let i = 5; i < lines.length; i++) {
      values.push(...lines[i].trim().split(/\s+/).map(Number));
    }
    return { nx, ny, xmin, xmax, ymin, ymax, values,
             dx: (xmax-xmin)/(nx-1), dy: (ymax-ymin)/(ny-1) };
  }

  function interpSRP(t, lon, lat) {
    if (!t) return 0;
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    lat = Math.max(-90, Math.min(90, lat));
    const fx = (lon - t.xmin) / t.dx;
    const fy = (lat - t.ymin) / t.dy;
    const ix = Math.max(0, Math.min(t.nx-2, Math.floor(fx)));
    const iy = Math.max(0, Math.min(t.ny-2, Math.floor(fy)));
    const tx = fx - ix, ty = fy - iy;
    const v00 = t.values[iy*t.nx+ix] || 0;
    const v10 = t.values[iy*t.nx+ix+1] || 0;
    const v01 = t.values[(iy+1)*t.nx+ix] || 0;
    const v11 = t.values[(iy+1)*t.nx+ix+1] || 0;
    return (v00*(1-tx)+v10*tx)*(1-ty) + (v01*(1-tx)+v11*tx)*ty;
  }

  function calculateSRP() {
    const fx = interpSRP(srpTables.X, sunLon, sunLat);
    const fy = interpSRP(srpTables.Y, sunLon, sunLat);
    const fz = interpSRP(srpTables.Z, sunLon, sunLat);
    return Math.sqrt(fx*fx + fy*fy + fz*fz) * 1e9;
  }

  function updateGraph(canvas, history, color) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (history.length < 2) return;

    const vals = history.map(d => d.value);
    const min = Math.min(...vals) * 0.95;
    const max = Math.max(...vals) * 1.05;
    const range = max - min || 1;

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i/3)*h);
      ctx.lineTo(w, (i/3)*h);
      ctx.stroke();
    }

    // Line with gradient
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color);

    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    history.forEach((p, i) => {
      const x = (i / (MAX_HISTORY-1)) * w;
      const y = h - ((p.value - min) / range) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Value label
    ctx.fillStyle = '#374151';
    ctx.font = '10px SF Mono, Monaco, monospace';
    ctx.textAlign = 'right';
    const current = history[history.length - 1]?.value || 0;
    const unit = color === '#3b82f6' ? ' μN' : ' nm/s²';
    ctx.fillText(current.toFixed(color === '#3b82f6' ? 1 : 2) + unit, w - 4, 12);
  }

  function onResize() {
    let width, height;

    if (isBackgroundMode) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    [dragGraph, srpGraph].forEach(g => {
      if (g?.parentElement) {
        const r = g.parentElement.getBoundingClientRect();
        g.width = r.width - 24;
        g.height = 50;
      }
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    controls.update();
    updateFlowLines(delta);

    if (!dragHistory.length || now - dragHistory[dragHistory.length-1].time > 100) {
      dragHistory.push({ time: now, value: calculateDrag() });
      if (dragHistory.length > MAX_HISTORY) dragHistory.shift();

      srpHistory.push({ time: now, value: calculateSRP() });
      if (srpHistory.length > MAX_HISTORY) srpHistory.shift();

      updateGraph(dragGraph, dragHistory, '#3b82f6');
      updateGraph(srpGraph, srpHistory, '#f59e0b');
    }

    renderer.render(scene, camera);
  }
})();
