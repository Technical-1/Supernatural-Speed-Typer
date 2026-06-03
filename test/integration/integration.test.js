const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-extra');
// Requiring FlashTyper.js registers the stealth plugin on the shared
// puppeteer-extra instance, so this test file does not register it again.
const { runTyper, PASSAGE_SELECTOR, STATS_SELECTOR, RESULT_SELECTOR } = require('../../FlashTyper.js');
const { stripStatsPrefix } = require('../../src/text');
const { typePassage } = require('../../src/typer');

const FIXTURE_URL = pathToFileURL(
  path.join(__dirname, '..', 'fixtures', 'typing-page.html')
).href;

test('runTyper completes cleanly against a local fixture (lifecycle + teardown)', async () => {
  // runTyper signals failure by setting process.exitCode = 1. Snapshot and
  // restore the global so this assertion can't leak state into other tests.
  const initialExitCode = process.exitCode;
  process.exitCode = 0;
  try {
    await runTyper({
      url: FIXTURE_URL,
      executablePath: undefined,
      headless: true,
      typingDelayMs: 0,
      waitTimeoutMs: 15000,
      resultTimeoutMs: 15000,
      holdOpenMs: 0,
      livePollMs: 20,
      liveSettleMs: 1200,
    });
    assert.equal(process.exitCode, 0, 'runTyper should finish without setting a failure exit code');
  } finally {
    process.exitCode = initialExitCode;
  }
});

test('runTyper captures the peak live speed from the indicators table', async () => {
  const result = await runTyper({
    url: FIXTURE_URL,
    executablePath: undefined,
    headless: true,
    typingDelayMs: 0,
    waitTimeoutMs: 15000,
    resultTimeoutMs: 15000,
    holdOpenMs: 0,
    livePollMs: 20,
    liveSettleMs: 1200,
  });
  assert.ok(result, 'runTyper should resolve to a result object');
  assert.ok(result.peak, 'result should carry a peak');
  assert.equal(result.peak.wpm, 4200);
  assert.equal(result.peak.cpm, 8400);
});

test('scrape + strip + type writes the passage into the focused field', async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
    // Mirror production: wait for the passage to actually load, not merely for
    // the container node to exist (it mounts empty and fills in asynchronously).
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return !!el && el.textContent.trim().length > 0;
      },
      { timeout: 15000 },
      PASSAGE_SELECTOR
    );

    const rawText = await page.evaluate(
      (sel) => document.querySelector(sel).textContent,
      PASSAGE_SELECTOR
    );
    const statsText = await page.evaluate((sel) => {
      const node = document.querySelector(sel);
      return node ? node.textContent : null;
    }, STATS_SELECTOR);

    const passage = stripStatsPrefix(rawText, statsText);
    assert.equal(passage, 'The quick brown fox⏎jumps over');

    await page.focus('#capture');
    await typePassage(page.keyboard, passage, { delayMs: 0 });

    const typed = await page.$eval('#capture', (el) => el.value);
    assert.equal(typed, 'The quick brown fox\njumps over');
  } finally {
    await browser.close();
  }
});
