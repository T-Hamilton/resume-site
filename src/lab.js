import Chart from 'chart.js/auto';

/* ── config ─────────────────────────────────────────────────────────────────
   API base is overridable for dev:  /lab?api=http://localhost:8011
   Default points at the Cloudflare-tunnel hostname for the A40 backend. */
const params = new URLSearchParams(location.search);
if (params.get('api')) localStorage.setItem('cs_api', params.get('api').replace(/\/$/, ''));
// When previewing from localhost, default to the SSH-tunnelled pod API so no
// query param is needed. In production (geohamilton.com) use the public tunnel.
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const DEFAULT_API = isLocal ? 'http://127.0.0.1:8011' : 'https://api.geohamilton.com';
const API = (localStorage.getItem('cs_api') || DEFAULT_API).replace(/\/$/, '');
const WS = API.replace(/^http/, 'ws');

const $ = (s) => document.querySelector(s);
const el = (t, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(t), props);
  for (const k of kids) n.append(k);
  return n;
};
const j = (path, opts) => fetch(API + path, opts).then((r) => r.json());

const REASON_COLORS = {
  BILLING_FEES: '#5588ff', FRAUD_SECURITY: '#ff6677', CREDIT_REPORTING: '#44ddaa',
  DEBT_COLLECTION: '#ffbb55', ACCOUNT_CLOSURE: '#cc88ff', SERVICE_QUALITY: '#55ccff',
  PRODUCT_MISREP: '#ff99cc', TECH_ACCESS: '#88ddff', OTHER: '#ffd9a0', NONE: '#445',
};

/* ── particle background (matches the rest of the site) ─────────────────────*/
(function particles() {
  const cv = el('canvas');
  $('#particles').append(cv);
  const ctx = cv.getContext('2d');
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
  resize(); addEventListener('resize', resize);
  const dots = Array.from({ length: 70 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 1 + Math.random() * 2,
    dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25, a: 0.08 + Math.random() * 0.28,
  }));
  (function loop() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const d of dots) {
      d.x = (d.x + d.dx + cv.width) % cv.width; d.y = (d.y + d.dy + cv.height) % cv.height;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fillStyle = `rgba(85,136,255,${d.a})`; ctx.fill();
    }
    requestAnimationFrame(loop);
  })();
})();

/* ── health + status pills ──────────────────────────────────────────────────*/
async function ping() {
  const p = $('#llm-status');
  try {
    const h = await j('/health');
    p.className = 'pill ok'; p.textContent = `backend ok · ${h.tools} tools`;
  } catch {
    p.className = 'pill bad'; p.textContent = 'backend offline';
  }
}

/* ── tool palette ───────────────────────────────────────────────────────────*/
async function loadTools() {
  const { tools } = await j('/tools');
  const wrap = $('#tool-list'); wrap.innerHTML = '';
  let cat = null;
  for (const t of tools) {
    if (t.category !== cat) { cat = t.category; wrap.append(el('div', { className: 'tool-cat', textContent: cat })); }
    const card = el('div', { className: 'tool' },
      el('span', { className: 'dot' }), el('span', { className: 'nm', textContent: t.name }));
    card.onclick = () => openTool(t);
    wrap.append(card);
  }
}

