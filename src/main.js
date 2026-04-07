import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ═══════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════ */

const HELIX_RADIUS   = 4.5;
const TOTAL_HEIGHT   = 35;
const HELIX_TURNS    = 2.5;
const CAMERA_RADIUS  = 9;
const SPINE_VERTS    = 26;
const LERP_SPEED     = 0.045;
const SCROLL_SENS    = 0.00035;

/* ═══════════════════════════════════════════════════════
   RESUME DATA — Edit your content here
   ═══════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    title: 'GEO HAMILTON',
    body: [
      'AI & Cloud/BI Architecture',
      '',
      '11+ years delivering Linux, cloud,',
      'data & analytics platforms.',
      '',
      'Scroll to explore ↓',
    ],
    accent: '#5588ff',
  },
  {
    title: 'ABOUT',
    body: [
      'Cloud/BI architect: MicroStrategy,',
      'Power BI, Looker, AWS, GCP.',
      '',
      'Built "OpenClaw" — Claude-based AI',
      'agent for real-world delivery.',
      'Known for bridging teams &',
      'creating roles that didn\'t exist.',
    ],
    accent: '#44ddaa',
  },
  {
    title: 'SKILLS',
    body: [
      'Agentic AI · Claude · LLM Workflows',
      'Linux · Docker · Kubernetes',
      'AWS · GCP · Snowflake · PostgreSQL',
      'MicroStrategy · Power BI · Looker',
      'Python · Java · SQL · SAS',
      'SSO · OpenAM · OAuth · Jira',
    ],
    accent: '#ff6644',
  },
  {
    title: 'OPENCLAW',
    body: [
      'Claude-based AI Agent System',
      '',
      'Context mgmt, tool orchestration,',
      'repeatable workflows for tech ops.',
      'Human-in-the-loop reliability.',
      'Automation, reporting, analysis.',
    ],
    accent: '#aa66ff',
  },
  {
    title: 'CHARTER',
    body: [
      'Solutions Partner & Cloud Architect',
      'Datafact Z · Oct 2021 – Present',
      '',
      'Led MSTR → PowerBI migration,',
      'Fortune 100 client, team of 12.',
      'AWS end-to-end. 4000+ daily users.',
      '3 renewed SLAs + 1 new project.',
    ],
    accent: '#ffaa44',
  },
  {
    title: 'PWC LONDON',
    body: [
      'Solutions Partner & Cloud Architect',
      'Pandera Systems · 2018 – 2022',
      '',
      '$4MM account, grew $1.2MM/yr.',
      'LDAP → SSO for 20k users.',
      'GCP + Linux + MSTR admin.',
      'Python API scripts for auditing.',
    ],
    accent: '#44aaff',
  },
  {
    title: 'EARLY CAREER',
    body: [
      'NDE Inc · BI Specialist · 2017–18',
      '  Cloud migration lead, GCP + MSTR',
      '',
      'Home Depot · Soft Eng 3 · 2016–17',
      '  Automated 300+ reports to Tableau',
      '',
      'Cox Comms · Soft Eng 1 · 2013–16',
      '  Created my own role. C-suite BI.',
    ],
    accent: '#ff44aa',
  },
  {
    title: 'CONTACT',
    body: [
      'tim.d.hamilton@gmail.com',
      '678.689.3330',
      '',
      'Maui, HI · Remote',
      '',
      'Humanitarian: medical ship team',
      'Australia & PNG — cataract',
      'surgery for remote villages (2012)',
    ],
    accent: '#44ffdd',
  },
];

const NUM_SCREENS = SECTIONS.length;

/* ═══════════════════════════════════════════════════════
   RENDERER & SCENE
   ═══════════════════════════════════════════════════════ */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040408);
scene.fog = new THREE.FogExp2(0x040408, 0.022);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 120
);

/* ═══════════════════════════════════════════════════════
   POST-PROCESSING
   ═══════════════════════════════════════════════════════ */

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.85,  // strength
  0.4,   // radius
  0.80   // threshold
));
composer.addPass(new OutputPass());

