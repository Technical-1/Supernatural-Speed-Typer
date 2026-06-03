function intFromEnv(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function resolveConfig(env = process.env) {
  return {
    url: env.TYPING_TEST_URL || 'https://thetypingcat.com/typing-speed-test/1m',
    // undefined is intentional: Puppeteer falls back to its bundled Chromium
    // when no executablePath is given. CHROME_PATH overrides with a system Chrome.
    executablePath: env.CHROME_PATH || undefined,
    headless: env.HEADLESS === 'true',
    typingDelayMs: intFromEnv(env.TYPING_DELAY_MS, 0),
    waitTimeoutMs: intFromEnv(env.WAIT_TIMEOUT_MS, 15000),
    // How long to wait for the results page after typing (the test runs a full
    // 60s, then navigates to the results screen).
    resultTimeoutMs: intFromEnv(env.RESULT_TIMEOUT_MS, 90000),
    // After results load in a visible window, keep it open this long (or until
    // the user closes it) so the result can be viewed live. Ignored when headless.
    holdOpenMs: intFromEnv(env.HOLD_OPEN_MS, 120000),
  };
}

module.exports = { resolveConfig };