/* ── tool run modal ─────────────────────────────────────────────────────────*/
function openTool(t) {
  $('#modal-h').textContent = t.name;
  $('#modal-desc').textContent = t.description || '';
  const form = $('#modal-form'); form.innerHTML = '';
  const out = $('#modal-out'); out.className = ''; out.textContent = '';
  const props = t.parameters || {};
  for (const [k, spec] of Object.entries(props)) {
    const big = (spec.type === 'string' && /text|verbatim/.test(k));
    const field = big ? el('textarea', { rows: 4, name: k }) : el('input', { name: k, type: spec.type === 'integer' ? 'number' : 'text' });
    form.append(el('label', {}, `${k}${spec.type ? ' : ' + spec.type : ''}`, field));
  }
  if (!Object.keys(props).length) form.append(el('div', { className: 'hint', textContent: 'no arguments — runs directly.' }));
  $('#modal-run').onclick = async () => {
    const args = {};
    for (const f of form.querySelectorAll('input,textarea')) {
      if (f.value === '') continue;
      args[f.name] = f.type === 'number' ? Number(f.value) : f.value;
    }
    out.className = 'show'; out.textContent = 'running…';
    try {
      const r = await j('/tools/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: t.name, args }) });
      out.textContent = JSON.stringify(r.result, null, 2);
    } catch (e) { out.textContent = 'error: ' + e; }
  };
  $('#modal').classList.remove('hidden');
}
$('#modal-close').onclick = () => $('#modal').classList.add('hidden');
$('#modal').onclick = (e) => { if (e.target.id === 'modal') $('#modal').classList.add('hidden'); };

/* ── chunk selector + runner ────────────────────────────────────────────────*/
let CHUNKS = 0;
async function loadCorpus() {
  const idx = await j('/corpus');
  CHUNKS = idx.num_chunks || 0;
  const sel = $('#chunk-select'); sel.innerHTML = '';
  (idx.chunks || []).forEach((c) => {
    const fmts = Object.entries(c.formats).map(([k, v]) => `${k}:${v}`).join(' ');
    sel.append(el('option', { value: c.id, textContent: `chunk ${c.id}  ·  ${c.count} docs  ·  ${fmts}` }));
  });
}

$('#run-chunk').onclick = async () => {
  const chunk = Number($('#chunk-select').value);
  $('#run-chunk').disabled = true;
  const res = await j('/pipeline/run-chunk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chunk }) });
  if (res.error) { $('#run-label').textContent = res.error; $('#run-chunk').disabled = false; return; }
  pollJob();
};

/* full-corpus run (every chunk) */
$('#run-all').onclick = async () => {
  if (!confirm('Run the FULL pipeline over all chunks (~every document)? This can take several minutes.')) return;
  $('#run-all').disabled = true; $('#run-chunk').disabled = true;
  const r = await j('/pipeline/run-all', { method: 'POST' });
  if (r.error) { $('#run-label').textContent = r.error; $('#run-all').disabled = false; $('#run-chunk').disabled = false; return; }
  pollAll();
};
async function pollAll() {
  const s = await j('/pipeline/run-all/status');
  const pct = s.total ? Math.round((s.processed / s.total) * 100) : 0;
  $('#run-bar').style.width = pct + '%';
  $('#run-label').textContent = `full run · ch ${s.chunk}/${(s.chunks_total || 1) - 1} · ${s.processed}/${s.total} · ${s.saved} saved`;
  const cp = $('#chunk-status'); cp.className = 'pill ' + (s.running ? 'run' : 'ok');
  cp.textContent = s.running ? `full run ${pct}%` : `corpus done · ${s.processed}`;
  refreshDash();
  if (s.running) setTimeout(pollAll, 1500);
  else { $('#run-all').disabled = false; $('#run-chunk').disabled = false; refreshDash(); refreshFindings(); }
}

/* CSV export — one row per document, duplicates included */
$('#export-csv').onclick = async () => {
  $('#export-csv').textContent = '↓ …';
  try {
    const res = await fetch(API + '/export/findings.csv');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'cancel_reasons.csv' });
    document.body.append(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (e) { alert('export failed: ' + e); }
  $('#export-csv').innerHTML = '&#x2193; EXPORT CSV';
};

async function pollJob() {
  const s = await j('/pipeline/status');
  const pct = s.total ? Math.round((s.i / s.total) * 100) : 0;
  $('#run-bar').style.width = pct + '%';
  $('#run-label').textContent = `${s.i}/${s.total} · ${s.saved} saved`;
  const cp = $('#chunk-status');
  cp.className = 'pill ' + (s.running ? 'run' : 'ok');
  cp.textContent = `chunk ${s.chunk}/${CHUNKS - 1}`;
  refreshDash();                       // live-fill the dashboard as it runs
  if (s.running) { setTimeout(pollJob, 1200); }
  else { $('#run-chunk').disabled = false; refreshDash(); refreshFindings(); }
}

/* ── discovery dashboard ────────────────────────────────────────────────────*/
let reasonChart;
async function refreshDash() {
  const [stats, agg, cross, themes] = await Promise.all([
    j('/dashboard/stats'), j('/dashboard/aggregate?dimension=primary_reason'),
    j('/dashboard/crosstab?row_dim=primary_reason&col_dim=source_type'), j('/dashboard/themes'),
  ]);
  // stat band
  $('#stat-band').innerHTML = '';
  const band = [['total', stats.total, ''], ['complaints', stats.complaints, ''],
    ['need review', stats.needs_review, 'warn'], ['avg conf', stats.avg_confidence ?? '–', '']];
  for (const [l, v, cls] of band) $('#stat-band').append(
    el('div', { className: 'stat ' + cls }, el('div', { className: 'v', textContent: v }), el('div', { className: 'l', textContent: l })));

  // reason breakdown (exclude NONE; show it as a note)
  const buckets = (agg.buckets || []).filter((b) => b.key && b.key !== 'NONE');
  const noise = (agg.buckets || []).find((b) => b.key === 'NONE');
  $('#noise-note').textContent = noise ? `${noise.count} noise → NONE` : '';
  const labels = buckets.map((b) => b.key), data = buckets.map((b) => b.count);
  const colors = labels.map((k) => REASON_COLORS[k] || '#5588ff');
  if (reasonChart) reasonChart.destroy();
  reasonChart = new Chart($('#reasonChart'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, barThickness: 14 }] },
    options: {
      indexAxis: 'y', plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#7780a0', font: { size: 10 } }, grid: { color: 'rgba(85,136,255,.07)' } },
        y: { ticks: { color: '#bcd', font: { size: 10, family: 'monospace' } }, grid: { display: false } },
      }, responsive: true, maintainAspectRatio: false,
    },
  });
  $('#reasonChart').parentElement.style.height = Math.max(120, labels.length * 26 + 30) + 'px';

  // crosstab heatmap
  renderCrosstab(cross);

  // discovery themes
  $('#themes-hint').textContent = themes.unsorted_docs
    ? `${themes.unsorted_docs} unsorted/uncertain docs mined — high-count phrases with no taxonomy home are candidate new reason codes.`
    : 'run more chunks to accumulate an unsorted pile to mine.';
  const tw = $('#themes'); tw.innerHTML = '';
  (themes.candidate_themes || []).forEach((t) => {
    const c = el('span', { className: 'theme ' + (t.kind === 'unigram' ? 'uni' : '') }, t.phrase, el('b', { textContent: t.count }));
    tw.append(c);
  });
  if (!(themes.candidate_themes || []).length) tw.append(el('span', { className: 'sys-line', textContent: '— none yet —' }));
}

