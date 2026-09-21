import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ═══════════════════════════════════════════════════════
   NOTICE POPUP
   ═══════════════════════════════════════════════════════ */

document.getElementById('notice-dismiss').addEventListener('click', () => {
  document.getElementById('notice-overlay').classList.add('hidden');
});

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
const TITLE_HEIGHT   = 14;

// Derived
const TITLE_Y        = TOTAL_HEIGHT / 2 + TITLE_HEIGHT;
const TOTAL_TRAVEL   = TOTAL_HEIGHT + TITLE_HEIGHT;
const TITLE_FRAC     = TITLE_HEIGHT / TOTAL_TRAVEL;

/* ═══════════════════════════════════════════════════════
   RESUME DATA — Edit your content here
   ═══════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    title: 'DASHBOARD',
    body: [
      'Live career metrics',
      'powered by Supabase',
      '',
      'Click to explore  \u25B6',
    ],
    accent: '#ffb000',
    link: '/dashboard.html',
    chart: true,
  },
  {
    title: 'GEO HAMILTON',
    body: [
      'Built my career by creating roles',
      'that didn\'t exist yet — then delivering',
      'so well they became permanent.',
      '',
      '13+ yrs Fortune 100 cloud & data —',
      'now architecting & self-hosting',
      'production AI systems end-to-end.',
    ],
    accent: '#ffb000',
  },
  {
    title: 'AGENTIC LAB',
    body: [
      'Cancel-Sort — Agentic Ops Console',
      '',
      'LLM chat input → tool-calling agent.',
      'Tools fire as discrete, visible steps.',
      'Self-hosted Qwen2.5-7B · zero APIs.',
      'Run full pipeline · export CSV.',
      '',
      'Click to open the live lab  ▶',
      'Code: github.com/T-Hamilton/cancel-sort',
    ],
    accent: '#ffb000',
    link: '/lab.html',
  },
  {
    title: 'SKILLS',
    body: [
      ['LLM Serving · vLLM · llama.cpp', 'AI'],
      ['RAG · pgvector · Semantic Memory', 'AI'],
      ['Agentic Orchestration · Multi-Agent', 'AI'],
      ['Generative Media · Diffusion · LoRA', 'AI'],
      ['GPU Infra · CUDA · Self-Hosting', 'AI'],
      [],
      ['Cloud / Data Architecture', '13 yrs'],
      ['AWS · GCP · Snowflake · Postgres', '13 yrs'],
      ['Python · Go · SQL · Java', '13 yrs'],
      ['Linux · Docker · SSO · IAM', '13 yrs'],
    ],
    accent: '#ffb000',
    grid: true,
  },
  {
    title: 'AI ENGINEERING',
    body: [
      'Self-directed · 2024 – Present',
      '',
      'Architect & self-host production AI',
      'end-to-end — zero third-party APIs.',
      '',
      'Multi-modal AI platform: 70B LLM,',
      'pgvector memory, image / video gen.',
      '',
      'Distributed agentic AI: Go multi-agent,',
      'encrypted, sovereign, self-deploying.',
      '',
      'Gen-AI marketplace · LLM analytics bot.',
    ],
    accent: '#ffb000',
  },
  {
    title: 'FEATURED BUILD',
    body: [
      'Relay — Support & Ops Console',
      '',
      'Full-stack demo in this exact stack:',
      'Next.js + Redux · RTK Query · Thunk · Saga',
      'Django REST core + FastAPI async edge',
      '',
      'Click to open the live demo  ▶',
      'Code: github.com/T-Hamilton/relay',
    ],
    accent: '#ffb000',
    link: 'https://relay-demo-47l.pages.dev',
  },
  {
    title: 'CHARTER & DATAFACT Z',
    body: [
      'Solutions Partner & Cloud Architect',
      'Oct 2021 – Present',
      '',
      'Led MSTR → PowerBI migration for',
      'Fortune 100 client, team of 12.',
      'AWS end-to-end · Snowflake · Postgres.',
      '2 BI platforms deployed, 4000+ daily.',
      'Introduced AI-assisted dev workflows.',
    ],
    accent: '#ffb000',
  },
  {
    title: 'PWC LONDON / PANDERA',
    body: [
      'Solutions Partner & Cloud Architect',
      'Pandera Systems · 2018 – 2022',
      '',
      '$4MM account, grew $1.2MM/yr.',
      'LDAP → SSO for 20k users.',
      'GCP + Linux + MSTR admin.',
      'Python API scripts for auditing.',
    ],
    accent: '#ffb000',
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
      '',
      'Humanitarian: medical ship team',
      'Australia & PNG — cataract',
      'surgery for remote villages (2012)',
    ],
    accent: '#ffb000',
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
scene.background = new THREE.Color(0x010503);
scene.fog = new THREE.FogExp2(0x010503, 0.022);

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

scene.add(new THREE.AmbientLight(0x102418, 0.6));

const keyLight = new THREE.PointLight(0x00ff88, 2.2, 50);
keyLight.position.set(8, 12, 8);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x0a5533, 1.8, 40);
fillLight.position.set(-6, -8, -6);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0x33ffcc, 1.2, 35);
rimLight.position.set(0, 0, 10);
scene.add(rimLight);

/* ═══════════════════════════════════════════════════════
   SPINE — Matrix data-stream column
   Falling glyph rain forming a vertical conduit of code
   ═══════════════════════════════════════════════════════ */

