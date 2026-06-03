const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { resolveConfig } = require('./src/config');
const { stripStatsPrefix } = require('./src/text');
const { typePassage } = require('./src/typer');

// Register the stealth plugin once at module load. puppeteer-extra holds a
// single shared instance, so registering here covers every runTyper() call and
// any other module that requires this file.
puppeteer.use(StealthPlugin());

// Semantic, human-authored class — survives styled-components hash churn.
const PASSAGE_SELECTOR = '.screen-display';
// Best-effort live stats node; stripStatsPrefix falls back to regex if absent.
const STATS_SELECTOR = '.screen-display .stats, .typing-stats';

async function runTyper(config) {
  let browser;
  let context;
  try {
    browser = await puppeteer.launch({
      headless: config.headless,
      executablePath: config.executablePath,
    });
    // #1123: use an isolated context AND open the page from it.
    context = await browser.createBrowserContext();
    const page = await context.newPage();

    await page.goto(config.url, { waitUntil: 'domcontentloaded' });

    // #1125: wait for real readiness instead of a fixed sleep.
    await page.waitForSelector(PASSAGE_SELECTOR, { timeout: config.waitTimeoutMs });

    // #1121: guard against a null element. waitForSelector throws on timeout,
    // but the node could still detach between that call and this query.
    const element = await page.$(PASSAGE_SELECTOR);
    if (!element) {
      throw new Error(`Passage element not found: ${PASSAGE_SELECTOR}`);
    }

    const rawText = await page.evaluate((el) => el.textContent, element);
    const statsText = await page.evaluate((sel) => {
      const node = document.querySelector(sel);
      return node ? node.textContent : null;
    }, STATS_SELECTOR);

    const passage = stripStatsPrefix(rawText, statsText);
    if (!passage) {
      throw new Error('Extracted passage was empty after stripping stats');
    }

    // Type one throwaway key first — this is what starts the timed test on the
    // site — then type the scraped passage.
    await page.keyboard.type('j');
    await typePassage(page.keyboard, passage, { delayMs: config.typingDelayMs });
  } catch (err) {
    console.error('[FlashTyper] failed:', err.message);
    process.exitCode = 1;
  } finally {
    // #1124: guaranteed teardown — no orphaned Chrome on any path.
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

async function main() {
  await runTyper(resolveConfig());
}

if (require.main === module) {
  main();
}

module.exports = { runTyper, main, PASSAGE_SELECTOR, STATS_SELECTOR };
