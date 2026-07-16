/* ═══════════════════════════════════════════════════════
   THEME TOGGLE — Light / Dark Mode
═══════════════════════════════════════════════════════ */
(function ThemeToggle() {
  const html = document.documentElement;
  const STORAGE_KEY = 'tacbot-theme';

  /* Default = light (per product requirement) — ignores OS preference */
  function getPreferred() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return 'light';
  }

  function applyTheme(theme) {
    html.classList.add('no-transitions');
    html.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Force a reflow to flush styling changes instantly
    const _ = window.getComputedStyle(html).opacity;
    
    requestAnimationFrame(() => {
      html.classList.remove('no-transitions');
    });
  }

  /* Apply immediately (before paint) */
  applyTheme(getPreferred());

  /* Wire up button after DOM is ready */
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = html.dataset.theme;
      const next = current === 'dark' ? 'light' : 'dark';
      /* Micro-animation: rotate toggle icon */
      btn.style.transform = 'scale(0.85)';
      requestAnimationFrame(() => {
        applyTheme(next);
        requestAnimationFrame(() => {
          btn.style.transform = '';
        });
      });
    });

    /* Update tooltip text dynamically */
    function updateTitle() {
      btn.title = html.dataset.theme === 'dark'
        ? 'Switch to Light Mode'
        : 'Switch to Dark Mode';
      btn.setAttribute('aria-label', btn.title);
    }
    updateTitle();

    /* Watch for programmatic changes */
    const observer = new MutationObserver(updateTitle);
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  });
})();