const MATRIX_GLYPHS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789<>=*+-:・¦'.split('');

const STREAM_COUNT = 30;
const STREAM_ROWS  = 24;   // glyphs per texture tile
const GLYPH_PX     = 64;
const matrixStreams = [];

function drawGlyphRow(ctx, r) {
  const ch = MATRIX_GLYPHS[(Math.random() * MATRIX_GLYPHS.length) | 0];
  ctx.clearRect(0, r * GLYPH_PX, GLYPH_PX, GLYPH_PX);
  ctx.save();
  ctx.font = '700 46px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (r === 0) {
    // Stream head — near-white with a strong halo, catches the bloom pass
    ctx.fillStyle = '#eaffef';
    ctx.shadowColor = '#aaffcc';
    ctx.shadowBlur = 12;
  } else {
    const fade = 1 - r / STREAM_ROWS;
    const amber = Math.random() < 0.05; // rogue amber glyph in the rain
    ctx.fillStyle = amber
      ? `rgba(255, 176, 0, ${(0.25 + 0.75 * fade).toFixed(3)})`
      : `rgba(0, 255, 136, ${(0.15 + 0.85 * fade).toFixed(3)})`;
    ctx.shadowColor = amber ? '#ffb000' : '#00ff88';
    ctx.shadowBlur = 8 * fade;
  }
  ctx.fillText(ch, GLYPH_PX / 2, r * GLYPH_PX + GLYPH_PX / 2);
  ctx.restore();
}

function makeStreamTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = GLYPH_PX;
  cvs.height = GLYPH_PX * STREAM_ROWS;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  for (let r = 0; r < STREAM_ROWS; r++) drawGlyphRow(ctx, r);
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return { tex, ctx };
}

function buildSpine() {
  const group = new THREE.Group();
  const H = TOTAL_HEIGHT + 6;

  for (let i = 0; i < STREAM_COUNT; i++) {
    const { tex, ctx } = makeStreamTexture();
    const radius = 0.2 + Math.random() * 0.75;
    const angle  = Math.random() * Math.PI * 2;
    const planeW = 0.16 + Math.random() * 0.1;
    tex.repeat.set(1, 1.2 + Math.random() * 1.8);

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.22 + Math.random() * 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, H), mat);
    mesh.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    group.add(mesh);

    matrixStreams.push({
      mesh, tex, ctx,
      speed: 0.08 + Math.random() * 0.18,
      nextRetex: Math.random() * 0.5,
    });
  }

  // Faint green core glow up the middle of the column
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H, 16), coreMat));

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
  const geo = new THREE.TubeGeometry(curve, 500, 0.015, 12, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x116644,
    emissive: 0x008855,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.3,
  });
  return new THREE.Mesh(geo, mat);
}

scene.add(buildHelixRail());

/* ═══════════════════════════════════════════════════════
   TITLE — Floating hero billboard with photo
   ═══════════════════════════════════════════════════════ */

const titleGroup = new THREE.Group();
titleGroup.position.set(0, TITLE_Y, 0);
titleGroup.lookAt(CAMERA_RADIUS, TITLE_Y, 0);
scene.add(titleGroup);

// Glowing torus ring around photo area
const titleRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.25, 0.045, 16, 120),
  new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00cc66,
    emissiveIntensity: 1.5,
  })
);
titleRing.position.set(-5.26, 0, 0.1);
titleGroup.add(titleRing);

// Outer decorative ring
const titleRing2 = new THREE.Mesh(
  new THREE.TorusGeometry(1.42, 0.02, 12, 120),
  new THREE.MeshStandardMaterial({
    color: 0x66ffcc,
    emissive: 0x22cc88,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: 0.6,
  })
);
titleRing2.position.copy(titleRing.position);
titleGroup.add(titleRing2);

// Point light for title emphasis
const titleLight = new THREE.PointLight(0xfff8f0, 6, 25);
titleLight.position.set(0, 0, 4);
titleGroup.add(titleLight);

