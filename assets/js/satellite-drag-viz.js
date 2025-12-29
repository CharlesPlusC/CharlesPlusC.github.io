/**
 * Satellite Drag Visualization
 * Interactive 3D visualization of atmospheric drag on a satellite
 */

(function() {
  'use strict';

  let scene, camera, renderer, controls;
  let satellite = null;
  let particles = [];
  let velocity = 7000;
  let dragHistory = [];
  let lastTime = performance.now();
  const MAX_HISTORY = 600; // 60 seconds at 10 samples/sec

  const canvas = document.getElementById('satellite-canvas');
  const graphCanvas = document.getElementById('drag-graph');
  const velocitySlider = document.getElementById('velocity-slider');
  const velocityValue = document.getElementById('velocity-value');

  if (!canvas || !graphCanvas) return;

  init();
  animate();

  function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(15, 10, 20);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Controls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 50;

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 10, 7);
    scene.add(directional);

    const backLight = new THREE.DirectionalLight(0x4466ff, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Load satellite model
    loadSatellite();

    // Create particles
    createParticles();

    // Event listeners
    velocitySlider.addEventListener('input', (e) => {
      velocity = parseInt(e.target.value);
      velocityValue.textContent = velocity + ' m/s';
    });

    window.addEventListener('resize', onResize);
    onResize();
  }

  function loadSatellite() {
    const loader = new THREE.OBJLoader();
    loader.load('/data/gps2f_boxwing.obj', (obj) => {
      satellite = obj;

      // Apply metallic material
      const busMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.8,
        roughness: 0.3
      });

      const arrayMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a237e,
        metalness: 0.4,
        roughness: 0.6
      });

      satellite.traverse((child) => {
        if (child.isMesh) {
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
      const scale = 5 / maxDim;
      satellite.scale.setScalar(scale);

      scene.add(satellite);
    }, undefined, (err) => {
      // Fallback: create simple satellite geometry
      createFallbackSatellite();
    });
  }

  function createFallbackSatellite() {
    const group = new THREE.Group();

    // Main bus
    const busGeo = new THREE.BoxGeometry(2, 2, 3);
    const busMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });
    const bus = new THREE.Mesh(busGeo, busMat);
    group.add(bus);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(6, 0.1, 2);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a237e, metalness: 0.4, roughness: 0.6 });

    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.set(-4.5, 0, 0);
    group.add(panelL);

    const panelR = new THREE.Mesh(panelGeo, panelMat);
    panelR.position.set(4.5, 0, 0);
    group.add(panelR);

    satellite = group;
    scene.add(satellite);
  }

  function createParticles() {
    const particleCount = 150;
    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      metalness: 1.0,
      roughness: 0.0,
      envMapIntensity: 1.0
    });

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(geometry, material.clone());
      resetParticle(particle);
      particles.push(particle);
      scene.add(particle);
    }
  }

  function resetParticle(particle, randomZ = true) {
    // Particles come from +X direction (flow comes from right)
    particle.position.x = 25 + (randomZ ? Math.random() * 10 : 0);
    particle.position.y = (Math.random() - 0.5) * 16;
    particle.position.z = (Math.random() - 0.5) * 16;
    particle.userData.velocity = new THREE.Vector3(-1, 0, 0);
    particle.userData.reflected = false;
    particle.material.color.setHex(0x88ccff);
    particle.material.emissive = new THREE.Color(0x000000);
  }

  function updateParticles(delta) {
    const speed = (velocity / 7000) * 30 * delta; // Scale speed visually

    particles.forEach(particle => {
      // Move particle
      particle.position.addScaledVector(particle.userData.velocity, speed);

      // Check collision with satellite bounding box
      if (satellite && !particle.userData.reflected) {
        const satBox = new THREE.Box3().setFromObject(satellite);
        if (satBox.containsPoint(particle.position)) {
          // Reflect particle
          particle.userData.reflected = true;

          // Calculate reflection based on satellite surface
          const satCenter = satBox.getCenter(new THREE.Vector3());
          const normal = particle.position.clone().sub(satCenter).normalize();

          // Specular reflection
          const v = particle.userData.velocity.clone();
          const reflection = v.sub(normal.multiplyScalar(2 * v.dot(normal)));
          particle.userData.velocity.copy(reflection.normalize());

          // Visual feedback
          particle.material.color.setHex(0xffaa44);
          particle.material.emissive = new THREE.Color(0x442200);
        }
      }

      // Reset if out of bounds
      if (particle.position.x < -30 ||
          Math.abs(particle.position.y) > 20 ||
          Math.abs(particle.position.z) > 20) {
        resetParticle(particle);
      }
    });
  }

  function calculateDrag() {
    if (!satellite) return 0;

    // Get satellite orientation
    const flowDirection = new THREE.Vector3(-1, 0, 0);

    // Approximate cross-sectional area based on orientation
    const box = new THREE.Box3().setFromObject(satellite);
    const size = box.getSize(new THREE.Vector3());

    // Transform flow direction to satellite local space
    const invMatrix = new THREE.Matrix4().copy(satellite.matrixWorld).invert();
    const localFlow = flowDirection.clone().transformDirection(invMatrix);

    // Calculate projected area (simplified)
    const projectedArea = Math.abs(localFlow.x) * size.y * size.z +
                          Math.abs(localFlow.y) * size.x * size.z +
                          Math.abs(localFlow.z) * size.x * size.y;

    // Drag formula: F = 0.5 * rho * v^2 * Cd * A
    // Using normalized values for visualization
    const rho = 1e-12; // Approximate thermosphere density
    const Cd = 2.2;
    const drag = 0.5 * rho * velocity * velocity * Cd * projectedArea;

    return drag * 1e9; // Scale for display (mN range)
  }

  function updateDragGraph() {
    const ctx = graphCanvas.getContext('2d');
    const width = graphCanvas.width;
    const height = graphCanvas.height;

    ctx.clearRect(0, 0, width, height);

    if (dragHistory.length < 2) return;

    // Find min/max for scaling
    const values = dragHistory.map(d => d.value);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const range = maxVal - minVal || 1;

    // Draw grid
    ctx.strokeStyle = 'rgba(100, 130, 180, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#64ffda';
    ctx.lineWidth = 2;

    dragHistory.forEach((point, i) => {
      const x = (i / (MAX_HISTORY - 1)) * width;
      const y = height - ((point.value - minVal) / range) * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw glow
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Current value
    const currentDrag = dragHistory[dragHistory.length - 1]?.value || 0;
    ctx.fillStyle = '#64ffda';
    ctx.font = '11px SF Mono, Monaco, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(currentDrag.toFixed(2) + ' mN', width - 4, 14);
  }

  function onResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Resize graph canvas
    const graphRect = graphCanvas.parentElement.getBoundingClientRect();
    graphCanvas.width = graphRect.width - 24;
    graphCanvas.height = 100;
  }

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    controls.update();
    updateParticles(delta);

    // Sample drag at 10Hz
    if (dragHistory.length === 0 || now - (dragHistory[dragHistory.length - 1]?.time || 0) > 100) {
      const drag = calculateDrag();
      dragHistory.push({ time: now, value: drag });
      if (dragHistory.length > MAX_HISTORY) {
        dragHistory.shift();
      }
      updateDragGraph();
    }

    renderer.render(scene, camera);
  }
})();
