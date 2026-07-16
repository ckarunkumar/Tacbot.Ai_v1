// ─────────────────────────────────────────────────────
// ABOUT PAGE — Animations & Interactivity
// ─────────────────────────────────────────────────────

gsap.registerPlugin(ScrollTrigger);

// ── Hero blob parallax — follows cursor ───────────────
const abHero = document.getElementById('ab-hero');
if (abHero) {
  const blob1 = abHero.querySelector('.ab-blob-1');
  const blob2 = abHero.querySelector('.ab-blob-2');
  abHero.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = abHero.getBoundingClientRect();
    const px = (e.clientX - left) / width - 0.5;
    const py = (e.clientY - top) / height - 0.5;
    gsap.to(blob1, { x: px * 40, y: py * 40, duration: 0.8, ease: 'power2.out' });
    gsap.to(blob2, { x: px * -30, y: py * -30, duration: 0.8, ease: 'power2.out' });
  });
}

// ── Magnetic buttons ───────────────────────────────────
document.querySelectorAll('.ab-magnetic').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.25, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  });
});

// ── Hero entrance ─────────────────────────────────────
gsap.from('.ab-hero-inner > *', {
  opacity: 0,
  y: 24,
  duration: 0.9,
  stagger: 0.12,
  ease: 'power2.out',
  delay: 0.1
});

// ── Who We Are card — reveal (mirrors .praha-card.revealed pattern) ──
const whoCard = document.getElementById('whoCard');
if (whoCard) {
  ScrollTrigger.create({
    trigger: '#who-we-are',
    start: 'top 75%',
    once: true,
    onEnter: () => whoCard.classList.add('revealed')
  });

  gsap.utils.toArray('#who-we-are .ab-who-chip').forEach((chip, i) => {
    gsap.to(chip, {
      scrollTrigger: { trigger: '#who-we-are', start: 'top 70%' },
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      delay: 0.3 + i * 0.07,
      ease: 'power2.out'
    });
  });
}

// ── Why We Started ────────────────────────────────────
gsap.from('#why-we-started .section-eyebrow, #why-we-started .ab-why-title, #why-we-started .ab-why-body, #why-we-started .ab-why-emphasis', {
  scrollTrigger: { trigger: '#why-we-started', start: 'top 78%' },
  opacity: 0,
  y: 24,
  duration: 0.8,
  stagger: 0.12,
  ease: 'power2.out'
});

// Flow diagram — icons stagger in, then arrow draws
gsap.from('#why-we-started .ab-flow-group', {
  scrollTrigger: { trigger: '.ab-flow', start: 'top 82%' },
  opacity: 0,
  y: 16,
  duration: 0.6,
  stagger: 0.25,
  delay: 0.2,
  ease: 'power2.out'
});
gsap.from('.ab-flow-arrow', {
  scrollTrigger: { trigger: '.ab-flow', start: 'top 82%' },
  opacity: 0,
  scale: 0.6,
  duration: 0.5,
  delay: 0.55,
  ease: 'back.out(2)'
});

// ── Mission ────────────────────────────────────────────
gsap.from('#mission .ab-mission-badge, #mission .section-eyebrow, #mission .ab-mission-title', {
  scrollTrigger: { trigger: '#mission', start: 'top 78%' },
  opacity: 0,
  scale: 0.96,
  y: 16,
  duration: 0.9,
  stagger: 0.1,
  ease: 'power2.out'
});

// ── Principles — stagger reveal ───────────────────────
gsap.from('#principles .section-eyebrow, #principles .ab-principles-title', {
  scrollTrigger: { trigger: '#principles', start: 'top 82%' },
  opacity: 0,
  y: 20,
  duration: 0.7,
  stagger: 0.1,
  ease: 'power2.out'
});

gsap.utils.toArray('.ab-principle-card').forEach((card, i) => {
  gsap.to(card, {
    scrollTrigger: { trigger: card, start: 'top 88%' },
    opacity: 1,
    y: 0,
    duration: 0.6,
    delay: i * 0.1,
    ease: 'power2.out'
  });
});

// ── Closing ────────────────────────────────────────────
gsap.from('.ab-closing-body, .ab-closing-actions', {
  scrollTrigger: { trigger: '.ab-closing', start: 'top 80%' },
  opacity: 0,
  y: 24,
  duration: 0.8,
  stagger: 0.15,
  ease: 'power2.out'
});
