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
  };
}

module.exports = { resolveConfig };