/* ═══════════════════════════════════════════════════════
   STARS
═══════════════════════════════════════════════════════ */
(function Stars() {
  const canvases = document.querySelectorAll('.stars-canvas');
  if (!canvases.length) return;
  function initStars(canvas) {
    const ctx = canvas.getContext('2d');
  let stars = [], t = 0;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    const n = Math.floor(canvas.width * canvas.height / 3200);
    for (let i = 0; i < n; i++) {
      stars.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.1 + 0.15,
        base:  Math.random() * 0.65 + 0.15,
        phase: Math.random() * Math.PI * 2,
        freq:  Math.random() * 0.012 + 0.003,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t++;
    for (const s of stars) {
      const a = s.base * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      const isDark = document.documentElement.dataset.theme !== 'light';
      ctx.fillStyle = isDark
        ? `rgba(255,255,255,${a.toFixed(3)})`
        : `rgba(22,50,91,${(a * 0.35).toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    tick();
  }

  canvases.forEach(initStars);
})();


/* ═══════════════════════════════════════════════════════
   GLOBE — dotted world map, golden routes, drag rotation
═══════════════════════════════════════════════════════ */
(async function GlobeManager() {
  const canvases = document.querySelectorAll('.globe-canvas');
  if (!canvases.length) return;

  // Wait for topojson
  let land = null, borders = null, graticule = null;
  try {
    const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
    land      = topojson.feature(world, world.objects.land);
    borders   = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
    graticule = d3.geoGraticule().step([20, 20])();
  } catch (e) {
    console.warn('World atlas load failed:', e.message);
  }

  function initGlobeInstance(canvas) {
    const ctx = canvas.getContext('2d');
    const isFlipped = canvas.dataset.flip === 'true';

  /* ── 12 cities across continents ── */
  const CITIES = [
    { coord: [-74.0,  40.7],  name: 'New York City'      },  // 0
    { coord: [76.95,  11.0],  name: 'Coimbatore, India'  },  // 1
    { coord: [-96.8,  32.8],  name: 'Dallas, Texas'      },  // 2
    { coord: [77.6,   12.9],  name: 'Bangalore, India'   },  // 3
    { coord: [-0.1,   51.5],  name: 'London, UK'         },  // 4
    { coord: [103.8,   1.3],  name: 'Singapore'          },  // 5
    { coord: [139.7,  35.7],  name: 'Tokyo, Japan'       },  // 6
    { coord: [-46.6, -23.5],  name: 'São Paulo, Brazil'  },  // 7
    { coord: [55.3,   25.2],  name: 'Dubai, UAE'         },  // 8
    { coord: [2.3,    48.8],  name: 'Paris, France'      },  // 9
    { coord: [37.6,   55.7],  name: 'Moscow, Russia'     },  // 10
    { coord: [151.2, -33.9],  name: 'Sydney, Australia'  },  // 11
  ];

  /* ── 10 cross-continental routes ── */
  const ROUTES = [
    [0,  1],   // New York      → Coimbatore
    [2,  3],   // Dallas        → Bangalore
    [4,  5],   // London        → Singapore
    [6,  7],   // Tokyo         → São Paulo
    [8,  0],   // Dubai         → New York
    [9,  6],   // Paris         → Tokyo
    [11, 4],   // Sydney        → London
    [3,  0],   // Bangalore     → New York
    [10, 8],   // Moscow        → Dubai
    [1,  4],   // Coimbatore    → London
  ];

  /* ── Arc animations — staggered offsets ── */
  const arcs = ROUTES.map((_, i) => ({
    progress: i / ROUTES.length,
    speed:    0.00062 + (i % 4) * 0.00011,
  }));

  /* ── City pulse rings — 3 per city ── */
  const rings = CITIES.map(() =>
    [0, 0.38, 0.72].map(o => ({
      phase: o,
      speed: 0.006 + Math.random() * 0.005,
    }))
  );

  /* ── Drag / rotation state ── */
  let rotX       = 10;
  let velX       = 0.022;  // angular velocity; starts at auto-rotate speed
  let isDragging = false;
  let lastDragX  = 0;
  let resumeTimer;

  /* ── Projection & sizing ── */
  let W, H, R, projection, pathGen;

  function resize() {
    W = canvas.width  = canvas.parentElement.clientWidth || window.innerWidth;
    const parentH = canvas.parentElement.clientHeight || window.innerHeight;
    H = canvas.height = Math.round(parentH * (W < 768 ? 0.5 : 0.68));
    
    if(isFlipped) H = canvas.height = Math.min(parentH, 600);
    
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    
    const isSmall = W < 600;
    R = isSmall ? Math.min(W * 0.72, 400) : Math.min(W * 0.56, 960);
    
    const cy = isFlipped ? (-R * (isSmall ? 0.3 : 0.45)) : (H + R * (isSmall ? 0.12 : 0.15));

    projection = d3.geoOrthographic()
      .scale(R)
      .translate([W / 2, cy])
      .clipAngle(90);

    pathGen = d3.geoPath().projection(projection).context(ctx);
  }



  /* ── Great-circle arc interpolation ── */
  function arcPoints(c1, c2, steps = 240) {
    const ip = d3.geoInterpolate(c1, c2);
    return Array.from({ length: steps + 1 }, (_, i) => ip(i / steps));
  }

  /* ── Front-hemisphere alpha ── */
  function frontAlpha(coord) {
    const d = d3.geoDistance(coord, [-rotX, isFlipped ? 15 : -15]);
    return Math.max(0, Math.min(1, 1 - d / (Math.PI * 0.48)));
  }

  /* ── Draw glowing route ── */
  function drawRoute(pts, tailF, headF, alpha, light) {
    let mv;
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    const rC = light ? '37,99,235' : '251,191,36'; // Blue in light, Golden in dark

    const tail = Math.floor(tailF);
    const head = Math.min(Math.floor(headF), pts.length - 1);

    // Dim full background path
    ctx.beginPath(); mv = true;
    for (let i = 0; i < pts.length; i++) {
      const p = projection(pts[i]);
      if (!p) { mv = true; continue; }
      mv ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
      mv = false;
    }
    ctx.strokeStyle = `rgba(${rC},${alpha * 0.14})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Glow layers — wide outer to sharp inner
    const layers = [
      { w: 10,  a: 0.025 },
      { w: 5,   a: 0.08  },
      { w: 2.2, a: 0.28  },
      { w: 0.9, a: 0.95  },
    ];
    for (const lay of layers) {
      ctx.beginPath(); mv = true;
      for (let i = tail; i <= head; i++) {
        const p = projection(pts[i]);
        if (!p) { mv = true; continue; }
        mv ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        mv = false;
      }
      // extend to fractional head for sub-pixel smoothness
      const frac = headF - head;
      if (frac > 0 && head + 1 < pts.length) {
        const pA = projection(pts[head]);
        const pB = projection(pts[head + 1]);
        if (pA && pB && !mv) {
          ctx.lineTo(pA[0] + (pB[0] - pA[0]) * frac, pA[1] + (pB[1] - pA[1]) * frac);
        }
      }
      ctx.strokeStyle = `rgba(${rC},${alpha * lay.a})`;
      ctx.lineWidth   = lay.w;
      ctx.shadowBlur  = 0;
      if (lay.w < 1.5) { ctx.shadowBlur = 14; ctx.shadowColor = `rgba(${rC},0.9)`; }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Bright head dot — interpolated to fractional position
    let hpx, hpy;
    const frac = headF - head;
    if (frac > 0 && head + 1 < pts.length) {
      const pA = projection(pts[head]);
      const pB = projection(pts[head + 1]);
      if (pA && pB) { hpx = pA[0] + (pB[0] - pA[0]) * frac; hpy = pA[1] + (pB[1] - pA[1]) * frac; }
    }
    if (hpx == null) {
      const hp0 = projection(pts[head]);
      if (hp0) { hpx = hp0[0]; hpy = hp0[1]; }
    }
    if (hpx != null) {
      ctx.beginPath();
      ctx.arc(hpx, hpy, 2.8, 0, Math.PI * 2);
      ctx.fillStyle  = 'rgba(253,224,71,1)';
      ctx.shadowBlur  = 16; ctx.shadowColor = 'rgba(251,191,36,1)';
      ctx.fill();
      ctx.shadowBlur  = 0;
    }
  }

  /* ── Draw white label card ── */
  function drawLabel(x, y, text, alpha) {
    if (alpha < 0.15) return;
    const fs = 10.5;
    ctx.font = `600 ${fs}px Inter, sans-serif`;
    const tw = ctx.measureText(text).width;
    const px2 = 9, py2 = 5.5;
    const bw = tw + px2 * 2;
    const bh = fs + py2 * 2;
    const lx = x - bw / 2;
    const ly = y - bh - 14;

    // Card background
    ctx.shadowBlur  = 8; ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.fillStyle   = `rgba(255,255,255,${alpha * 0.94})`;
    const cr = 4;
    ctx.beginPath();
    ctx.moveTo(lx + cr, ly);
    ctx.lineTo(lx + bw - cr, ly);   ctx.quadraticCurveTo(lx + bw, ly,      lx + bw, ly + cr);
    ctx.lineTo(lx + bw, ly + bh - cr); ctx.quadraticCurveTo(lx + bw, ly + bh, lx + bw - cr, ly + bh);
    ctx.lineTo(lx + cr, ly + bh);   ctx.quadraticCurveTo(lx,      ly + bh, lx,       ly + bh - cr);
    ctx.lineTo(lx, ly + cr);        ctx.quadraticCurveTo(lx,      ly,      lx + cr,  ly);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    // Connector line from card bottom to dot
    ctx.beginPath();
    ctx.moveTo(x, ly + bh);
    ctx.lineTo(x, y - 5);
    ctx.strokeStyle = `rgba(180,200,230,${alpha * 0.5})`;
    ctx.lineWidth   = 0.9;
    ctx.stroke();

    // Text
    ctx.fillStyle = `rgba(10,20,46,${alpha})`;
    ctx.fillText(text, lx + px2, ly + py2 + fs - 0.5);
  }

  /* ── Theme helper — read current mode on every frame ── */
  function isLight() {
    return document.documentElement.dataset.theme === 'light';
  }

  /* ── Main render loop ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const light = isLight();

    if (!isDragging) {
      velX += (0.022 - velX) * 0.018;  // always pull toward auto-rotate speed
      rotX += velX;
    }
    if (rotX > 360) rotX -= 360;

    // if flipped (bottom view), change the tilt from -15 to +45 to show south pole, or keep it if they just want the shape
    projection.rotate([rotX, isFlipped ? 15 : -15, 0]);

    const cx2 = W / 2;
    const cy2 = isFlipped ? (-R * 0.5) : (H + R * 0.5);

    /* Globe body fill */
    const gf = ctx.createRadialGradient(cx2, cy2 - R * 0.1, R * 0.02, cx2, cy2, R);
    if (light) {
      gf.addColorStop(0,    'rgba(224,232,255,0.97)');
      gf.addColorStop(0.55, 'rgba(200,218,255,0.97)');
      gf.addColorStop(1,    'rgba(180,205,252,0.99)');
    } else {
      gf.addColorStop(0,    'rgba(6,16,50,0.98)');
      gf.addColorStop(0.60, 'rgba(4,10,30,0.98)');
      gf.addColorStop(1,    'rgba(2,5,16,0.99)');
    }
    ctx.beginPath(); ctx.arc(cx2, cy2, R, 0, Math.PI * 2);
    ctx.fillStyle = gf; ctx.fill();

    /* Atmosphere halo */
    const halo = ctx.createRadialGradient(cx2, cy2, R * 0.88, cx2, cy2, R * 1.12);
    if (light) {
      halo.addColorStop(0,    'rgba(99,130,220,0)');
      halo.addColorStop(0.42, 'rgba(99,140,230,0.09)');
      halo.addColorStop(1,    'rgba(99,130,246,0)');
    } else {
      halo.addColorStop(0,    'rgba(20,60,190,0)');
      halo.addColorStop(0.42, 'rgba(40,95,215,0.11)');
      halo.addColorStop(1,    'rgba(59,130,246,0)');
    }
    ctx.beginPath(); ctx.arc(cx2, cy2, R * 1.12, 0, Math.PI * 2);
    ctx.fillStyle = halo; ctx.fill();

    /* Rim glow — full circle, gradient spans entire sphere height so no band cutoff */
    const topY = cy2 - R;
    const rimG = ctx.createLinearGradient(cx2, topY, cx2, cy2 + R);
    if (light) {
      if (isFlipped) {
        rimG.addColorStop(1,    'rgba(100,140,230,0.85)');
        rimG.addColorStop(0.94, 'rgba(80,120,210,0.65)');
        rimG.addColorStop(0.82, 'rgba(60,100,200,0.25)');
        rimG.addColorStop(0.62, 'rgba(22,50,130,0.08)');
        rimG.addColorStop(0,    'rgba(59,100,220,0)');
      } else {
        rimG.addColorStop(0,    'rgba(100,140,230,0.85)');
        rimG.addColorStop(0.06, 'rgba(80,120,210,0.65)');
        rimG.addColorStop(0.18, 'rgba(60,100,200,0.25)');
        rimG.addColorStop(0.38, 'rgba(22,50,130,0.08)');
        rimG.addColorStop(1,    'rgba(59,100,220,0)');
      }
    } else {
      if (isFlipped) {
        rimG.addColorStop(1,    'rgba(140,200,255,0.98)');
        rimG.addColorStop(0.94, 'rgba(110,180,255,0.88)');
        rimG.addColorStop(0.82, 'rgba(70,140,255,0.38)');
        rimG.addColorStop(0.62, 'rgba(22,50,91,0.15)');
        rimG.addColorStop(0,    'rgba(59,130,246,0)');
      } else {
        rimG.addColorStop(0,    'rgba(140,200,255,0.98)');
        rimG.addColorStop(0.06, 'rgba(110,180,255,0.88)');
        rimG.addColorStop(0.18, 'rgba(70,140,255,0.38)');
        rimG.addColorStop(0.38, 'rgba(22,50,91,0.15)');
        rimG.addColorStop(1,    'rgba(59,130,246,0)');
      }
    }
    ctx.beginPath(); ctx.arc(cx2, cy2, R, 0, Math.PI * 2);
    ctx.strokeStyle = rimG; ctx.lineWidth = 2.5;
    ctx.shadowBlur = light ? 22 : 42;
    ctx.shadowColor = light ? 'rgba(80,110,210,0.6)' : 'rgba(110,180,255,0.9)';
    ctx.stroke(); ctx.shadowBlur = 0;

    // Wide outer bloom
    const bloomG = ctx.createLinearGradient(cx2, topY, cx2, cy2 + R);
    if (light) {
      if (isFlipped) {
        bloomG.addColorStop(1,    'rgba(80,120,220,0.18)');
        bloomG.addColorStop(0.86, 'rgba(59,100,200,0.07)');
        bloomG.addColorStop(0.65, 'rgba(59,100,200,0.01)');
        bloomG.addColorStop(0,    'rgba(59,100,200,0)');
      } else {
        bloomG.addColorStop(0,    'rgba(80,120,220,0.18)');
        bloomG.addColorStop(0.14, 'rgba(59,100,200,0.07)');
        bloomG.addColorStop(0.35, 'rgba(59,100,200,0.01)');
        bloomG.addColorStop(1,    'rgba(59,100,200,0)');
      }
    } else {
      if (isFlipped) {
        bloomG.addColorStop(1,    'rgba(80,150,255,0.30)');
        bloomG.addColorStop(0.86, 'rgba(59,130,246,0.10)');
        bloomG.addColorStop(0.65, 'rgba(59,130,246,0.02)');
        bloomG.addColorStop(0,    'rgba(59,130,246,0)');
      } else {
        bloomG.addColorStop(0,    'rgba(80,150,255,0.30)');
        bloomG.addColorStop(0.14, 'rgba(59,130,246,0.10)');
        bloomG.addColorStop(0.35, 'rgba(59,130,246,0.02)');
        bloomG.addColorStop(1,    'rgba(59,130,246,0)');
      }
    }
    ctx.beginPath(); ctx.arc(cx2, cy2, R, 0, Math.PI * 2);
    ctx.strokeStyle = bloomG; ctx.lineWidth = 18;
    ctx.stroke();

    /* ── clip to sphere surface ── */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx2, cy2, R - 1, 0, Math.PI * 2); ctx.clip();

    /* Graticule grid */
    if (graticule) {
      ctx.beginPath(); pathGen(graticule);
      ctx.strokeStyle = light ? 'rgba(50,80,180,0.09)' : 'rgba(59,130,246,0.055)';
      ctx.lineWidth = 0.5; ctx.stroke();
    }

    /* Land fill + outline */
    if (land) {
      ctx.beginPath(); pathGen(land);
      ctx.fillStyle   = light ? 'rgba(60,90,200,0.18)' : 'rgba(28,58,130,0.28)'; ctx.fill();
      ctx.strokeStyle = light ? 'rgba(60,100,210,0.30)' : 'rgba(96,165,250,0.22)';
      ctx.lineWidth   = 0.5; ctx.stroke();
    }

    /* Country borders */
    if (borders) {
      ctx.beginPath(); pathGen(borders);
      ctx.strokeStyle = light ? 'rgba(60,100,210,0.14)' : 'rgba(96,165,250,0.1)';
      ctx.lineWidth   = 0.4; ctx.stroke();
    }

    /* Routes */
    ROUTES.forEach(([ai, bi], idx) => {
      const arc = arcs[idx];
      arc.progress += arc.speed;
      if (arc.progress > 1) arc.progress = 0;

      const pts    = arcPoints(CITIES[ai].coord, CITIES[bi].coord);
      const headF  = arc.progress * (pts.length - 1);   // fractional
      const tailF  = Math.max(0, headF - pts.length * 0.28); // 28% tail
      const mid    = pts[Math.floor(pts.length / 2)];
      const alpha  = Math.max(0, Math.min(1, 1 - d3.geoDistance(mid, [-rotX, isFlipped ? 15 : -15]) / (Math.PI * 0.5)));

      if (alpha > 0.04) drawRoute(pts, tailF, headF, alpha, light);
    });

    /* City dots with pulse rings */
    CITIES.forEach((city, i) => {
      const p     = projection(city.coord);
      if (!p) return;
      const alpha = frontAlpha(city.coord);
      if (alpha < 0.06) return;

      const rC = light ? '37,99,235' : '251,191,36';

      for (const ring of rings[i]) {
        ring.phase = (ring.phase + ring.speed) % 1;
        const rr = 3.5 + ring.phase * 13;
        const ra = (1 - ring.phase) * 0.52 * alpha;
        ctx.beginPath();
        ctx.arc(p[0], p[1], rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rC},${ra.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Halo + core dot
      ctx.beginPath(); ctx.arc(p[0], p[1], 5.5, 0, Math.PI * 2);
      ctx.fillStyle = light
        ? `rgba(50,80,220,${alpha * 0.22})`
        : `rgba(59,100,220,${alpha * 0.28})`;
      ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
      ctx.fillStyle  = light
        ? `rgba(80,100,230,${alpha})`
        : `rgba(200,220,255,${alpha})`;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = light ? 'rgba(80,110,220,0.7)' : 'rgba(150,190,255,0.9)';
      ctx.fill(); ctx.shadowBlur = 0;
    });

    ctx.restore(); /* end sphere clip */

    /* Vignette — fade globe edges to match the page background */
    const bgAlpha = light ? 'rgba(244,246,251,' : 'rgba(4,6,15,';
    const sw = W * 0.16;
    const svL = ctx.createLinearGradient(0, 0, sw, 0);
    svL.addColorStop(0, bgAlpha+'1)'); svL.addColorStop(1, bgAlpha+'0)');
    ctx.fillStyle = svL; ctx.fillRect(0, 0, sw, H);
    const svR = ctx.createLinearGradient(W - sw, 0, W, 0);
    svR.addColorStop(0, bgAlpha+'0)'); svR.addColorStop(1, bgAlpha+'1)');
    ctx.fillStyle = svR; ctx.fillRect(W - sw, 0, sw, H);
    
    if (isFlipped) {
       const svT = ctx.createLinearGradient(0, 0, 0, H * 0.4);
       svT.addColorStop(0, bgAlpha+'1)'); svT.addColorStop(1, bgAlpha+'0)');
       ctx.fillStyle = svT; ctx.fillRect(0, 0, W, H * 0.40);
    } else {
       const svB = ctx.createLinearGradient(0, H * 0.60, 0, H);
       svB.addColorStop(0, bgAlpha+'0)'); svB.addColorStop(1, bgAlpha+'1)');
       ctx.fillStyle = svB; ctx.fillRect(0, H * 0.60, W, H * 0.40);
    }


    requestAnimationFrame(draw);
  }

  /* ── Drag interaction ── */
  const gx = e => e.touches ? e.touches[0].clientX : e.clientX;

  function startDrag(e) {
    isDragging = true; lastDragX = gx(e);
    clearTimeout(resumeTimer); e.preventDefault();
  }
  function onDrag(e) {
    if (!isDragging) return;
    const dx = (gx(e) - lastDragX) * 0.28;
    velX = velX * 0.6 + dx * 0.4;   // exponential smooth of velocity
    rotX += dx;
    lastDragX = gx(e);
  }
  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    // velX already carries throw momentum; draw() blends it toward auto-rotate speed
  }

  canvas.addEventListener('mousedown',  startDrag);
  window.addEventListener('mousemove',  onDrag);
  window.addEventListener('mouseup',    endDrag);
  canvas.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchmove',  onDrag,    { passive: false });
  window.addEventListener('touchend',   endDrag);

  /* ── Start ── */
  resize();
  window.addEventListener('resize', resize);
  draw();
  }

  canvases.forEach(initGlobeInstance);
})();


/* ═══════════════════════════════════════════════════════
   NAV scroll tint
═══════════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});


/* ═══════════════════════════════════════════════════════
   GSAP entrance
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') { document.getElementById('heroContent').style.opacity = '1'; return; }
  gsap.set('#heroContent', { opacity: 1 });
  gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } })
    .fromTo('nav',          { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.1)
    .fromTo('h1',           { y: 32,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, 0.35)
    .fromTo('.hero-sub',    { y: 20,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.55)
    .fromTo('.hero-ctas .btn-primary',   { y: 18, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.65 }, 0.72)
    .fromTo('.hero-ctas .btn-secondary', { y: 18, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.65 }, 0.82);

  /* ── Problem section animations ── */
  gsap.registerPlugin(ScrollTrigger);

  // Header
  gsap.from('.problem-header > *', {
    scrollTrigger: { trigger: '.problem-header', start: 'top 85%' },
    y: 28, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
  });

  // Bento cards stagger in
  gsap.to('.bento-card', {
    scrollTrigger: { trigger: '.bento-grid', start: 'top 82%' },
    y: 0, opacity: 1, duration: 0.65, stagger: 0.12, ease: 'power3.out',
  });

  // Stat counters
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.target;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter() {
        gsap.to({ val: 0 }, {
          val: target, duration: 1.6, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(this.targets()[0].val); },
        });
      },
    });
  });

  // Portal chips stagger
  ScrollTrigger.create({
    trigger: '.portal-grid',
    start: 'top 85%',
    once: true,
    onEnter() {
      gsap.to('.portal-chip', {
        opacity: 1, scale: 1, duration: 0.3,
        stagger: { each: 0.055, from: 'random' },
        ease: 'back.out(1.4)',
      });
    },
  });

  // SLA chart draw
  ScrollTrigger.create({
    trigger: '.card-sla',
    start: 'top 80%',
    once: true,
    onEnter() {
      setTimeout(() => {
        document.querySelector('.sla-line').classList.add('drawn');
        setTimeout(() => document.querySelector('.sla-breach-dot').classList.add('visible'), 2000);
      }, 400);
    },
  });

  /* ── Vision section animations ── */
  gsap.from('.vision-header > *', {
    scrollTrigger: { trigger: '.vision-header', start: 'top 85%' },
    y: 28, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
  });

  document.querySelectorAll('.vision-subsection').forEach(sub => {
    // Subsection headers fade/slide up
    const header = sub.querySelector('.subsection-header');
    if (header) {
      gsap.from(header.children, {
        scrollTrigger: { trigger: sub, start: 'top 85%' },
        y: 20, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out',
      });
    }
  });

  // Showcase and widget fade up on scroll
  gsap.from('.evolution-showcase', {
    scrollTrigger: { trigger: '.evolution-showcase', start: 'top 82%' },
    y: 24, opacity: 0, duration: 0.75, ease: 'power3.out'
  });

  gsap.from('.autonomy-cards .autonomy-card', {
    scrollTrigger: { trigger: '.autonomy-cards', start: 'top 80%' },
    y: 24, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
    clearProps: "transform"
  });

  /* ── Evolution Showcase — right-side mockup auto-advances, left cards stay static ── */
  const mockupPanels = document.querySelectorAll('.mockup-panel');
  let activePhase = 1;

  function switchPhase(phaseNum) {
    activePhase = phaseNum;
    mockupPanels.forEach(panel => {
      if (+panel.dataset.panel === phaseNum) {
        panel.classList.add('active');
        gsap.fromTo(panel.querySelectorAll('.mockup-body > *'),
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
        );
      } else {
        panel.classList.remove('active');
      }
    });
  }

  if (mockupPanels.length) {
    setInterval(() => {
      let nextPhase = activePhase + 1;
      if (nextPhase > mockupPanels.length) nextPhase = 1;
      switchPhase(nextPhase);
    }, 4000);
  }

});