/* ═══════════════════════════════════════════════════════
   LIGHTING
   ═══════════════════════════════════════════════════════ */

scene.add(new THREE.AmbientLight(0x1a1a2e, 0.6));

const keyLight = new THREE.PointLight(0x4488ff, 3, 50);
keyLight.position.set(8, 12, 8);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xff4488, 1.8, 40);
fillLight.position.set(-6, -8, -6);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0x44ffaa, 1.2, 35);
rimLight.position.set(0, 0, 10);
scene.add(rimLight);

/* ═══════════════════════════════════════════════════════
   SPINE — Stylized vertebrae with spinal cord
   ═══════════════════════════════════════════════════════ */

/** Natural S-curve offset (sagittal plane) */
function spineCurveZ(t) {
  return Math.sin(t * Math.PI * 2) * 0.35;
}

function buildSpine() {
  const group = new THREE.Group();
  const step = TOTAL_HEIGHT / SPINE_VERTS;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x8888aa,
    metalness: 0.75,
    roughness: 0.25,
    emissive: 0x111122,
    emissiveIntensity: 0.3,
  });

  const discMat = new THREE.MeshStandardMaterial({
    color: 0x4466aa,
    emissive: 0x223366,
    emissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.5,
  });

  for (let i = 0; i < SPINE_VERTS; i++) {
    const t = i / (SPINE_VERTS - 1);
    const y = TOTAL_HEIGHT / 2 - i * step;
    const z = spineCurveZ(t);

    // Vertebral body — wider in the lumbar region
    const w = 0.28 + Math.sin(t * Math.PI) * 0.1;
    const bodyGeo = new THREE.BoxGeometry(w * 2, step * 0.42, w * 1.4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, y, z);
    group.add(body);

    // Spinous process (posterior spike)
    const procGeo = new THREE.ConeGeometry(0.055, 0.5, 4);
    const proc = new THREE.Mesh(procGeo, bodyMat);
    proc.position.set(0, y, z - w * 1.3);
    proc.rotation.x = Math.PI / 2;
    group.add(proc);

    // Transverse processes (lateral wings)
    for (const side of [-1, 1]) {
      const tpGeo = new THREE.ConeGeometry(0.04, 0.35, 4);
      const tp = new THREE.Mesh(tpGeo, bodyMat);
      tp.position.set(side * w * 1.1, y, z - w * 0.3);
      tp.rotation.z = side * Math.PI / 2;
      group.add(tp);
    }

    // Intervertebral disc
    if (i < SPINE_VERTS - 1) {
      const nextZ = spineCurveZ((i + 1) / (SPINE_VERTS - 1));
      const discGeo = new THREE.CylinderGeometry(w * 0.75, w * 0.75, step * 0.12, 8);
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.set(0, y - step * 0.35, (z + nextZ) / 2);
      group.add(disc);
    }
  }

  // Spinal cord — glowing tube through the canal
  const cordPts = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    cordPts.push(new THREE.Vector3(0, TOTAL_HEIGHT / 2 - t * TOTAL_HEIGHT, spineCurveZ(t)));
  }
  const cordCurve = new THREE.CatmullRomCurve3(cordPts);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 120, 0.055, 8, false);
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    emissive: 0x2255cc,
    emissiveIntensity: 1.3,
    transparent: true,
    opacity: 0.85,
  });
  group.add(new THREE.Mesh(cordGeo, cordMat));

  return group;
}

const spine = buildSpine();
scene.add(spine);

/* ═══════════════════════════════════════════════════════
   HELIX RAIL — Glowing tube tracing the screen path
   ═══════════════════════════════════════════════════════ */

