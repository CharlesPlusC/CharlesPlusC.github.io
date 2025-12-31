/**
 * Satellite Drag & SRP Visualization
 * Double helix formation flying through particle flow with reflections
 */

(function() {
  'use strict';

  let scene, camera, renderer, controls;
  let satellites = [];
  let satelliteTrails = [];
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

  // Double helix parameters
  const HELIX_RADIUS = 3;
  const HELIX_SPEED = 0.4;
  const HELIX_FORWARD_SPEED = 0.8; // Speed moving through particles
  let helixTime = 0;
  let helixOffset = 0; // Forward position

  // Satellite trail settings
  const SAT_TRAIL_LENGTH = 60;
  const TRAIL_COLORS = [
    new THREE.Color(0x3b82f6), // Blue
    new THREE.Color(0x8b5cf6)  // Purple
  ];

  // Flow line settings
  const NUM_LINES = 120;
  const TRAIL_LENGTH = 50;

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
  if (!isBackgroundMode) loadSRPTables();
  animate();

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

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
    if (isBackgroundMode) {
      camera.position.set(-15, 6, 12);
      camera.lookAt(5, 0, 0);
    } else {
      camera.position.set(0, 8, 22);
    }

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (isBackgroundMode) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }

    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 40;

    if (isBackgroundMode) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = false;
      controls.enablePan = false;
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
    keyLight.position.set(5, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.25);
    fillLight.position.set(-8, 5, -5);
    scene.add(fillLight);

    // Create satellites and flow lines
    if (isBackgroundMode) {
      createHelixSatellites();
      createSatelliteTrails();
      createFlowLines();
      createStarField();
    } else {
      loadSingleSatellite();
      createFlowLines();
    }

    sunRayGroup = new THREE.Group();
    if (!isBackgroundMode) {
      scene.add(sunRayGroup);
    }

    // Events
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

  function createHelixSatellites() {
    const loader = new THREE.OBJLoader();

    for (let i = 0; i < 2; i++) {
      const phaseOffset = i * Math.PI;

      loader.load('/data/gps2f_boxwing.obj', (obj) => {
        const sat = obj.clone();

        const busMat = new THREE.MeshPhongMaterial({
          color: i === 0 ? 0xd8dce3 : 0xe0e4eb,
          specular: 0x888888,
          shininess: 60,
          emissive: TRAIL_COLORS[i],
          emissiveIntensity: 0.15
        });

        const panelMat = new THREE.MeshPhongMaterial({
          color: i === 0 ? 0x1e3a6e : 0x2d1b69,
          specular: 0x445577,
          shininess: 30
        });

        sat.traverse((child) => {
          if (child.isMesh) {
            child.material = child.name.includes('Arr') ? panelMat : busMat;
          }
        });

        const box = new THREE.Box3().setFromObject(sat);
        const center = box.getCenter(new THREE.Vector3());
        sat.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const scale = 2.5 / Math.max(size.x, size.y, size.z);
        sat.scale.setScalar(scale);

        sat.userData.phaseOffset = phaseOffset;
        sat.userData.index = i;

        satellites[i] = sat;
        scene.add(sat);
      }, undefined, () => createFallbackHelixSatellite(i, phaseOffset));
    }
  }

  function createFallbackHelixSatellite(index, phaseOffset) {
    const group = new THREE.Group();

    const busMat = new THREE.MeshPhongMaterial({
      color: index === 0 ? 0xd8dce3 : 0xe0e4eb,
      specular: 0x888888,
      shininess: 60,
      emissive: TRAIL_COLORS[index],
      emissiveIntensity: 0.15
    });

    const panelMat = new THREE.MeshPhongMaterial({
      color: index === 0 ? 0x1e3a6e : 0x2d1b69,
      specular: 0x445577,
      shininess: 30
    });

    const bus = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1.2), busMat);
    group.add(bus);

    const panelGeo = new THREE.BoxGeometry(0.06, 3.5, 1.2);
    [-2, 2].forEach(x => {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(x, 0, 0);
      group.add(panel);
    });

    group.userData.phaseOffset = phaseOffset;
    group.userData.index = index;

    satellites[index] = group;
    scene.add(group);
  }

  function createSatelliteTrails() {
    for (let i = 0; i < 2; i++) {
      const positions = new Float32Array(SAT_TRAIL_LENGTH * 3);
      const colors = new Float32Array(SAT_TRAIL_LENGTH * 3);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        linewidth: 2
      });

      const mesh = new THREE.Line(geometry, material);

      const trail = [];
      for (let j = 0; j < SAT_TRAIL_LENGTH; j++) {
        trail.push(new THREE.Vector3(0, 0, 0));
      }

      satelliteTrails.push({
        mesh,
        trail,
        baseColor: TRAIL_COLORS[i]
      });

      scene.add(mesh);
    }
  }

  function updateHelixPositions(delta) {
    helixTime += delta * HELIX_SPEED;
    helixOffset -= delta * HELIX_FORWARD_SPEED; // Move backward through scene (satellites go forward)

    // Reset position when too far back
    if (helixOffset < -25) {
      helixOffset = 15;
      // Reset trails
      satelliteTrails.forEach(trail => {
        for (let j = 0; j < SAT_TRAIL_LENGTH; j++) {
          trail.trail[j].set(0, 0, 0);
        }
      });
    }

    satellites.forEach((sat, i) => {
      if (!sat) return;

      const phase = helixTime + sat.userData.phaseOffset;

      // Double helix position - satellites move forward (negative X direction relative to particles)
      const x = helixOffset;
      const y = Math.sin(phase) * HELIX_RADIUS;
      const z = Math.cos(phase) * HELIX_RADIUS;

      sat.position.set(x, y, z);

      // Rotate to face forward with helix rotation
      sat.rotation.x = phase;
      sat.rotation.y = Math.PI / 2;
    });
  }

  function updateSatelliteTrails() {
    satellites.forEach((sat, i) => {
      if (!sat || !satelliteTrails[i]) return;

      const trail = satelliteTrails[i];

      for (let j = SAT_TRAIL_LENGTH - 1; j > 0; j--) {
        trail.trail[j].copy(trail.trail[j - 1]);
      }

      trail.trail[0].copy(sat.position);

      const positions = trail.mesh.geometry.attributes.position.array;
      const colors = trail.mesh.geometry.attributes.color.array;

      for (let j = 0; j < SAT_TRAIL_LENGTH; j++) {
        const idx = j * 3;
        positions[idx] = trail.trail[j].x;
        positions[idx + 1] = trail.trail[j].y;
        positions[idx + 2] = trail.trail[j].z;

        const t = j / (SAT_TRAIL_LENGTH - 1);
        const fade = Math.pow(1 - t, 1.8);
        const glow = j < 3 ? 1.3 - j * 0.1 : 1;

        colors[idx] = trail.baseColor.r * fade * glow;
        colors[idx + 1] = trail.baseColor.g * fade * glow;
        colors[idx + 2] = trail.baseColor.b * fade * glow;
      }

      trail.mesh.geometry.attributes.position.needsUpdate = true;
      trail.mesh.geometry.attributes.color.needsUpdate = true;
    });
  }

  function loadSingleSatellite() {
    const loader = new THREE.OBJLoader();
    loader.load('/data/gps2f_boxwing.obj', (obj) => {
      const sat = obj;

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

      sat.traverse((child) => {
        if (child.isMesh) {
          child.material = child.name.includes('Arr') ? panelMat : busMat;
        }
      });

      const box = new THREE.Box3().setFromObject(sat);
      const center = box.getCenter(new THREE.Vector3());
      sat.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const scale = 5 / Math.max(size.x, size.y, size.z);
      sat.scale.setScalar(scale);
      sat.rotation.y = Math.PI / 2;

      satellites.push(sat);
      scene.add(sat);
      setTimeout(updateSunRays, 100);
    }, undefined, createFallbackSingleSatellite);
  }

  function createFallbackSingleSatellite() {
    const group = new THREE.Group();

    const busMat = new THREE.MeshPhongMaterial({ color: 0xd8dce3, specular: 0x888888, shininess: 60 });
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1e3a6e, specular: 0x445577, shininess: 30 });

    const bus = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), busMat);
    group.add(bus);

    const panelGeo = new THREE.BoxGeometry(0.1, 7, 2.5);
    [-4, 4].forEach(x => {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(x, 0, 0);
      group.add(panel);
    });

    group.rotation.y = Math.PI / 2;
    satellites.push(group);
    scene.add(group);
    setTimeout(updateSunRays, 100);
  }

  function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 80 + Math.random() * 120;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        colors[i * 3] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 1.0;
      } else if (colorChoice < 0.85) {
        colors[i * 3] = 0.6 + Math.random() * 0.2;
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.2;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  }

  function createFlowLines() {
    for (let i = 0; i < NUM_LINES; i++) {
      const line = createFlowLine(i / NUM_LINES);
      flowLines.push(line);
      scene.add(line.mesh);
    }
  }

  function createFlowLine(offset) {
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

    const startX = 20 - offset * 40;
    const y = (Math.random() - 0.5) * 14;
    const z = (Math.random() - 0.5) * 14;

    const trail = [];
    for (let j = 0; j < TRAIL_LENGTH; j++) {
      trail.push(new THREE.Vector3(startX + j * 0.3, y, z));
    }

    const hue = 0.5 + Math.random() * 0.15;
    const saturation = 0.7 + Math.random() * 0.3;
    const lightness = 0.5 + Math.random() * 0.15;

    return {
      mesh,
      trail,
      velocity: new THREE.Vector3(-1, 0, 0),
      reflected: false,
      reflectedBy: -1,
      age: 0,
      baseColor: new THREE.Color().setHSL(hue, saturation, lightness)
    };
  }

  function resetFlowLine(line) {
    const startX = 22 + Math.random() * 5;
    const y = (Math.random() - 0.5) * 16;
    const z = (Math.random() - 0.5) * 16;

    for (let j = 0; j < TRAIL_LENGTH; j++) {
      line.trail[j].set(startX + j * 0.2, y, z);
    }

    line.velocity.set(-1, 0, 0);
    line.reflected = false;
    line.reflectedBy = -1;
    line.age = 0;
    const hue = 0.5 + Math.random() * 0.15;
    line.baseColor.setHSL(hue, 0.7 + Math.random() * 0.3, 0.5 + Math.random() * 0.15);
  }

  function updateFlowLines(delta) {
    const speed = (velocity / 7000) * 22 * delta;

    // Build bounding boxes for all satellites
    const satBoxes = [];
    const satCenters = [];
    const satSizes = [];

    satellites.forEach((sat, i) => {
      if (!sat) return;
      const box = new THREE.Box3().setFromObject(sat);
      box.expandByScalar(0.3);
      satBoxes[i] = box;
      satCenters[i] = box.getCenter(new THREE.Vector3());
      satSizes[i] = box.getSize(new THREE.Vector3());
    });

    flowLines.forEach(line => {
      line.age += delta;

      const head = line.trail[0];
      head.addScaledVector(line.velocity, speed);

      // Check collision with all satellites
      if (!line.reflected) {
        for (let i = 0; i < satBoxes.length; i++) {
          if (!satBoxes[i]) continue;

          if (satBoxes[i].containsPoint(head)) {
            line.reflected = true;
            line.reflectedBy = i;
            line.age = 0;

            const rel = head.clone().sub(satCenters[i]);
            const size = satSizes[i];
            const ax = Math.abs(rel.x) / (size.x || 1);
            const ay = Math.abs(rel.y) / (size.y || 1);
            const az = Math.abs(rel.z) / (size.z || 1);

            const normal = new THREE.Vector3();
            if (ax >= ay && ax >= az) normal.set(Math.sign(rel.x), 0, 0);
            else if (ay >= ax && ay >= az) normal.set(0, Math.sign(rel.y), 0);
            else normal.set(0, 0, Math.sign(rel.z));

            const v = line.velocity;
            const d = v.dot(normal);
            v.sub(normal.clone().multiplyScalar(2 * d));
            v.normalize();

            // Color based on which satellite was hit
            if (i === 0) {
              line.baseColor.setHSL(0.08 + Math.random() * 0.04, 0.95, 0.55); // Orange/gold
            } else {
              line.baseColor.setHSL(0.85 + Math.random() * 0.1, 0.9, 0.6); // Pink/magenta
            }
            break;
          }
        }
      }

      // Cascade trail positions
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

        const t = j / (TRAIL_LENGTH - 1);
        const fade = Math.pow(1 - t, 1.5);
        const reflectFade = line.reflected ? Math.max(0, 1 - line.age * 0.35) : 1;
        const alpha = fade * reflectFade;

        colors[idx] = line.baseColor.r * alpha + (1 - alpha) * 0.06;
        colors[idx + 1] = line.baseColor.g * alpha + (1 - alpha) * 0.09;
        colors[idx + 2] = line.baseColor.b * alpha + (1 - alpha) * 0.16;
      }

      line.mesh.geometry.attributes.position.needsUpdate = true;
      line.mesh.geometry.attributes.color.needsUpdate = true;

      // Reset if out of bounds
      if (head.x < -30 || head.x > 35 || Math.abs(head.y) > 20 || Math.abs(head.z) > 20) {
        resetFlowLine(line);
      }
    });
  }

  function updateSunRays() {
    if (!satellites.length) return;
    const sat = satellites[0];
    if (!sat) return;

    while (sunRayGroup.children.length) sunRayGroup.remove(sunRayGroup.children[0]);

    const latRad = sunLat * Math.PI / 180;
    const lonRad = sunLon * Math.PI / 180;
    const sunDir = new THREE.Vector3(
      Math.cos(latRad) * Math.cos(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.sin(lonRad)
    ).normalize();

    const box = new THREE.Box3().setFromObject(sat);
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

    ctx.strokeStyle = '#e2e8f0';
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i/3)*h);
      ctx.lineTo(w, (i/3)*h);
      ctx.stroke();
    }

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

    if (isBackgroundMode) {
      // Double helix moving through particles
      updateHelixPositions(delta);
      updateSatelliteTrails();
    }

    // Always update flow lines (particles)
    updateFlowLines(delta);

    if (!isBackgroundMode) {
      if (!dragHistory.length || now - dragHistory[dragHistory.length-1].time > 100) {
        dragHistory.push({ time: now, value: calculateDrag() });
        if (dragHistory.length > MAX_HISTORY) dragHistory.shift();

        srpHistory.push({ time: now, value: calculateSRP() });
        if (srpHistory.length > MAX_HISTORY) srpHistory.shift();

        updateGraph(dragGraph, dragHistory, '#3b82f6');
        updateGraph(srpGraph, srpHistory, '#f59e0b');
      }
    }

    renderer.render(scene, camera);
  }
})();