/* ═══════════════════════════════════════════════════════
   NETWORK CANVAS — Feature A
═══════════════════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const VENDORS = [
    { name: 'AWS',        iconId: 'amazonaws',      color: '#f59e0b', localColor: 'assets/images/integrations/aws.svg',         localWhite: 'assets/images/integrations/aws.svg' },
    { name: 'Azure',      iconId: 'microsoftazure', color: '#3b82f6', localColor: 'assets/images/integrations/azure.svg',       localWhite: 'assets/images/integrations/azure.svg' },
    { name: 'ServiceNow', iconId: 'servicenow',     color: '#22c55e', localColor: 'assets/images/integrations/servicenow.svg',  localWhite: 'assets/images/integrations/servicenow.svg' },
    { name: 'Jira',       iconId: 'jira',           color: '#6366f1' },
    { name: 'Datadog',    iconId: 'datadog',        color: '#a855f7' },
    { name: 'PagerDuty',  iconId: 'pagerduty',      color: '#ef4444' },
  ];

  VENDORS.forEach(v => {
    v.imgWhite = new Image();
    v.imgWhite.src = v.localWhite || `https://cdn.simpleicons.org/${v.iconId}/white`;
    v.imgColor = new Image();
    v.imgColor.src = v.localColor || `https://cdn.simpleicons.org/${v.iconId}`;
  });

  let W, H, cx, cy, R;
  const nodes = [];
  const packets = [];
  const startTime = performance.now();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = 360;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    R  = Math.min(W * 0.33, 138);
    cy = H / 2;
    nodes.length = 0;
    nodes.push({ x: cx, y: cy, isHub: true });
    VENDORS.forEach((v, i) => {
      const angle = (i / VENDORS.length) * Math.PI * 2 - Math.PI / 2;
      nodes.push({ x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R, ...v, angle });
    });
    const htmlHub = document.getElementById('networkHub');
    if (htmlHub) {
      htmlHub.style.top  = cy + 'px';
      htmlHub.style.left = cx + 'px';
      htmlHub.style.transform = 'translate(-50%, -50%)';
    }
  }

  function spawnPacket() {
    const vi = 1 + Math.floor(Math.random() * VENDORS.length);
    const toHub = Math.random() < 0.5;
    packets.push({ from: toHub ? vi : 0, to: toHub ? 0 : vi, t: 0,
      speed: 0.007 + Math.random() * 0.005, color: nodes[vi].color });
  }

  for (let i = 0; i < 6; i++) {
    const vi = 1 + Math.floor(Math.random() * VENDORS.length);
    const fromHub = Math.random() < 0.5;
    packets.push({ from: fromHub ? 0 : vi, to: fromHub ? vi : 0,
      t: Math.random(), speed: 0.007 + Math.random() * 0.005,
      color: nodes[vi]?.color || '#6366f1' });
  }

  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  let lastSpawn = 0;
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    const elapsed = ts - startTime;
    const isLight = document.documentElement.dataset.theme === 'light';

    // hub pulse rings
    for (let i = 0; i < 3; i++) {
      const phase = ((elapsed / 2400) + i / 3) % 1;
      const rr = 38 + phase * 62;
      const a  = (1 - phase) * (isLight ? 0.14 : 0.22);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? `rgba(14,39,66,${a})` : `rgba(99,102,241,${a})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // edges
    VENDORS.forEach((v, i) => {
      const hub = nodes[0], vnd = nodes[i + 1];
      const grad = ctx.createLinearGradient(hub.x, hub.y, vnd.x, vnd.y);
      if (isLight) {
        grad.addColorStop(0, 'rgba(14,39,66,0.22)');
        grad.addColorStop(1, v.color + '50');
      } else {
        grad.addColorStop(0, 'rgba(99,102,241,0.3)');
        grad.addColorStop(1, v.color + '40');
      }
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(vnd.x, vnd.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // packets with trail
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += p.speed;
      if (p.t >= 1) { packets.splice(i, 1); continue; }
      const fn = nodes[p.from], tn = nodes[p.to];
      for (let j = 4; j >= 0; j--) {
        const tt = Math.max(0, p.t - j * 0.022);
        const tx = fn.x + (tn.x - fn.x) * tt;
        const ty = fn.y + (tn.y - fn.y) * tt;
        const a  = ((1 - j / 5) * 0.55).toFixed(2);
        const r2 = Math.max(0.5, 2 - j * 0.28);
        ctx.beginPath();
        ctx.arc(tx, ty, r2, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(parseFloat(a) * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
      const px = fn.x + (tn.x - fn.x) * p.t;
      const py = fn.y + (tn.y - fn.y) * p.t;
      const g  = ctx.createRadialGradient(px, py, 0, px, py, 8);
      g.addColorStop(0, p.color + 'bb');
      g.addColorStop(1, p.color + '00');
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill();
    }

    if (ts - lastSpawn > 650) { spawnPacket(); lastSpawn = ts; }

    // vendor node cards
    const cW = 64, cH = 52, cR = 10;
    VENDORS.forEach((v, ri) => {
      const nd = nodes[ri + 1];
      const nx = nd.x, ny = nd.y;

      // halo glow
      const halo = ctx.createRadialGradient(nx, ny, 0, nx, ny, 44);
      halo.addColorStop(0, v.color + '25');
      halo.addColorStop(1, v.color + '00');
      ctx.beginPath(); ctx.arc(nx, ny, 44, 0, Math.PI * 2);
      ctx.fillStyle = halo; ctx.fill();

      // card fill
      rrect(nx - cW/2, ny - cH/2, cW, cH, cR);
      ctx.fillStyle = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(12,16,36,0.78)';
      ctx.fill();

      // card border
      rrect(nx - cW/2, ny - cH/2, cW, cH, cR);
      ctx.strokeStyle = isLight ? v.color + '55' : v.color + '66';
      ctx.lineWidth = 1;
      ctx.stroke();

      // icon
      const img = isLight ? v.imgColor : v.imgWhite;
      if (img && img.complete && img.naturalWidth !== 0) {
        const sz = 22;
        ctx.drawImage(img, nx - sz/2, ny - cH/2 + 8, sz, sz);
      }

      // name label
      ctx.font = '500 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isLight ? 'rgba(13,21,39,0.55)' : 'rgba(255,255,255,0.5)';
      ctx.fillText(v.name, nx, ny + cH/2 - 7);
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
})();

/* ═══════════════════════════════════════════════════════
   CALENDAR DEMO — Feature B
═══════════════════════════════════════════════════════ */
(function() {
  const events   = document.querySelectorAll('.cal-has-event');
  const conflict = document.getElementById('calConflict');
  if (!events.length) return;

  ScrollTrigger.create({
    trigger: '#feat-b',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      events.forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * 180);
      });
      setTimeout(() => {
        if (conflict) conflict.classList.add('visible');
      }, events.length * 180 + 400);
    },
  });
})();

