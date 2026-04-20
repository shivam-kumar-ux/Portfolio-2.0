/**
 * threejs-scene.js
 * ─────────────────────────────────────────────────────────────
 * Builds and animates the 3D hero graphic using Three.js r128.
 *
 * Scene objects:
 *  1. Wireframe icosahedron shell   — outer crystal, neon cyan
 *  2. Solid inner core              — dark faceted icosahedron
 *  3. Torus ring #1 (cyan)          — horizontal orbital plane
 *  4. Torus ring #2 (violet)        — tilted orbital plane
 *  5. Three orbiting dot spheres    — cyan, violet, rose
 *  6. Particle halo                 — 600 pts in spherical cloud
 *  7. Two point lights              — neon + violet fill
 *
 * Parallax: camera lerps toward the normalised mouse position.
 *
 * Performance:
 *  - On mobile (≤ 768px) the Three.js scene is fully disabled
 *    to save GPU resources. The canvas simply stays transparent.
 *  - devicePixelRatio is capped at 2 to avoid overshading on
 *    high-DPI screens.
 *  - The animation loop pauses when the document is hidden.
 * ─────────────────────────────────────────────────────────────
 */

(function initThreeScene() {
  'use strict';

  const canvas = document.getElementById('tc');
  if (!canvas || typeof THREE === 'undefined') return;

  /* Skip 3D scene on mobile — show nothing, save GPU */
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    canvas.style.display = 'none';
    return;
  }

  /* ── Renderer — fill the hero section ── */
  const heroSection = document.getElementById('hero');
  const W = heroSection ? heroSection.clientWidth  : window.innerWidth;
  const H = heroSection ? heroSection.clientHeight : window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  /* ── Scene & camera ── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
  camera.position.z = 5;

  /* ── 1. Outer wireframe icosahedron ── */
  const icoMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.MeshStandardMaterial({
      color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.42,
    })
  );
  scene.add(icoMesh);

  /* ── 2. Inner solid core ── */
  const coreMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 0),
    new THREE.MeshStandardMaterial({
      color: 0x071828, emissive: 0x001530, roughness: 0.7, metalness: 0.3,
    })
  );
  scene.add(coreMesh);

  /* ── 3 & 4. Orbital torus rings ── */
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.017, 8, 90),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.2 })
  );
  ring1.rotation.x = Math.PI / 2;
  scene.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.85, 0.011, 8, 90),
    new THREE.MeshBasicMaterial({ color: 0x7b2ff7, transparent: true, opacity: 0.15 })
  );
  ring2.rotation.x = Math.PI / 3;
  ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  /* ── 5. Orbiting dot spheres ── */
  /**
   * @typedef {{ mesh: THREE.Mesh, radius: number, phase: number, speed: number }} Orb
   */

  /** @type {Orb[]} */
  const orbs = [
    { color: 0x00e5ff, radius: 2.3,  phase: 0.0, speed: 0.52 },
    { color: 0x7b2ff7, radius: 2.65, phase: 1.3, speed: 0.38 },
    { color: 0xff2d78, radius: 2.1,  phase: 2.5, speed: 0.61 },
  ].map(({ color, radius, phase, speed }) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.072, 10, 10),
      new THREE.MeshBasicMaterial({ color })
    );
    scene.add(mesh);
    return { mesh, radius, phase, speed };
  });

  /* ── 6. Spherical particle halo ── */
  const PARTICLE_COUNT = 600;
  const positions      = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 2.8 + Math.random() * 2.0;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(
    ptGeo,
    new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.02, transparent: true, opacity: 0.5 })
  ));

  /* ── 7. Lights ── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.32));

  const pLight1 = new THREE.PointLight(0x00e5ff, 2.0, 12);
  pLight1.position.set(3, 3, 3);
  scene.add(pLight1);

  const pLight2 = new THREE.PointLight(0x7b2ff7, 1.5, 12);
  pLight2.position.set(-3, -2, 2);
  scene.add(pLight2);

  /* ── Mouse parallax tracking ── */
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Responsive resize ── */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const hero = document.getElementById('hero');
      const w = hero ? hero.clientWidth  : window.innerWidth;
      const h = hero ? hero.clientHeight : window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }, 150);
  });

  /* ── Animation loop ── */
  let elapsed  = 0;
  let isActive = true;

  document.addEventListener('visibilitychange', () => {
    isActive = !document.hidden;
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!isActive) return;

    elapsed += 0.012;

    /* Rotate main objects */
    icoMesh.rotation.y  =  elapsed * 0.36;
    icoMesh.rotation.x  =  elapsed * 0.13;
    coreMesh.rotation.y = -elapsed * 0.26;
    coreMesh.rotation.z =  elapsed * 0.08;

    /* Spin rings */
    ring1.rotation.z = elapsed * 0.16;
    ring2.rotation.y = elapsed * 0.12;

    /* Move orbiting dots along circular paths */
    for (const orb of orbs) {
      orb.mesh.position.x = Math.cos(elapsed * orb.speed + orb.phase) * orb.radius;
      orb.mesh.position.y = Math.sin(elapsed * orb.speed + orb.phase) * 0.45;
      orb.mesh.position.z = Math.sin(elapsed * orb.speed + orb.phase) * orb.radius;
    }

    /* Lerp camera for parallax */
    camera.position.x += (targetX * 0.32 - camera.position.x) * 0.05;
    camera.position.y += (targetY * 0.32 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

})();