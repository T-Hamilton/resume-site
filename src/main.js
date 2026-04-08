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
    accent: '#44ffdd',
    link: '/dashboard.html',
  },
  {
    title: 'GEO HAMILTON',
    body: [
      'Built my career by creating roles',
      'that didn\'t exist yet — then delivering',
      'so well they became permanent.',
      '',
      '13+ yrs · Fortune 100 clients',
      'Cloud/Data architecture → Agentic AI',
      'Maui, HI · Miami · Remote',
    ],
    accent: '#5588ff',
  },
  {
    title: 'SKILLS',
    body: [
      ['Agentic AI · Claude Code · LLM Workflows', ''],
      [],
      ['Full Stack Cloud/Data Architecture', '13 yrs'],
      ['AWS · GCP · Snowflake · PostgreSQL', '13 yrs'],
      ['MicroStrategy · Power BI · Looker', '13 yrs'],
      ['Python · Java · SQL · SAS', '13 yrs'],
      ['Linux · SSO · OpenAM · OAuth', '13 yrs'],
      ['Jira · Confluence', '13 yrs'],
      ['IAM · RBAC · Data Governance', '8 yrs'],
    ],
    accent: '#44ddaa',
    grid: true,
  },
  {
    title: 'CHARTER & DATAFACT Z',
    body: [
      'Solutions Partner & Cloud Architect',
      'Oct 2021 – Present · Maui, FL, Remote',
      '',
      'Led MSTR → PowerBI migration for',
      'Fortune 100 client, team of 12.',
      'AWS end-to-end · Snowflake · Postgres.',
      '2 BI platforms deployed, 4000+ daily.',
      'Admin/Architect: MSTR, Looker, Tableau, Alteryx.',
    ],
    accent: '#ffaa44',
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
      '',
      'Humanitarian: medical ship team',
      'Australia & PNG — cataract',
      'surgery for remote villages (2012)',
    ],
    accent: '#ff44aa',
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
    color: 0xaaaacc,
    metalness: 0.85,
    roughness: 0.15,
    emissive: 0x334466,
    emissiveIntensity: 0.6,
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
    color: 0x5588ff,
    emissive: 0x3366dd,
    emissiveIntensity: 3.0,
  })
);
titleRing.position.set(-5.26, 0, 0.1);
titleGroup.add(titleRing);

// Outer decorative ring
const titleRing2 = new THREE.Mesh(
  new THREE.TorusGeometry(1.42, 0.02, 12, 120),
  new THREE.MeshStandardMaterial({
    color: 0x44ddaa,
    emissive: 0x22aa77,
    emissiveIntensity: 2.25,
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
    ctx.strokeStyle = '#5588ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#5588ff';
    ctx.shadowBlur = 45;
    ctx.stroke();
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
  ctx.font = '800 150px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#5588ff';
  ctx.shadowBlur = 30;
  ctx.fillText('GEO', 600, 310);
  ctx.fillText('HAMILTON', 600, 490);
  ctx.restore();

  // Accent line
  ctx.save();
  ctx.fillStyle = '#5588ff';
  ctx.shadowColor = '#5588ff';
  ctx.shadowBlur = 20;
  ctx.fillRect(600, 525, 700, 4);
  ctx.restore();

  // Subtitle
  ctx.font = '300 70px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#7777aa';
  ctx.fillText('an interactive resum\u00e9', 600, 620);

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
  ctx.font = '800 380px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(80, 130, 255, 0.3)';
  ctx.shadowColor = '#5588ff';
  ctx.shadowBlur = 35;
  ctx.fillText('G', s / 2, s / 2 + 10);

  const tex = new THREE.CanvasTexture(cvs);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0x5588ff,
      emissiveMap: tex,
      emissiveIntensity: 0.8,
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
    color: 0x5588ff,
    emissive: 0x3366dd,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.5,
  })
);
bgCircle.rotation.y = Math.PI / 2;
bgGGroup.add(bgCircle);

// Helix with a gap in the middle where the circle sits
const bgHelixMat = new THREE.MeshStandardMaterial({
  color: 0x4477cc,
  emissive: 0x223399,
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
    new THREE.TubeGeometry(curve, 300, 0.03, 6, false),
    bgHelixMat
  );
}

bgGGroup.add(makeBgHelix(1, 3, 1.0));    // above: short
bgGGroup.add(makeBgHelix(-1, 7, 2.0));   // below: extends 14.5 units down to the spine

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
  ctx.font = '700 50px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(section.title, W / 2, 74);

  // Accent bar under title (centered)
  const barW = 140;
  ctx.fillStyle = section.accent;
  ctx.fillRect((W - barW) / 2, 84, barW, 2.5);

  // Body
  ctx.font = '300 26px system-ui, -apple-system, sans-serif';
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
    const areaBot = section.link ? 320 : H - 20;
    const bodyY = areaTop + (areaBot - areaTop - bodyH) / 2 + 40;
    section.body.forEach((line, i) => {
      ctx.fillText(line, W / 2, bodyY + i * 40);
    });
  }

  // Mini chart preview for dashboard screen
  if (section.link) {
    const chartX = 80, chartW = W - 160, chartY = 340, chartH = 200;
    const bars = [
      { label: 'AWS', val: 13, color: '#5588ff' },
      { label: 'MSTR', val: 13, color: '#44ddaa' },
      { label: 'Python', val: 13, color: '#ffaa44' },
      { label: 'Looker', val: 8, color: '#aa66ff' },
      { label: 'IAM', val: 8, color: '#ff44aa' },
      { label: 'AI', val: 1, color: '#ff6644' },
    ];
    const maxVal = 13;
    const gap = 12;
    const barWidth = (chartW - gap * (bars.length - 1)) / bars.length;

    // Faint grid lines
    ctx.strokeStyle = 'rgba(85, 136, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const gy = chartY + chartH - (i / 3) * chartH;
      ctx.beginPath();
      ctx.moveTo(chartX, gy);
      ctx.lineTo(chartX + chartW, gy);
      ctx.stroke();
    }

    bars.forEach((b, i) => {
      const bx = chartX + i * (barWidth + gap);
      const bh = (b.val / maxVal) * (chartH - 20);
      const by = chartY + chartH - bh;

      ctx.fillStyle = b.color + '88';
      ctx.beginPath();
      ctx.roundRect(bx, by, barWidth, bh, 3);
      ctx.fill();

      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, barWidth, bh, 3);
      ctx.stroke();

      ctx.font = '300 14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#667788';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, bx + barWidth / 2, chartY + chartH + 18);
    });

    ctx.font = '300 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#44ddaa';
    ctx.textAlign = 'center';
    ctx.fillText('LIVE FROM SUPABASE', W / 2, chartY + chartH + 50);
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
      window.location.href = SECTIONS[idx].link;
    }
  }
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
   VINES — Hanging tendrils in the mid-space (title → spine)
   ═══════════════════════════════════════════════════════ */