function buildTitleCanvas(photo) {
  const W = 2048, H = 900;
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Photo
  if (photo) {
    const r = 165;
    const cx = 310, cy = H / 2;

    // Glow halo
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 22;
    ctx.stroke();
    ctx.restore();

    // Circular crop
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const imgA = photo.width / photo.height;
    let dw, dh;
    if (imgA > 1) { dh = r * 2; dw = dh * imgA; }
    else           { dw = r * 2; dh = dw / imgA; }
    ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }

  // "GEO HAMILTON"
  ctx.save();
  ctx.font = '800 130px ui-monospace, Menlo, monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 30;
  ctx.fillText('GEO', 600, 310);
  ctx.fillText('HAMILTON', 600, 490);
  ctx.restore();

  // Accent line
  ctx.save();
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 20;
  ctx.fillRect(600, 525, 700, 4);
  ctx.restore();

  // Subtitle
  ctx.font = '400 58px ui-monospace, Menlo, monospace';
  ctx.fillStyle = '#5f9b7d';
  ctx.fillText('an interactive resume', 600, 620);

  // Teaser \u2014 points to the live demo builds further down the helix
  ctx.font = '500 42px ui-monospace, Menlo, monospace';
  ctx.fillStyle = '#66ffaa';
  ctx.fillText('interactive demo builds below  \u2193', 600, 700);

  const tex = new THREE.CanvasTexture(cvs);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function createTitleMesh(tex) {
  const old = titleGroup.children.find(c => c.userData.isTitlePlane);
  if (old) { old.geometry.dispose(); old.material.dispose(); titleGroup.remove(old); }

  const h = 6.5;
  const w = h * (2048 / 900);
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.12,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isTitlePlane = true;
  mesh.position.z = 0.15;
  titleGroup.add(mesh);
}

// Render title immediately (no photo), then re-render with photo once loaded
createTitleMesh(buildTitleCanvas(null));
const _photoImg = new Image();
_photoImg.src = '/photo.jpg';
_photoImg.onload = () => createTitleMesh(buildTitleCanvas(_photoImg));

/* ═══════════════════════════════════════════════════════
   BACKGROUND G — Spinning monogram with helix
   ═══════════════════════════════════════════════════════ */

const bgGGroup = new THREE.Group();
bgGGroup.position.set(-2, TITLE_Y, 0);
scene.add(bgGGroup);

// G letter
{
  const s = 512;
  const cvs = document.createElement('canvas');
  cvs.width = s; cvs.height = s;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  ctx.font = '800 380px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 35;
  ctx.fillText('G', s / 2, s / 2 + 10);

  const tex = new THREE.CanvasTexture(cvs);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0x00ff88,
      emissiveMap: tex,
      emissiveIntensity: 0.45,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  mesh.rotation.y = -Math.PI / 2; // face camera at start
  bgGGroup.add(mesh);
}

// Circle tightly around the G — sits in the helix gap
const BG_R = 2.2;
const bgCircle = new THREE.Mesh(
  new THREE.TorusGeometry(BG_R, 0.035, 16, 120),
  new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00cc66,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.5,
  })
);
bgCircle.rotation.y = Math.PI / 2;
bgGGroup.add(bgCircle);

// Helix with a gap in the middle where the circle sits
const bgHelixMat = new THREE.MeshStandardMaterial({
  color: 0x11aa66,
  emissive: 0x006633,
  emissiveIntensity: 0.8,
  transparent: true,
  opacity: 0.35,
});

