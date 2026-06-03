const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const previewsDir = __dirname;                 // .portfolio/og-image-preview
  const outFile = path.join(previewsDir, '..', 'preview.png'); // .portfolio/preview.png

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(previewsDir, 'og-home.html'), { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 600));

  const card = await page.$('.og-card');
  await card.screenshot({ path: outFile, type: 'png' });
  console.log('Wrote ' + outFile);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