/* ═══════════════════════════════════════════════════════
   SCORECARD ANIMATION — Feature C
═══════════════════════════════════════════════════════ */
(function() {
  const rows = document.querySelectorAll('.sc-row');
  if (!rows.length) return;

  ScrollTrigger.create({
    trigger: '#feat-c',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      rows.forEach((row, i) => {
        setTimeout(() => {
          row.classList.add('revealed');
          // bar fill
          const bar = row.querySelector('.sc-bar');
          if (bar) bar.style.width = bar.style.getPropertyValue('--target') || row.dataset.score + '%';
          // counter
          const numEl = row.querySelector('.sc-num');
          const target = parseInt(numEl?.dataset.target || 0, 10);
          let current = 0;
          const dur = 1200;
          const step = 16;
          const inc = target / (dur / step);
          const timer = setInterval(() => {
            current = Math.min(current + inc, target);
            numEl.textContent = Math.round(current);
            if (current >= target) clearInterval(timer);
          }, step);
        }, i * 120);
      });
    },
  });
})();

/* ═══════════════════════════════════════════════════════
   ECOSYSTEM HUB & SPOKE — SVG lines + node reveal (Draggable & Floating)
═══════════════════════════════════════════════════════ */
(function() {
  const section = document.querySelector('.eco-section');
  const svg     = document.getElementById('ecoSvg');
  const hub     = document.getElementById('ecoHub');
  const nodesIn  = [...document.querySelectorAll('.eco-node[data-ring="in"]')];
  const nodesOut = [...document.querySelectorAll('.eco-node[data-ring="out"]')];
  if (!svg || !hub) return;

  function getCenter(el) {
    const sr = svg.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return {
      x: er.left + er.width  / 2 - sr.left,
      y: er.top  + er.height / 2 - sr.top,
    };
  }

  function getNodeEdge(el, isOut, isMobile) {
    const sr = svg.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (isMobile) {
      return {
        x: er.left + er.width / 2 - sr.left,
        y: isOut ? (er.top - sr.top) : (er.bottom - sr.top)
      };
    } else {
      return {
        x: isOut ? (er.left - sr.left) : (er.right - sr.left),
        y: er.top  + er.height / 2 - sr.top,
      };
    }
  }

  const allNodes = [...nodesIn, ...nodesOut];
  const connections = [];

  // Initialize nodes for drag & float
  allNodes.forEach((node, i) => {
    node.dragX = 0;
    node.dragY = 0;
    node.floatPhase = Math.random() * Math.PI * 2;
    node.floatSpeed = 0.015 + Math.random() * 0.01;
    node.isDragging = false;
    node.isRevealed = false;
    node.style.cursor = 'grab';
    node.style.position = 'relative'; // ensures z-index works well
    node.style.userSelect = 'none'; // prevent text highlight when dragging

    // Pointer events for drag (Disabled on small mobile to prevent scroll interference)
    node.addEventListener('mousedown', e => onDragStart(e, node));
    node.addEventListener('touchstart', e => {
      if (window.innerWidth > 600) onDragStart(e.touches[0], node);
    }, { passive: true });
  });

  let activeNode = null;
  let dragOffset = { x: 0, y: 0 };

  function onDragStart(e, node) {
    if (!node.isRevealed) return;
    activeNode = node;
    node.isDragging = true;
    node.style.cursor = 'grabbing';
    node.style.zIndex = 100;
    node.style.transition = 'none'; // Ensure no CSS transition interferes
    
    // Calculate offset relative to current drag coords
    dragOffset.x = e.clientX - node.dragX;
    dragOffset.y = e.clientY - node.dragY;
  }

  function onDragMove(e) {
    if (!activeNode) return;

    const wrapRect = document.querySelector('.eco-hub-wrap').getBoundingClientRect();
    const nodeRect = activeNode.getBoundingClientRect();
    const nodeW = nodeRect.width;
    const nodeH = nodeRect.height;
    const isIn = activeNode.dataset.ring === 'in';

    // Raw proposed position
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Compute proposed screen left edge of the node at this dragX
    // node's natural left (without dragX) == nodeRect.left - activeNode.dragX
    const naturalLeft = nodeRect.left - activeNode.dragX;
    const naturalTop  = nodeRect.top  - activeNode.dragY;

    // Screen boundaries
    const wrapLeft  = wrapRect.left;
    const wrapRight = wrapRect.right;
    const wrapTop   = wrapRect.top;
    const wrapBottom = wrapRect.bottom;
    const midX = wrapLeft + wrapRect.width / 2;

    // Convert proposed dragX to proposed screen left of node
    const proposedScreenLeft = naturalLeft + newX;
    const proposedScreenRight = proposedScreenLeft + nodeW;
    const proposedScreenTop  = naturalTop  + newY;
    const proposedScreenBot  = proposedScreenTop + nodeH;

    // Clamp X: left-ring stays left of center, right-ring stays right of center
    if (isIn) {
      if (proposedScreenLeft < wrapLeft) newX += wrapLeft - proposedScreenLeft;
      if (proposedScreenRight > midX)    newX -= proposedScreenRight - midX;
    } else {
      if (proposedScreenLeft < midX)   newX += midX - proposedScreenLeft;
      if (proposedScreenRight > wrapRight) newX -= proposedScreenRight - wrapRight;
    }

    // Clamp Y: stay within wrap vertically
    if (proposedScreenTop < wrapTop)      newY += wrapTop  - proposedScreenTop;
    if (proposedScreenBot > wrapBottom)   newY -= proposedScreenBot - wrapBottom;

    activeNode.dragX = newX;
    activeNode.dragY = newY;
    e.preventDefault();
  }

  function onDragEnd() {
    if (activeNode) {
      activeNode.isDragging = false;
      activeNode.style.cursor = 'grab';
      activeNode.style.zIndex = '';
      activeNode.style.transition = 'opacity 0.5s, border-color 0.25s, background 0.25s'; // Restore hover transitions
      activeNode = null;
    }
  }

  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchmove', e => { if (activeNode) { onDragMove(e.touches[0]); } }, { passive: false });
  window.addEventListener('touchend', onDragEnd);

  function initSVG() {
    svg.innerHTML = '';
    connections.length = 0;

    allNodes.forEach((node, i) => {
      const isOut = node.dataset.ring === 'out';
      
      const gId = 'eg_' + Math.random().toString(36).slice(2);
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', gId);
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');

      const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s1.setAttribute('offset', '0%');
      s1.setAttribute('stop-color', isOut ? 'rgba(96,165,250,0.6)' : 'rgba(96,165,250,0.15)');
      const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s2.setAttribute('offset', '100%');
      s2.setAttribute('stop-color', isOut ? 'rgba(52,211,153,0.6)' : 'rgba(96,165,250,0.6)');

      grad.appendChild(s1);
      grad.appendChild(s2);
      defs.appendChild(grad);
      svg.appendChild(defs);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('stroke', `url(#${gId})`);
      line.setAttribute('stroke-width', '1.2');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('fill', 'none');
      line.style.opacity = '0';
      svg.appendChild(line);

      const dotIn = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotIn.setAttribute('r', '3');
      dotIn.setAttribute('fill', i % 3 === 0 ? '#fbbf24' : '#60a5fa');
      dotIn.setAttribute('opacity', '0');
      svg.appendChild(dotIn);

      const dotOut = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotOut.setAttribute('r', '3');
      dotOut.setAttribute('fill', i % 3 === 0 ? '#60a5fa' : '#fbbf24');
      dotOut.setAttribute('opacity', '0');
      svg.appendChild(dotOut);

      connections.push({
        node, line, dotIn, dotOut, grad, isOut,
        tIn: Math.random(),
        tOut: Math.random(),
        speed: 0.0015 + Math.random() * 0.0015
      });
    });
  }

  function drawLoop() {
    const hc = getCenter(hub);

    connections.forEach(conn => {
      const { node, line, dotIn, dotOut, grad, isOut } = conn;
      
      if (node.isRevealed) {
        // Floating motion
        if (!node.isDragging) {
          node.floatPhase += node.floatSpeed;
        }
        const floatY = Math.sin(node.floatPhase) * 18; // Increased float height
        const floatX = Math.cos(node.floatPhase * 0.7) * 10; // Increased horizontal float
        node.style.transform = `translate(${node.dragX + floatX}px, ${node.dragY + floatY}px)`;

        const isMobile = window.innerWidth < 860;
        const nc = getNodeEdge(node, isOut, isMobile);

        // Update gradient coords based on node positions
        grad.setAttribute('x1', isOut ? hc.x : nc.x);
        grad.setAttribute('y1', isOut ? hc.y : nc.y);
        grad.setAttribute('x2', isOut ? nc.x : hc.x);
        grad.setAttribute('y2', isOut ? nc.y : hc.y);

        // Compute Bezier Control Points
        let cp1x, cp1y, cp2x, cp2y;

        if (isMobile) {
          // Vertical flow with horizontal bulge
          const dy = (hc.y - nc.y) * 0.5;
          const bulge = (nc.x - hc.x) * 0.4; // Bulge based on horizontal deviation
          cp1x = nc.x + bulge;
          cp1y = nc.y + dy;
          cp2x = hc.x - bulge;
          cp2y = hc.y - dy;
        } else {
          // Horizontal flow
          const dx = (hc.x - nc.x) * 0.5;
          cp1x = nc.x + dx;
          cp1y = nc.y;
          cp2x = hc.x - dx;
          cp2y = hc.y;
        }

        // Update path data
        line.setAttribute('d', `M ${nc.x},${nc.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${hc.x},${hc.y}`);
        line.style.opacity = '1';

        // Update dot position using Bezier formula
        conn.tIn += conn.speed;
        if (conn.tIn > 1) conn.tIn -= 1;
        
        conn.tOut += conn.speed;
        if (conn.tOut > 1) conn.tOut -= 1;
        
        function getP(t) {
          const mt = 1 - t;
          const mt2 = mt * mt;
          const mt3 = mt2 * mt;
          const t2 = t * t;
          const t3 = t2 * t;
          return {
            x: mt3 * nc.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * hc.x,
            y: mt3 * nc.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * hc.y
          };
        }

        // tIn goes from 0 to 1 (node to hub)
        const pIn = getP(conn.tIn);
        dotIn.setAttribute('cx', pIn.x);
        dotIn.setAttribute('cy', pIn.y);
        dotIn.setAttribute('opacity', '0.85');

        // tOut goes from 1 to 0 (hub to node)
        const pOut = getP(1 - conn.tOut);
        dotOut.setAttribute('cx', pOut.x);
        dotOut.setAttribute('cy', pOut.y);
        dotOut.setAttribute('opacity', '0.85');
      }
    });

    requestAnimationFrame(drawLoop);
  }

  initSVG();

  ScrollTrigger.create({
    trigger: '.eco-section',
    start: 'top 65%',
    once: true,
    onEnter: () => {
      allNodes.forEach((node, i) => {
        setTimeout(() => {
          node.classList.add('revealed');
          node.isRevealed = true;
          // Set transition to opacity only to ignore transform css conflicts
          node.style.transition = 'opacity 0.5s, border-color 0.25s, background 0.25s'; 
        }, i * 100);
      });
      // Start the render loop
      requestAnimationFrame(drawLoop);
    },
  });
})();