function makeBgHelix(dir, turns, pitch) {
  const pts = [];
  const gap = pitch * 0.5;
  for (let i = 0; i <= 300; i++) {
    const t = i / 300;
    const angle = t * turns * Math.PI * 2;
    const y = dir * (gap + t * turns * pitch);
    pts.push(new THREE.Vector3(
      BG_R * Math.cos(angle),
      y,
      BG_R * Math.sin(angle)
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 300, 0.03, 12, false),
    bgHelixMat
  );
}

bgGGroup.add(makeBgHelix(1, 3, 1.0));    // above: short
bgGGroup.add(makeBgHelix(-1, 7, 2.0));   // below: extends 14.5 units down to the spine

/* ═══════════════════════════════════════════════════════
   DASHBOARD CARD DATA — mirrors the dashboard page's
   "Impact / current focus" chart (AI an order of magnitude
   above the rest)
   ═══════════════════════════════════════════════════════ */

const dashChart = {
  bars: [
    { label: 'AI/ML',    val: 100, color: '#ffb000' },
    { label: 'Cloud',    val: 12,  color: '#33ffaa' },
    { label: 'Data',     val: 10,  color: '#00cc66' },
    { label: 'BI',       val: 8,   color: '#66ffcc' },
    { label: 'Security', val: 6,   color: '#00ffcc' },
  ],
};

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

  // Title
  ctx.font = '700 46px ui-monospace, Menlo, monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(section.title, W / 2, 74);

  // Accent bar under title (centered)
  const barW = 140;
  ctx.fillStyle = section.accent;
  ctx.fillRect((W - barW) / 2, 84, barW, 2.5);

  // Body
  ctx.font = '400 24px ui-monospace, Menlo, monospace';
  ctx.fillStyle = '#bbbbc8';
  if (section.grid) {
    const padL = 120, padR = 120;
    section.body.forEach((row, i) => {
      if (row.length === 0) return; // empty row = spacer
      ctx.textAlign = 'left';
      ctx.fillText(row[0], padL, 134 + i * 40);
      if (row[1]) {
        ctx.textAlign = 'right';
        ctx.fillStyle = section.accent;
        ctx.fillText(row[1], W - padR, 134 + i * 40);
        ctx.fillStyle = '#bbbbc8';
      }
    });
    ctx.textAlign = 'center'; // reset
  } else {
    const bodyH = section.body.length * 40;
    const areaTop = 110;
    const areaBot = section.chart ? 320 : H - 20;
    const bodyY = areaTop + (areaBot - areaTop - bodyH) / 2 + 40;
    section.body.forEach((line, i) => {
      const y = bodyY + i * 40;
      // Clickable cue lines (ending in ▶) render as a blue hyperlink.
      if (line.includes('▶')) {
        ctx.save();
        ctx.fillStyle = '#ffb347';
        ctx.fillText(line, W / 2, y);
        const w = ctx.measureText(line).width;
        ctx.strokeStyle = '#ffb347';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 - w / 2, y + 14);
        ctx.lineTo(W / 2 + w / 2, y + 14);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillText(line, W / 2, y);
      }
    });
  }

  // Mini chart preview for dashboard screen — impact/current focus.
  // Horizontal bars scaled to the runner-up; the AI bar breaks the
  // chart frame ("off the chart") instead of crushing the others.
  if (section.chart) {
    const bars = dashChart.bars;
    const labelX = 210;                 // right edge of labels
    const areaX = 230;                  // bars start
    const areaW = W - areaX - 150;      // room for values on the right
    const top = 336, rowH = 42;
    const runnerUp = Math.max(...bars.filter(b => b.label !== 'AI/ML').map(b => b.val));
    const scaleMax = runnerUp * 1.25;   // AI (100) blows past this

    // Chart frame the AI bar will escape from
    const frameW = areaW * 0.82;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(areaX, top - 16, frameW, bars.length * rowH + 20);

    bars.forEach((b, i) => {
      const y = top + i * rowH;
      const isAI = b.label === 'AI/ML';
      const bh = isAI ? 24 : 16;
      const bw = isAI ? areaW : frameW * (b.val / scaleMax);

      // Label (left, right-aligned)
      ctx.font = isAI
        ? '700 20px ui-monospace, Menlo, monospace'
        : '400 16px ui-monospace, Menlo, monospace';
      ctx.fillStyle = isAI ? '#ffb347' : '#7aa88f';
      ctx.textAlign = 'right';
      ctx.fillText(b.label, labelX, y + bh / 2 + 6);

      // Bar
      if (isAI) {
        const grad = ctx.createLinearGradient(areaX, 0, areaX + bw, 0);
        grad.addColorStop(0, '#8f6300');
        grad.addColorStop(0.7, '#ffb000');
        grad.addColorStop(1, '#ffe08a');
        ctx.save();
        ctx.shadowColor = '#ffb000';
        ctx.shadowBlur = 22;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(areaX, y, bw, bh, 4);
        ctx.fill();
        ctx.restore();
        // Breakout chevrons past the bar tip
        ctx.fillStyle = '#ffe08a';
        ctx.font = '700 20px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('▸▸', areaX + bw + 8, y + bh / 2 + 7);
      } else {
        ctx.fillStyle = b.color + '66';
        ctx.beginPath();
        ctx.roundRect(areaX, y, bw, bh, 3);
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(areaX, y, bw, bh, 3);
        ctx.stroke();
        // Value at the bar tip
        ctx.fillStyle = '#9fd8bb';
        ctx.font = '400 15px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(String(b.val), areaX + bw + 10, y + bh / 2 + 5);
      }
    });

    // AI value called out above its bar tip
    ctx.font = '700 17px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#ffe08a';
    ctx.textAlign = 'right';
    ctx.fillText('100 · OFF THE CHART', areaX + areaW, top - 24);

    ctx.font = '400 14px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#44ffaa';
    ctx.textAlign = 'center';
    ctx.fillText('YEARS · RELATIVE IMPACT · CURRENT FOCUS', W / 2, top + bars.length * rowH + 34);
  }

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

  // Push screen slightly outward so the helix rail doesn't cut through text
  const outward = 0.35;
  mesh.position.set(
    x + outward * Math.cos(angle),
    y,
    z + outward * Math.sin(angle)
  );
  mesh.lookAt(0, y, 0);
  mesh.rotateY(Math.PI); // flip so text faces outward toward camera

  scene.add(mesh);
  screens.push({ mesh, angle, y, t, section });
});

