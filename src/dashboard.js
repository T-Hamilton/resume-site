import { createClient } from '@supabase/supabase-js';
import Chart from 'chart.js/auto';

const supabase = createClient(
  'https://owgzrwfdmtiaenbumyzo.supabase.co',
  'sb_publishable_QyRLOovp0cNH1age1QTcuQ_yiMOXhnJ'
);

/* ── Particle background ────────────────────────────── */
const particleCanvas = document.createElement('canvas');
document.getElementById('particles').appendChild(particleCanvas);
const pCtx = particleCanvas.getContext('2d');

function resizeParticles() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}
resizeParticles();
window.addEventListener('resize', resizeParticles);

const dots = Array.from({ length: 80 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: 1 + Math.random() * 2,
  dx: (Math.random() - 0.5) * 0.3,
  dy: (Math.random() - 0.5) * 0.3,
  a: 0.1 + Math.random() * 0.3,
}));

function drawParticles() {
  pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  dots.forEach(d => {
    d.x += d.dx;
    d.y += d.dy;
    if (d.x < 0) d.x = particleCanvas.width;
    if (d.x > particleCanvas.width) d.x = 0;
    if (d.y < 0) d.y = particleCanvas.height;
    if (d.y > particleCanvas.height) d.y = 0;
    pCtx.beginPath();
    pCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(85, 136, 255, ${d.a})`;
    pCtx.fill();
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ── Chart.js global defaults ───────────────────────── */
Chart.defaults.color = '#8888aa';
Chart.defaults.borderColor = 'rgba(85, 136, 255, 0.08)';
Chart.defaults.font.family = "system-ui, -apple-system, sans-serif";

/* ── Animated count-up ──────────────────────────────── */
function countUp(el, target, suffix = '') {
  const isFloat = String(target).includes('.');
  const num = parseFloat(target.replace(/,/g, ''));
  if (isNaN(num)) { el.textContent = target; return; }
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = num * ease;
    if (isFloat) {
      el.textContent = val.toFixed(1) + suffix;
    } else if (num >= 100) {
      el.textContent = Math.round(val).toLocaleString() + suffix;
    } else {
      el.textContent = Math.round(val) + suffix;
    }
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── Fetch & render ─────────────────────────────────── */
async function init() {
  const [statsRes, skillsRes, projectsRes, catsRes] = await Promise.all([
    supabase.from('resume_stats').select('*').order('sort_order'),
    supabase.from('resume_skills').select('*').order('sort_order'),
    supabase.from('resume_projects').select('*').order('year_start', { ascending: false }),
    supabase.from('resume_categories').select('*'),
  ]);

  const stats = statsRes.data || [];
  const skills = skillsRes.data || [];
  const projects = projectsRes.data || [];
  const categories = catsRes.data || [];

  // ── Metric cards ──
  const cardsEl = document.getElementById('cards');
  stats.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card';
    const valEl = document.createElement('div');
    valEl.className = 'value';
    const labEl = document.createElement('div');
    labEl.className = 'label';
    labEl.textContent = s.label;
    card.appendChild(valEl);
    card.appendChild(labEl);
    cardsEl.appendChild(card);

    // Parse suffix (%, +)
    const raw = s.value;
    const suffix = raw.endsWith('%') ? '%' : raw.endsWith('+') ? '+' : '';
    countUp(valEl, raw.replace(/[%+]/g, ''), suffix);
  });

  // ── Bar chart with filters ──
  const cats = [...new Set(skills.map(s => s.category))];
  const filterEl = document.getElementById('bar-filter');
  let activeFilter = 'All';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'All';
  filterEl.appendChild(allBtn);

  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = c;
    filterEl.appendChild(btn);
  });

  const barCtx = document.getElementById('barChart').getContext('2d');
  const catColors = {
    Cloud: '#5588ff',
    BI: '#44ddaa',
    Engineering: '#ffaa44',
    Infrastructure: '#aa66ff',
    Security: '#ff44aa',
    'AI/ML': '#ff6644',
  };

  function getBarData(filter) {
    const filtered = filter === 'All' ? skills : skills.filter(s => s.category === filter);
    return {
      labels: filtered.map(s => s.skill),
      datasets: [{
        data: filtered.map(s => s.years),
        backgroundColor: filtered.map(s => {
          const c = catColors[s.category] || '#5588ff';
          return c + '66';
        }),
        borderColor: filtered.map(s => catColors[s.category] || '#5588ff'),
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 36,
      }],
    };
  }

  const barChart = new Chart(barCtx, {
    type: 'bar',
    data: getBarData('All'),
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(6, 6, 14, 0.95)',
          borderColor: 'rgba(85, 136, 255, 0.3)',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#bbbbc8',
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.raw} years`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(85, 136, 255, 0.06)' },
          ticks: { color: '#667788' },
          title: { display: true, text: 'Years', color: '#667788' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#bbbbc8', font: { size: 12 } },
        },
      },
    },
  });

  // Resize bar chart canvas height based on data count
  document.getElementById('barChart').parentElement.style.height =
    Math.max(320, skills.length * 32 + 60) + 'px';

  filterEl.addEventListener('click', (e) => {
    if (!e.target.classList.contains('filter-btn')) return;
    filterEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeFilter = e.target.textContent;
    const newData = getBarData(activeFilter);
    barChart.data = newData;
    barChart.update('active');
    // Resize
    const count = newData.labels.length;
    document.getElementById('barChart').parentElement.style.height =
      Math.max(220, count * 32 + 60) + 'px';
  });

  // ── Donut chart ──
  const donutCtx = document.getElementById('donutChart').getContext('2d');
  new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: categories.map(c => c.category),
      datasets: [{
        data: categories.map(c => c.percentage),
        backgroundColor: categories.map(c => c.color + '88'),
        borderColor: categories.map(c => c.color),
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            color: '#bbbbc8',
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(6, 6, 14, 0.95)',
          borderColor: 'rgba(85, 136, 255, 0.3)',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#bbbbc8',
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`,
          },
        },
      },
    },
  });

  // ── Sortable table ──
  const tbody = document.querySelector('#projects-table tbody');
  let sortCol = 'year_start';
  let sortDir = 'desc';

  function renderTable(data) {
    tbody.innerHTML = '';
    data.forEach(p => {
      const tr = document.createElement('tr');
      const yearStr = p.year_end ? `${p.year_start}–${p.year_end}` : `${p.year_start}–Present`;
      const fields = [p.project, p.client, p.role, yearStr];
      fields.forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      // Type tag with styled span
      const typeTd = document.createElement('td');
      const typeSpan = document.createElement('span');
      typeSpan.className = 'type-tag';
      typeSpan.textContent = p.type;
      typeTd.appendChild(typeSpan);
      tr.appendChild(typeTd);
      // Impact
      const impactTd = document.createElement('td');
      impactTd.textContent = p.impact || '—';
      tr.appendChild(impactTd);
      tbody.appendChild(tr);
    });
  }

  function sortAndRender() {
    const sorted = [...projects].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    renderTable(sorted);

    // Update header indicators
    document.querySelectorAll('#projects-table th').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.col === sortCol) {
        th.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });
  }

  document.querySelectorAll('#projects-table th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortCol = col;
        sortDir = 'asc';
      }
      sortAndRender();
    });
  });

  sortAndRender();

  // ── Donut click → filter table ──
  document.getElementById('donutChart').addEventListener('click', (e) => {
    const donut = Chart.getChart('donutChart');
    const points = donut.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
    if (points.length) {
      const cat = categories[points[0].index].category;
      // Map category to project types
      const typeMap = {
        'Cloud Infrastructure': 'Cloud Migration',
        'BI / Analytics': 'BI/Analytics',
        'Data Engineering': 'Data Engineering',
        'Security / IAM': 'Security',
        'AI / ML': 'AI/ML',
      };
      const type = typeMap[cat];
      const filtered = type ? projects.filter(p => p.type === type) : projects;
      renderTable(filtered);
    } else {
      sortAndRender();
    }
  });
}

init();