function buildHelixRail() {
  const pts = [];
  for (let i = 0; i <= 500; i++) {
    const t = i / 500;
    const angle = t * HELIX_TURNS * Math.PI * 2;
    const y = TOTAL_HEIGHT / 2 - t * TOTAL_HEIGHT;
    pts.push(new THREE.Vector3(
      HELIX_RADIUS * Math.cos(angle),
      y,
      HELIX_RADIUS * Math.sin(angle)
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 500, 0.015, 6, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3355aa,
    emissive: 0x112288,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.3,
  });
  return new THREE.Mesh(geo, mat);
}

scene.add(buildHelixRail());

/* ═══════════════════════════════════════════════════════
   SCREEN TEXTURES — Canvas-rendered resume cards
   ═══════════════════════════════════════════════════════ */

function makeTexture(section) {
  const W = 1024, H = 640;
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d');

  // Background
  ctx.fillStyle = 'rgba(6, 6, 14, 0.92)';
  ctx.beginPath();
  ctx.roundRect(6, 6, W - 12, H - 12, 14);
  ctx.fill();

  // Glowing border
  ctx.save();
  ctx.strokeStyle = section.accent;
  ctx.lineWidth = 2;
  ctx.shadowColor = section.accent;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.roundRect(6, 6, W - 12, H - 12, 14);
  ctx.stroke();
  ctx.restore();

  // Accent bar under title
  ctx.fillStyle = section.accent;
  ctx.fillRect(44, 84, 140, 2.5);

  // Title
  ctx.font = '700 50px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(section.title, 44, 74);

  // Body
  ctx.font = '300 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#bbbbc8';
  section.body.forEach((line, i) => {
    ctx.fillText(line, 44, 134 + i * 40);
  });

  const tex = new THREE.CanvasTexture(cvs);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

/* ═══════════════════════════════════════════════════════
   HELIX SCREENS
   ═══════════════════════════════════════════════════════ */

const screens = [];

SECTIONS.forEach((section, i) => {
  const tex = makeTexture(section);
  const geo = new THREE.PlaneGeometry(3.4, 2.1);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: tex,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);

  const t = i / (NUM_SCREENS - 1);
  const angle = t * HELIX_TURNS * Math.PI * 2;
  const y = TOTAL_HEIGHT / 2 - t * TOTAL_HEIGHT;
  const x = HELIX_RADIUS * Math.cos(angle);
  const z = HELIX_RADIUS * Math.sin(angle);

  mesh.position.set(x, y, z);
  mesh.lookAt(0, y, 0);
  mesh.rotateY(Math.PI); // flip so text faces outward toward camera

  scene.add(mesh);
  screens.push({ mesh, angle, y, t });
});

/* ═══════════════════════════════════════════════════════
   NERVE CONNECTIONS — Spine to each screen
   ═══════════════════════════════════════════════════════ */

screens.forEach(({ angle, y }) => {
  const t = (TOTAL_HEIGHT / 2 - y) / TOTAL_HEIGHT;
  const z0 = spineCurveZ(t);
  const pts = [
    new THREE.Vector3(0, y, z0),
    new THREE.Vector3(
      HELIX_RADIUS * 0.45 * Math.cos(angle),
      y,
      HELIX_RADIUS * 0.45 * Math.sin(angle)
    ),
    new THREE.Vector3(
      HELIX_RADIUS * Math.cos(angle),
      y,
      HELIX_RADIUS * Math.sin(angle)
    ),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 30, 0.01, 4, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x335588,
    emissive: 0x112244,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.25,
  });
  scene.add(new THREE.Mesh(geo, mat));
});

/* ═══════════════════════════════════════════════════════
   PARTICLES — Ambient floating dust
   ═══════════════════════════════════════════════════════ */