// Make dashboard screen clickable — raycast against mesh
const clickRaycaster = new THREE.Raycaster();
const clickNDC = new THREE.Vector2();
window.addEventListener('click', (e) => {
  clickNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  clickNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  clickRaycaster.setFromCamera(clickNDC, camera);
  const linkMeshes = screens
    .filter((_, i) => SECTIONS[i].link)
    .map(s => s.mesh);
  const hits = clickRaycaster.intersectObjects(linkMeshes);
  if (hits.length > 0) {
    const idx = screens.findIndex(s => s.mesh === hits[0].object);
    if (idx >= 0 && SECTIONS[idx].link) {
      const target = SECTIONS[idx].link;
      if (target.startsWith('http')) {
        window.open(target, '_blank', 'noopener');
      } else {
        window.location.href = target;
      }
    }
  }
});

/* ═══════════════════════════════════════════════════════
   NERVE CONNECTIONS — Spine to each screen
   ═══════════════════════════════════════════════════════ */

screens.forEach(({ angle, y }) => {
  const pts = [
    new THREE.Vector3(0, y, 0),
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
  const geo = new THREE.TubeGeometry(curve, 30, 0.01, 8, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x115533,
    emissive: 0x003322,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.25,
  });
  scene.add(new THREE.Mesh(geo, mat));
});

/* ═══════════════════════════════════════════════════════
   STREAMERS — Individual falling matrix lines in the
   mid-space (title → spine gap), same look as the column
   ═══════════════════════════════════════════════════════ */

const streamers = [];
const STREAMER_COUNT = 14;
const STREAMER_MID_Y = TOTAL_HEIGHT / 2 + TITLE_HEIGHT * 0.45; // center of the gap

for (let vi = 0; vi < STREAMER_COUNT; vi++) {
  const angle = (vi / STREAMER_COUNT) * Math.PI * 2 + Math.random() * 0.4;
  const radius = 2 + Math.random() * 5;
  const anchorY = STREAMER_MID_Y + (Math.random() - 0.3) * 6;
  const len = 3 + Math.random() * 4;
  const w = 0.16 + Math.random() * 0.08;

  const { tex, ctx } = makeStreamTexture();
  tex.repeat.set(1, len / 3.6); // glyphs ~0.15 world units tall

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat);
  mesh.position.set(radius * Math.cos(angle), anchorY, radius * Math.sin(angle));
  scene.add(mesh);

  streamers.push({
    mesh, tex, ctx,
    phase: Math.random() * Math.PI * 2,
    shimmerSpeed: 1.5 + Math.random() * 2.5,
    scrollSpeed: 0.08 + Math.random() * 0.18,   // same fall speed as the column
    nextRetex: Math.random(),
    anchorY,
  });
}

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
    color: 0x22aa66,
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
   ORBS — Floating points of light with soft gradient halos
   ═══════════════════════════════════════════════════════ */

const orbs = [];
const ORB_COUNT = 18;

const orbColors = [
  0x00ff88, 0x33ffaa, 0x00cc66, 0x66ffcc,
  0xaaffdd, 0x00ffcc, 0x118855, 0xd8ffe8,
];