function renderCrosstab(cross) {
  const cells = (cross.cells || []).filter((c) => c.row && c.row !== 'NONE');
  const rows = [...new Set(cells.map((c) => c.row))];
  const cols = [...new Set(cells.map((c) => c.col))];
  const max = Math.max(1, ...cells.map((c) => c.count));
  const lookup = {}; cells.forEach((c) => (lookup[c.row + '|' + c.col] = c.count));
  const wrap = $('#crosstab');
  if (!rows.length) { wrap.innerHTML = '<div class="sys-line">— no complaints yet —</div>'; return; }
  const t = el('table');
  const head = el('tr', {}, el('th', {}, '')); cols.forEach((c) => head.append(el('th', { textContent: c })));
  t.append(head);
  for (const r of rows) {
    const tr = el('tr', {}, el('td', { className: 'r', textContent: r }));
    for (const c of cols) {
      const n = lookup[r + '|' + c] || 0;
      const a = n ? 0.12 + 0.55 * (n / max) : 0;
      tr.append(el('td', { className: n ? 'cell' : '', textContent: n || '·', style: `background:rgba(85,136,255,${a})` }));
    }
    t.append(tr);
  }
  wrap.innerHTML = ''; wrap.append(t);
}

/* ── evidence tab ───────────────────────────────────────────────────────────*/
async function refreshFindings() {
  const q = $('#find-search').value.trim();
  const d = await j(`/dashboard/findings?limit=80${q ? '&search=' + encodeURIComponent(q) : ''}`);
  const wrap = $('#findings'); wrap.innerHTML = '';
  (d.rows || []).forEach((r) => {
    const isNone = r.primary_reason === 'NONE';
    const card = el('div', { className: 'finding' });
    const badge = el('span', { className: 'badge ' + (isNone ? 'none' : ''), textContent: `${r.primary_reason} ${Number(r.confidence).toFixed(2)}` });
    const top = el('div', { className: 'top' }, el('span', { className: 'id', textContent: r.document_id }), badge);
    card.append(top);
    if (r.needs_review) top.append(el('span', { className: 'badge rev', textContent: 'review' }));
    if (r.reason_verbatim) card.append(el('div', { className: 'vq', textContent: '“' + r.reason_verbatim + '”' }));
    wrap.append(card);
  });
  if (!(d.rows || []).length) wrap.append(el('div', { className: 'sys-line', textContent: 'no findings yet — apply a chunk.' }));
}
let searchT;
$('#find-search').oninput = () => { clearTimeout(searchT); searchT = setTimeout(refreshFindings, 250); };

