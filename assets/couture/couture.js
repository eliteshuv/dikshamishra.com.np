/* ==========================================================================
   DR. DIKSHA MISHRA & DR. AASHIK JHA — INTERACTIVE COUTURE ENGINE
   dikshamishra.com.np · Animations, Shaders, Audio & Bilingual Guest Studio
   ========================================================================== */
(() => {
  'use strict';

  // 1. Clean single-link normalization: scrap old ?v=d1/d2/d3 or #full/#day/#friends
  try {
    if (location.protocol !== 'file:' && (location.search || /^(#full|#day|#friends|#d1|#d2|#d3)$/i.test(location.hash))) {
      history.replaceState(null, '', location.pathname);
    }
  } catch (_) {}

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- State ----------
  let lang = 'en';
  try {
    if (localStorage.getItem('diksha-wedding-lang') === 'ne') lang = 'ne';
  } catch (_) {}

  let gateOpened = false;
  let musicPlaying = false;
  let audioCtx = null;
  let saptapadiIndex = 0;
  let activeGuideTab = 'attire';
  let dholBoost = 0;
  let mirrorTurbo = 0;

  const nepaliDigits = (str) =>
    lang === 'ne' ? String(str).replace(/\d/g, (d) => '०१२३४५६७८९'[d]) : String(str);

  // ---------- Toast Helper ----------
  let toastTimer = null;
  function showToast(enText, neText) {
    const el = $('#royal-toast');
    if (!el) return;
    el.textContent = lang === 'ne' ? neText : enText;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 2500);
  }

  function triggerLensBloom(strength = 0.55) {
    const bloom = $('#lens-bloom');
    if (!bloom || reducedMotion) return;
    bloom.style.opacity = String(strength);
    setTimeout(() => {
      bloom.style.opacity = '0';
    }, 520);
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
        poly.setAttribute('points', `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`);
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

  // ---------- Master Soundtrack & Web Audio Procedural Instruments ----------
  const bgAudio = document.getElementById('bride-master-audio');
  if (bgAudio) {
    bgAudio.volume = 0.78;
  }

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

  function updateMusicHud() {
    const btn = $('#music-toggle-btn');
    if (!btn) return;
    btn.classList.toggle('active-music', musicPlaying);
    btn.setAttribute('aria-pressed', String(musicPlaying));
    const lbl = $('#music-pill-label');
    if (lbl) {
      lbl.textContent = lang === 'ne'
        ? (musicPlaying ? 'संगीत खुला' : 'संगीत')
        : (musicPlaying ? 'Music On' : 'Play Music');
    }
  }

  async function setMusicPlaying(play) {
    if (!bgAudio) return;
    if (play) {
      try {
        await bgAudio.play();
        musicPlaying = true;
      } catch (_) {
        musicPlaying = false;
      }
    } else {
      bgAudio.pause();
      musicPlaying = false;
    }
    updateMusicHud();
  }

  // Harmonic Brass Temple Bell
  function playTempleBell(pitchMult = 1.0, gainLevel = 0.14) {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return;
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
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.3 - idx * 0.25);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.4);
      });
    } catch (_) {}
  }

  // Festive Dhol Drum Hit
  function playDholBeat() {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Low Dagga bass membrane
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(148, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.24);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.30);

      // High Tilli wooden rim accent
      const rim = ctx.createOscillator();
      const rg = ctx.createGain();
      rim.type = 'triangle';
      rim.frequency.setValueAtTime(420, now + 0.02);
      rim.frequency.exponentialRampToValueAtTime(210, now + 0.11);
      rg.gain.setValueAtTime(0.14, now + 0.02);
      rg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      rim.connect(rg);
      rg.connect(ctx.destination);
      rim.start(now + 0.02);
      rim.stop(now + 0.13);
    } catch (_) {}
  }

  // Royal Tutari Brass Horn Fanfare
  function playTutariFanfare() {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [
        { f: 392.0, t: 0.0, d: 0.22 },
        { f: 523.25, t: 0.18, d: 0.24 },
        { f: 659.25, t: 0.36, d: 0.58 }
      ];
      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const flt = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + t);
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(1650, now + t);
        g.gain.setValueAtTime(0.001, now + t);
        g.gain.linearRampToValueAtTime(0.09, now + t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
        osc.connect(flt);
        flt.connect(g);
        g.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.04);
      });
    } catch (_) {}
  }

  // Classic Vintage Getaway Car Musical Horn ("Beep-Beep!")
  function playVintageHorn() {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.19].forEach((offset) => {
        [440, 554.37].forEach((freq) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + offset);
          g.gain.setValueAtTime(0.001, now + offset);
          g.gain.linearRampToValueAtTime(0.10, now + offset + 0.02);
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

  const moteCount = vw < 700 ? 28 : 50;
  const ambientMotes = Array.from({ length: moteCount }, (_, i) => ({
    x: Math.random() * vw,
    y: Math.random() * vh,
    vy: 12 + (i % 6) * 4,
    amp: 14 + (i % 5) * 5,
    freq: 0.8 + (i % 4) * 0.25,
    r: 1.4 + (i % 4) * 0.7,
    ph: i * 0.9
  }));

  const petalCount = vw < 700 ? 16 : 28;
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

  const fgBokeh = Array.from({ length: vw < 700 ? 6 : 10 }, (_, i) => ({
    x: Math.random() * vw,
    y: Math.random() * vh,
    vy: 52 + (i % 4) * 16,
    vx: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 6),
    w: 24 + (i % 3) * 10,
    h: 15 + (i % 3) * 6,
    col: i % 2 === 0 ? 'rgba(236, 118, 148, 0.18)' : 'rgba(250, 195, 112, 0.18)',
    ph: i * 2.1
  }));

  const burstParticles = [];
  const paletteMap = {
    royal: ['#E5BA63', '#E86F8C', '#C81E3C', '#FFB703', '#FFF0B8'],
    haldi: ['#FFB703', '#FB8500', '#FFE066', '#52C49A', '#E84A8A'],
    blessing: ['#FF9E1B', '#FFE28A', '#F48FB1', '#E5BA63', '#D93870']
  };

  function spawnPetalBurst(x, y, count = 38, theme = 'royal') {
    if (reducedMotion) return;
    const cols = paletteMap[theme] || paletteMap.royal;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.6 + Math.random() * 5.8;
      burstParticles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.8,
        r: 4 + Math.random() * 5.5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.16,
        col: cols[i % cols.length],
        star: i % 4 === 0,
        life: 1.0,
        decay: 0.011 + Math.random() * 0.01
      });
    }
  }

  // Interactive Pointer Stardust Trail
  let lastTrailTs = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      // Gatefold specular sheen tracking before open
      if (!gateOpened) {
        const gate = $('#royal-gatefold');
        if (gate) {
          const pct = ((e.clientX / Math.max(1, vw)) * 120 - 60).toFixed(1);
          gate.style.setProperty('--sheen-x', `${pct}%`);
        }
      }
      const now = performance.now();
      if (now - lastTrailTs > 52 && !reducedMotion) {
        lastTrailTs = now;
        burstParticles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.1,
          vy: -0.6 - Math.random() * 1.0,
          r: 2.6 + Math.random() * 2.4,
          rot: Math.random() * 6.28,
          vrot: 0.08,
          col: Math.random() > 0.45 ? '#F5C869' : '#F28CA6',
          star: true,
          life: 0.85,
          decay: 0.028
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
    [255, 186, 24],  // 0: Haldi Gold
    [232, 68, 134],  // 1: Sangeet Rani Pink
    [64, 192, 146],  // 2: Mehendi Mint
    [255, 126, 95]   // 3: Coral Peach
  ];

  function fireGulalCannon(colorIdx = -1) {
    if (!gulalCanvas || reducedMotion) return;
    const cw = gulalCanvas.width || 1080;
    const ch = gulalCanvas.height || 900;
    const indices = colorIdx >= 0 ? [colorIdx] : [0, 1, 2, 3];
    indices.forEach((cIdx, k) => {
      const originX = cw * (0.18 + ((k * 0.22 + Math.random() * 0.14) % 0.68));
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

  // Load cutout images for 2.5D Couple Breeze & 2D Puppet Sangeet Dancers
  const coupleCutoutImg = new Image();
  coupleCutoutImg.src = 'assets/couture/couple_back_cutout.webp';
  const coupleCv = document.getElementById('couple-breeze-canvas');
  const coupleCtx = coupleCv ? coupleCv.getContext('2d') : null;

  const dancersCutoutImg = new Image();
  dancersCutoutImg.src = 'assets/couture/layer_sangeet_dancers.webp';
  const dancersCv = document.getElementById('sangeet-dancers-canvas');
  const dancersCtx = dancersCv ? dancersCv.getContext('2d') : null;

  // Visibility tracking so per-chapter canvases only compute when near viewport
  const visibleChapters = new Set(['ch1-invocation', 'ch2-couple']);
  const chapters = $$('.couture-chapter');
  const dockButtons = $$('.dock-btn');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          visibleChapters.add(id);
          if (id === 'ch3-carnival' && gulalPuffs.length === 0) {
            resizeGulalCanvas();
            fireGulalCannon(-1);
          }
        } else {
          visibleChapters.delete(id);
        }
        if (entry.intersectionRatio >= 0.38) {
          dockButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.target === id);
          });
        }
      });
    },
    { threshold: [0.12, 0.38] }
  );
  chapters.forEach((ch) => io.observe(ch));

  // Scroll Progress Bar
  window.addEventListener(
    'scroll',
    () => {
      const bar = $('#scroll-progress-bar');
      if (!bar) return;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = clamp((window.scrollY / maxScroll) * 100, 0, 100);
      bar.style.width = `${pct.toFixed(2)}%`;
    },
    { passive: true }
  );

  // ---------- Master 60fps Animation Loop ----------
  let prevTime = performance.now();
  function renderLoop(now) {
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    prevTime = now;
    const t = now / 1000;

    dholBoost = Math.max(0, dholBoost - dt * 1.4);
    mirrorTurbo = Math.max(0, mirrorTurbo - dt * 1.2);

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
    if (coupleCtx && coupleCutoutImg.complete && coupleCutoutImg.naturalWidth > 0 && visibleChapters.has('ch2-couple')) {
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

    // 3. Chapter 3 Gulal Smoke Plumes & 90-Strip Puppet-Animated Sangeet Dancers
    if (visibleChapters.has('ch3-carnival')) {
      if (gulalCtx && gulalCanvas) {
        gulalCtx.clearRect(0, 0, gulalCanvas.width, gulalCanvas.height);
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
        const freq = 6.0 + dholBoost * 4.5;
        const ampY = 12.0 + dholBoost * 16.0;

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

        // Rhythmic golden Dhol acoustic shockwave ring
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

    // 4. Global Ambient Dust Motes, Drifting Petals & Interactive Burst Particles
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

    // 5. Foreground Out-of-Focus Bokeh Petals
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
  requestAnimationFrame(renderLoop);

  // ---------- Gatefold Unlock & Replay Handlers ----------
  function openRoyalGatefold(withMusic = true) {
    if (gateOpened) return;
    gateOpened = true;
    const gate = $('#royal-gatefold');
    document.body.classList.remove('gate-locked');
    if (gate) gate.classList.add('unfolded');

    triggerLensBloom(0.75);
    spawnPetalBurst(vw * 0.5, vh * 0.48, 65, 'royal');
    if (withMusic) {
      playTempleBell(1.0, 0.16);
      setMusicPlaying(true);
    }
  }

  $('#seal-unlock-btn')?.addEventListener('click', () => openRoyalGatefold(true));
  $('#gate-enter-music-btn')?.addEventListener('click', () => openRoyalGatefold(true));
  $('#gate-enter-muted-btn')?.addEventListener('click', () => openRoyalGatefold(false));

  $('#replay-gate-btn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      gateOpened = false;
      const gate = $('#royal-gatefold');
      if (gate) gate.classList.remove('unfolded');
      document.body.classList.add('gate-locked');
    }, 450);
  });

  // ---------- Top HUD & Interactive Bell / Flower / Samai / Mirror / Carnival ----------
  $('#music-toggle-btn')?.addEventListener('click', () => {
    setMusicPlaying(!musicPlaying);
  });

  $('#hud-bell-btn')?.addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    playTempleBell(1.05, 0.16);
    spawnPetalBurst(r.left + r.width / 2, r.bottom + 10, 32, 'blessing');
    showToast(
      'Temple bell rung — May auspiciousness fill every moment!',
      'मन्दिरको घण्टी बज्यो — शुभ र मङ्गलमय होस्!'
    );
  });

  $('#hud-flower-btn')?.addEventListener('click', () => {
    spawnPetalBurst(vw * 0.22, 70, 26, 'royal');
    spawnPetalBurst(vw * 0.5, 60, 32, 'blessing');
    spawnPetalBurst(vw * 0.78, 70, 26, 'royal');
    showToast('Pushpanjali flower shower!', 'पुष्पाञ्जली पुष्प वर्षा!');
  });

  // Chapter Dock Navigation
  dockButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Chapter 1: 5 Interactive Hanging Temple Bells (Harmonic Pentatonic Scale!)
  const bellPitches = [0.88, 1.0, 1.12, 1.25, 1.5];
  $$('.hanging-bell-btn').forEach((bellBtn, idx) => {
    bellBtn.addEventListener('click', () => {
      bellBtn.classList.remove('ring-impulse');
      void bellBtn.offsetWidth;
      bellBtn.classList.add('ring-impulse');
      playTempleBell(bellPitches[idx % bellPitches.length], 0.15);
      const rect = bellBtn.getBoundingClientRect();
      spawnPetalBurst(rect.left + rect.width / 2, rect.bottom, 22, 'blessing');
    });
  });

  // Chapter 1: Ganesha Pushpanjali Blessing
  function triggerGaneshaBlessing(originEl) {
    const ganBtn = $('#ganesha-blessing-btn');
    if (ganBtn) {
      ganBtn.classList.add('blessed-glow');
      setTimeout(() => ganBtn.classList.remove('blessed-glow'), 1800);
    }
    const rect = (originEl || ganBtn)?.getBoundingClientRect();
    if (rect) {
      spawnPetalBurst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.45, 48, 'blessing');
    }
    playTempleBell(1.2, 0.14);
    showToast(
      '॥ Shri Ganeshaya Namah ॥ May Lord Ganesha bless Dr. Diksha & Dr. Aashik with eternal joy and harmony.',
      '॥ श्री गणेशाय नमः ॥ भगवान् गणेशले डॉ. दीक्षा र डॉ. आशिकलाई सदा सुख, शान्ति र समृद्धिको आशीर्वाद दिऊन्।'
    );
  }
  $('#ganesha-blessing-btn')?.addEventListener('click', (e) => triggerGaneshaBlessing(e.currentTarget));
  $('#offer-pushpanjali-btn')?.addEventListener('click', (e) => triggerGaneshaBlessing(e.currentTarget));

  // Chapter 1: Left & Right Brass Samai Lamps
  $$('.samai-lamp-btn').forEach((lamp) => {
    lamp.addEventListener('click', () => {
      lamp.classList.toggle('boosted');
      const r = lamp.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top + 30, 26, 'blessing');
      playTempleBell(1.35, 0.1);
      showToast(
        'Sacred Brass Samai illuminated with warm blessings!',
        'पवित्र पानस दीप प्रज्वलित भयो!'
      );
    });
  });

  // Chapter 2: Couture Edison Mirror Crest
  $('#couture-mirror-crest')?.addEventListener('click', (e) => {
    mirrorTurbo = 1.0;
    const r = e.currentTarget.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top + r.height / 2, 36, 'royal');
    playTempleBell(1.4, 0.1);
  });

  // Chapter 3: Tutari Fanfare, Gulal Colour Swatches & Dhol Beat Boost
  $$('.tutari-horn-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      playTutariFanfare();
      const r = e.currentTarget.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top + 20, 30, 'haldi');
      showToast(
        'Royal Tutari Fanfare! Let the Haldi, Mehendi & Sangeet festivities begin!',
        'शाही तुतारी धुन! हल्दी, मेहन्दी र संगीत उत्सव सुरु होस्!'
      );
    });
  });

  $$('.gulal-swatch-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const colIdx = Number(btn.dataset.col ?? -1);
      resizeGulalCanvas();
      fireGulalCannon(colIdx);
      const r = e.currentTarget.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top, 34, 'haldi');
    });
  });

  $('#throw-all-gulal-btn')?.addEventListener('click', (e) => {
    resizeGulalCanvas();
    fireGulalCannon(-1);
    const r = e.currentTarget.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top, 48, 'haldi');
    playDholBeat();
    showToast(
      'Splash of Haldi, Mehendi & Sangeet colours across the courtyard!',
      'आँगनभरि हल्दी, मेहन्दी र संगीतको रमाइलो रंग!'
    );
  });

  function triggerDholCelebration(el) {
    dholBoost = 1.0;
    playDholBeat();
    setTimeout(playDholBeat, 210);
    resizeGulalCanvas();
    fireGulalCannon(Math.floor(Math.random() * 4));
    if (el) {
      const r = el.getBoundingClientRect();
      spawnPetalBurst(r.left + r.width / 2, r.top + r.height * 0.4, 34, 'haldi');
    }
  }

  $('#beat-dhol-btn')?.addEventListener('click', (e) => triggerDholCelebration(e.currentTarget));
  dancersCv?.addEventListener('click', (e) => triggerDholCelebration(e.currentTarget));

  // Chapter 4: 7 Saptapadi Sacred Wishes
  const saptapadiWishes = [
    [
      '1st Blessing · May lifelong friendship and mutual respect be your first sacred promise.',
      'पहिलो आशीर्वाद · जीवनभरको मित्रता र आपसी सम्मान तपाईंहरूको पहिलो पवित्र वाचा बनोस्।'
    ],
    [
      '2nd Blessing · May strength, courage, and serenity fill your home through every season.',
      'दोस्रो आशीर्वाद · हरेक ऋतुमा तपाईंहरूको घर ऊर्जा, साहस र शान्तिले भरियोस्।'
    ],
    [
      '3rd Blessing · May abundant prosperity, healing grace, and generosity walk beside you.',
      'तेस्रो आशीर्वाद · समृद्धि, सेवा र उदारताले तपाईंहरूको जीवनयात्रा उज्यालो बनोस्।'
    ],
    [
      '4th Blessing · May laughter, warmth, and harmony unite both families forever.',
      'चौथो आशीर्वाद · हाँसो, आत्मीयता र सद्भावले दुवै परिवारलाई सधैँ जोडेर राखोस्।'
    ],
    [
      '5th Blessing · May every shared dream blossom with patience, kindness, and trust.',
      'पाँचौँ आशीर्वाद · धैर्य, करुणा र विश्वासका साथ हरेक साझा सपना साकार होस्।'
    ],
    [
      '6th Blessing · May good health and joyous celebrations grace all your years together.',
      'छैटौँ आशीर्वाद · सुस्वास्थ्य र आनन्दमय पलहरूले तपाईंहरूको दाम्पत्य जीवन सधैँ हराभरा रहोस्।'
    ],
    [
      '7th Blessing · May your two hearts walk as eternal companions — today and forevermore.',
      'सातौँ आशीर्वाद · आजदेखि सधैँभरि तपाईंहरूका दुई मुटु अमर सहयात्री बनेर अघि बढून्।'
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
    saptapadiIndex = Number(btn.dataset.wish || 0);
    renderSaptapadi();
    playTempleBell(1.0 + saptapadiIndex * 0.08, 0.11);
    const r = btn.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top, 26, 'royal');
  });

  $('#mandap-couple-figure')?.addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top + r.height * 0.3, 45, 'royal');
    playTempleBell(1.25, 0.12);
    showToast(
      'Showering rose & lotus petals on Dr. Diksha & Dr. Aashik!',
      'डॉ. दीक्षा र डॉ. आशिकमाथि गुलाब र कमलका फूलहरूको वर्षा!'
    );
  });

  // ---------- Chapter 2 Live Nepal-Time Countdown & Calendar (.ics / Google) ----------
  function updateCountdown() {
    // Countdown to the start of Wedding Celebrations (24 Nov 2026 18:00 NPT) or Wedding Day (25 Nov 2026)
    const targetMs = new Date('2026-11-25T17:00:00+05:45').getTime();
    let diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
    const days = Math.floor(diff / 86400);
    diff %= 86400;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;

    const map = {
      'cd-days': days,
      'cd-hours': hours,
      'cd-mins': mins,
      'cd-secs': secs
    };
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
      'DESCRIPTION:6:00 PM Onwards (8 Mangsir 2083). Pastel hues, dhol beats & live concert under the stars at Mithila Awadh Dharmashala (opposite Janaki Health Care Hospital), Janakpur Dham.',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:shubh-vivah-20261125@dikshamishra.com.np',
      'DTSTAMP:20261101T000000Z',
      'DTSTART:20261125T111500Z',
      'DTEND:20261125T180000Z',
      'SUMMARY:Shubh Vivah (The Wedding) — Dr. Diksha Mishra weds Dr. Aashik Jha',
      'LOCATION:Mithila Awadh Dharmashala, Bajrang Chowk-8, Janakpur Dham, Nepal',
      'DESCRIPTION:Wednesday 25 November 2026 (9 Mangsir 2083). Preeti Bhoj: 5:00 PM | Baraat Swagat: 7:00 PM, followed by auspicious Shubh Vivah rituals. Hosted by Dipendra Mishra & Nilam Mishra.',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Dr-Diksha-Weds-Dr-Aashik-Janakpur-2026.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    showToast(
      'Calendar invite (.ics) for 24 & 25 November downloaded!',
      '२४ र २५ नोभेम्बरको पात्रो निमन्त्रणा डाउनलोड भयो!'
    );
  }

  $$('.save-ics-trigger').forEach((btn) => btn.addEventListener('click', downloadWeddingICS));

  // ---------- Chapter 5: Travel / Dress Code / Weather Concierge Tabs & Copy Address ----------
  const guideContent = {
    attire: {
      en: '<strong>24 Nov · Haldi, Mehendi &amp; Sangeet:</strong> Vibrant pastels, marigold yellows, mint greens, or breezy Indo-westerns ready for dhol dancing.<br><strong>25 Nov · Shubh Vivah:</strong> Royal traditional attire — sarees, lehengas, sherwanis, or festive formal wear.',
      ne: '<strong>२४ नोभेम्बर · हल्दी, मेहन्दी र संगीत:</strong> हल्का पेस्टल रंग, पहँेलो, हरियो वा नाचगानका लागि सहज उत्सव पोशाक।<br><strong>२५ नोभेम्बर · शुभ विवाह:</strong> परम्परागत शाही पहिरन — साडी, लेहेंगा, शेरवानी वा औपचारिक उत्सव पोशाक।'
    },
    travel: {
      en: '<strong>Landmark:</strong> Mithila Awadh Dharmashala is at <em>Bajrang Chowk–8</em>, directly opposite Janaki Health Care Hospital in Janakpur Dham.<br><strong>By Air / Road:</strong> ~12 minutes from Janakpur Airport (JKR) by taxi/e-rickshaw, and ~10 minutes from Janaki Mandir.',
      ne: '<strong>प्रमुख चिन्ह:</strong> मिथिला अवध धर्मशाला <em>बजरंग चोक–८</em> मा जानकी हेल्थ केयर अस्पतालको ठीक अगाडि अवस्थित छ।<br><strong>यात्रा:</strong> जनकपुर विमानस्थलबाट करिब १२ मिनेट र जानकी मन्दिरबाट करिब १० मिनेटको दूरीमा।'
    },
    weather: {
      en: '<strong>Pleasant Terai Autumn:</strong> Late November in Janakpur Dham enjoys sunny, comfortable afternoons (25°C–27°C) and crisp, starry evenings (15°C–18°C). A light pashmina shawl or stole is lovely for late-evening ceremonies.',
      ne: '<strong>सुखद मौसम:</strong> मंसिरको जनकपुरधाममा दिउँसो न्यानो घाम (२५°C–२७°C) र साँझपख शीतल हावा (१५°C–१८°C) चल्छ। रातिको समारोहका लागि पातलो पश्मिना वा शल बोक्नु उपयुक्त हुनेछ।'
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
    const addr = 'Mithila Awadh Dharmashala (Mithila Abadh Sanskritik Sanrakchan Parishad), Bajrang Chowk-8, Opposite Janaki Health Care Hospital, Janakpur Dham, Nepal';
    try {
      await navigator.clipboard.writeText(addr);
      showToast('Venue address copied to clipboard!', 'समारोह स्थलको ठेगाना कपी भयो!');
    } catch (_) {
      showToast('Mithila Awadh Dharmashala · Bajrang Chowk–8, Janakpur Dham', 'मिथिला अवध धर्मशाला · बजरंग चोक–८, जनकपुरधाम');
    }
  });

  // ---------- Chapter 6: Vintage Car Horn, 5-Diya Aarti Thali & WhatsApp RSVP Studio ----------
  $('#getaway-car-btn')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    btn.classList.remove('honk-bounce');
    void btn.offsetWidth;
    btn.classList.add('honk-bounce');
    playVintageHorn();
    const r = btn.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.bottom - 20, 44, 'royal');
    showToast(
      'Beep-Beep! Our Forever Starts Now — See you in Janakpur Dham!',
      'हाम्रो अनन्त यात्रा सुरु हुँदैछ — जनकपुरधाममा भेटौँ है!'
    );
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
      btn.classList.toggle('lit');
      const isLit = btn.classList.contains('lit');
      if (isLit) {
        const r = e.currentTarget.getBoundingClientRect();
        spawnPetalBurst(r.left + r.width / 2, r.top, 24, 'blessing');
        playTempleBell(1.3, 0.1);
      }
      updateDiyaCountLabel();
    });
  });

  $('#light-all-diyas-btn')?.addEventListener('click', (e) => {
    $$('.aarti-diya-btn').forEach((b, idx) => {
      setTimeout(() => b.classList.add('lit'), idx * 90);
    });
    setTimeout(updateDiyaCountLabel, 500);
    const r = e.currentTarget.getBoundingClientRect();
    spawnPetalBurst(r.left + r.width / 2, r.top, 46, 'blessing');
    playTempleBell(1.18, 0.14);
    showToast(
      'All 5 Aarti Diyas lit! Thank you for filling our celebration with light.',
      'पाँचवटै आरती दीप प्रज्वलित भए! तपाईंको न्यानो आशीर्वादका लागि धन्यवाद।'
    );
  });

  // Quick-fill Blessing Chips in RSVP Form
  $$('.blessing-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const msgBox = $('#rsvp-message');
      if (!msgBox) return;
      msgBox.value = lang === 'ne' ? chip.dataset.msgNe : chip.dataset.msgEn;
    });
  });

  // Interactive RSVP Submit -> Personalized WhatsApp + Celebration Burst
  $('#rsvp-studio-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const guestName = ($('#rsvp-name')?.value || '').trim() || (lang === 'ne' ? 'शुभेच्छुक पाहुना' : 'Warm Guest');
    const attending = $('#rsvp-events')?.value || 'Both Celebrations (24 & 25 Nov 2026)';
    const guestsCount = $('#rsvp-guests')?.value || '2';
    const blessingMsg =
      ($('#rsvp-message')?.value || '').trim() ||
      'Heartfelt congratulations and blessings to Dr. Diksha & Dr. Aashik!';

    const textLines = [
      '🙏 *Namaste Mishra Family!*',
      `✨ *Wedding RSVP — Dr. Diksha & Dr. Aashik*`,
      `• *Name:* ${guestName}`,
      `• *Celebration:* ${attending}`,
      `• *Guests:* ${guestsCount}`,
      `• *Blessing:* ${blessingMsg}`,
      `📍 Janakpur Dham · dikshamishra.com.np`
    ];
    const waUrl = `https://wa.me/9779745315294?text=${encodeURIComponent(textLines.join('\n'))}`;
    spawnPetalBurst(vw * 0.5, vh * 0.5, 65, 'royal');
    playTempleBell(1.15, 0.14);

    const confirmEl = $('#rsvp-confirmation-note');
    if (confirmEl) {
      confirmEl.hidden = false;
      confirmEl.textContent =
        lang === 'ne'
          ? `धन्यवाद ${guestName}! तपाईंको सन्देश व्हाट्सएपमा तयार पारिएको छ।`
          : `Thank you, ${guestName}! Opening WhatsApp with your personalized RSVP & blessing.`;
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  });

  // Share Website Link
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
        showToast('Invitation link (dikshamishra.com.np) copied!', 'निमन्त्रणा लिङ्क (dikshamishra.com.np) कपी भयो!');
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        showToast('Share https://dikshamishra.com.np/', 'https://dikshamishra.com.np/ साझा गर्नुहोस्');
      }
    }
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
      langBtn.setAttribute('aria-label', lang === 'en' ? 'Switch language to Nepali' : 'Switch language to English');
    }
    updateMusicHud();
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

  // Initialize UI
  applyLanguage();
})();