// Shared radial-gradient halo texture — smooth falloff, no shell banding
const glowTex = (() => {
  const s = 128;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0,  'rgba(255,255,255,0.85)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.6,  'rgba(255,255,255,0.08)');
  g.addColorStop(1.0,  'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cvs);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
})();

function makeHalo(color, scale, opacity) {
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  halo.scale.setScalar(scale);
  return halo;
}

// Matrix glyphs suspended inside the big orbs — swapped periodically
const orbGlyphs = [];

function drawOrbGlyph(ctx) {
  const ch = MATRIX_GLYPHS[(Math.random() * MATRIX_GLYPHS.length) | 0];
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = '700 88px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ch, 64, 68);
}

for (let i = 0; i < ORB_COUNT; i++) {
  const group = new THREE.Group();

  const color = orbColors[i % orbColors.length];
  const coreR = 0.16 + Math.random() * 0.18;

  // Bright core — whitened toward the center like a real light source
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(coreR * 0.45, 32, 24),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(0.55),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  group.add(core);

  // Single soft halo replaces the old atmosphere shells
  group.add(makeHalo(color, coreR * 6, 0.4));

  // Dark matrix glyph silhouetted in the core
  const gcvs = document.createElement('canvas');
  gcvs.width = gcvs.height = 128;
  const gctx = gcvs.getContext('2d');
  drawOrbGlyph(gctx);
  const gtex = new THREE.CanvasTexture(gcvs);
  gtex.minFilter = THREE.LinearFilter;
  gtex.generateMipmaps = false;
  const amberRune = Math.random() < 0.2;
  const glyph = new THREE.Sprite(new THREE.SpriteMaterial({
    map: gtex,
    color: amberRune ? 0xd99e20 : 0x35d98d,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  glyph.scale.setScalar(coreR * 2.1);
  glyph.renderOrder = 2; // draw after the core — the rune is the light source
  group.add(glyph);
  orbGlyphs.push({ ctx: gctx, tex: gtex, nextSwap: Math.random() * 0.4 });

  // Scatter across the full scene height (title zone + spine zone)
  const fullHeight = TOTAL_HEIGHT + TITLE_HEIGHT;
  const spread = 14;
  group.position.set(
    (Math.random() - 0.5) * spread,
    TOTAL_HEIGHT / 2 + TITLE_HEIGHT - Math.random() * fullHeight,
    (Math.random() - 0.5) * spread
  );

  scene.add(group);
  orbs.push({
    group,
    // Each orb has its own lazy orbit
    orbitR:     0.5 + Math.random() * 1.5,
    orbitSpeed: 0.15 + Math.random() * 0.3,
    bobSpeed:   0.3 + Math.random() * 0.5,
    bobAmp:     0.2 + Math.random() * 0.4,
    phase:      Math.random() * Math.PI * 2,
    basePos:    group.position.clone(),
  });
}

// Small orbs — scattered densely to match the floating dust
const SMALL_ORB_COUNT = 50;

for (let i = 0; i < SMALL_ORB_COUNT; i++) {
  const group = new THREE.Group();
  const color = orbColors[i % orbColors.length];
  const coreR = 0.025 + Math.random() * 0.045;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(coreR, 16, 12),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.3),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  group.add(core);

  group.add(makeHalo(color, coreR * 7, 0.45));

  const fullHeight = TOTAL_HEIGHT + TITLE_HEIGHT;
  const spread = 20;
  group.position.set(
    (Math.random() - 0.5) * spread,
    TOTAL_HEIGHT / 2 + TITLE_HEIGHT - Math.random() * fullHeight,
    (Math.random() - 0.5) * spread
  );

  scene.add(group);
  orbs.push({
    group,
    orbitR:     0.3 + Math.random() * 0.8,
    orbitSpeed: 0.1 + Math.random() * 0.25,
    bobSpeed:   0.2 + Math.random() * 0.6,
    bobAmp:     0.1 + Math.random() * 0.3,
    phase:      Math.random() * Math.PI * 2,
    basePos:    group.position.clone(),
  });
}

/* ═══════════════════════════════════════════════════════
   SCROLL INPUT
   ═══════════════════════════════════════════════════════ */

let scrollTarget = 0;
let scrollCurrent = 0;
let lastScrollTime = 0;

// Snap points: title (0) + each screen in helix zone
const snapPoints = [0];
for (let i = 0; i < NUM_SCREENS; i++) {
  snapPoints.push(TITLE_FRAC + (i / (NUM_SCREENS - 1)) * (1 - TITLE_FRAC));
}

function nearestSnap(val) {
  let best = snapPoints[0], bestD = Math.abs(val - best);
  for (let i = 1; i < snapPoints.length; i++) {
    const d = Math.abs(val - snapPoints[i]);
    if (d < bestD) { bestD = d; best = snapPoints[i]; }
  }
  return best;
}

window.addEventListener('wheel', (e) => {
  scrollTarget += e.deltaY * SCROLL_SENS;
  scrollTarget = Math.max(0, Math.min(1, scrollTarget));
  lastScrollTime = performance.now();
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
  lastScrollTime = performance.now();
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
   CURSOR SPARKS — Particles that shoot off while moving
   ═══════════════════════════════════════════════════════ */

const SPARK_MAX = 120;
const sparkColors = [0x00ff88, 0x33ffaa, 0x66ffcc, 0x00ffcc, 0xaaffdd, 0x00cc66];
const sparkPool = [];
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
let prevMouseX = 0, prevMouseY = 0;
let mouseSpeed = 0;

// Pre-render code character textures
const codeChars = '0123456789{}()<>/=;#!/$%&*+-_.json'.split('');
const charTextures = codeChars.map((ch) => {
  const s = 64;
  const cvs = document.createElement('canvas');
  cvs.width = s; cvs.height = s;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  ctx.font = '700 42px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ch, s / 2, s / 2);
  const tex = new THREE.CanvasTexture(cvs);
  return tex;
});
const codeGeo = new THREE.PlaneGeometry(0.14, 0.14);

window.addEventListener('mousemove', (e) => {
  const dx = e.clientX - prevMouseX;
  const dy = e.clientY - prevMouseY;
  mouseSpeed = Math.sqrt(dx * dx + dy * dy);
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
  mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;

  if (mouseSpeed < 3) return; // only emit while moving

  // Cast ray from camera through mouse position
  raycaster.setFromCamera(mouseNDC, camera);
  const hitPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(
    new THREE.Plane(camera.getWorldDirection(new THREE.Vector3()).clone(), 0)
      .setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()),
        camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(6))
      ),
    hitPoint
  );

  if (!hitPoint) return;

  // Spawn 1–3 sparks depending on speed
  const count = Math.min(3, Math.ceil(mouseSpeed / 15));
  for (let i = 0; i < count; i++) {
    emitSpark(hitPoint, dx, dy);
  }
});

function emitSpark(origin, dx, dy) {
  let spark = sparkPool.find(s => !s.alive);

  if (!spark) {
    if (sparkPool.length >= SPARK_MAX) return;

    const isCode = sparkPool.length % 2 === 0; // alternate: half code, half orb
    let mesh;

    if (isCode) {
      const tex = charTextures[Math.floor(Math.random() * charTextures.length)];
      mesh = new THREE.Mesh(codeGeo, new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0x00ff88,
        emissiveMap: tex,
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));
    } else {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 10, 8),
        new THREE.MeshStandardMaterial({
          emissive: 0x00ff88,
          emissiveIntensity: 2.5,
          transparent: true,
          opacity: 1,
          depthWrite: false,
        })
      );
    }

    scene.add(mesh);
    spark = { mesh, isCode, alive: false, vel: new THREE.Vector3(), age: 0, maxAge: 0 };
    sparkPool.push(spark);
  }

  // Randomize code character on reuse
  if (spark.isCode) {
    const tex = charTextures[Math.floor(Math.random() * charTextures.length)];
    spark.mesh.material.map = tex;
    spark.mesh.material.emissiveMap = tex;
    spark.mesh.material.needsUpdate = true;
  }

  spark.alive = true;
  spark.age = 0;
  spark.maxAge = spark.isCode ? 0.6 + Math.random() * 0.8 : 0.4 + Math.random() * 0.6;
  spark.mesh.visible = true;
  spark.mesh.position.copy(origin);
  spark.mesh.material.emissive.setHex(0xffffff);

  // Velocity: shoot outward in the mouse-move direction + random spread
  const speed = 2 + Math.random() * 4;
  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  camera.matrixWorld.extractBasis(camRight, camUp, new THREE.Vector3());
  spark.vel.set(0, 0, 0)
    .addScaledVector(camRight, (dx * 0.02 + (Math.random() - 0.5) * 0.8) * speed)
    .addScaledVector(camUp, (-dy * 0.02 + (Math.random() - 0.5) * 0.8) * speed);

  // Code chars tumble as they fly
  if (spark.isCode) {
    spark.mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
  }
}

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
  if (scrollCurrent <= TITLE_FRAC) {
    labelEl.textContent = 'GEO HAMILTON';
  } else {
    const helixT = (scrollCurrent - TITLE_FRAC) / (1 - TITLE_FRAC);
    const idx = Math.round(helixT * (NUM_SCREENS - 1));
    const clamped = Math.max(0, Math.min(NUM_SCREENS - 1, idx));
    labelEl.textContent = SECTIONS[clamped].title;
  }

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
  const time = performance.now() * 0.001;
  const dt = clock.getDelta() || 0.016;

  // Soft snap: after scrolling stops, gently pull toward nearest screen
  const idleMs = performance.now() - lastScrollTime;
  if (idleMs > 300) {
    const snap = nearestSnap(scrollTarget);
    scrollTarget += (snap - scrollTarget) * 0.04;
  }

  // Smooth-scroll interpolation
  scrollCurrent += (scrollTarget - scrollCurrent) * LERP_SPEED;

  // ── Camera: title zone → helix ──
  const camY = (TOTAL_HEIGHT / 2 + TITLE_HEIGHT) - scrollCurrent * TOTAL_TRAVEL;

  let camAngle;
  if (scrollCurrent <= TITLE_FRAC) {
    camAngle = 0; // straight-on during title
  } else {
    const helixT = (scrollCurrent - TITLE_FRAC) / (1 - TITLE_FRAC);
    camAngle = helixT * HELIX_TURNS * Math.PI * 2;
  }

  camera.position.set(
    CAMERA_RADIUS * Math.cos(camAngle),
    camY,
    CAMERA_RADIUS * Math.sin(camAngle)
  );
  camera.lookAt(0, camY, 0);

  // ── Title float & ring spin ──
  titleGroup.position.y = TITLE_Y + Math.sin(time * 0.5) * 0.2;
  titleRing.rotation.z  = time * 0.25;
  titleRing2.rotation.z = -time * 0.15;

  // ── Background G: follow camera Y during title zone, then stay ──
  if (scrollCurrent <= TITLE_FRAC) {
    bgGGroup.position.y = camY;
  } else {
    bgGGroup.position.y = (TOTAL_HEIGHT / 2 + TITLE_HEIGHT) - TITLE_FRAC * TOTAL_TRAVEL;
  }
  const scrollSpin = Math.min(scrollCurrent / TITLE_FRAC, 1) * Math.PI * 6;
  bgGGroup.rotation.y = time * 0.08 + scrollSpin;

  // ── Screen glow by proximity to camera ──
  screens.forEach((s) => {
    const d = camera.position.distanceTo(s.mesh.position);
    s.mesh.material.emissiveIntensity = THREE.MathUtils.clamp(1.4 - d / 7, 0.08, 0.6);
    s.mesh.material.opacity           = THREE.MathUtils.clamp(1.4 - d / 10, 0.25, 0.97);
  });

  // ── Streamers: grow-in, rain scroll, glyph shimmer ──
  streamers.forEach((st, vi) => {
    const dist = Math.abs(camY - st.anchorY);
    const prog = THREE.MathUtils.clamp(1 - (dist - 2) / 10, 0, 1);
    const stagger = vi * 0.05;
    const g = THREE.MathUtils.clamp((prog - stagger) / (1 - stagger), 0, 1);
    st.mesh.material.opacity = g * (0.55 + 0.25 * Math.sin(time * st.shimmerSpeed + st.phase));
    if (g <= 0) return;

    // Face the camera so the line reads from any orbit angle
    st.mesh.lookAt(camera.position.x, st.mesh.position.y, camera.position.z);

    // Falling rain + occasional glyph mutation, same as the column
    st.tex.offset.y += st.scrollSpeed * dt;
    if (time > st.nextRetex) {
      drawGlyphRow(st.ctx, (Math.random() * STREAM_ROWS) | 0);
      st.tex.needsUpdate = true;
      st.nextRetex = time + 0.2 + Math.random() * 0.6;
    }
  });

  // ── Orb drift ──
  orbs.forEach((o) => {
    const t = time * o.orbitSpeed + o.phase;
    o.group.position.x = o.basePos.x + Math.cos(t) * o.orbitR;
    o.group.position.y = o.basePos.y + Math.sin(time * o.bobSpeed + o.phase) * o.bobAmp;
    o.group.position.z = o.basePos.z + Math.sin(t) * o.orbitR;
  });

  // ── Cursor sparks update ──
  sparkPool.forEach((s) => {
    if (!s.alive) return;
    s.age += dt;
    if (s.age >= s.maxAge) {
      s.alive = false;
      s.mesh.visible = false;
      return;
    }
    const life = 1 - s.age / s.maxAge;
    s.mesh.position.addScaledVector(s.vel, dt);
    s.vel.multiplyScalar(0.96); // drag
    s.mesh.material.opacity = life;
    s.mesh.material.emissiveIntensity = 2.5 * life;
    const scale = 0.5 + life * 0.5;
    s.mesh.scale.setScalar(scale);
    if (s.isCode) {
      s.mesh.rotation.x += dt * 3;
      s.mesh.rotation.z += dt * 2;
    }
  });

  // ── Particle drift ──
  particles.rotation.y = time * 0.012;

  // ── Spine pulse ──
  const pulse = Math.sin(time * 1.5) * 0.15 + 1.0;
  spineEmissives.forEach(({ mesh, base }) => {
    mesh.material.emissiveIntensity = base * pulse;
  });

  // ── Orb glyphs: swap the suspended character now and then ──
  orbGlyphs.forEach((g) => {
    if (time > g.nextSwap) {
      drawOrbGlyph(g.ctx);
      g.tex.needsUpdate = true;
      g.nextSwap = time + 0.12 + Math.random() * 0.25;
    }
  });

  // ── Matrix streams: rain scroll + glyph shimmer + billboard ──
  matrixStreams.forEach((st) => {
    st.tex.offset.y += st.speed * dt;
    // Occasionally swap a couple of glyphs so the code "computes"
    if (time > st.nextRetex) {
      drawGlyphRow(st.ctx, (Math.random() * STREAM_ROWS) | 0);
      drawGlyphRow(st.ctx, (Math.random() * STREAM_ROWS) | 0);
      st.tex.needsUpdate = true;
      st.nextRetex = time + 0.1 + Math.random() * 0.4;
    }
    // Face the camera so streams never vanish edge-on
    st.mesh.lookAt(camera.position.x, st.mesh.position.y, camera.position.z);
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
