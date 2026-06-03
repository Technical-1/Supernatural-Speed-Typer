# Supernatural-Speed-Typer

Puppeteer based "thetypingcat" cheater. Opens up the site and grabs all of the text for the speed test and loops through each individual character emulating a user completing the test.


Changing the typing delay gives a variety of results. The higher the delay the more believable the result.

Delay 80ms  ~130 WPM

Delay 20ms  ~400 WPM

Delay 0ms  ~1200 WPM

## Setup

```bash
npm install      # installs Puppeteer + stealth plugin and a bundled Chromium
npm start        # runs FlashTyper.js against thetypingcat.com
```

## Configuration (environment variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `TYPING_TEST_URL` | `https://thetypingcat.com/typing-speed-test/1m` | Which test to run |
| `CHROME_PATH` | _(bundled Chromium)_ | Use a system Chrome instead |
| `HEADLESS` | `false` | Set `true` to run without a visible window |
| `TYPING_DELAY_MS` | `0` | Per-keystroke delay; higher = more believable WPM |
| `WAIT_TIMEOUT_MS` | `15000` | How long to wait for the passage to load |

## Tests

```bash
npm test                   # fast unit tests (config, text, typer)
npm run test:integration   # offline end-to-end against a local fixture
```
