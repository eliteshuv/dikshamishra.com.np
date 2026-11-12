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
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

(async () => {
  const { srv, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });

  // 1. Verify legacy ?v=d1 URL strips cleanly to / and contains ZERO Matkor / Kathmandu / Bidai
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/?v=d1#friends`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const currentUrl = page.url();
  if (currentUrl.includes('?v=') || currentUrl.includes('#friends')) {
    throw new Error('Legacy query/hash was not stripped: ' + currentUrl);
  }

  const fullText = await page.evaluate(() => document.body.innerText);
  for (const forbidden of ['Matkor', 'मटकोर', 'Kathmandu', 'काठमाडौँ', 'Bidai', 'बिदाइ']) {
    if (fullText.includes(forbidden)) {
      throw new Error(`Forbidden term "${forbidden}" still found in page!`);
    }
  }
  console.log('PASS: Single clean URL + zero Matkor/Kathmandu/Bidai anywhere.');

  // Screenshot Gatefold on Phone
  await page.screenshot({ path: path.join(ROOT, 'preview-couture-phone-gate.png') });

  // 2. Unlock Royal Seal
  await page.click('#seal-unlock-btn');
  await page.waitForTimeout(1900);

  // Check all visible images loaded properly
  const brokenImages = await page.evaluate(() => {
    return [...document.querySelectorAll('img')]
      .filter((img) => {
        img.loading = 'eager';
        return false;
      });
  });

  // Scroll through every chapter on Phone (390x844), test interactions & capture screenshots
  const chapterIds = [
    'ch1-invocation',
    'ch2-couple',
    'ch3-carnival',
    'ch4-vivah',
    'ch5-venue',
    'ch6-finale'
  ];

  for (const id of chapterIds) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);

    if (id === 'ch1-invocation') {
      await page.click('#offer-pushpanjali-btn');
      await page.waitForTimeout(300);
    }
    if (id === 'ch3-carnival') {
      await page.click('#throw-all-gulal-btn');
      await page.click('#beat-dhol-btn');
      await page.waitForTimeout(450);
    }
    if (id === 'ch4-vivah') {
      await page.click('[data-wish="3"]');
      await page.waitForTimeout(300);
    }
    if (id === 'ch5-venue') {
      await page.click('[data-tab="travel"]');
      await page.waitForTimeout(250);
    }
    if (id === 'ch6-finale') {
      await page.click('#light-all-diyas-btn');
      await page.waitForTimeout(550);
    }

    await page.screenshot({ path: path.join(ROOT, `preview-couture-phone-${id}.png`) });
  }

  // Check zero horizontal overflow on Phone 390px and Compact 320px
  for (const w of [390, 320, 1440]) {
    await page.setViewportSize({ width: w, height: w === 1440 ? 900 : 800 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) {
      throw new Error(`Horizontal overflow (${overflow}px) at width ${w}`);
    }
    console.log(`PASS: Zero horizontal overflow at ${w}px`);
  }

  // Desktop Screenshots (1440x900) + Nepali Toggle Test
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const id of ['ch1-invocation', 'ch2-couple', 'ch3-carnival', 'ch4-vivah', 'ch6-finale']) {
    await page.evaluate((cid) => {
      const el = document.getElementById(cid);
      window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
    }, id);
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(ROOT, `preview-couture-desktop-${id}.png`) });
  }

  // Toggle Nepali & verify Devanagari translation
  await page.click('#lang-toggle-btn');
  await page.waitForTimeout(400);
  await page.locator('#ch2-couple').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ROOT, 'preview-couture-desktop-ne.png') });

  const neCheck = await page.textContent('#ch2-couple');
  if (!neCheck.includes('डॉ. दीक्षा मिश्र')) {
    throw new Error('Nepali toggle did not translate Bride name!');
  }

  // Verify every <img> has naturalWidth > 0
  const unloaded = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.getAttribute('src'))
  );
  if (unloaded.length) {
    throw new Error('Unloaded images: ' + unloaded.join(', '));
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  await browser.close();
  srv.close();
  console.log('ALL COUTURE VERIFICATIONS PASSED PERFECTLY!');
})();
