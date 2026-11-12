// Realistic end-to-end check: REAL browser autoplay policy (no flags), touch phone emulation,
// portrait + landscape + desktop. Run: node verify-couture.cjs
const { chromium } = require('C:/Users/elite/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const fp = path.join(ROOT, rel);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
      const size = fs.statSync(fp).size;
      const range = req.headers.range;
      const type = MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream';
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? parseInt(m[2], 10) : size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        fs.createReadStream(fp, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
        fs.createReadStream(fp).pipe(res);
      }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

const ok = (m) => console.log('PASS:', m);
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };

(async () => {
  const { srv, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];

  async function phone(w, h) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
    return { ctx, page };
  }
  const state = (page) => page.evaluate(() => ({
    opened: document.getElementById('royal-gatefold').classList.contains('unfolded'),
    locked: document.body.classList.contains('gate-locked'),
    y: Math.round(window.scrollY),
    label: document.getElementById('music-pill-label')?.textContent,
    needsTap: document.getElementById('music-toggle-btn').classList.contains('needs-tap'),
    playing: [1, 2, 3, 4, 5, 6].map((i) => !document.getElementById('audio-ch' + i).paused),
    autoOn: document.getElementById('autoscroll-toggle-btn').classList.contains('active-auto'),
    ov: document.documentElement.scrollWidth - window.innerWidth
  }));

  // ===== PHONE PORTRAIT (390x844): touch, REAL autoplay policy =====
  let { ctx, page } = await phone(390, 844);
  await page.goto(`${base}/?v=d1#friends`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  assert(!/\?v=|#friends/.test(page.url()), 'legacy URL not stripped');
  const txt = await page.evaluate(() => document.body.innerText);
  for (const f of ['Matkor', 'Kathmandu', 'Bidai', 'मटकोर', 'काठमाडौँ', 'बिदाइ']) assert(!txt.includes(f), 'forbidden term ' + f);
  ok('single clean URL, no Matkor/Kathmandu/Bidai');
  await page.screenshot({ path: path.join(ROOT, 'preview-portrait-gate.png') });

  await page.waitForTimeout(3300); // never touch: it must open by itself
  let s = await state(page);
  assert(s.opened && !s.locked, 'gate did not auto-open: ' + JSON.stringify(s));
  ok('gate auto-opened hands-free (~2.7s)');

  await page.waitForTimeout(3500);
  s = await state(page);
  assert(s.y > 40, 'auto-scroll not moving, y=' + s.y);
  assert(s.autoOn, 'auto badge off');
  ok('auto-scroll cruising (scrollY=' + s.y + ')');

  if (!s.playing[0]) {
    assert(s.needsTap, 'no sound and no "Tap for Sound" hint: ' + JSON.stringify(s));
    ok('autoplay blocked by browser -> pulsing "Tap for Sound" shown');
    await page.touchscreen.tap(200, 500);
    await page.waitForTimeout(1200);
    s = await state(page);
  }
  assert(s.playing[0], 'Ganesh song not playing after tap: ' + JSON.stringify(s));
  ok('Segment 1 Ganesh song playing: "' + s.label + '"');

  for (const [id, idx] of [['ch3-carnival', 2], ['ch4-vivah', 3], ['ch6-finale', 5]]) {
    await page.evaluate((i) => window.scrollTo({ top: document.getElementById(i).offsetTop + 10, behavior: 'instant' }), id);
    await page.waitForTimeout(1900);
    s = await state(page);
    assert(s.playing[idx], `song for ${id} not playing: ` + JSON.stringify(s));
    assert(s.playing.filter(Boolean).length === 1, `more than one song at once at ${id}: ` + JSON.stringify(s.playing));
    ok(`${id} -> "${s.label}" plays alone (crossfaded)`);
    if (id === 'ch6-finale') await page.screenshot({ path: path.join(ROOT, 'preview-portrait-ch6.png') });
  }
  assert(s.ov <= 2, 'horizontal overflow ' + s.ov);
  ok('portrait: no horizontal overflow');
  await ctx.close();

  // ===== PHONE LANDSCAPE (844x390) =====
  ({ ctx, page } = await phone(844, 390));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(ROOT, 'preview-landscape-gate.png') });
  const box = await page.evaluate(() => {
    const r = document.getElementById('gate-center-hub').getBoundingClientRect();
    const b = document.getElementById('gate-enter-music-btn').getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, vh: innerHeight, btnBottom: b.bottom };
  });
  assert(box.top >= 0 && box.bottom <= box.vh + 1 && box.btnBottom <= box.vh, 'landscape gate clipped: ' + JSON.stringify(box));
  ok('landscape: gate fits the screen, Open button reachable');
  await page.waitForTimeout(3000);
  s = await state(page);
  assert(s.opened, 'landscape gate did not auto-open');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ROOT, 'preview-landscape-ch1.png') });
  assert(s.ov <= 2, 'landscape overflow ' + s.ov);
  ok('landscape: auto-opened, no overflow');
  await ctx.close();

  // ===== DESKTOP 1440x900 =====
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await dctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.click('#gate-enter-music-btn');
  await page.waitForTimeout(1600);
  s = await state(page);
  assert(s.opened && s.playing[0], 'desktop click-open: no song ' + JSON.stringify(s));
  ok('desktop: tap-to-open opens instantly and starts Ganesh song');
  await page.evaluate(() => document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')));
  await page.click('#autoscroll-toggle-btn');
  for (const id of ['ch1-invocation', 'ch3-carnival', 'ch6-finale']) {
    await page.evaluate((i) => window.scrollTo({ top: document.getElementById(i).offsetTop, behavior: 'instant' }), id);
    await page.waitForTimeout(id === 'ch6-finale' ? 2800 : 700);
    await page.screenshot({ path: path.join(ROOT, `preview-desktop-${id}.png`) });
  }
  await page.click('#lang-toggle-btn');
  assert((await page.evaluate(() => document.body.innerText)).includes('डॉ. दीक्षा मिश्र'), 'Nepali toggle');
  ok('desktop: Nepali toggle works');

  assert(errors.length === 0, 'console errors:\n' + errors.join('\n'));
  ok('zero console/page errors');
  await browser.close();
  srv.close();
  console.log('ALL REAL-WORLD CHECKS PASSED');
})().catch((e) => { console.error(e.message); process.exit(1); });
