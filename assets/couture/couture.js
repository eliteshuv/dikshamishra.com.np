/* ==========================================================================
   DR. DIKSHA MISHRA & DR. AASHIK JHA — SMART COUTURE ENGINE v3
   dikshamishra.com.np · Auto-Gatefold, Chapter-Adaptive Crossfade Audio,
   Smart Auto-Scroll Story Mode & 3D Moving Royal Getaway Convertible
   ========================================================================== */
(() => {
  'use strict';

  // 1. Single-URL normalization: strip legacy ?v=d1/d2/d3 or #full/#day/#friends
  try {
    if (
      location.protocol !== 'file:' &&
      (location.search || /^(#full|#day|#friends|#d1|#d2|#d3)$/i.test(location.hash))
    ) {
      history.replaceState(null, '', location.pathname);
    }
  } catch (_) {}

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Core State ----------
  let lang = 'en';
  try {
    if (localStorage.getItem('diksha-wedding-lang') === 'ne') lang = 'ne';
  } catch (_) {}

  let gateOpened = false;
  const GATE_AUTO_OPEN_MS = 2700; // Auto-opens cleanly at 2.7s (or immediately on tap)
  const gateBootTime = performance.now();

  let musicEnabled = true;          // Smart adaptive music ON by default
  let awaitingGestureUnlock = false; // True if browser deferred autoplay until first touch/scroll
  let audioCtx = null;

  let activeChapterIdx = 0;
  let autoScrollActive = !reducedMotion;
  let chapterDwellElapsed = 0;
  let programmaticScrollUntil = 0;
  const CHAPTER_DWELL_SEC = [9.5, 9.5, 10.0, 10.0, 9.0, 12.0];

  let saptapadiIndex = 0;
  let saptapadiTimer = 0;
  let activeGuideTab = 'attire';
  let dholBoost = 0;
  let mirrorTurbo = 0;

  // 3D Car Scene State (Chapter 6)
  let carSceneTime = 0;
  let carTurboBoost = 0;
  let carScrollDist = 0;
  let ch6EnteredOnce = false;

  const nepaliDigits = (str) =>
    lang === 'ne' ? String(str).replace(/\d/g, (d) => '०१२३४५६७८९'[d]) : String(str);

  // ---------- Toast & Lens Bloom ----------
  let toastTimer = null;
  function showToast(enText, neText) {
    const el = $('#royal-toast');
    if (!el) return;
    el.textContent = lang === 'ne' ? neText : enText;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 2300);
  }

  function triggerLensBloom(strength = 0.5) {
    const bloom = $('#lens-bloom');
    if (!bloom || reducedMotion) return;
    bloom.style.opacity = String(strength);
    setTimeout(() => {
      bloom.style.opacity = '0';
    }, 480);
  }

  // ---------- Populate Sacred Sunburst Rays, Lotus Mandala & 20 Mirror Bulbs ----------
  function populateSvgRaysAndLotus(rayId, lotusId) {
    const rg = document.getElementById(rayId);
    if (rg && !rg.childNodes.length) {
      for (let i = 0; i < 36; i++) {
        const ang = (i * 10 * Math.PI) / 180;
        const rIn = 138;
        const rOut = i % 2 === 0 ? 336 : 282;
        const wAng = 0.032;
        const x1 = 350 + Math.cos(ang - wAng) * rIn;
        const y1 = 350 + Math.sin(ang - wAng) * rIn;
        const x2 = 350 + Math.cos(ang) * rOut;
        const y2 = 350 + Math.sin(ang) * rOut;
        const x3 = 350 + Math.cos(ang + wAng) * rIn;
        const y3 = 350 + Math.sin(ang + wAng) * rIn;
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute(
          'points',
          `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`
        );
        poly.setAttribute('fill', 'url(#goldFoil)');
        poly.setAttribute('opacity', i % 2 === 0 ? '0.46' : '0.26');
        rg.appendChild(poly);
      }
    }
    const lg = lotusId ? document.getElementById(lotusId) : null;
    if (lg && !lg.childNodes.length) {
      for (let i = 0; i < 16; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 350 154 C 378 118, 382 142, 350 192 C 318 142, 322 118, 350 154 Z');
        path.setAttribute('transform', `rotate(${i * 22.5} 350 350)`);
        lg.appendChild(path);
      }
    }
  }

  populateSvgRaysAndLotus('ch1-surya-rays', 'ch1-lotus-petals');
  populateSvgRaysAndLotus('ch4-aura-rays', null);

  const mirrorBulbs = [];
  const bulbsGroup = document.getElementById('mirror-bulbs-group');
  if (bulbsGroup) {
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2 - Math.PI / 2;
      const bx = 160 + Math.cos(ang) * 126;
      const by = 160 + Math.sin(ang) * 126;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', bx.toFixed(1));
      glow.setAttribute('cy', by.toFixed(1));
      glow.setAttribute('r', '11');
      glow.setAttribute('fill', 'rgba(255, 224, 130, 0.45)');
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('cx', bx.toFixed(1));
      core.setAttribute('cy', by.toFixed(1));
      core.setAttribute('r', '4.8');
      core.setAttribute('fill', '#FFFDF2');
      core.setAttribute('stroke', '#D89B2B');
      core.setAttribute('stroke-width', '1.2');
      g.appendChild(glow);
      g.appendChild(core);
      bulbsGroup.appendChild(g);
      mirrorBulbs.push({ glow, idx: i });
    }
  }

  // ==========================================================================
  // SMART SEGMENT-ADAPTIVE 6-SONG CROSSFADE ENGINE
  // ==========================================================================
  const chapterTracks = [
    { id: 'ch1-invocation', el: $('#audio-ch1'), en: 'Ganesh Vandana', ne: 'गणेश वन्दना', vol: 0 },
    { id: 'ch2-couple',     el: $('#audio-ch2'), en: 'Diksha & Aashik', ne: 'प्रेम धुन',    vol: 0 },
    { id: 'ch3-carnival',   el: $('#audio-ch3'), en: 'Sangeet Beats',   ne: 'संगीत र ढोल', vol: 0 },
    { id: 'ch4-vivah',      el: $('#audio-ch4'), en: 'Shubh Vivah',     ne: 'शुभ विवाह',   vol: 0 },
    { id: 'ch5-venue',      el: $('#audio-ch5'), en: 'Mithila Melody',  ne: 'मिथिला धुन',  vol: 0 },
    { id: 'ch6-finale',     el: $('#audio-ch6'), en: 'Forever Finale',  ne: 'अनन्त यात्रा', vol: 0 }
  ];

  const MAX_MUSIC_VOL = 0.80;
  const CROSSFADE_SECONDS = 1.35;

  chapterTracks.forEach((tr) => {
    if (tr.el) tr.el.volume = 0;
  });

  function preloadRemainingTracks() {
    chapterTracks.forEach((tr) => {
      if (tr.el && tr.el.preload !== 'auto') {
        tr.el.preload = 'auto';
      }
    });
  }

  function updateMusicHud() {
    const btn = $('#music-toggle-btn');
    if (!btn) return;
    const isPlayingNow = musicEnabled && !awaitingGestureUnlock;
    btn.classList.toggle('active-music', isPlayingNow);
    btn.setAttribute('aria-pressed', String(musicEnabled));

    const lbl = $('#music-pill-label');
    if (!lbl) return;
    if (!musicEnabled) {
      lbl.textContent = lang === 'ne' ? 'संगीत बन्द' : 'Music Off';
    } else if (awaitingGestureUnlock) {
      lbl.textContent = lang === 'ne' ? 'संगीत खोल्नुहोस्' : 'Tap for Sound';
    } else {
      const cur = chapterTracks[activeChapterIdx] || chapterTracks[0];
      lbl.textContent = lang === 'ne' ? cur.ne : cur.en;
    }
  }

  function tryPlayActiveTrack() {
    if (!musicEnabled) return;
    const cur = chapterTracks[activeChapterIdx];
    if (!cur || !cur.el) return;
    if (cur.el.paused) {
      cur.el.volume = clamp(cur.vol, 0, MAX_MUSIC_VOL);
      const p = cur.el.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          awaitingGestureUnlock = false;
          updateMusicHud();
        }).catch(() => {
          awaitingGestureUnlock = true;
          updateMusicHud();
        });
      }
    }
  }

  // Smooth per-frame crossfade step across all 6 tracks
  function stepAudioCrossfader(dt) {
    const step = dt / CROSSFADE_SECONDS;
    chapterTracks.forEach((tr, idx) => {
      if (!tr.el) return;
      const shouldPlay = gateOpened && musicEnabled && idx === activeChapterIdx;
      if (shouldPlay) {
        if (tr.el.paused && !awaitingGestureUnlock) {
          tryPlayActiveTrack();
        }
        if (!tr.el.paused) {
          tr.vol = Math.min(1, tr.vol + step);
          // Equal-power smooth curve
          const gain = Math.sin(tr.vol * Math.PI * 0.5) * MAX_MUSIC_VOL;
          tr.el.volume = clamp(gain, 0, MAX_MUSIC_VOL);
        }
      } else {
        if (tr.vol > 0) {
          tr.vol = Math.max(0, tr.vol - step);
          const gain = Math.sin(tr.vol * Math.PI * 0.5) * MAX_MUSIC_VOL;
          tr.el.volume = clamp(gain, 0, MAX_MUSIC_VOL);
        }
        if (tr.vol <= 0.004 && !tr.el.paused) {
          tr.el.volume = 0;
          tr.el.pause();
        }
      }
    });
  }

  // Automatic first-gesture audio unlocker (for mobile browsers after 2.7s timer auto-open)
  function handleFirstUserGesture() {
    if (musicEnabled && gateOpened) {
      ensureAudioCtx();
      const cur = chapterTracks[activeChapterIdx];
      if (cur && cur.el && cur.el.paused) {
        awaitingGestureUnlock = false;
        tryPlayActiveTrack();
      }
    }
  }
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, handleFirstUserGesture, { passive: true, capture: true });
  });

  // ---------- Web Audio Procedural Instruments ----------
  function ensureAudioCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTempleBell(pitchMult = 1.0, gainLevel = 0.13) {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const freqs = [523.25, 783.99, 1046.5, 1567.98, 2093.0].map((f) => f * pitchMult);
      const now = ctx.currentTime;
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        const amp = gainLevel / (idx * 0.9 + 1);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.014);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2 - idx * 0.25);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.3);
      });
    } catch (_) {}
  }

  function playDholBeat() {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(148, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.24);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      const rim = ctx.createOscillator();
      const rg = ctx.createGain();
      rim.type = 'triangle';
      rim.frequency.setValueAtTime(420, now + 0.02);
      rim.frequency.exponentialRampToValueAtTime(210, now + 0.11);
      rg.gain.setValueAtTime(0.12, now + 0.02);
      rg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      rim.connect(rg);
      rg.connect(ctx.destination);
      rim.start(now + 0.02);
      rim.stop(now + 0.13);
    } catch (_) {}
  }

  function playTutariFanfare() {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      [
        { f: 392.0, t: 0.0, d: 0.22 },
        { f: 523.25, t: 0.18, d: 0.24 },
        { f: 659.25, t: 0.36, d: 0.56 }
      ].forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const flt = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + t);
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(1650, now + t);
        g.gain.setValueAtTime(0.001, now + t);
        g.gain.linearRampToValueAtTime(0.08, now + t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
        osc.connect(flt);
        flt.connect(g);
        g.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.04);
      });
    } catch (_) {}
  }

  function playVintageHorn() {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      [0, 0.18].forEach((offset) => {
        [440, 554.37].forEach((freq) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + offset);
          g.gain.setValueAtTime(0.001, now + offset);
          g.gain.linearRampToValueAtTime(0.09, now + offset + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.16);
        });
      });
    } catch (_) {}
  }

  // ---------- Ambient Multi-Plane Particle & Petal Engine ----------
  const ambCanvas = document.getElementById('ambient-vfx-canvas');
  const ambCtx = ambCanvas ? ambCanvas.getContext('2d') : null;
  const bokehCanvas = document.getElementById('fg-bokeh-canvas');
  const bokehCtx = bokehCanvas ? bokehCanvas.getContext('2d') : null;

  let vw = window.innerWidth;
  let vh = window.innerHeight;

  function resizeGlobalCanvases() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    [
      [ambCanvas, ambCtx],
      [bokehCanvas, bokehCtx]
    ].forEach(([cv, ctx]) => {
      if (!cv || !ctx) return;
      cv.width = Math.floor(vw * dpr);
      cv.height = Math.floor(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }
  window.addEventListener('resize', resizeGlobalCanvases);
  resizeGlobalCanvases();

  const moteCount = vw < 700 ? 24 : 44;
  const ambientMotes = Array.from({ length: moteCount }, (_, i) => ({
    x: Math.random() * vw,
    y: Math.random() * vh,
    vy: 12 + (i % 6) * 4,
    amp: 14 + (i % 5) * 5,
    freq: 0.8 + (i % 4) * 0.25,
    r: 1.4 + (i % 4) * 0.7,
    ph: i * 0.9
  }));

  const petalCount = vw < 700 ? 14 : 26;
  const driftingPetals = Array.from({ length: petalCount }, (_, i) => ({
    x: Math.random() * vw,
    y: Math.random() * vh,
    vy: 28 + (i % 5) * 9,
    amp: 22 + (i % 4) * 8,
    freq: 0.65 + (i % 4) * 0.2,
    rotSpd: 0.8 + (i % 4) * 0.35,
    w: 8 + (i % 4) * 2.5,
    h: 5 + (i % 3) * 1.8,
    col: ['rgba(236, 134, 158, 0.55)', 'rgba(186, 48, 76, 0.45)', 'rgba(244, 184, 68, 0.52)'][i % 3],
    ph: i * 1.37
  }));

  const fgBokeh = Array.from({ length: vw < 700 ? 5 : 9 }, (_, i) => ({
    x: Math.random() * vw,
    y: Math.random() * vh,
    vy: 50 + (i % 4) * 15,
    vx: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 6),
    w: 24 + (i % 3) * 10,
    h: 15 + (i % 3) * 6,
    col: i % 2 === 0 ? 'rgba(236, 118, 148, 0.16)' : 'rgba(250, 195, 112, 0.16)',
    ph: i * 2.1
  }));

  const burstParticles = [];
  const paletteMap = {
    royal: ['#E5BA63', '#E86F8C', '#C81E3C', '#FFB703', '#FFF0B8'],
    haldi: ['#FFB703', '#FB8500', '#FFE066', '#52C49A', '#E84A8A'],
    blessing: ['#FF9E1B', '#FFE28A', '#F48FB1', '#E5BA63', '#D93870']
  };

  function spawnPetalBurst(x, y, count = 34, theme = 'royal') {
    if (reducedMotion) return;
    const cols = paletteMap[theme] || paletteMap.royal;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.6 + Math.random() * 5.6;
      burstParticles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.8,
        r: 4 + Math.random() * 5.2,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.16,
        col: cols[i % cols.length],
        star: i % 4 === 0,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.01
      });
    }
  }

  let lastTrailTs = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!gateOpened) {
        const gate = $('#royal-gatefold');
        if (gate) {
          const pct = ((e.clientX / Math.max(1, vw)) * 120 - 60).toFixed(1);
          gate.style.setProperty('--sheen-x', `${pct}%`);
        }
      }
      const now = performance.now();
      if (now - lastTrailTs > 60 && !reducedMotion) {
        lastTrailTs = now;
        burstParticles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.0,
          vy: -0.6 - Math.random() * 0.9,
          r: 2.4 + Math.random() * 2.2,
          rot: Math.random() * 6.28,
          vrot: 0.08,
          col: Math.random() > 0.45 ? '#F5C869' : '#F28CA6',
          star: true,
          life: 0.82,
          decay: 0.03
        });
      }
    },
    { passive: true }
  );

  // ---------- Chapter 3 Volumetric Gulal Smoke & 2D Puppet Dancers ----------
  const gulalCanvas = document.getElementById('gulal-carnival-canvas');
  const gulalCtx = gulalCanvas ? gulalCanvas.getContext('2d') : null;
  const gulalPuffs = [];
  const gulalRGB = [
    [255, 186, 24],
    [232, 68, 134],
    [64, 192, 146],
    [255, 126, 95]
  ];

  function fireGulalCannon(colorIdx = -1) {
    if (!gulalCanvas || reducedMotion) return;
    const cw = gulalCanvas.width || 1080;
    const ch = gulalCanvas.height || 900;
    const indices = colorIdx >= 0 ? [colorIdx] : [0, 1, 2, 3];
    indices.forEach((cIdx, k) => {
      const originX = cw * (0.16 + ((k * 0.22 + Math.random() * 0.14) % 0.68));
      const originY = ch * 0.88;
      for (let p = 0; p < 6; p++) {
        gulalPuffs.push({
          x: originX + (Math.random() - 0.5) * 60,
          y: originY,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -(2.6 + Math.random() * 3.6),
          rad: 45 + Math.random() * 55,
          maxRad: 140 + Math.random() * 90,
          rgb: gulalRGB[cIdx % gulalRGB.length],
          life: 1.0,
          decay: 0.008 + Math.random() * 0.006
        });
      }
    });
  }

  function resizeGulalCanvas() {
    if (!gulalCanvas) return;
    const rect = gulalCanvas.parentElement.getBoundingClientRect();
    gulalCanvas.width = Math.max(360, Math.floor(rect.width));
    gulalCanvas.height = Math.max(480, Math.floor(rect.height));
  }
  window.addEventListener('resize', resizeGulalCanvas);
  setTimeout(resizeGulalCanvas, 120);

  // ---------- Cutout Images for Chapter 2, Chapter 3 & Chapter 6 3D Getaway Car ----------
  const coupleCutoutImg = new Image();
  coupleCutoutImg.src = 'assets/couture/couple_back_cutout.webp';
  const coupleCv = document.getElementById('couple-breeze-canvas');
  const coupleCtx = coupleCv ? coupleCv.getContext('2d') : null;

  const dancersCutoutImg = new Image();
  dancersCutoutImg.src = 'assets/couture/layer_sangeet_dancers.webp';
  const dancersCv = document.getElementById('sangeet-dancers-canvas');
  const dancersCtx = dancersCv ? dancersCv.getContext('2d') : null;

  const car3DCoupleImg = new Image();
  car3DCoupleImg.src = 'assets/couture/layer_car_3d_couple.webp';
  const standingCoupleImg = new Image();
  standingCoupleImg.src = 'assets/couture/layer_mandap_couple.webp';

  const car3DCv = document.getElementById('getaway-3d-canvas');
  const car3DCtx = car3DCv ? car3DCv.getContext('2d') : null;
  const carWakePetals = [];

  function spawnCarWakePetal(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      carWakePetals.push({
        x: x + (Math.random() - 0.5) * 32,
        y: y + (Math.random() - 0.5) * 20,
        vx: -(1.8 + Math.random() * 2.8),
        vy: 0.6 + Math.random() * 1.8 - Math.random() * 1.4,
        r: 4 + Math.random() * 4.5,
        rot: Math.random() * 6.28,
        col: ['#F06292', '#C2185B', '#FFB703', '#FFE082'][Math.floor(Math.random() * 4)],
        heart: Math.random() > 0.68,
        life: 1.0,
        decay: 0.016 + Math.random() * 0.012
      });
    }
  }

  function updateCarStatusBadge(boardingPhase) {
    const badge = $('#car-3d-status-badge');
    if (!badge) return;
    if (boardingPhase) {
      badge.textContent =
        lang === 'ne'
          ? '✨ वर-वधु शाही कारमा सवार हुँदै…'
          : '✨ Bride & Groom Taking Their Seats…';
    } else {
      badge.textContent =
        lang === 'ne'
          ? '🚗 अनन्त यात्रामा वर-वधु · हर्नका लागि छुनुहोस्!'
          : '🚗 Cruising Into Forever · Tap to Honk & Boost!';
    }
  }

  // Render 60fps 3D Perspective Royal Palace Boulevard & Moving Couple Convertible
  function render3DGetawayScene(dt, t) {
    if (!car3DCtx || !car3DCv) return;
    const W = car3DCv.width;
    const H = car3DCv.height;
    const ctx = car3DCtx;

    carSceneTime += dt;
    carTurboBoost = Math.max(0, carTurboBoost - dt * 0.85);

    // Phase A (0 -> 2.0s): Couple Boarding & Seating; Phase B (2.0s+): 3D Boulevard Drive!
    const boardingDur = 2.0;
    const isBoarding = carSceneTime < boardingDur;
    const driveRamp = clamp((carSceneTime - boardingDur) / 1.1, 0, 1);
    const speed = isBoarding ? 0 : (driveRamp * (1.0 + carTurboBoost * 1.45));
    carScrollDist += speed * dt * 1.15;

    updateCarStatusBadge(isBoarding);

    // 1. Golden Sunset Mithila Sky & Horizon Vanishing Point (aligned with 3D car heading!)
    const vx = W * 0.80;
    const vy = H * 0.24;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#FFE4BC');
    skyGrad.addColorStop(0.35, '#FAD0A8');
    skyGrad.addColorStop(0.65, '#E9BA94');
    skyGrad.addColorStop(1, '#CFA07A');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Glowing Sunset Orb & Volumetric Rays at 3D Vanishing Point
    const sunGlow = ctx.createRadialGradient(vx, vy, 8, vx, vy, W * 0.45);
    sunGlow.addColorStop(0, 'rgba(255, 252, 232, 0.98)');
    sunGlow.addColorStop(0.28, 'rgba(255, 214, 132, 0.65)');
    sunGlow.addColorStop(0.68, 'rgba(244, 162, 118, 0.22)');
    sunGlow.addColorStop(1, 'rgba(244, 162, 118, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(vx, vy);
    for (let r = 0; r < 12; r++) {
      const ang = (r / 12) * Math.PI * 2 + t * 0.08;
      ctx.fillStyle = 'rgba(255, 245, 205, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang - 0.06) * W, Math.sin(ang - 0.06) * W);
      ctx.lineTo(Math.cos(ang + 0.06) * W, Math.sin(ang + 0.06) * W);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Distant Janakpur Palace Silhouette on Horizon
    ctx.fillStyle = 'rgba(138, 62, 58, 0.18)';
    ctx.beginPath();
    ctx.moveTo(0, vy + 24);
    for (let px = 0; px <= W; px += 38) {
      const domeH = 12 + (px % 76 === 0 ? 22 : 8);
      ctx.quadraticCurveTo(px + 19, vy + 24 - domeH, px + 38, vy + 24);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 2. True 3D Perspective Royal Marble Boulevard Polygon (from bottom-left to vanishing point vx, vy)
    const roadLeftNearX = -W * 0.14;
    const roadLeftNearY = H * 0.98;
    const roadRightNearX = W * 0.68;
    const roadRightNearY = H * 1.14;

    const roadGrad = ctx.createLinearGradient(vx, vy, W * 0.25, H);
    roadGrad.addColorStop(0, '#E8C5A0');
    roadGrad.addColorStop(0.45, '#C89B78');
    roadGrad.addColorStop(1, '#9E6E52');
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(vx - 16, vy);
    ctx.lineTo(vx + 22, vy + 4);
    ctx.lineTo(roadRightNearX, roadRightNearY);
    ctx.lineTo(roadLeftNearX, roadLeftNearY);
    ctx.closePath();
    ctx.fill();

    // Golden-ivory marble curbs
    ctx.strokeStyle = 'rgba(255, 236, 182, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vx - 15, vy);
    ctx.lineTo(roadLeftNearX, roadLeftNearY);
    ctx.moveTo(vx + 20, vy + 4);
    ctx.lineTo(roadRightNearX, roadRightNearY);
    ctx.stroke();

    // 3. Perspective-Projected Moving Center Dashes, Sandstone Palace Arches & Glowing Roadside Diyas
    const numSlices = 14;
    for (let i = 0; i < numSlices; i++) {
      // u goes 0 (horizon) -> 1 (foreground camera), advancing smoothly with carScrollDist!
      const lin = ((i / numSlices) + (carScrollDist % 1) / numSlices + (carScrollDist * 0.35)) % 1;
      const p = Math.pow(lin, 2.15); // 3D perspective foreshortening!
      const pNext = Math.pow(Math.min(1, lin + 0.038), 2.15);

      const lx = lerp(vx - 15, roadLeftNearX, p);
      const ly = lerp(vy, roadLeftNearY, p);
      const rx = lerp(vx + 20, roadRightNearX, p);
      const ry = lerp(vy + 4, roadRightNearY, p);

      const cx1 = (lx + rx) * 0.5;
      const cy1 = (ly + ry) * 0.5;
      const cx2 = (lerp(vx - 15, roadLeftNearX, pNext) + lerp(vx + 20, roadRightNearX, pNext)) * 0.5;
      const cy2 = (lerp(vy, roadLeftNearY, pNext) + lerp(vy + 4, roadRightNearY, pNext)) * 0.5;

      // Center gold boulevard dash
      ctx.strokeStyle = `rgba(255, 240, 190, ${(0.2 + p * 0.72).toFixed(3)})`;
      ctx.lineWidth = Math.max(1, p * 5.5);
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
      ctx.stroke();

      // Roadside Sandstone Pillars & Glowing Diyas on Left & Right Shoulders
      const pillarH = 18 + p * 165;
      const pillarW = 3 + p * 18;
      const alpha = clamp(p * 1.4, 0.12, 0.92);

      // Left colonnade pillar + marigold lamp
      ctx.fillStyle = `rgba(176, 108, 76, ${(alpha * 0.65).toFixed(3)})`;
      ctx.fillRect(lx - pillarW * 1.4, ly - pillarH, pillarW, pillarH);
      ctx.fillStyle = `rgba(255, 192, 64, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(lx - pillarW * 0.9, ly - 3 * p, 1.5 + p * 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Right colonnade diya
      ctx.fillStyle = `rgba(255, 192, 64, ${(alpha * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(rx + 6 * p, ry - 3 * p, 1.5 + p * 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Car Position, 3D Perspective Scale, Suspension Bounce & Road Banking
    // Subtle 3D forward-right cruise motion + S-curve sway
    const laneSwayX = speed > 0 ? Math.sin(t * 1.45) * 10 : 0;
    const laneSwayY = speed > 0 ? Math.cos(t * 1.45) * 4 : 0;
    const seatDip =
      carSceneTime > 1.05 && carSceneTime < 1.85
        ? Math.sin(((carSceneTime - 1.05) / 0.8) * Math.PI) * 9.5
        : 0;
    const engineBounce = speed > 0 ? Math.sin(t * (15 + carTurboBoost * 10)) * (1.8 + carTurboBoost * 1.6) : 0;

    const carW = W * 0.64;
    const carH = carW * (633 / 960);
    const carX = W * 0.15 + laneSwayX + driveRamp * 12;
    const carY = H * 0.20 + laneSwayY + seatDip + engineBounce - driveRamp * 4;

    // 5. Warm Volumetric 3D Headlight Cone (switches ON as couple finishes boarding at t=1.25s!)
    const lightOn = clamp((carSceneTime - 1.2) / 0.5, 0, 1);
    if (lightOn > 0.02) {
      const hlX = carX + carW * 0.90;
      const hlY = carY + carH * 0.30;
      const beamGrad = ctx.createRadialGradient(hlX, hlY, 4, hlX + 95, hlY - 36, 185);
      beamGrad.addColorStop(0, `rgba(255, 248, 198, ${(0.72 * lightOn).toFixed(3)})`);
      beamGrad.addColorStop(0.5, `rgba(255, 224, 130, ${(0.28 * lightOn).toFixed(3)})`);
      beamGrad.addColorStop(1, 'rgba(255, 224, 130, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(hlX, hlY);
      ctx.lineTo(W, vy - 20);
      ctx.lineTo(W, H * 0.68);
      ctx.closePath();
      ctx.fill();
    }

    // 6. Soft 3D Ground Contact Shadow Under Tires
    ctx.save();
    ctx.translate(carX + carW * 0.52, carY + carH * 0.80);
    ctx.rotate(-0.34);
    const shGrad = ctx.createRadialGradient(0, 0, 18, 0, 0, carW * 0.52);
    shGrad.addColorStop(0, 'rgba(54, 18, 22, 0.44)');
    shGrad.addColorStop(0.65, 'rgba(54, 18, 22, 0.18)');
    shGrad.addColorStop(1, 'rgba(54, 18, 22, 0)');
    ctx.fillStyle = shGrad;
    ctx.scale(1, 0.32);
    ctx.beginPath();
    ctx.arc(0, 0, carW * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Boarding Phase (0 -> 1.45s): Standing Bride & Groom Glide Up & Step Into Cabin!
    if (carSceneTime < 1.55 && standingCoupleImg.complete && standingCoupleImg.naturalWidth > 0) {
      const bp = clamp(carSceneTime / 1.35, 0, 1);
      const easeBp = 1 - Math.pow(1 - bp, 3);
      const stAlpha = clamp(1 - (carSceneTime - 0.95) / 0.5, 0, 1);
      const figH = H * lerp(0.56, 0.40, easeBp);
      const figW = figH * (standingCoupleImg.naturalWidth / standingCoupleImg.naturalHeight);
      const figX = lerp(W * 0.05, carX + carW * 0.34, easeBp);
      const figY = lerp(H * 0.26, carY + carH * 0.04, easeBp);

      ctx.save();
      ctx.globalAlpha = stAlpha;
      ctx.drawImage(standingCoupleImg, figX, figY, figW, figH);
      ctx.restore();

      if (Math.random() < 0.65) {
        spawnCarWakePetal(figX + figW * 0.6, figY + figH * 0.4, 1);
      }
    }

    // 8. Draw the 3D Royal Convertible with Seated Bride & Groom!
    if (car3DCoupleImg.complete && car3DCoupleImg.naturalWidth > 0) {
      ctx.save();
      const bankRot = speed > 0 ? Math.cos(t * 1.45) * 0.014 : 0;
      ctx.translate(carX + carW * 0.5, carY + carH * 0.5);
      ctx.rotate(bankRot);

      if (carSceneTime < 1.25) {
        // Before 1.25s, softly veil the upper cabin while the boarding couple glides into their seats,
        // then reveal them seated inside with a golden sparkle burst!
        const seatReveal = clamp((carSceneTime - 0.85) / 0.45, 0, 1);
        // Draw lower chassis at 100% opacity
        ctx.save();
        ctx.beginPath();
        ctx.rect(-carW * 0.5, -carH * 0.5 + carH * 0.34, carW, carH * 0.66);
        ctx.clip();
        ctx.drawImage(car3DCoupleImg, -carW * 0.5, -carH * 0.5, carW, carH);
        ctx.restore();

        // Cross-reveal upper cabin with Bride & Groom settling down (+10px -> 0px)
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.75 * seatReveal;
        ctx.beginPath();
        ctx.rect(-carW * 0.5, -carH * 0.5 - 20, carW, carH * 0.35 + 20);
        ctx.clip();
        const settleOffsetY = (1 - seatReveal) * -12;
        ctx.drawImage(car3DCoupleImg, -carW * 0.5, -carH * 0.5 + settleOffsetY, carW, carH);
        ctx.restore();
      } else {
        ctx.drawImage(car3DCoupleImg, -carW * 0.5, -carH * 0.5, carW, carH);
      }

      // Spinning 3D Golden Wheel Spoke Shimmer Over Rear-Right & Front-Right Wheels!
      if (speed > 0.05) {
        const wheelSpin = t * (12 + carTurboBoost * 14);
        const wheels = [
          { wx: carW * 0.085, wy: carH * 0.285, rx: carW * 0.042, ry: carH * 0.11 },
          { wx: carW * 0.425, wy: carH * 0.015, rx: carW * 0.032, ry: carH * 0.088 }
        ];
        wheels.forEach(({ wx, wy, rx, ry }) => {
          ctx.save();
          ctx.translate(wx, wy);
          ctx.rotate(0.14);
          ctx.strokeStyle = 'rgba(255, 240, 180, 0.62)';
          ctx.lineWidth = 1.6;
          for (let s = 0; s < 4; s++) {
            const a = wheelSpin + (s * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
            ctx.stroke();
          }
          ctx.restore();
        });
      }

      // Ruby Taillight Glow Pulses
      const tailAlpha = isBoarding ? 0.65 : 0.38 + 0.2 * Math.sin(t * 5);
      [
        [-carW * 0.435, carH * 0.14],
        [-carW * 0.045, carH * 0.27]
      ].forEach(([tx, ty]) => {
        const tg = ctx.createRadialGradient(tx, ty, 2, tx, ty, 18);
        tg.addColorStop(0, `rgba(255, 70, 70, ${tailAlpha.toFixed(3)})`);
        tg.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.arc(tx, ty, 18, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // 9. Trailing 3D Rose Petals, Marigolds & Golden Hearts Behind the Moving Car!
    if (speed > 0.1 && Math.random() < 0.45 + carTurboBoost * 0.45) {
      spawnCarWakePetal(carX + carW * 0.18, carY + carH * 0.58, 1);
    }

    for (let i = carWakePetals.length - 1; i >= 0; i--) {
      const p = carWakePetals[i];
      p.x += p.vx * (1 + carTurboBoost * 0.8);
      p.y += p.vy;
      p.rot += 0.08;
      p.life -= p.decay;
      if (p.life <= 0) {
        carWakePetals.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      if (p.heart) {
        const s = p.r * 0.45;
        ctx.beginPath();
        ctx.moveTo(0, s);
        ctx.bezierCurveTo(-s * 2, -s, -s * 2.4, s * 1.4, 0, s * 2.8);
        ctx.bezierCurveTo(s * 2.4, s * 1.4, s * 2, -s, 0, s);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.25, p.r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 10. Turbo Speed Lines when Boosted!
    if (carTurboBoost > 0.05) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 248, 215, ${(carTurboBoost * 0.45).toFixed(3)})`;
      ctx.lineWidth = 2;
      for (let k = 0; k < 7; k++) {
        const sy = H * (0.18 + k * 0.11);
        const sx = ((W - ((t * 900 + k * 170) % W)) + W) % W;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 55 * carTurboBoost, sy + 20 * carTurboBoost);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ==========================================================================
  // SMART INTERSECTION OBSERVER, ACTIVE CHAPTER & AUTONOMOUS CHAPTER MAGIC
  // ==========================================================================
  const visibleChapters = new Set(['ch1-invocation', 'ch2-couple']);
  const chapters = $$('.couture-chapter');
  const dockButtons = $$('.dock-btn');
  const chapterAutoCelebrated = new Set();

  function setActiveChapter(idx) {
    if (idx === activeChapterIdx || idx < 0 || idx >= chapters.length) return;
    activeChapterIdx = idx;
    chapterDwellElapsed = 0;

    dockButtons.forEach((btn, bIdx) => {
      btn.classList.toggle('active', bIdx === idx);
    });
    updateMusicHud();

    // Trigger autonomous arrival magic so every segment comes alive without needing clicks!
    const id = chapters[idx].id;
    if (!chapterAutoCelebrated.has(id)) {
      chapterAutoCelebrated.add(id);
      if (id === 'ch2-couple') {
        mirrorTurbo = 0.85;
      } else if (id === 'ch3-carnival') {
        resizeGulalCanvas();
        fireGulalCannon(-1);
        dholBoost = 0.85;
      } else if (id === 'ch4-vivah') {
        spawnPetalBurst(vw * 0.65, vh * 0.35, 28, 'royal');
      } else if (id === 'ch6-finale') {
        if (!ch6EnteredOnce) {
          ch6EnteredOnce = true;
          carSceneTime = 0; // Play Couple Boarding -> 3D Drive!
          setTimeout(() => {
            if (visibleChapters.has('ch6-finale')) playVintageHorn();
          }, 1850);
          // Auto-light all 5 Aarti Diyas gracefully
          $$('.aarti-diya-btn').forEach((b, dIdx) => {
            setTimeout(() => {
              b.classList.add('lit');
              updateDiyaCountLabel();
            }, 400 + dIdx * 220);
          });
        }
      }
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          visibleChapters.add(id);
        } else {
          visibleChapters.delete(id);
        }
        if (entry.intersectionRatio >= 0.45) {
          const idx = Number(entry.target.dataset.chapterIndex || 0);
          setActiveChapter(idx);
        }
      });
    },
    { threshold: [0.12, 0.45] }
  );
  chapters.forEach((ch) => io.observe(ch));

  // Scroll Progress Bar + Center-Viewport Chapter Detection Fallback
  window.addEventListener(
    'scroll',
    () => {
      const bar = $('#scroll-progress-bar');
      if (bar) {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pct = clamp((window.scrollY / maxScroll) * 100, 0, 100);
        bar.style.width = `${pct.toFixed(2)}%`;
      }
      const midY = window.innerHeight * 0.48;
      for (let i = 0; i < chapters.length; i++) {
        const r = chapters[i].getBoundingClientRect();
        if (r.top <= midY && r.bottom >= midY) {
          setActiveChapter(i);
          break;
        }
      }
    },
    { passive: true }
  );

  // ==========================================================================
  // SMART AUTO-SCROLL STORY MODE (AUTO-ADVANCES, PAUSES ON MANUAL GESTURE)
  // ==========================================================================
  function updateAutoScrollHud() {
    const btn = $('#autoscroll-toggle-btn');
    const lbl = $('#autoscroll-label');
    const ring = $('#auto-progress-circle');
    if (!btn) return;
    btn.classList.toggle('active-auto', autoScrollActive);
    btn.setAttribute('aria-pressed', String(autoScrollActive));
    if (lbl) {
      lbl.textContent =
        lang === 'ne'
          ? (autoScrollActive ? 'स्वतः खुला' : 'स्वतः')
          : (autoScrollActive ? 'Auto On' : 'Auto');
    }
    if (!autoScrollActive && ring) {
      ring.setAttribute('stroke-dashoffset', '59.7');
    }
  }

  function setAutoScroll(enabled, announce = false) {
    autoScrollActive = Boolean(enabled);
    chapterDwellElapsed = 0;
    updateAutoScrollHud();
    if (announce) {
      showToast(
        autoScrollActive ? 'Smart Auto-Scroll Story resumed' : 'Auto-Scroll paused — explore freely',
        autoScrollActive ? 'स्वतः स्क्रोल सुरु भयो' : 'स्वतः स्क्रोल रोकियो'
      );
    }
  }

  function scrollToChapterSmooth(idx) {
    const target = chapters[idx];
    if (!target) return;
    programmaticScrollUntil = performance.now() + 1450;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Politely pause Auto-Scroll if the user manually wheels, swipes, or types in RSVP!
  ['wheel', 'touchmove'].forEach((evt) => {
    window.addEventListener(
      evt,
      () => {
        if (gateOpened && autoScrollActive && performance.now() > programmaticScrollUntil) {
          setAutoScroll(false, false);
        }
      },
      { passive: true }
    );
  });

  $('#rsvp-studio-form')?.addEventListener('focusin', () => {
    if (autoScrollActive) setAutoScroll(false, false);
  });

  $('#autoscroll-toggle-btn')?.addEventListener('click', () => {
    if (!autoScrollActive && activeChapterIdx >= chapters.length - 1) {
      scrollToChapterSmooth(0);
    }
    setAutoScroll(!autoScrollActive, true);
  });

  // ==========================================================================
  // MASTER 60FPS ANIMATION, AUTO-GATEFOLD, AUDIO & AUTO-SCROLL LOOP
  // ==========================================================================
  const gateRingEl = $('#gate-auto-ring');
  const autoCircleEl = $('#auto-progress-circle');

  let prevTime = performance.now();
  function renderLoop(now) {
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    prevTime = now;
    const t = now / 1000;

    // A) Smart 2.7s Gatefold Auto-Open Countdown Ring
    if (!gateOpened) {
      const elapsedGate = now - gateBootTime;
      const gateProg = clamp(elapsedGate / GATE_AUTO_OPEN_MS, 0, 1);
      if (gateRingEl) {
        gateRingEl.setAttribute('stroke-dashoffset', (823 * (1 - gateProg)).toFixed(1));
      }
      if (elapsedGate >= GATE_AUTO_OPEN_MS) {
        openRoyalGatefold(true);
      }
    }

    // B) Step 6-Deck Chapter Audio Crossfader
    stepAudioCrossfader(dt);

    // C) Step Smart Auto-Scroll Story Timer
    if (gateOpened && autoScrollActive) {
      const dwellTarget = CHAPTER_DWELL_SEC[activeChapterIdx] || 9.5;
      chapterDwellElapsed += dt;
      if (autoCircleEl) {
        const p = clamp(chapterDwellElapsed / dwellTarget, 0, 1);
        autoCircleEl.setAttribute('stroke-dashoffset', (59.7 * (1 - p)).toFixed(2));
      }
      if (chapterDwellElapsed >= dwellTarget) {
        chapterDwellElapsed = 0;
        if (activeChapterIdx < chapters.length - 1) {
          scrollToChapterSmooth(activeChapterIdx + 1);
        } else {
          // Completed full story tour at Chapter 6 RSVP — pause gently so guest can RSVP!
          setAutoScroll(false, false);
        }
      }
    }

    // D) Autonomous Chapter 4 Saptapadi Wish Cycling (every 3.8s while viewing Chapter 4)
    if (visibleChapters.has('ch4-vivah')) {
      saptapadiTimer += dt;
      if (saptapadiTimer >= 3.8) {
        saptapadiTimer = 0;
        saptapadiIndex = (saptapadiIndex + 1) % saptapadiWishes.length;
        renderSaptapadi();
      }
    }

    dholBoost = Math.max(0, dholBoost - dt * 1.2);
    mirrorTurbo = Math.max(0, mirrorTurbo - dt * 1.1);

    // 1. Edison Mirror Crest Marquee Chase (Chapter 2)
    if (mirrorBulbs.length && visibleChapters.has('ch2-couple')) {
      const speed = 6.5 + mirrorTurbo * 14.0;
      for (const b of mirrorBulbs) {
        const chase = 0.5 + 0.5 * Math.sin(t * speed - b.idx * 0.62);
        b.glow.setAttribute('fill', `rgba(255, 220, 118, ${(0.22 + 0.58 * chase).toFixed(3)})`);
        b.glow.setAttribute('r', (8.5 + 5.5 * chase).toFixed(1));
      }
    }

    // 2. 2.5D Breeze-Warped Lakeside Couple Back-Portrait (Chapter 2)
    if (
      coupleCtx &&
      coupleCutoutImg.complete &&
      coupleCutoutImg.naturalWidth > 0 &&
      visibleChapters.has('ch2-couple')
    ) {
      const cw = coupleCv.width;
      const ch = coupleCv.height;
      coupleCtx.clearRect(0, 0, cw, ch);
      const nw = coupleCutoutImg.naturalWidth;
      const nh = coupleCutoutImg.naturalHeight;
      const rows = 64;
      const rh = ch / rows;
      const srh = nh / rows;
      for (let r = 0; r < rows; r++) {
        const u = r / rows;
        const breezeWeight = Math.pow(clamp((u - 0.25) / 0.75, 0, 1), 1.5);
        const dx = Math.sin(t * 3.0 - u * 5.0) * (8.5 * breezeWeight);
        const stretchW = 1.0 + Math.cos(t * 2.5 - u * 3.8) * (0.016 * breezeWeight);
        const baseW = cw * 0.9;
        const drawW = baseW * stretchW;
        const drawX = (cw - baseW) * 0.5 + dx - (drawW - baseW) * 0.35;
        coupleCtx.drawImage(coupleCutoutImg, 0, r * srh, nw, srh + 0.8, drawX, r * rh, drawW, rh + 0.7);
      }
    }

    // 3. Chapter 3 Gulal Smoke Plumes & 72-Strip Puppet-Animated Sangeet Dancers
    if (visibleChapters.has('ch3-carnival')) {
      if (gulalCtx && gulalCanvas) {
        gulalCtx.clearRect(0, 0, gulalCanvas.width, gulalCanvas.height);
        // Periodic gentle autonomous Gulal puff so Chapter 3 stays colourful!
        if (gulalPuffs.length < 4 && Math.random() < 0.03) {
          fireGulalCannon(Math.floor(Math.random() * 4));
        }
        for (let i = gulalPuffs.length - 1; i >= 0; i--) {
          const g = gulalPuffs[i];
          g.x += g.vx + Math.sin(t * 2.0 + i) * 0.4;
          g.y += g.vy;
          g.vy *= 0.985;
          g.rad = Math.min(g.maxRad, g.rad + 1.1);
          g.life -= g.decay;
          if (g.life <= 0) {
            gulalPuffs.splice(i, 1);
            continue;
          }
          const alpha = Math.sin(g.life * Math.PI) * 0.42;
          const [cr, cg, cb] = g.rgb;
          const grd = gulalCtx.createRadialGradient(g.x, g.y, 6, g.x, g.y, g.rad);
          grd.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${alpha.toFixed(3)})`);
          grd.addColorStop(0.55, `rgba(${cr}, ${cg}, ${cb}, ${(alpha * 0.45).toFixed(3)})`);
          grd.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
          gulalCtx.fillStyle = grd;
          gulalCtx.beginPath();
          gulalCtx.arc(g.x, g.y, g.rad, 0, Math.PI * 2);
          gulalCtx.fill();
        }
      }

      if (dancersCtx && dancersCutoutImg.complete && dancersCutoutImg.naturalWidth > 0) {
        const dw = dancersCv.width;
        const dh = dancersCv.height;
        dancersCtx.clearRect(0, 0, dw, dh);
        const nw = dancersCutoutImg.naturalWidth;
        const nh = dancersCutoutImg.naturalHeight;
        const cols = 72;
        const stripW = (dw * 0.96) / cols;
        const srcW = nw / cols;
        const freq = 6.2 + dholBoost * 4.5;
        const ampY = 13.0 + dholBoost * 16.0;

        for (let c = 0; c < cols; c++) {
          const u = c / cols;
          const phase = u * Math.PI * 4.6;
          const bounceY = Math.abs(Math.sin(t * freq + phase)) * -ampY;
          const swayY = Math.cos(t * 3.0 + phase * 0.7) * 4.0;
          const stretchH = 1.0 + Math.sin(t * freq + phase) * (0.02 + dholBoost * 0.015);
          const baseH = dh * 0.88;
          const drawH = baseH * stretchH;
          const drawY = dh * 0.09 + bounceY + swayY + (baseH - drawH);
          dancersCtx.drawImage(
            dancersCutoutImg,
            c * srcW,
            0,
            srcW + 0.9,
            nh,
            dw * 0.02 + c * stripW,
            drawY,
            stripW + 0.7,
            drawH
          );
        }

        const beatP = (t * (1.85 + dholBoost * 1.2)) % 1.0;
        const beatAlpha = (1 - beatP) * (0.35 + dholBoost * 0.35);
        dancersCtx.save();
        dancersCtx.strokeStyle = `rgba(237, 160, 8, ${beatAlpha.toFixed(3)})`;
        dancersCtx.lineWidth = 2.6 * (1 - beatP);
        dancersCtx.beginPath();
        dancersCtx.arc(dw * 0.5, dh * 0.56, 32 + beatP * 150, 0, Math.PI * 2);
        dancersCtx.stroke();
        dancersCtx.restore();
      }
    }

    // 4. Chapter 6 3D Perspective Royal Palace Boulevard & Moving Couple Convertible
    if (visibleChapters.has('ch6-finale') || activeChapterIdx >= 4) {
      render3DGetawayScene(dt, t);
    }

    // 5. Global Ambient Dust Motes, Drifting Petals & Interactive Burst Particles
    if (ambCtx && !reducedMotion) {
      ambCtx.clearRect(0, 0, vw, vh);

      for (const m of ambientMotes) {
        m.y -= m.vy * dt;
        if (m.y < -10) {
          m.y = vh + 10;
          m.x = Math.random() * vw;
        }
        const mx = m.x + Math.sin(t * m.freq + m.ph) * m.amp;
        const alpha = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.6 + m.ph));
        ambCtx.fillStyle = `rgba(232, 182, 78, ${alpha.toFixed(3)})`;
        ambCtx.beginPath();
        ambCtx.arc(mx, m.y, m.r, 0, Math.PI * 2);
        ambCtx.fill();
      }

      for (const p of driftingPetals) {
        p.y += p.vy * dt;
        if (p.y > vh + 20) {
          p.y = -20;
          p.x = Math.random() * vw;
        }
        const px = p.x + Math.cos(t * p.freq + p.ph) * p.amp;
        ambCtx.save();
        ambCtx.translate(px, p.y);
        ambCtx.rotate(t * p.rotSpd + p.ph);
        ambCtx.scale(1, 0.62 + 0.38 * Math.abs(Math.sin(t * 2.0 + p.ph)));
        ambCtx.fillStyle = p.col;
        ambCtx.beginPath();
        ambCtx.ellipse(0, 0, p.w, p.h, 0, 0, Math.PI * 2);
        ambCtx.fill();
        ambCtx.restore();
      }

      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.vy += 0.08;
        bp.rot += bp.vrot;
        bp.life -= bp.decay;
        if (bp.life <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }
        ambCtx.save();
        ambCtx.globalAlpha = clamp(bp.life, 0, 1);
        ambCtx.translate(bp.x, bp.y);
        ambCtx.rotate(bp.rot);
        ambCtx.fillStyle = bp.col;
        if (bp.star) {
          ambCtx.beginPath();
          for (let s = 0; s < 4; s++) {
            const a = (s * Math.PI) / 2;
            ambCtx.lineTo(Math.cos(a) * bp.r * 1.4, Math.sin(a) * bp.r * 1.4);
            const a2 = a + Math.PI / 4;
            ambCtx.lineTo(Math.cos(a2) * bp.r * 0.35, Math.sin(a2) * bp.r * 0.35);
          }
          ambCtx.closePath();
          ambCtx.fill();
        } else {
          ambCtx.beginPath();
          ambCtx.ellipse(0, 0, bp.r * 1.35, bp.r * 0.78, 0, 0, Math.PI * 2);
          ambCtx.fill();
        }
        ambCtx.restore();
      }
    }

    // 6. Foreground Out-of-Focus Bokeh Petals
    if (bokehCtx && !reducedMotion) {
      bokehCtx.clearRect(0, 0, vw, vh);
      for (const f of fgBokeh) {
        f.y += f.vy * dt;
        f.x += f.vx * dt * 0.4;
        if (f.y > vh + 50) {
          f.y = -50;
          f.x = Math.random() * vw;
        }
        if (f.x < -60) f.x = vw + 50;
        if (f.x > vw + 60) f.x = -50;
        bokehCtx.save();
        bokehCtx.translate(f.x, f.y);
        bokehCtx.rotate(t * 0.5 + f.ph);
        bokehCtx.fillStyle = f.col;
        bokehCtx.beginPath();
        bokehCtx.ellipse(0, 0, f.w, f.h, 0, 0, Math.PI * 2);
        bokehCtx.fill();
        bokehCtx.restore();
      }
    }

    requestAnimationFrame(renderLoop);
  }

  // ---------- Gatefold Unlock & Replay Handlers ----------
  function openRoyalGatefold(fromAutoTimer = false) {
    if (gateOpened) return;
    gateOpened = true;
    chapterDwellElapsed = 0;

    const gate = $('#royal-gatefold');
    document.body.classList.remove('gate-locked');
    if (gate) gate.classList.add('unfolded');

    triggerLensBloom(0.7);
    spawnPetalBurst(vw * 0.5, vh * 0.46, 54, 'royal');

    if (!fromAutoTimer) {
      ensureAudioCtx();
      playTempleBell(1.0, 0.14);
    }
    tryPlayActiveTrack();
    setTimeout(preloadRemainingTracks, 600);
    updateMusicHud();
    updateAutoScrollHud();
  }

  $('#seal-unlock-btn')?.addEventListener('click', () => openRoyalGatefold(false));
  $('#gate-enter-music-btn')?.addEventListener('click', () => openRoyalGatefold(false));

  $('#replay-gate-btn')?.addEventListener('click', () => {
    setAutoScroll(true, false);
    scrollToChapterSmooth(0);
    setTimeout(() => {
      gateOpened = false;
      const gate = $('#royal-gatefold');
      if (gate) gate.classList.remove('unfolded');
      document.body.classList.add('gate-locked');
      setTimeout(() => openRoyalGatefold(false), 2500);
    }, 450);
  });

  // ---------- Top HUD & Interactive Elements ----------
  $('#music-toggle-btn')?.addEventListener('click', () => {
    ensureAudioCtx();
    if (awaitingGestureUnlock) {
      musicEnabled = true;
      awaitingGestureUnlock = false;
      tryPlayActiveTrack();
    } else {
      musicEnabled = !musicEnabled;
      if (musicEnabled) tryPlayActiveTrack();
    }
    updateMusicHud();
  });

  $('#hud-bell-btn')?.addEventListener('click', (e) => {
    ensureAudioCtx();
    const r = e.currentTarget.getBoundingClientRect();
    playTempleBell(1.05, 0.15);
    spawnPetalBurst(r.left + r.width / 2, r.bottom + 10, 32, 'blessing');
  });

  dockButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      setAutoScroll(false, false);
      scrollToChapterSmooth(idx);
    });
  });

  // Chapter 1: 5 Harmonic Temple Bells, Ganesha Pushpanjali & Brass Samai
  const bellPitches = [0.88, 1.0, 1.12, 1.25, 1.5];
  $$('.hanging-bell-btn').forEach((bellBtn, idx) => {
    bellBtn.addEventListener('click', () => {
      ensureAudioCtx();
      bellBtn.classList.remove('ring-impulse');
      void bellBtn.offsetWidth;
      bellBtn.classList.add('ring-impulse');
      playTempleBell(bellPitches[idx % bellPitches.length], 0.14);
      const rect = bellBtn.getBoundingClientRect();
      spawnPetalBurst(rect.left + rect.width / 2, rect.bottom, 20, 'blessing');
    });
  });

  function triggerGaneshaBlessing(originEl) {
    ensureAudioCtx();
    const ganBtn = $('#ganesha-blessing-btn');
    if (ganBtn) {
      ganBtn.classList.add('blessed-glow');
      setTimeout(() => ganBtn.classList.remove('blessed-glow'), 1800);
    }
    const rect = (originEl || ganBtn)?.getBoundingClientRect();
    if (rect) {
      spawnPetalBurst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.45, 44, 'blessing');
    }
    playTempleBell(1.2, 0.13);
    showToast(
      '॥ Shri Ganeshaya Namah ॥ Divine blessings upon Dr. Diksha & Dr. Aashik!',
      '॥ श्री गणेशाय नमः ॥ डॉ. दीक्षा र डॉ. आशिकलाई मङ्गलमय शुभाशीर्वाद!'
    );
  }
  $('#ganesha-blessing-btn')?.addEventListener('click', (e) => triggerGaneshaBlessing(e.currentTarget));
  $('#offer-pushpanjali-btn')?.addEventListener('click', (e) => triggerGaneshaBlessing(e.currentTarget));

  $$('.samai-lamp-btn').forEach((lamp) => {
    lamp.addEventListener('click', () => {
      ensureAudioCtx();
      lamp.classList.toggle('boosted');
      const r = lamp.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top + 30, 24, 'blessing');
      playTempleBell(1.35, 0.1);
    });
  });

  // Chapter 2: Couture Edison Mirror Crest
  $('#couture-mirror-crest')?.addEventListener('click', (e) => {
    ensureAudioCtx();
    mirrorTurbo = 1.0;
    const r = e.currentTarget.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top + r.height / 2, 34, 'royal');
    playTempleBell(1.4, 0.1);
  });

  // Chapter 3: Tutari Fanfare, Gulal Colour Swatches & Dhol Beat Boost
  $$('.tutari-horn-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      ensureAudioCtx();
      playTutariFanfare();
      const r = e.currentTarget.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top + 20, 28, 'haldi');
    });
  });

  $$('.gulal-swatch-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const colIdx = Number(btn.dataset.col ?? -1);
      resizeGulalCanvas();
      fireGulalCannon(colIdx);
      const r = e.currentTarget.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top, 30, 'haldi');
    });
  });

  $('#throw-all-gulal-btn')?.addEventListener('click', (e) => {
    ensureAudioCtx();
    resizeGulalCanvas();
    fireGulalCannon(-1);
    const r = e.currentTarget.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top, 42, 'haldi');
    playDholBeat();
  });

  function triggerDholCelebration(el) {
    ensureAudioCtx();
    dholBoost = 1.0;
    playDholBeat();
    setTimeout(playDholBeat, 200);
    resizeGulalCanvas();
    fireGulalCannon(Math.floor(Math.random() * 4));
    if (el) {
      const r = el.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top + r.height * 0.4, 30, 'haldi');
    }
  }
  $('#beat-dhol-btn')?.addEventListener('click', (e) => triggerDholCelebration(e.currentTarget));
  dancersCv?.addEventListener('click', (e) => triggerDholCelebration(e.currentTarget));

  // Chapter 4: 7 Saptapadi Sacred Wishes
  const saptapadiWishes = [
    [
      '1st Blessing · Lifelong friendship and mutual respect.',
      'पहिलो आशीर्वाद · जीवनभरको मित्रता र आपसी सम्मान।'
    ],
    [
      '2nd Blessing · Strength, courage, and serenity through every season.',
      'दोस्रो आशीर्वाद · हरेक ऋतुमा ऊर्जा, साहस र शान्ति।'
    ],
    [
      '3rd Blessing · Abundant prosperity, healing grace, and generosity.',
      'तेस्रो आशीर्वाद · समृद्धि, सेवा र उदारताले भरिएको यात्रा।'
    ],
    [
      '4th Blessing · Laughter, warmth, and harmony uniting both families.',
      'चौथो आशीर्वाद · दुवै परिवारलाई जोड्ने आत्मीयता र सद्भाव।'
    ],
    [
      '5th Blessing · Shared dreams blossoming with kindness and trust.',
      'पाँचौँ आशीर्वाद · विश्वास र करुणाका साथ साकार हुने सपना।'
    ],
    [
      '6th Blessing · Good health and joyous celebrations through the years.',
      'छैटौँ आशीर्वाद · सुस्वास्थ्य र आनन्दमय दाम्पत्य जीवन।'
    ],
    [
      '7th Blessing · Two hearts walking as eternal companions forevermore.',
      'सातौँ आशीर्वाद · आजदेखि सधैँभरि अमर जीवनसाथी।'
    ]
  ];

  function renderSaptapadi() {
    const wrap = $('#saptapadi-petals');
    const quote = $('#saptapadi-quote');
    if (!wrap || !quote) return;
    quote.textContent = saptapadiWishes[saptapadiIndex][lang === 'ne' ? 1 : 0];
    wrap.innerHTML = saptapadiWishes
      .map(
        (_, i) =>
          `<button type="button" class="petal-wish-btn ${i === saptapadiIndex ? 'selected' : ''}" data-wish="${i}" aria-label="Blessing ${i + 1}">${nepaliDigits(i + 1)}</button>`
      )
      .join('');
  }

  $('#saptapadi-petals')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.petal-wish-btn');
    if (!btn) return;
    ensureAudioCtx();
    saptapadiTimer = 0;
    saptapadiIndex = Number(btn.dataset.wish || 0);
    renderSaptapadi();
    playTempleBell(1.0 + saptapadiIndex * 0.08, 0.1);
    const r = btn.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top, 22, 'royal');
  });

  $('#mandap-couple-figure')?.addEventListener('click', (e) => {
    ensureAudioCtx();
    const r = e.currentTarget.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top + r.height * 0.3, 42, 'royal');
    playTempleBell(1.25, 0.11);
  });

  // ---------- Chapter 2 Live Nepal-Time Countdown & Calendar (.ics) ----------
  function updateCountdown() {
    const targetMs = new Date('2026-11-25T17:00:00+05:45').getTime();
    let diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
    const days = Math.floor(diff / 86400);
    diff %= 86400;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;

    const map = { 'cd-days': days, 'cd-hours': hours, 'cd-mins': mins, 'cd-secs': secs };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = nepaliDigits(String(val).padStart(2, '0'));
    });
  }
  setInterval(updateCountdown, 1000);

  function downloadWeddingICS() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dr. Diksha & Dr. Aashik//Royal Wedding//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:haldi-sangeet-20261124@dikshamishra.com.np',
      'DTSTAMP:20261101T000000Z',
      'DTSTART:20261124T121500Z',
      'DTEND:20261124T171500Z',
      'SUMMARY:Haldi, Mehendi & Sangeet Night — Dr. Diksha & Dr. Aashik',
      'LOCATION:Mithila Awadh Dharmashala, Bajrang Chowk-8, Janakpur Dham, Nepal',
      'DESCRIPTION:6:00 PM Onwards (8 Mangsir 2083). Pastel hues, dhol beats & live concert under the stars at Mithila Awadh Dharmashala, Janakpur Dham.',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:shubh-vivah-20261125@dikshamishra.com.np',
      'DTSTAMP:20261101T000000Z',
      'DTSTART:20261125T111500Z',
      'DTEND:20261125T180000Z',
      'SUMMARY:Shubh Vivah (The Wedding) — Dr. Diksha Mishra weds Dr. Aashik Jha',
      'LOCATION:Mithila Awadh Dharmashala, Bajrang Chowk-8, Janakpur Dham, Nepal',
      'DESCRIPTION:Wednesday 25 November 2026 (9 Mangsir 2083). Preeti Bhoj: 5:00 PM | Baraat Swagat: 7:00 PM. Hosted by Dipendra Mishra & Nilam Mishra.',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Dr-Diksha-Weds-Dr-Aashik-Janakpur-2026.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    showToast('Calendar invite (.ics) saved!', 'पात्रो निमन्त्रणा सुरक्षित भयो!');
  }
  $$('.save-ics-trigger').forEach((btn) => btn.addEventListener('click', downloadWeddingICS));

  // ---------- Chapter 5 Concierge Tabs & Copy Venue ----------
  const guideContent = {
    attire: {
      en: '<strong>24 Nov · Haldi, Mehendi &amp; Sangeet:</strong> Vibrant pastels, marigold yellows, mint greens, or festive Indo-westerns.<br><strong>25 Nov · Shubh Vivah:</strong> Royal sarees, lehengas, sherwanis, or festive formal attire.',
      ne: '<strong>२४ नोभेम्बर · हल्दी, मेहन्दी र संगीत:</strong> पेस्टल रंग, पहँेलो, हरियो वा सहज उत्सव पोशाक।<br><strong>२५ नोभेम्बर · शुभ विवाह:</strong> साडी, लेहेंगा, शेरवानी वा परम्परागत शाही पहिरन।'
    },
    travel: {
      en: '<strong>Landmark:</strong> <em>Bajrang Chowk–8</em>, directly opposite Janaki Health Care Hospital, Janakpur Dham (~12 mins from Janakpur Airport &amp; ~10 mins from Janaki Mandir).',
      ne: '<strong>प्रमुख चिन्ह:</strong> <em>बजरंग चोक–८</em>, जानकी हेल्थ केयर अस्पतालको ठीक अगाडि (जनकपुर विमानस्थलबाट करिब १२ मिनेट)।'
    },
    weather: {
      en: '<strong>Pleasant Late-November Weather:</strong> Sunny afternoons (25°C–27°C) and crisp starry evenings (15°C–18°C). A light shawl is lovely for evening rituals.',
      ne: '<strong>सुखद मौसम:</strong> दिउँसो न्यानो घाम (२५°C–२७°C) र साँझपख शीतल हावा (१५°C–१८°C)। रातिको समारोहका लागि पातलो शल उपयुक्त हुनेछ।'
    }
  };

  function renderGuideTab() {
    const panel = $('#guide-tab-content');
    if (!panel) return;
    panel.innerHTML = guideContent[activeGuideTab][lang];
    $$('.guide-tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === activeGuideTab));
  }

  $$('.guide-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeGuideTab = btn.dataset.tab;
      renderGuideTab();
    });
  });

  $('#copy-venue-btn')?.addEventListener('click', async () => {
    const addr =
      'Mithila Awadh Dharmashala (Mithila Abadh Sanskritik Sanrakchan Parishad), Bajrang Chowk-8, Opposite Janaki Health Care Hospital, Janakpur Dham, Nepal';
    try {
      await navigator.clipboard.writeText(addr);
      showToast('Venue address copied!', 'ठेगाना कपी भयो!');
    } catch (_) {
      showToast('Mithila Awadh Dharmashala · Bajrang Chowk–8', 'मिथिला अवध धर्मशाला · बजरंग चोक–८');
    }
  });

  // ---------- Chapter 6: 3D Getaway Car Controls, 5-Diya Thali & WhatsApp RSVP ----------
  function triggerCarHonkAndTurbo(el) {
    ensureAudioCtx();
    carTurboBoost = 1.0;
    if (carSceneTime < 2.0) carSceneTime = 2.05;
    playVintageHorn();
    spawnCarWakePetal(220, 290, 14);
    if (el) {
      const r = el.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width * 0.5, r.top + r.height * 0.45, 36, 'royal');
    }
  }

  $('#getaway-3d-viewport')?.addEventListener('click', (e) => triggerCarHonkAndTurbo(e.currentTarget));
  $('#car-honk-boost-btn')?.addEventListener('click', (e) => triggerCarHonkAndTurbo(e.currentTarget));

  $('#car-replay-boarding-btn')?.addEventListener('click', () => {
    ensureAudioCtx();
    carSceneTime = 0;
    carTurboBoost = 0;
    setTimeout(() => {
      if (visibleChapters.has('ch6-finale')) playVintageHorn();
    }, 1850);
  });

  function updateDiyaCountLabel() {
    const litCount = $$('.aarti-diya-btn.lit').length;
    const status = $('#diya-status-label');
    if (!status) return;
    status.textContent =
      lang === 'ne'
        ? `${nepaliDigits(litCount)} / ५ मङ्गल दीप प्रज्वलित`
        : `${litCount} of 5 Blessing Diyas Lit`;
  }

  $$('.aarti-diya-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      ensureAudioCtx();
      btn.classList.toggle('lit');
      if (btn.classList.contains('lit')) {
        const r = e.currentTarget.getBoundingClientRect();
        spawnPetalBurst(r.left + r.width / 2, r.top, 22, 'blessing');
        playTempleBell(1.3, 0.1);
      }
      updateDiyaCountLabel();
    });
  });

  $$('.blessing-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const msgBox = $('#rsvp-message');
      if (!msgBox) return;
      msgBox.value = lang === 'ne' ? chip.dataset.msgNe : chip.dataset.msgEn;
    });
  });

  $('#rsvp-studio-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const guestName =
      ($('#rsvp-name')?.value || '').trim() || (lang === 'ne' ? 'शुभेच्छुक पाहुना' : 'Warm Guest');
    const attending = $('#rsvp-events')?.value || 'Both Celebrations (24 & 25 Nov 2026)';
    const guestsCount = $('#rsvp-guests')?.value || '2';
    const blessingMsg =
      ($('#rsvp-message')?.value || '').trim() ||
      'Heartfelt congratulations and blessings to Dr. Diksha & Dr. Aashik!';

    const textLines = [
      '🙏 *Namaste Mishra Family!*',
      '✨ *Wedding RSVP — Dr. Diksha & Dr. Aashik*',
      `• *Name:* ${guestName}`,
      `• *Celebration:* ${attending}`,
      `• *Guests:* ${guestsCount}`,
      `• *Blessing:* ${blessingMsg}`,
      '📍 Janakpur Dham · dikshamishra.com.np'
    ];
    const waUrl = `https://wa.me/9779745315294?text=${encodeURIComponent(textLines.join('\n'))}`;
    spawnPetalBurst(vw * 0.5, vh * 0.5, 56, 'royal');
    playTempleBell(1.15, 0.13);

    const confirmEl = $('#rsvp-confirmation-note');
    if (confirmEl) {
      confirmEl.hidden = false;
      confirmEl.textContent =
        lang === 'ne'
          ? `धन्यवाद ${guestName}! व्हाट्सएपमा तपाईंको सन्देश तयार छ।`
          : `Thank you, ${guestName}! Opening WhatsApp with your RSVP & blessing.`;
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  });

  $('#share-invite-btn')?.addEventListener('click', async () => {
    const shareUrl = 'https://dikshamishra.com.np/';
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Dr. Diksha Mishra & Dr. Aashik Jha — Wedding Invitation',
          text: 'Join us on 24–25 November 2026 (8–9 Mangsir 2083) in Janakpur Dham!',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Invitation link copied!', 'निमन्त्रणा लिङ्क कपी भयो!');
      }
    } catch (_) {}
  });

  // ---------- Bilingual Translation System (English <-> नेपाली) ----------
  function applyLanguage() {
    document.documentElement.lang = lang;
    $$('[data-en]').forEach((el) => {
      const val = lang === 'ne' ? el.dataset.ne : el.dataset.en;
      if (val !== undefined) el.innerHTML = val;
    });
    $$('[data-placeholder-en]').forEach((el) => {
      el.placeholder = lang === 'ne' ? el.dataset.placeholderNe : el.dataset.placeholderEn;
    });
    const langBtn = $('#lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = lang === 'en' ? 'नेपाली' : 'English';
      langBtn.setAttribute(
        'aria-label',
        lang === 'en' ? 'Switch language to Nepali' : 'Switch language to English'
      );
    }
    updateMusicHud();
    updateAutoScrollHud();
    updateCountdown();
    renderSaptapadi();
    renderGuideTab();
    updateDiyaCountLabel();
  }

  $('#lang-toggle-btn')?.addEventListener('click', () => {
    lang = lang === 'en' ? 'ne' : 'en';
    try {
      localStorage.setItem('diksha-wedding-lang', lang);
    } catch (_) {}
    applyLanguage();
    showToast('Switched to English', 'नेपाली भाषामा परिवर्तन गरियो');
  });

  // Boot UI & 60fps Loop
  applyLanguage();
  requestAnimationFrame(renderLoop);
})();