function buildParticles() {
  const count = 3000;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * TOTAL_HEIGHT * 1.8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x4466aa,
    size: 0.035,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

const particles = buildParticles();
scene.add(particles);

/* ═══════════════════════════════════════════════════════
   SCROLL INPUT
   ═══════════════════════════════════════════════════════ */

let scrollTarget = 0;
let scrollCurrent = 0;

window.addEventListener('wheel', (e) => {
  scrollTarget += e.deltaY * SCROLL_SENS;
  scrollTarget = Math.max(0, Math.min(1, scrollTarget));
}, { passive: true });

let touchY = 0;
window.addEventListener('touchstart', (e) => {
  touchY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchmove', (e) => {
  const dy = touchY - e.touches[0].clientY;
  touchY = e.touches[0].clientY;
  scrollTarget += dy * 0.002;
  scrollTarget = Math.max(0, Math.min(1, scrollTarget));
}, { passive: true });

/* ═══════════════════════════════════════════════════════
   KEYBOARD — Arrow keys / Page Up/Down
   ═══════════════════════════════════════════════════════ */

window.addEventListener('keydown', (e) => {
  const step = 1 / (NUM_SCREENS - 1);
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    scrollTarget = Math.min(1, scrollTarget + step);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    scrollTarget = Math.max(0, scrollTarget - step);
  } else if (e.key === 'Home') {
    scrollTarget = 0;
  } else if (e.key === 'End') {
    scrollTarget = 1;
  }
});

/* ═══════════════════════════════════════════════════════
   UI ELEMENTS
   ═══════════════════════════════════════════════════════ */

const progressFill = document.getElementById('progress-fill');
const labelEl      = document.getElementById('section-label');
const hintEl       = document.getElementById('scroll-hint');

function updateUI() {
  // Progress bar
  progressFill.style.height = `${scrollCurrent * 100}%`;

  // Section label
  const idx = Math.round(scrollCurrent * (NUM_SCREENS - 1));
  const clamped = Math.max(0, Math.min(NUM_SCREENS - 1, idx));
  labelEl.textContent = SECTIONS[clamped].title;

  // Hide scroll hint after first scroll
  if (scrollCurrent > 0.01) {
    hintEl.style.opacity = '0';
    hintEl.style.transition = 'opacity 1s';
  }
}

/* ═══════════════════════════════════════════════════════
   ANIMATION LOOP
   ═══════════════════════════════════════════════════════ */

const clock = new THREE.Clock();

// Cache base emissive values for spine pulse
const spineEmissives = [];
spine.children.forEach((child) => {
  if (child.material?.emissive) {
    spineEmissives.push({ mesh: child, base: child.material.emissiveIntensity });
  }
});

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  // Smooth-scroll interpolation
  scrollCurrent += (scrollTarget - scrollCurrent) * LERP_SPEED;

  // ── Camera follows helix at larger radius ──
  const camAngle = scrollCurrent * HELIX_TURNS * Math.PI * 2;
  const camY     = TOTAL_HEIGHT / 2 - scrollCurrent * TOTAL_HEIGHT;

  camera.position.set(
    CAMERA_RADIUS * Math.cos(camAngle),
    camY,
    CAMERA_RADIUS * Math.sin(camAngle)
  );
  camera.lookAt(0, camY, 0);

  // ── Screen glow by proximity to camera ──
  screens.forEach((s) => {
    const d = camera.position.distanceTo(s.mesh.position);
    s.mesh.material.emissiveIntensity = THREE.MathUtils.clamp(1.4 - d / 7, 0.08, 0.6);
    s.mesh.material.opacity           = THREE.MathUtils.clamp(1.4 - d / 10, 0.25, 0.97);
  });

  // ── Particle drift ──
  particles.rotation.y = time * 0.012;

  // ── Spine pulse ──
  const pulse = Math.sin(time * 1.5) * 0.15 + 1.0;
  spineEmissives.forEach(({ mesh, base }) => {
    mesh.material.emissiveIntensity = base * pulse;
  });

  // ── Orbiting lights ──
  keyLight.position.x  =  8 * Math.cos(time * 0.18);
  keyLight.position.z  =  8 * Math.sin(time * 0.18);
  fillLight.position.x = -6 * Math.cos(time * 0.13);
  fillLight.position.z = -6 * Math.sin(time * 0.13);

  updateUI();
  composer.render();
}

animate();

/* ═══════════════════════════════════════════════════════
   RESIZE
   ═══════════════════════════════════════════════════════ */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
