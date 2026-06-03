const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { resolveConfig } = require('./src/config');
const { stripStatsPrefix } = require('./src/text');
const { typePassage } = require('./src/typer');
const { parseLiveStats, mergePeak, formatPeak } = require('./src/stats');

// Register the stealth plugin once at module load. puppeteer-extra holds a
// single shared instance, so registering here covers every runTyper() call and
// any other module that requires this file.
puppeteer.use(StealthPlugin());

// The passage renders into its own .text node inside .screen-display — NOT the
// container itself, which also holds the live stats table (.indicators).
const PASSAGE_SELECTOR = '.screen-display .text';
// Best-effort live stats node; stripStatsPrefix falls back to regex if absent.
const STATS_SELECTOR = '.screen-display .indicators, .typing-stats';
// Container the site navigates to when the timed test ends.
const RESULT_SELECTOR = '.typing-speed-test-result';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Keep a visible browser open so the result can be viewed live: resolve when
// the user closes the window (browser disconnects) or after holdOpenMs, first.
function holdOpenUntilClosed(browser, holdOpenMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, holdOpenMs);
    browser.once('disconnected', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function runTyper(config) {
  let browser;
  let context;
  let polling = false;
  let pollLoop = null;
  let peak = { wpm: null, cpm: null };
  try {
    browser = await puppeteer.launch({
      headless: config.headless,
      executablePath: config.executablePath,
    });
    // #1123: use an isolated context AND open the page from it.
    context = await browser.createBrowserContext();
    const page = await context.newPage();

    await page.goto(config.url, { waitUntil: 'domcontentloaded' });

    // #1125: wait for real readiness instead of a fixed sleep. The .text
    // container mounts immediately but is populated asynchronously, so wait for
    // it to actually contain the passage — presence of the node isn't enough.
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return !!el && el.textContent.trim().length > 0;
      },
      { timeout: config.waitTimeoutMs },
      PASSAGE_SELECTOR
    );

    // #1121: guard against a null element. waitForFunction throws on timeout,
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

    // Poll the live .indicators stats for the peak speed. The site caps the
    // end-of-test number for superhuman runs, but the live readout spikes to the
    // real burst figure mid-test — so sample repeatedly and keep the maximum.
    polling = true;
    pollLoop = (async () => {
      while (polling) {
        try {
          const text = await page.evaluate((sel) => {
            const node = document.querySelector(sel);
            return node ? node.textContent : null;
          }, STATS_SELECTOR);
          peak = mergePeak(peak, parseLiveStats(text));
        } catch {
          // Transient read failure (e.g. navigation/detach); keep polling.
        }
        await sleep(config.livePollMs);
      }
    })();

    // Type one throwaway key first — this is what starts the timed test on the
    // site — then type the scraped passage.
    await page.keyboard.type('j');
    await typePassage(page.keyboard, passage, { delayMs: config.typingDelayMs });

    // Keep sampling briefly after the burst to catch the post-typing spike, then
    // stop the loop and report the peak we saw.
    await sleep(config.liveSettleMs);
    polling = false;
    await pollLoop;

    const peakSummary = formatPeak(peak);
    console.log(
      peakSummary
        ? `[FlashTyper] Peak live speed — ${peakSummary}`
        : '[FlashTyper] Test complete (could not read live speed)'
    );

    // In a visible window, keep it open so the result can be viewed live, until
    // the user closes it (capped by holdOpenMs). No-op when headless.
    if (!config.headless && config.holdOpenMs > 0) {
      await holdOpenUntilClosed(browser, config.holdOpenMs);
    }

    return { peak };
  } catch (err) {
    console.error('[FlashTyper] failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Stop the live-stats poll loop before teardown so it can't keep calling
    // page.evaluate against a closing page (which would reject unhandled).
    polling = false;
    if (pollLoop) await pollLoop.catch(() => {});
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

module.exports = { runTyper, main, PASSAGE_SELECTOR, STATS_SELECTOR, RESULT_SELECTOR };
