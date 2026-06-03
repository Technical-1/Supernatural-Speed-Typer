# Supernatural Speed Typer

A Node.js browser-automation tool that completes the typing-speed test at [thetypingcat.com](https://thetypingcat.com) by scraping the prompt and replaying it as real keystrokes through a stealth-patched Chromium.

I built this to explore browser automation with Puppeteer end to end: driving a real Chromium session, reading dynamic page content, and synthesizing human-like keyboard input. A configurable per-keystroke delay maps directly to the resulting words-per-minute, and the scraping and typing logic is split into small, unit-tested modules so the browser-dependent glue stays thin.

## Features

- **Automated typing** — launches Chromium, waits for the test passage to render, scrapes it, and types it character by character (pressing Enter on line breaks).
- **Tunable speed** — `TYPING_DELAY_MS` sets the per-keystroke delay; ~0 ms lands around 1200 WPM, ~80 ms around 130 WPM for a more believable result.
- **Stealth automation** — `puppeteer-extra-plugin-stealth` masks the common headless/automation fingerprints sites use to detect bots.
- **Resilient scraping** — a stable semantic selector plus dynamic stats stripping survive minor changes to the site's UI instead of breaking on every rebuild.
- **Portable** — defaults to Puppeteer's bundled Chromium; `CHROME_PATH` points it at a system Chrome instead. Every knob is an environment variable, so there's nothing to edit in code.
- **Tested** — pure logic is covered by `node:test` unit tests, and an offline HTML fixture drives a deterministic end-to-end test with no dependency on the live site.

## Tech Stack

- **Language**: Node.js (CommonJS)
- **Automation**: Puppeteer 24 with `puppeteer-extra` + stealth plugin
- **Testing**: Node's built-in test runner (`node:test`)

## Getting Started

### Prerequisites

- Node.js 18 or newer

### Installation

```bash
npm install      # installs Puppeteer + stealth plugin and a bundled Chromium
```

### Usage

```bash
npm start        # runs against thetypingcat.com with default settings
```

Configure behavior with environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `TYPING_TEST_URL` | `https://thetypingcat.com/typing-speed-test/1m` | Which test to run |
| `CHROME_PATH` | _(bundled Chromium)_ | Use a system Chrome instead |
| `HEADLESS` | `false` | Set `true` to run without a visible window |
| `TYPING_DELAY_MS` | `0` | Per-keystroke delay; higher = more believable WPM |
| `WAIT_TIMEOUT_MS` | `15000` | How long to wait for the passage to load |
| `RESULT_TIMEOUT_MS` | `90000` | How long to wait for the results screen after typing (the test runs a fixed ~60s) |
| `HOLD_OPEN_MS` | `120000` | In a visible window, how long to keep it open on the results screen (or until you close it). Ignored when headless |

After typing, the tool waits for the test to finish, then prints the result, e.g.:

```
[FlashTyper] Test complete — 132 WPM, 100% accuracy — better than 99.1% of all users
```

```bash
# Example: a believable ~130 WPM run in a headless window
HEADLESS=true TYPING_DELAY_MS=80 npm start
```

## Development

```bash
# Install dependencies
npm install

# Fast unit tests (config, text cleanup, typing loop)
npm test

# Offline end-to-end test against a local HTML fixture
npm run test:integration
```

## Project Structure

```
Supernatural-Speed-Typer/
├── FlashTyper.js          # Orchestrator: browser lifecycle, scrape, type
├── src/
│   ├── config.js          # Environment-driven configuration
│   ├── text.js            # Stats-prefix stripping (scrape cleanup)
│   └── typer.js           # Code-point-safe keystroke loop
└── test/
    ├── unit/              # Pure-logic unit tests
    ├── integration/       # Offline end-to-end test (real Chromium)
    └── fixtures/          # Local HTML fixture mirroring the test page
```

## License

Unlicensed (personal project).

## Author

Jacob Kanfer — [GitHub](https://github.com/Technical-1)