/* ═══════════════════════════════════════════════════════
   SECTION 5 — THE TACBOT EDGE — Praha scroll reveal
═══════════════════════════════════════════════════════ */
(function EdgePraha() {
  const section = document.getElementById('tacbot-edge');
  if (!section) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top 75%',
    once: true,
    onEnter() {
      const card = section.querySelector('.praha-card');
      if (card) card.classList.add('revealed');
    },
  });
})();

/* ═══════════════════════════════════════════════════════
   SECTION 6 — CTA SECTION Particles & Reveal
═══════════════════════════════════════════════════════ */
(function() {
  // GSAP Reveal
  ScrollTrigger.create({
    trigger: '.cta-section',
    start: 'top 75%',
    once: true,
    onEnter: () => {
      document.querySelector('.cta-container')?.classList.add('revealed');
    }
  });

  // Canvas Particles
  const canvas = document.getElementById('cta-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let w, h;
  const particles = [];
  const particleCount = 60;
  
  function resize() {
    w = canvas.width = canvas.parentElement.clientWidth;
    h = canvas.height = canvas.parentElement.clientHeight;
  }
  
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * -0.5 - 0.2, // Floats up
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap around
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96, 165, 250, ${p.alpha})`;
      ctx.fill();
    }
    
    requestAnimationFrame(draw);
  }
  
  draw();
})();


/* ═══════════════════════════════════════════════════════
   MOBILE NAV
═══════════════════════════════════════════════════════ */
(function MobileNav() {
  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  function close() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      // Entrance animation
      gsap.to('.nav-links', { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.to('.nav-links a, .nav-mobile-cta, .nav-menu-footer', {
        opacity: 1, y: 0, duration: 0.5,
        stagger: 0.05, ease: 'power3.out', delay: 0.1
      });
    } else {
      // Reset positions
      gsap.set(['.nav-links a', '.nav-mobile-cta', '.nav-menu-footer'], { 
        opacity: 0, y: 20 
      });
    }
  });

  navLinks.querySelectorAll('a:not(.nav-trigger)').forEach(a => a.addEventListener('click', close));
  navLinks.querySelectorAll('button').forEach(b => b.addEventListener('click', close));

  // Dropdown click handler
  document.querySelectorAll('.nav-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const navItem = trigger.closest('.nav-item');
      
      // Close other dropdowns
      document.querySelectorAll('.nav-item').forEach(item => {
        if (item !== navItem) {
          item.classList.remove('active-dropdown');
        }
      });
      
      navItem.classList.toggle('active-dropdown');
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item')) {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active-dropdown');
      });
    }
  });

  window.addEventListener('resize', () => { 
    if (window.innerWidth > 768) {
      close();
      gsap.set(['.nav-links a', '.nav-mobile-cta', '.nav-menu-footer'], { 
        clearProps: 'all' 
      });
    }
  });
})();