/* tabs */
document.querySelectorAll('.tab').forEach((t) => t.onclick = () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
  t.classList.add('active');
  $('#tab-dash').classList.toggle('hidden', t.dataset.tab !== 'dash');
  $('#tab-evidence').classList.toggle('hidden', t.dataset.tab !== 'evidence');
  if (t.dataset.tab === 'evidence') refreshFindings();
});

/* ── chat agent over WebSocket (step events, no token streaming) ─────────────*/
let ws, steps;
function chatConnect() {
  ws = new WebSocket(WS + '/ws/chat');
  ws.onmessage = (e) => {
    const ev = JSON.parse(e.data);
    if (ev.type === 'tool_call') {
      steps = steps || addSteps();
      steps.append(el('div', { className: 'step' },
        el('span', { className: 'call', textContent: '→ ' + ev.name }),
        el('span', { textContent: ' ' + short(ev.args) })));
    } else if (ev.type === 'tool_result') {
      if (steps) steps.append(el('div', { className: 'step' + (ev.result && ev.result.error ? ' err' : '') },
        el('span', { className: 'res', textContent: '  ⤷ ' + short(ev.result) })));
    } else if (ev.type === 'final') {
      addMsg('bot', ev.content || '(no answer)');
    } else if (ev.type === 'turn_end') {
      steps = null; refreshDash();
    }
  };
  ws.onclose = () => setTimeout(chatConnect, 2000);
}
const addMsg = (cls, txt) => { const m = el('div', { className: 'msg ' + cls, textContent: txt }); $('#chat-log').append(m); scroll(); return m; };
const addSteps = () => { const s = el('div', { className: 'steps' }); $('#chat-log').append(s); scroll(); return s; };
const scroll = () => { $('#chat-log').scrollTop = $('#chat-log').scrollHeight; };
const short = (o) => { const s = JSON.stringify(o); return s.length > 90 ? s.slice(0, 90) + '…' : s; };

$('#chat-form').onsubmit = (e) => {
  e.preventDefault();
  const v = $('#chat-input').value.trim(); if (!v) return;
  addMsg('user', v); $('#chat-input').value = ''; steps = null;
  if (!ws || ws.readyState !== 1) { addMsg('bot', '(connecting… try again in a moment)'); chatConnect(); return; }
  ws.send(v);
};

/* ── boot ───────────────────────────────────────────────────────────────────*/
(async function boot() {
  ping(); setInterval(ping, 15000);
  await Promise.all([loadTools(), loadCorpus()]);
  refreshDash();
  chatConnect();
})();
