const { chromium } = require('C:/Users/elite/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml'
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const cleanPath = decodeURIComponent(req.url.split('?')[0]);
      const rel = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
      const fp = path.join(ROOT, rel);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const stat = fs.statSync(fp);
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream',
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

(async () => {
  const { srv, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });

  // 1. Load on Phone (390x844) & verify legacy URL strips + zero forbidden words
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/?v=d1#friends`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);

  if (page.url().includes('?v=') || page.url().includes('#friends')) {
    throw new Error('Legacy query/hash was not stripped: ' + page.url());
  }

  const fullText = await page.evaluate(() => document.body.innerText);
  for (const term of ['Matkor', 'मटकोर', 'Kathmandu', 'काठमाडौँ', 'Bidai', 'बिदाइ']) {
    if (fullText.includes(term)) {
      throw new Error(`Forbidden term "${term}" found in page!`);
    }
  }
  console.log('PASS: Single clean URL + zero Matkor/Kathmandu/Bidai.');

  await page.screenshot({ path: path.join(ROOT, 'preview-v3-phone-gate.png') });

  // 2. Verify Gatefold AUTO-OPENS without any click within ~2.7s!
  await page.waitForTimeout(2650);
  const autoOpened = await page.evaluate(() => {
    const g = document.getElementById('royal-gatefold');
    return g && g.classList.contains('unfolded') && !document.body.classList.contains('gate-locked');
  });
  if (!autoOpened) {
    throw new Error('Gatefold did NOT auto-open after 2.7s!');
  }
  console.log('PASS: Gatefold auto-opened hands-free at 2.7s!');

  // Pause auto-scroll temporarily so deterministic chapter & song tests don't jump mid-screenshot
  await page.click('#autoscroll-toggle-btn');
  await page.waitForTimeout(900);

  // Force eager load of lazy images for screenshot completeness
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'));
  });
  await page.waitForTimeout(500);

  // 3. Verify Segment 1 plays Ganesh song
  const ch1AudioOk = await page.evaluate(() => {
    const a1 = document.getElementById('audio-ch1');
    const lbl = document.getElementById('music-pill-label')?.textContent || '';
    return a1 && !a1.paused && lbl.includes('Ganesh');
  });
  if (!ch1AudioOk) {
    throw new Error('Chapter 1 Ganesh audio did not start automatically!');
  }
  console.log('PASS: Chapter 1 plays Ganesh Vandana.');

  // 4. Scroll to Segment 3 (Sangeet) and verify smooth song crossfade to Sangeet Beats!
  await page.evaluate(() => {
    const el = document.getElementById('ch3-carnival');
    window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  });
  await page.waitForTimeout(900);
  const ch3State = await page.evaluate(() => ({
    label: document.getElementById('music-pill-label')?.textContent || '',
    ch3Paused: document.getElementById('audio-ch3')?.paused,
    ch3Vol: document.getElementById('audio-ch3')?.volume || 0,
    ch1Vol: document.getElementById('audio-ch1')?.volume || 0
  }));
  if (ch3State.ch3Paused || !ch3State.label.includes('Sangeet') || ch3State.ch3Vol <= 0.1) {
    throw new Error('Chapter 3 Sangeet crossfade failed: ' + JSON.stringify(ch3State));
  }
  console.log('PASS: Smooth crossfade to Chapter 3 Sangeet song:', JSON.stringify(ch3State));

  // 5. Scroll to Segment 6 (3D Getaway Car) -> capture Boarding beat AND Cruising beat!
  await page.evaluate(() => {
    const el = document.getElementById('ch6-finale');
    window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  });
  await page.click('#car-replay-boarding-btn');
  await page.waitForTimeout(650);
  await page.screenshot({ path: path.join(ROOT, 'preview-v3-phone-ch6-boarding.png') });

  await page.waitForTimeout(2100);
  await page.click('#car-honk-boost-btn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ROOT, 'preview-v3-phone-ch6-cruising.png') });

  // 6. Desktop Widescreen Screenshots (1440x900)
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const id of ['ch1-invocation', 'ch3-carnival', 'ch6-finale']) {
    await page.evaluate((cid) => {
      const el = document.getElementById(cid);
      window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
    }, id);
    if (id === 'ch6-finale') {
      await page.waitForTimeout(700);
      await page.click('#car-honk-boost-btn');
    }
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(ROOT, `preview-v3-desktop-${id}.png`) });
  }

  // 7. Zero horizontal overflow across devices
  for (const w of [390, 320, 1440]) {
    await page.setViewportSize({ width: w, height: w === 1440 ? 900 : 800 });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) {
      throw new Error(`Horizontal overflow (${overflow}px) at width ${w}`);
    }
    console.log(`PASS: Zero horizontal overflow at ${w}px`);
  }

  // 8. Check Nepali toggle
  await page.click('#lang-toggle-btn');
  await page.waitForTimeout(300);
  const neOk = await page.evaluate(() => document.body.innerText.includes('डॉ. दीक्षा मिश्र'));
  if (!neOk) throw new Error('Nepali translation failed!');

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  await browser.close();
  srv.close();
  console.log('ALL SMART V3 COUTURE VERIFICATIONS PASSED PERFECTLY!');
})();
