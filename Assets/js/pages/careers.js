// ─────────────────────────────────────────────────────
// CAREERS PAGE — Animations & Interactivity
// ─────────────────────────────────────────────────────

// ── Nav scroll tint ──────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Mobile hamburger ─────────────────────────────────
const hamburger = document.getElementById('navHamburger');
const navLinks  = document.getElementById('navLinks');

hamburger?.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ── Stars canvas ─────────────────────────────────────
function initStars(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [], W, H, raf;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    stars = Array.from({ length: Math.floor(W * H / 3500) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.1 + 0.2,
      o: Math.random() * 0.45 + 0.08,
      s: Math.random() * 0.003 + 0.0008
    }));
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.dataset.theme !== 'light';
    stars.forEach(s => {
      const flicker = Math.sin(t * s.s * 80) * 0.15;
      const alpha = Math.max(0.04, Math.min(0.65, s.o + flicker));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(255,255,255,${alpha.toFixed(3)})`
        : `rgba(22,50,91,${(alpha * 0.35).toFixed(3)})`;
      ctx.fill();
    });
    t += 0.016;
    raf = requestAnimationFrame(draw);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || document.documentElement);
  resize();
  draw();
}

initStars(document.getElementById('careers-stars'));
initStars(document.getElementById('roles-stars'));

// ── Hero entrance ─────────────────────────────────────
const heroContent = document.getElementById('heroContent');
if (heroContent) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      heroContent.style.transition = 'opacity 1s cubic-bezier(0.2,0.8,0.2,1), transform 1s cubic-bezier(0.2,0.8,0.2,1)';
      heroContent.style.opacity   = '1';
      heroContent.style.transform = 'translateY(0)';
    }, 150);
  });
}

// ── GSAP ScrollTrigger ────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// Founders card — uses CSS transition (.revealed)
const foundersCard = document.getElementById('foundersCard');
if (foundersCard) {
  ScrollTrigger.create({
    trigger: foundersCard,
    start: 'top 80%',
    onEnter: () => foundersCard.classList.add('revealed')
  });
}

// Culture cards — stagger reveal
gsap.utils.toArray('.culture-card').forEach((card, i) => {
  gsap.to(card, {
    scrollTrigger: { trigger: card, start: 'top 86%' },
    opacity: 1,
    y: 0,
    duration: 0.7,
    delay: i * 0.14,
    ease: 'power2.out'
  });
});

// Tech feature row
gsap.from('#feat-tech .feature-text', {
  scrollTrigger: { trigger: '#feat-tech', start: 'top 80%' },
  opacity: 0, x: -30, duration: 0.8, ease: 'power2.out'
});
gsap.from('#terminal-card', {
  scrollTrigger: { trigger: '#feat-tech', start: 'top 80%' },
  opacity: 0, x: 30, duration: 0.8, delay: 0.15, ease: 'power2.out'
});

// Global map drawing
(function() {
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('mapContainer');
  let worldData = null;

  // Equirectangular projection configuration
  const projectionRefWidth = 1080;
  const projectionRefHeight = 650;

  function getXY(lon, lat, width, height) {
    const proj = d3.geoEquirectangular()
      .scale((width / projectionRefWidth) * 182)
      .translate([width / 2, height / 2 + 15]);
    return proj([lon, lat]);
  }

  function positionCallouts() {
    const markers = document.querySelectorAll('.map-marker');
    markers.forEach(marker => {
      const lon = +marker.dataset.lon;
      const lat = +marker.dataset.lat;
      const [x, y] = getXY(lon, lat, projectionRefWidth, projectionRefHeight);
      marker.style.left = `${(x / projectionRefWidth) * 100}%`;
      marker.style.top = `${(y / projectionRefHeight) * 100}%`;
    });
  }

  function drawMap() {
    if (!worldData) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Set canvas dimensions with high DPI support
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    const proj = d3.geoEquirectangular()
      .scale((width / projectionRefWidth) * 182)
      .translate([width / 2, height / 2 + 15]);

    const pathGenerator = d3.geoPath().projection(proj);

    // Render landmasses to offscreen canvas to check points
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const oCtx = offscreenCanvas.getContext('2d');
    oCtx.scale(devicePixelRatio, devicePixelRatio);
    oCtx.fillStyle = '#ffffff';

    oCtx.beginPath();
    pathGenerator.context(oCtx);
    worldData.features.forEach(f => {
      pathGenerator(f);
    });
    oCtx.fill();

    // Scan a grid of points on offscreen canvas
    const dotSpacing = 7.5; // space between dots in CSS pixels
    const dotRadius = 1.3;
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';

    ctx.fillStyle = isLightTheme ? 'rgba(15, 23, 42, 0.38)' : 'rgba(255, 255, 255, 0.28)';

    const imgData = oCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < height; y += dotSpacing) {
      for (let x = 0; x < width; x += dotSpacing) {
        const px = Math.round(x * devicePixelRatio);
        const py = Math.round(y * devicePixelRatio);

        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          const index = (py * canvas.width + px) * 4;
          if (data[index + 3] > 0) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // Load world geometries from atlas CDN
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(res => res.json())
    .then(data => {
      worldData = topojson.feature(data, data.objects.countries);
      positionCallouts();
      drawMap();

      // Trigger GSAP entry animation
      if (window.gsap && window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: container,
          start: 'top 85%',
          onEnter: () => {
            container.classList.add('shown');
          }
        });
      } else {
        container.classList.add('shown');
      }

      window.addEventListener('resize', drawMap);

      // Listen for theme transitions to redraw map
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'data-theme') {
            drawMap();
          }
        });
      });
      observer.observe(document.documentElement, { attributes: true });
    });
})();

// Principle rows — stagger
gsap.utils.toArray('.principle-row').forEach((row, i) => {
  gsap.to(row, {
    scrollTrigger: { trigger: row, start: 'top 87%' },
    opacity: 1,
    y: 0,
    duration: 0.65,
    delay: i * 0.1,
    ease: 'power2.out'
  });
});

// Roles CTA — uses CSS transition (.revealed)
const rolesCta = document.getElementById('rolesCta');
if (rolesCta) {
  ScrollTrigger.create({
    trigger: rolesCta,
    start: 'top 80%',
    onEnter: () => rolesCta.classList.add('revealed')
  });
}

// ── Stat counters ─────────────────────────────────────
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateCounter(el, target, duration = 1600) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(easeOutCubic(p) * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

let statsAnimated = false;
const statsStrip = document.querySelector('.stats-strip');

if (statsStrip) {
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      document.querySelectorAll('.stat-big[data-target]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target));
      });
      io.disconnect();
    }
  }, { threshold: 0.4 });
  io.observe(statsStrip);
}

// ── Terminal animation ────────────────────────────────
const terminalBody = document.getElementById('terminalBody');

if (terminalBody) {
  const VENDORS = [
    { name: 'AWS CloudWatch   ', events: '12,847 events/hr' },
    { name: 'Salesforce       ', events: ' 8,291 events/hr' },
    { name: 'ServiceNow ITSM  ', events: ' 4,102 events/hr' },
    { name: 'SAP Analytics    ', events: ' 2,891 events/hr' },
    { name: 'Datadog APM      ', events: '19,443 events/hr' },
    { name: 'Jira Software    ', events: ' 3,204 events/hr' },
    { name: 'PagerDuty        ', events: ' 1,847 events/hr' },
    { name: '+ 505 more       ', events: '        ···' },
  ];

  function buildPhases() {
    const phases = [
      [0,    `<div><span class="t-prompt">$&nbsp;</span><span class="t-cmd">tacbot normalize \\</span></div>`],
      [380,  `<div><span class="t-dim">&nbsp;&nbsp;--sources=512 --output=unified.stream</span></div>`],
      [820,  `<div>&nbsp;</div>`],
      [860,  `<div><span class="t-dim">Discovering vendor schemas...</span></div>`],
      [1600, `<div><span class="t-success">✓</span> <span class="t-dim">Connected — 512 APIs detected</span></div>`],
      [2000, `<div>&nbsp;</div>`],
      [2050, `<div><span class="t-blue">Normalizing event schemas:</span></div>`],
    ];

    VENDORS.forEach((v, i) => {
      const d = 2440 + i * 270;
      const isLast = v.events.includes('···');
      phases.push([
        d,
        isLast
          ? `<div><span class="t-dim">&nbsp;&nbsp;${v.name} ${v.events}</span></div>`
          : `<div>&nbsp;&nbsp;<span class="t-success">✓</span>&nbsp;<span class="t-cmd">${v.name}</span><span class="t-dim">${v.events}</span></div>`
      ]);
    });

    const out = 2440 + VENDORS.length * 270 + 360;
    phases.push([out,       `<div>&nbsp;</div>`]);
    phases.push([out + 50,  `<div><span class="t-blue">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span></div>`]);
    phases.push([out + 220, `<div><span class="t-success">✓ Unified Stream Active</span></div>`]);
    phases.push([out + 400, `<div>&nbsp;&nbsp;<span class="t-dim">throughput  </span><span class="t-val">2.4M events / day</span></div>`]);
    phases.push([out + 540, `<div>&nbsp;&nbsp;<span class="t-dim">p99 latency </span><span class="t-val">12ms</span></div>`]);
    phases.push([out + 680, `<div>&nbsp;&nbsp;<span class="t-dim">fidelity    </span><span class="t-val">99.97%</span></div>`]);
    phases.push([out + 860, `<div>&nbsp;</div>`]);
    phases.push([out + 920, `<div><span class="t-success">[ LIVE ]</span>&nbsp;<span class="t-cursor"></span></div>`]);

    return { phases, loopAt: out + 920 + 4200 };
  }

  let loopTimer = null;
  let phaseTimers = [];

  function clearAll() {
    phaseTimers.forEach(clearTimeout);
    phaseTimers = [];
    clearTimeout(loopTimer);
  }

  function runTerminal() {
    clearAll();
    terminalBody.innerHTML = '';

    const { phases, loopAt } = buildPhases();

    phases.forEach(([delay, html]) => {
      phaseTimers.push(setTimeout(() => {
        // Remove existing cursor before appending
        terminalBody.querySelector('.t-cursor')?.remove();
        terminalBody.insertAdjacentHTML('beforeend', html);
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }, delay));
    });

    loopTimer = setTimeout(runTerminal, loopAt);
  }

  // Start terminal only when visible
  let termStarted = false;
  const termCard = document.getElementById('terminal-card');
  if (termCard) {
    const termObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !termStarted) {
        termStarted = true;
        termObs.disconnect();
        runTerminal();
      }
    }, { threshold: 0.25 });
    termObs.observe(termCard);
  }
}
