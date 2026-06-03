const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveConfig } = require('../../src/config');

test('defaults reproduce current behavior when env is empty', () => {
  const c = resolveConfig({});
  assert.equal(c.url, 'https://thetypingcat.com/typing-speed-test/1m');
  assert.equal(c.executablePath, undefined);
  assert.equal(c.headless, false);
  assert.equal(c.typingDelayMs, 0);
  assert.equal(c.waitTimeoutMs, 15000);
  assert.equal(c.resultTimeoutMs, 90000);
  assert.equal(c.holdOpenMs, 120000);
});

test('RESULT_TIMEOUT_MS and HOLD_OPEN_MS are parsed; bad values fall back', () => {
  assert.equal(resolveConfig({ RESULT_TIMEOUT_MS: '75000' }).resultTimeoutMs, 75000);
  assert.equal(resolveConfig({ RESULT_TIMEOUT_MS: 'nope' }).resultTimeoutMs, 90000);
  assert.equal(resolveConfig({ HOLD_OPEN_MS: '0' }).holdOpenMs, 0);
  assert.equal(resolveConfig({ HOLD_OPEN_MS: 'nope' }).holdOpenMs, 120000);
});

test('CHROME_PATH overrides the executable path', () => {
  const c = resolveConfig({ CHROME_PATH: '/custom/chrome' });
  assert.equal(c.executablePath, '/custom/chrome');
});

test('numeric envs are parsed; bad values fall back to defaults', () => {
  assert.equal(resolveConfig({ TYPING_DELAY_MS: '80' }).typingDelayMs, 80);
  assert.equal(resolveConfig({ TYPING_DELAY_MS: 'abc' }).typingDelayMs, 0);
  assert.equal(resolveConfig({ WAIT_TIMEOUT_MS: '5000' }).waitTimeoutMs, 5000);
});

test('HEADLESS is true only for the literal string "true"', () => {
  assert.equal(resolveConfig({ HEADLESS: 'true' }).headless, true);
  assert.equal(resolveConfig({ HEADLESS: '1' }).headless, false);
});