const vineMeshes = [];
const VINE_COUNT = 14;
const VINE_MID_Y = TOTAL_HEIGHT / 2 + TITLE_HEIGHT * 0.45; // center of the gap

for (let vi = 0; vi < VINE_COUNT; vi++) {
  const angle = (vi / VINE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
  const radius = 2 + Math.random() * 5;
  const anchorX = radius * Math.cos(angle);
  const anchorZ = radius * Math.sin(angle);
  const anchorY = VINE_MID_Y + (Math.random() - 0.3) * 6;
  const length = 2 + Math.random() * 4;
  const sway = (Math.random() - 0.5) * 1.5;
  const depthSway = (Math.random() - 0.5) * 1.0;

  const pts = [];
  for (let j = 0; j <= 8; j++) {
    const t = j / 8;
    pts.push(new THREE.Vector3(
      anchorX + Math.sin(t * Math.PI * 1.5 + vi * 0.9) * sway * t,
      anchorY - t * length,
      anchorZ + Math.cos(t * Math.PI + vi * 0.6) * depthSway * t
    ));
  }

  const curve = new THREE.CatmullRomCurve3(pts);
  const thick = 0.015 + Math.random() * 0.015;
  const geo = new THREE.TubeGeometry(curve, 50, thick, 5, false);

  const hue = 0.38 + Math.random() * 0.1;
  const color = new THREE.Color().setHSL(hue, 0.65, 0.35);
  const emCol = new THREE.Color().setHSL(hue, 0.75, 0.22);

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: emCol,
    emissiveIntensity: 0.8,
    metalness: 0.15,
    roughness: 0.55,
    transparent: true,
    opacity: 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  vineMeshes.push({
    mesh,
    phase: Math.random() * Math.PI * 2,
    shimmerSpeed: 1.5 + Math.random() * 2.5,
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
   ORBS — Floating spheres with atmospheric glow shells
   ═══════════════════════════════════════════════════════ */

const orbs = [];
const ORB_COUNT = 18;

const orbColors = [
  0x4488ff, 0x44ddaa, 0xff6644, 0xaa66ff,
  0xffaa44, 0x44aaff, 0xff44aa, 0x44ffdd,
];

for (let i = 0; i < ORB_COUNT; i++) {
  const group = new THREE.Group();

  const color = orbColors[i % orbColors.length];
  const coreR = 0.08 + Math.random() * 0.14;

  // Solid core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(coreR, 16, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.5,
      metalness: 0.4,
      roughness: 0.2,
    })
  );
  group.add(core);

  // Inner atmosphere
  const atmo1 = new THREE.Mesh(
    new THREE.SphereGeometry(coreR * 2.0, 20, 20),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  group.add(atmo1);

  // Outer atmosphere
  const atmo2 = new THREE.Mesh(
    new THREE.SphereGeometry(coreR * 3.5, 20, 20),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  group.add(atmo2);

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
    new THREE.SphereGeometry(coreR, 8, 8),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.8,
    })
  );
  group.add(core);

  // Single soft atmosphere
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(coreR * 2.8, 10, 10),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  group.add(atmo);

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
const sparkColors = [0x5588ff, 0x44ddaa, 0xff6644, 0xaa66ff, 0xffaa44, 0x44ffdd];
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
        emissive: 0x5588ff,
        emissiveMap: tex,
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));
    } else {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshStandardMaterial({
          emissive: 0x5588ff,
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

  // ── Vine grow-in & shimmer ──
  vineMeshes.forEach((v, vi) => {
    const dist = Math.abs(camY - v.anchorY);
    const prog = THREE.MathUtils.clamp(1 - (dist - 2) / 10, 0, 1);
    const stagger = vi * 0.05;
    const t = THREE.MathUtils.clamp((prog - stagger) / (1 - stagger), 0, 1);
    v.mesh.material.opacity = t * 0.7;
    v.mesh.material.emissiveIntensity = 0.6 + Math.sin(time * v.shimmerSpeed + v.phase) * 0.5;
  });

  // ── Orb drift ──
  orbs.forEach((o) => {
    const t = time * o.orbitSpeed + o.phase;
    o.group.position.x = o.basePos.x + Math.cos(t) * o.orbitR;
    o.group.position.y = o.basePos.y + Math.sin(time * o.bobSpeed + o.phase) * o.bobAmp;
    o.group.position.z = o.basePos.z + Math.sin(t) * o.orbitR;
  });

  // ── Cursor sparks update ──
  const dt = clock.getDelta() || 0.016;
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
