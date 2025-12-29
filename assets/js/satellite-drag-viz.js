/**
 * Satellite Drag & SRP Visualization
 * Interactive 3D visualization with atmospheric drag and solar radiation pressure
 */

(function() {
  'use strict';

  // Three.js objects
  let scene, camera, renderer, controls;
  let satellite = null;
  let satelliteMeshes = [];
  let particles = [];
  let sunRayGroup = null;

  // Parameters
  let velocity = 7000;
  let sunLat = 23;
  let sunLon = 45;

  // Physics constants
  const RHO = 1e-12;
  const CD = 2.2;
  const AREA = 10.0;

  // History for graphs
  let dragHistory = [];
  let srpHistory = [];
  let lastTime = performance.now();
  const MAX_HISTORY = 600;

  // SRP lookup tables
  let srpTables = { X: null, Y: null, Z: null };

  // DOM elements
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

  init();
  loadSRPTables();
  animate();

  function init() {
    // Scene with soft gradient background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f5fa);

    // Get container dimensions
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();

    // Camera
    camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 1000);
    camera.position.set(0, 6, 18);

    // Renderer - fill container
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 35;
    controls.target.set(0, 0, 0);

    // Soft lighting for pleasing look
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9ec5ff, 0.3);
    fillLight.position.set(-8, 4, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.2);
    rimLight.position.set(0, -5, -10);
    scene.add(rimLight);

    // Load satellite
    loadSatellite();

    // Create particle system
    createParticles();

    // Create sun rays group
    sunRayGroup = new THREE.Group();
    scene.add(sunRayGroup);

    // Event listeners
    velocitySlider.addEventListener('input', (e) => {
      velocity = parseInt(e.target.value);
      velocityValue.textContent = velocity + ' m/s';
    });

    sunLatSlider.addEventListener('input', (e) => {
      sunLat = parseInt(e.target.value);
      sunLatValue.textContent = sunLat + '°';
      updateSunRays();
    });

    sunLonSlider.addEventListener('input', (e) => {
      sunLon = parseInt(e.target.value);
      sunLonValue.textContent = sunLon + '°';
      updateSunRays();
    });

    window.addEventListener('resize', onResize);
    // Initial resize to ensure proper fit
    setTimeout(onResize, 50);
  }

  function loadSatellite() {
    const loader = new THREE.OBJLoader();
    loader.load('/data/gps2f_boxwing.obj', (obj) => {
      satellite = obj;
      satelliteMeshes = [];

      // Bright, visible materials
      const busMaterial = new THREE.MeshPhongMaterial({
        color: 0xe8e8e8,
        specular: 0x666666,
        shininess: 40
      });

      const arrayMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a4494,
        specular: 0x334466,
        shininess: 25
      });

      satellite.traverse((child) => {
        if (child.isMesh) {
          satelliteMeshes.push(child);
          if (child.name.includes('Array') || child.name.includes('Arr')) {
            child.material = arrayMaterial;
          } else {
            child.material = busMaterial;
          }
        }
      });

      // Center the model
      const box = new THREE.Box3().setFromObject(satellite);
      const center = box.getCenter(new THREE.Vector3());
      satellite.position.sub(center);

      // Scale to reasonable size
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4.5 / maxDim;
      satellite.scale.setScalar(scale);

      // Rotate so largest area (solar panels) faces the flow (-X direction)
      // The panels extend along Y axis, so rotate 90° around Z to face them into flow
      satellite.rotation.z = Math.PI / 2;

      scene.add(satellite);

      setTimeout(updateSunRays, 100);
    }, undefined, () => {
      createFallbackSatellite();
    });
  }

  function createFallbackSatellite() {
    const group = new THREE.Group();
    satelliteMeshes = [];

    const busMat = new THREE.MeshPhongMaterial({ color: 0xe8e8e8, specular: 0x666666, shininess: 40 });
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x2a4494, specular: 0x334466, shininess: 25 });

    // Main bus
    const busGeo = new THREE.BoxGeometry(1.5, 1.5, 2);
    const bus = new THREE.Mesh(busGeo, busMat);
    satelliteMeshes.push(bus);
    group.add(bus);

    // Solar panels - wider to present area to flow
    const panelGeo = new THREE.BoxGeometry(5, 0.08, 2);
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.set(-3.5, 0, 0);
    satelliteMeshes.push(panelL);
    group.add(panelL);

    const panelR = new THREE.Mesh(panelGeo, panelMat);
    panelR.position.set(3.5, 0, 0);
    satelliteMeshes.push(panelR);
    group.add(panelR);

    // Rotate so panels face flow
    group.rotation.z = Math.PI / 2;

    satellite = group;
    scene.add(satellite);
    setTimeout(updateSunRays, 100);
  }

  function createParticles() {
    // Many small particles for atmospheric feel
    const particleCount = 800;
    const geometry = new THREE.SphereGeometry(0.025, 6, 6);

    for (let i = 0; i < particleCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0x6ba4d9,
        transparent: true,
        opacity: 0.7
      });
      const particle = new THREE.Mesh(geometry, material);

      // Stagger across full stream length for continuous flow
      const streamProgress = i / particleCount;
      resetParticle(particle, streamProgress);

      particles.push(particle);
      scene.add(particle);
    }
  }

  function resetParticle(particle, streamProgress = Math.random()) {
    // Particles flow from +X to -X
    const streamLength = 35;
    const startX = 20;

    particle.position.x = startX - streamProgress * streamLength;
    // Wider spread to cover satellite
    particle.position.y = (Math.random() - 0.5) * 10;
    particle.position.z = (Math.random() - 0.5) * 10;

    particle.userData.velocity = new THREE.Vector3(-1, 0, 0);
    particle.userData.reflected = false;
    particle.userData.lifetime = 0;

    // Depth-based appearance - particles farther away are more transparent
    const depth = (particle.position.x + 15) / 35;
    particle.material.opacity = 0.3 + depth * 0.5;
    particle.material.color.setHex(0x6ba4d9);
  }

  function updateParticles(delta) {
    if (!satellite) return;

    const visualSpeed = (velocity / 7000) * 28 * delta;

    // Get satellite bounding box
    const satBox = new THREE.Box3().setFromObject(satellite);
    const satCenter = satBox.getCenter(new THREE.Vector3());
    const satSize = satBox.getSize(new THREE.Vector3());
    satBox.expandByScalar(0.15);

    particles.forEach(particle => {
      particle.userData.lifetime += delta;

      // Move particle
      particle.position.addScaledVector(particle.userData.velocity, visualSpeed);

      // Collision detection
      if (!particle.userData.reflected && satBox.containsPoint(particle.position)) {
        particle.userData.reflected = true;

        // Determine reflection normal
        const relPos = particle.position.clone().sub(satCenter);
        let normal = new THREE.Vector3();

        const absX = Math.abs(relPos.x) / (satSize.x || 1);
        const absY = Math.abs(relPos.y) / (satSize.y || 1);
        const absZ = Math.abs(relPos.z) / (satSize.z || 1);

        if (absX >= absY && absX >= absZ) {
          normal.set(Math.sign(relPos.x), 0, 0);
        } else if (absY >= absX && absY >= absZ) {
          normal.set(0, Math.sign(relPos.y), 0);
        } else {
          normal.set(0, 0, Math.sign(relPos.z));
        }

        // Specular reflection with scatter
        const v = particle.userData.velocity.clone();
        const dotProduct = v.dot(normal);
        const reflection = v.sub(normal.multiplyScalar(2 * dotProduct));
        particle.userData.velocity.copy(reflection.normalize());

        // Add scatter
        particle.userData.velocity.x += (Math.random() - 0.5) * 0.4;
        particle.userData.velocity.y += (Math.random() - 0.5) * 0.4;
        particle.userData.velocity.z += (Math.random() - 0.5) * 0.4;
        particle.userData.velocity.normalize();

        // Color change on collision - warm orange/red
        particle.material.color.setHex(0xe07840);
        particle.material.opacity = 0.9;
      }

      // Fade reflected particles
      if (particle.userData.reflected) {
        particle.material.opacity = Math.max(0.15, 0.9 - particle.userData.lifetime * 0.6);
      }

      // Reset if out of bounds
      if (particle.position.x < -18 ||
          particle.position.x > 25 ||
          Math.abs(particle.position.y) > 14 ||
          Math.abs(particle.position.z) > 14) {
        resetParticle(particle);
      }
    });
  }

  function updateSunRays() {
    if (!satellite || satelliteMeshes.length === 0) return;

    // Clear existing rays
    while (sunRayGroup.children.length > 0) {
      sunRayGroup.remove(sunRayGroup.children[0]);
    }

    // Sun direction from lat/lon
    const latRad = sunLat * Math.PI / 180;
    const lonRad = sunLon * Math.PI / 180;
    const sunDir = new THREE.Vector3(
      Math.cos(latRad) * Math.cos(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.sin(lonRad)
    ).normalize();

    // Get satellite bounds
    const box = new THREE.Box3().setFromObject(satellite);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const rayCount = 50;
    const rayLength = 10;

    const rayMaterial = new THREE.LineBasicMaterial({
      color: 0xffc940,
      transparent: true,
      opacity: 0.6
    });

    let attempts = 0;
    for (let i = 0; i < rayCount && attempts < rayCount * 3; attempts++) {
      let point = new THREE.Vector3();
      let normal = new THREE.Vector3();

      const face = Math.floor(Math.random() * 6);
      const u = Math.random() - 0.5;
      const v = Math.random() - 0.5;

      switch (face) {
        case 0: point.set(size.x / 2, u * size.y, v * size.z); normal.set(1, 0, 0); break;
        case 1: point.set(-size.x / 2, u * size.y, v * size.z); normal.set(-1, 0, 0); break;
        case 2: point.set(u * size.x, size.y / 2, v * size.z); normal.set(0, 1, 0); break;
        case 3: point.set(u * size.x, -size.y / 2, v * size.z); normal.set(0, -1, 0); break;
        case 4: point.set(u * size.x, v * size.y, size.z / 2); normal.set(0, 0, 1); break;
        case 5: point.set(u * size.x, v * size.y, -size.z / 2); normal.set(0, 0, -1); break;
      }

      point.add(center);

      if (normal.dot(sunDir) > 0.05) {
        const positions = new Float32Array([
          point.x, point.y, point.z,
          point.x + sunDir.x * rayLength,
          point.y + sunDir.y * rayLength,
          point.z + sunDir.z * rayLength
        ]);
        const rayGeometry = new THREE.BufferGeometry();
        rayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const ray = new THREE.Line(rayGeometry, rayMaterial.clone());
        sunRayGroup.add(ray);
        i++;
      }
    }
  }

  function calculateDrag() {
    const drag = 0.5 * RHO * velocity * velocity * CD * AREA;
    return drag * 1e6; // μN
  }

  function loadSRPTables() {
    ['X', 'Y', 'Z'].forEach(comp => {
      fetch(`/data/gps2f_nb_force_rot_${comp}.grd`)
        .then(r => r.text())
        .then(text => { srpTables[comp] = parseGRDFile(text); })
        .catch(() => {});
    });
  }

  function parseGRDFile(text) {
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
             dx: (xmax - xmin) / (nx - 1), dy: (ymax - ymin) / (ny - 1) };
  }

  function interpolateSRP(table, lon, lat) {
    if (!table) return 0;

    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    lat = Math.max(-90, Math.min(90, lat));

    const fx = (lon - table.xmin) / table.dx;
    const fy = (lat - table.ymin) / table.dy;

    const ix0 = Math.max(0, Math.min(table.nx - 2, Math.floor(fx)));
    const iy0 = Math.max(0, Math.min(table.ny - 2, Math.floor(fy)));

    const tx = fx - ix0, ty = fy - iy0;

    const v00 = table.values[iy0 * table.nx + ix0] || 0;
    const v10 = table.values[iy0 * table.nx + ix0 + 1] || 0;
    const v01 = table.values[(iy0 + 1) * table.nx + ix0] || 0;
    const v11 = table.values[(iy0 + 1) * table.nx + ix0 + 1] || 0;

    return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty;
  }

  function calculateSRP() {
    const fx = interpolateSRP(srpTables.X, sunLon, sunLat);
    const fy = interpolateSRP(srpTables.Y, sunLon, sunLat);
    const fz = interpolateSRP(srpTables.Z, sunLon, sunLat);
    return Math.sqrt(fx * fx + fy * fy + fz * fz) * 1e9;
  }

  function updateDragGraph() {
    if (!dragGraph) return;
    const ctx = dragGraph.getContext('2d');
    const width = dragGraph.width, height = dragGraph.height;
    ctx.clearRect(0, 0, width, height);

    if (dragHistory.length < 2) return;

    const values = dragHistory.map(d => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 3) * height);
      ctx.lineTo(width, (i / 3) * height);
      ctx.stroke();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    dragHistory.forEach((p, i) => {
      const x = (i / (MAX_HISTORY - 1)) * width;
      const y = height - ((p.value - minVal) / range) * height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Value
    ctx.fillStyle = '#1e293b';
    ctx.font = '10px SF Mono, Monaco, monospace';
    ctx.textAlign = 'right';
    ctx.fillText((dragHistory[dragHistory.length - 1]?.value || 0).toFixed(1) + ' μN', width - 4, 12);
  }

  function updateSRPGraph() {
    if (!srpGraph) return;
    const ctx = srpGraph.getContext('2d');
    const width = srpGraph.width, height = srpGraph.height;
    ctx.clearRect(0, 0, width, height);

    if (srpHistory.length < 2) return;

    const values = srpHistory.map(d => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 3) * height);
      ctx.lineTo(width, (i / 3) * height);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    srpHistory.forEach((p, i) => {
      const x = (i / (MAX_HISTORY - 1)) * width;
      const y = height - ((p.value - minVal) / range) * height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = '10px SF Mono, Monaco, monospace';
    ctx.textAlign = 'right';
    ctx.fillText((srpHistory[srpHistory.length - 1]?.value || 0).toFixed(2) + ' nm/s²', width - 4, 12);
  }

  function onResize() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Graph canvases
    if (dragGraph?.parentElement) {
      const r = dragGraph.parentElement.getBoundingClientRect();
      dragGraph.width = r.width - 24;
      dragGraph.height = 50;
    }
    if (srpGraph?.parentElement) {
      const r = srpGraph.parentElement.getBoundingClientRect();
      srpGraph.width = r.width - 24;
      srpGraph.height = 50;
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    controls.update();
    updateParticles(delta);

    // 10Hz sampling
    if (dragHistory.length === 0 || now - (dragHistory[dragHistory.length - 1]?.time || 0) > 100) {
      dragHistory.push({ time: now, value: calculateDrag() });
      if (dragHistory.length > MAX_HISTORY) dragHistory.shift();

      srpHistory.push({ time: now, value: calculateSRP() });
      if (srpHistory.length > MAX_HISTORY) srpHistory.shift();

      updateDragGraph();
      updateSRPGraph();
    }

    renderer.render(scene, camera);
  }
})();
