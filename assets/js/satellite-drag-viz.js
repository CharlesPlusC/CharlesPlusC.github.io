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
  let sunRays = [];
  let sunRayGroup = null;

  // Parameters
  let velocity = 7000;
  let sunLat = 23;
  let sunLon = 45;

  // Physics constants
  const RHO = 1e-12;      // Atmospheric density kg/m³
  const CD = 2.2;         // Drag coefficient
  const AREA = 10.0;      // Cross-sectional area m²

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
    // Scene with light background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);

    // Camera
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    camera.position.set(12, 8, 15);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 40;

    // Lighting - bright for visibility
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 15, 10);
    scene.add(directional);

    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

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
    onResize();
  }

  function loadSatellite() {
    const loader = new THREE.OBJLoader();
    loader.load('/data/gps2f_boxwing.obj', (obj) => {
      satellite = obj;
      satelliteMeshes = [];

      // Apply visible materials
      const busMaterial = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        specular: 0x444444,
        shininess: 30
      });

      const arrayMaterial = new THREE.MeshPhongMaterial({
        color: 0x1e3a8a,
        specular: 0x222244,
        shininess: 20
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

      // Center and scale
      const box = new THREE.Box3().setFromObject(satellite);
      const center = box.getCenter(new THREE.Vector3());
      satellite.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;
      satellite.scale.setScalar(scale);

      scene.add(satellite);

      // Initialize sun rays after satellite loads
      setTimeout(updateSunRays, 100);
    }, undefined, () => {
      createFallbackSatellite();
    });
  }

  function createFallbackSatellite() {
    const group = new THREE.Group();
    satelliteMeshes = [];

    const busMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, specular: 0x444444, shininess: 30 });
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1e3a8a, specular: 0x222244, shininess: 20 });

    // Main bus
    const busGeo = new THREE.BoxGeometry(1.5, 1.5, 2);
    const bus = new THREE.Mesh(busGeo, busMat);
    satelliteMeshes.push(bus);
    group.add(bus);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(5, 0.05, 1.5);
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.set(-3.5, 0, 0);
    satelliteMeshes.push(panelL);
    group.add(panelL);

    const panelR = new THREE.Mesh(panelGeo, panelMat);
    panelR.position.set(3.5, 0, 0);
    satelliteMeshes.push(panelR);
    group.add(panelR);

    satellite = group;
    scene.add(satellite);
    setTimeout(updateSunRays, 100);
  }

  function createParticles() {
    const particleCount = 300;
    const geometry = new THREE.SphereGeometry(0.06, 8, 8);

    // Stagger particles across the full stream for continuous flow
    for (let i = 0; i < particleCount; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: 0x44aaff,
        specular: 0xffffff,
        shininess: 100,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);

      // Distribute particles evenly across the stream
      const streamProgress = i / particleCount;
      resetParticle(particle, streamProgress);

      particles.push(particle);
      scene.add(particle);
    }
  }

  function resetParticle(particle, streamProgress = Math.random()) {
    // Particles flow from +X to -X, concentrated toward satellite
    const streamLength = 30;
    particle.position.x = 18 - streamProgress * streamLength;
    particle.position.y = (Math.random() - 0.5) * 6;
    particle.position.z = (Math.random() - 0.5) * 6;

    particle.userData.velocity = new THREE.Vector3(-1, 0, 0);
    particle.userData.reflected = false;
    particle.userData.lifetime = 0;
    particle.material.color.setHex(0x44aaff);
    particle.material.opacity = 0.9;
  }

  function updateParticles(delta) {
    if (!satellite) return;

    const visualSpeed = (velocity / 7000) * 25 * delta;

    // Get satellite bounding box for collision
    const satBox = new THREE.Box3().setFromObject(satellite);
    const satCenter = satBox.getCenter(new THREE.Vector3());
    const satSize = satBox.getSize(new THREE.Vector3());

    // Expand box slightly for better collision detection
    satBox.expandByScalar(0.1);

    particles.forEach(particle => {
      particle.userData.lifetime += delta;

      // Move particle
      particle.position.addScaledVector(particle.userData.velocity, visualSpeed);

      // Check collision with satellite
      if (!particle.userData.reflected && satBox.containsPoint(particle.position)) {
        particle.userData.reflected = true;

        // Calculate surface normal for reflection
        const relPos = particle.position.clone().sub(satCenter);

        // Determine which face was hit based on relative position
        let normal = new THREE.Vector3();
        const absX = Math.abs(relPos.x) / satSize.x;
        const absY = Math.abs(relPos.y) / satSize.y;
        const absZ = Math.abs(relPos.z) / satSize.z;

        if (absX >= absY && absX >= absZ) {
          normal.set(Math.sign(relPos.x), 0, 0);
        } else if (absY >= absX && absY >= absZ) {
          normal.set(0, Math.sign(relPos.y), 0);
        } else {
          normal.set(0, 0, Math.sign(relPos.z));
        }

        // Specular reflection: v' = v - 2(v·n)n
        const v = particle.userData.velocity.clone();
        const dotProduct = v.dot(normal);
        const reflection = v.sub(normal.multiplyScalar(2 * dotProduct));
        particle.userData.velocity.copy(reflection.normalize());

        // Add slight random scatter for realism
        particle.userData.velocity.x += (Math.random() - 0.5) * 0.3;
        particle.userData.velocity.y += (Math.random() - 0.5) * 0.3;
        particle.userData.velocity.z += (Math.random() - 0.5) * 0.3;
        particle.userData.velocity.normalize();

        // Visual feedback - turn orange/red on collision
        particle.material.color.setHex(0xff6644);
        particle.material.opacity = 1.0;
      }

      // Fade reflected particles
      if (particle.userData.reflected) {
        particle.material.opacity = Math.max(0.3, 1.0 - particle.userData.lifetime * 0.5);
      }

      // Reset if out of bounds
      if (particle.position.x < -15 ||
          particle.position.x > 25 ||
          Math.abs(particle.position.y) > 12 ||
          Math.abs(particle.position.z) > 12) {
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

    // Calculate sun direction from lat/lon
    const latRad = sunLat * Math.PI / 180;
    const lonRad = sunLon * Math.PI / 180;
    const sunDir = new THREE.Vector3(
      Math.cos(latRad) * Math.cos(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.sin(lonRad)
    ).normalize();

    // Get satellite bounding box
    const box = new THREE.Box3().setFromObject(satellite);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Create 50 rays on the sun-facing surfaces
    const rayCount = 50;
    const rayLength = 8;

    const rayMaterial = new THREE.LineBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.7,
      linewidth: 1
    });

    for (let i = 0; i < rayCount; i++) {
      // Generate random point on satellite surface facing the sun
      let point = new THREE.Vector3();
      let normal = new THREE.Vector3();

      // Pick random surface point
      const face = Math.floor(Math.random() * 6);
      const u = Math.random() - 0.5;
      const v = Math.random() - 0.5;

      switch (face) {
        case 0: // +X
          point.set(size.x / 2, u * size.y, v * size.z);
          normal.set(1, 0, 0);
          break;
        case 1: // -X
          point.set(-size.x / 2, u * size.y, v * size.z);
          normal.set(-1, 0, 0);
          break;
        case 2: // +Y
          point.set(u * size.x, size.y / 2, v * size.z);
          normal.set(0, 1, 0);
          break;
        case 3: // -Y
          point.set(u * size.x, -size.y / 2, v * size.z);
          normal.set(0, -1, 0);
          break;
        case 4: // +Z
          point.set(u * size.x, v * size.y, size.z / 2);
          normal.set(0, 0, 1);
          break;
        case 5: // -Z
          point.set(u * size.x, v * size.y, -size.z / 2);
          normal.set(0, 0, -1);
          break;
      }

      point.add(center);

      // Only show rays on sun-facing surfaces (normal · sunDir > 0)
      if (normal.dot(sunDir) > 0.1) {
        const rayGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
          point.x, point.y, point.z,
          point.x + sunDir.x * rayLength,
          point.y + sunDir.y * rayLength,
          point.z + sunDir.z * rayLength
        ]);
        rayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const ray = new THREE.Line(rayGeometry, rayMaterial.clone());
        sunRayGroup.add(ray);
      } else {
        // Try again for sun-facing surface
        i--;
      }
    }
  }

  function calculateDrag() {
    // F = 0.5 * rho * v^2 * Cd * A
    const drag = 0.5 * RHO * velocity * velocity * CD * AREA;
    return drag * 1e6; // Convert to micro-Newtons for display
  }

  function loadSRPTables() {
    const components = ['X', 'Y', 'Z'];
    components.forEach(comp => {
      fetch(`/data/gps2f_nb_force_rot_${comp}.grd`)
        .then(response => response.text())
        .then(text => {
          srpTables[comp] = parseGRDFile(text);
        })
        .catch(err => console.log(`Could not load SRP table ${comp}`));
    });
  }

  function parseGRDFile(text) {
    const lines = text.trim().split('\n');
    if (lines[0] !== 'DSAA') return null;

    const [nx, ny] = lines[1].split(/\s+/).map(Number);
    const [xmin, xmax] = lines[2].split(/\s+/).map(Number);
    const [ymin, ymax] = lines[3].split(/\s+/).map(Number);

    // Parse all data values
    const values = [];
    for (let i = 5; i < lines.length; i++) {
      const nums = lines[i].trim().split(/\s+/).map(Number);
      values.push(...nums);
    }

    return {
      nx, ny,
      xmin, xmax,
      ymin, ymax,
      values,
      dx: (xmax - xmin) / (nx - 1),
      dy: (ymax - ymin) / (ny - 1)
    };
  }

  function interpolateSRP(table, lon, lat) {
    if (!table) return 0;

    // Normalize longitude to [-180, 180]
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;

    // Clamp latitude to [-90, 90]
    lat = Math.max(-90, Math.min(90, lat));

    // Convert to grid indices
    const fx = (lon - table.xmin) / table.dx;
    const fy = (lat - table.ymin) / table.dy;

    const ix = Math.floor(fx);
    const iy = Math.floor(fy);

    // Clamp indices
    const ix0 = Math.max(0, Math.min(table.nx - 2, ix));
    const iy0 = Math.max(0, Math.min(table.ny - 2, iy));
    const ix1 = ix0 + 1;
    const iy1 = iy0 + 1;

    // Fractional parts
    const tx = fx - ix0;
    const ty = fy - iy0;

    // Bilinear interpolation
    const v00 = table.values[iy0 * table.nx + ix0] || 0;
    const v10 = table.values[iy0 * table.nx + ix1] || 0;
    const v01 = table.values[iy1 * table.nx + ix0] || 0;
    const v11 = table.values[iy1 * table.nx + ix1] || 0;

    const v0 = v00 * (1 - tx) + v10 * tx;
    const v1 = v01 * (1 - tx) + v11 * tx;

    return v0 * (1 - ty) + v1 * ty;
  }

  function calculateSRP() {
    const fx = interpolateSRP(srpTables.X, sunLon, sunLat);
    const fy = interpolateSRP(srpTables.Y, sunLon, sunLat);
    const fz = interpolateSRP(srpTables.Z, sunLon, sunLat);

    // Return magnitude in nm/s²
    const magnitude = Math.sqrt(fx * fx + fy * fy + fz * fz);
    return magnitude * 1e9; // Convert to nm/s²
  }

  function updateGraphs() {
    updateDragGraph();
    updateSRPGraph();
  }

  function updateDragGraph() {
    if (!dragGraph) return;
    const ctx = dragGraph.getContext('2d');
    const width = dragGraph.width;
    const height = dragGraph.height;

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
      const y = (i / 3) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    dragHistory.forEach((point, i) => {
      const x = (i / (MAX_HISTORY - 1)) * width;
      const y = height - ((point.value - minVal) / range) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current value
    const current = dragHistory[dragHistory.length - 1]?.value || 0;
    ctx.fillStyle = '#1e293b';
    ctx.font = '10px SF Mono, Monaco, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(current.toFixed(1) + ' μN', width - 4, 12);
  }

  function updateSRPGraph() {
    if (!srpGraph) return;
    const ctx = srpGraph.getContext('2d');
    const width = srpGraph.width;
    const height = srpGraph.height;

    ctx.clearRect(0, 0, width, height);

    if (srpHistory.length < 2) return;

    const values = srpHistory.map(d => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = (i / 3) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;

    srpHistory.forEach((point, i) => {
      const x = (i / (MAX_HISTORY - 1)) * width;
      const y = height - ((point.value - minVal) / range) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current value
    const current = srpHistory[srpHistory.length - 1]?.value || 0;
    ctx.fillStyle = '#1e293b';
    ctx.font = '10px SF Mono, Monaco, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(current.toFixed(2) + ' nm/s²', width - 4, 12);
  }

  function onResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Resize graph canvases
    if (dragGraph && dragGraph.parentElement) {
      const rect = dragGraph.parentElement.getBoundingClientRect();
      dragGraph.width = rect.width - 24;
      dragGraph.height = 60;
    }
    if (srpGraph && srpGraph.parentElement) {
      const rect = srpGraph.parentElement.getBoundingClientRect();
      srpGraph.width = rect.width - 24;
      srpGraph.height = 60;
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    controls.update();
    updateParticles(delta);

    // Sample at 10Hz
    if (dragHistory.length === 0 || now - (dragHistory[dragHistory.length - 1]?.time || 0) > 100) {
      const drag = calculateDrag();
      dragHistory.push({ time: now, value: drag });
      if (dragHistory.length > MAX_HISTORY) dragHistory.shift();

      const srp = calculateSRP();
      srpHistory.push({ time: now, value: srp });
      if (srpHistory.length > MAX_HISTORY) srpHistory.shift();

      updateGraphs();
    }

    renderer.render(scene, camera);
  }
})();
