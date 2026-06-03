# Project Q&A

## Overview

Supernatural Speed Typer is a Node.js browser-automation tool that completes the typing-speed test at thetypingcat.com. It launches a stealth-patched Chromium, scrapes the prompt the site asks you to type, and replays it as real keyboard input at a configurable speed. The interesting part is less the trick itself and more the engineering around it: the scrape-and-type logic is decomposed into pure, unit-tested modules, and an offline HTML fixture lets the full pipeline be tested deterministically without ever touching the live site.

## Problem Solved

It's a hands-on study of end-to-end browser automation — reading dynamic, framework-rendered page content and producing human-like keyboard input — packaged as a tool that does something concrete and observable (a number on a screen) so the automation is easy to verify.

## Target Users

- **Engineers learning Puppeteer** — a compact, readable example of the launch → scrape → interact → teardown lifecycle with stealth and isolated browser contexts.
- **Myself, as a sandbox** — a place to practice making browser-dependent code testable and resilient to UI changes.

## Key Features

### Automated typing at a tunable speed
The tool reads the test passage and types it character by character. `TYPING_DELAY_MS` controls the gap between keystrokes, which maps directly to the resulting WPM — near-instant at 0 ms, believably human around 80 ms.

### Stealth, isolated browsing
It runs through `puppeteer-extra` with the stealth plugin to avoid the obvious automation fingerprints, and opens its page inside a fresh browser context so each run is clean and cookieless.

### Resilient scraping
It targets a semantic class name rather than generated style hashes and strips the page's stats bar dynamically, so routine site changes don't silently break the scrape.

## Technical Highlights

### Making a browser-dependent loop unit-testable
The typing loop, `typePassage(keyboard, text, { delayMs })` in `src/typer.js`, takes the keyboard as an injected dependency instead of reaching for Puppeteer's. That single seam lets unit tests pass a fake keyboard that records calls and assert the exact sequence — including that the `⏎` marker becomes an `Enter` press and that the configured delay is forwarded — with no browser involved.

### A numeric-gated regex that won't eat real text
The scraped display text is the stats bar glued to the passage. `stripStatsPrefix` in `src/text.js` first tries to slice an exact, live-read stats string; when that's unavailable it falls back to a regex. The subtle bit is that the regex only strips a leading run of stat tokens if it contains a numeric value, so a passage that genuinely starts with a word like "Time" or "Accuracy" is left intact rather than truncated.

### Deterministic end-to-end testing with a local fixture
`test/integration/integration.test.js` drives real Chromium against a local HTML fixture served over `file://`. One test runs the full `runTyper` lifecycle and asserts it completes and tears down cleanly; another walks the scrape → strip → type pipeline and asserts the exact typed output, newline included. Because it uses a fixture instead of the live page, it's reproducible and offline.

### Teardown that survives every failure path
`runTyper` in `FlashTyper.js` wraps the run in `try/catch/finally` with the browser handles hoisted, so the context and browser close whether the run succeeds, throws, or times out — no orphaned Chromium left behind.

## Engineering Decisions

### Decompose the script into pure modules
- **Constraint**: The original was one inline async function — impossible to test without launching a browser.
- **Options**: Keep it monolithic and test only through Puppeteer; or extract the logic into pure units.
- **Choice**: Extract configuration, stats stripping, and the typing loop into separate modules with an injectable keyboard.
- **Why**: The logic worth testing has nothing to do with a browser, so it shouldn't need one to test. Fast unit tests now cover it; the orchestrator stays a thin layer of glue.

### Test against a fixture, not the live site
- **Constraint**: I wanted real end-to-end coverage of the scrape-and-type path without flaky, network-dependent tests.
- **Options**: Hit thetypingcat.com directly in tests; mock Puppeteer entirely; or use a local fixture with a real browser.
- **Choice**: A local HTML fixture driven by a real Chromium.
- **Why**: It exercises the genuine browser keyboard and DOM-scrape code while staying deterministic and offline. Mocking the browser would test less; hitting the live site would be unreliable.

### Default to bundled Chromium, override by env
- **Constraint**: The original hardcoded a macOS Chrome path, so it ran on exactly one machine.
- **Options**: Hardcode per platform; require an env var; or default to the bundled browser.
- **Choice**: Use Puppeteer's bundled Chromium by default and let `CHROME_PATH` override.
- **Why**: It runs anywhere with zero configuration, while still allowing a system Chrome when wanted.

## Frequently Asked Questions

### How does the tool know what to type?
It waits for the passage element (`.screen-display`) to render, reads its text content along with the stats bar text, and runs `stripStatsPrefix` to remove the stats prefix and leave just the passage.

### How is the typing speed controlled?
Through `TYPING_DELAY_MS`, the per-keystroke delay passed into `keyboard.type`. Around 0 ms produces roughly 1200 WPM; around 80 ms produces roughly 130 WPM, which reads as a believable human result.

### Why does it press a key before typing the passage?
The site starts the timed test on the first keystroke, so the tool types one throwaway character to begin the run, then types the actual passage.

### Why scrape `.screen-display` instead of a more specific selector?
The site is built with styled-components, whose generated class names change on every rebuild. A semantic class like `.screen-display` is stable, so the scrape doesn't break when the build hashes change.

### Why is the stats stripping done with a regex fallback at all?
The preferred path slices an exact, live-read stats string. The regex exists only for when that text isn't available, and it's deliberately conservative — it requires a numeric token before stripping, so it can't accidentally remove real passage words.

### Does it leave browser processes running?
No. The run is wrapped in `try/catch/finally`, and both the browser context and the browser are closed in the `finally` block on every exit path.

### How do I run it without a visible window?
Set `HEADLESS=true` (for example, `HEADLESS=true npm start`). The default is a visible window.
