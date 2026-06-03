const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseResult } = require('../../src/result');

// A real results URL from thetypingcat: /<length>/<attempt>/<wpm>/<accuracy>
const RESULT_URL = 'https://thetypingcat.com/typing-speed-test-result/1m/1/80/100';
// The results container text arrives glued together (styled-components, no spaces).
const CONTAINER =
  'Your typing speed is 80WPMAccuracy100%Typing Speed80WPMIt is better than 98.35% of all usersRanking in last 24hrs10';

test('parses wpm and accuracy from a results URL', () => {
  const r = parseResult(RESULT_URL, null);
  assert.equal(r.wpm, 80);
  assert.equal(r.accuracy, 100);
});

test('extracts the percentile from the container text', () => {
  const r = parseResult(RESULT_URL, CONTAINER);
  assert.equal(r.percentile, 98.35);
});

test('builds a clean one-line summary from the parsed values', () => {
  const r = parseResult(RESULT_URL, CONTAINER);
  assert.equal(r.summary, '80 WPM, 100% accuracy — better than 98.35% of all users');
});

test('falls back to the container text when the URL is not a results URL', () => {
  const r = parseResult('https://thetypingcat.com/typing-speed-test/1m', CONTAINER);
  assert.equal(r.wpm, 80);
  assert.equal(r.accuracy, 100);
  assert.equal(r.percentile, 98.35);
});

test('the displayed container values take precedence over the URL', () => {
  // The results screen is the source of truth for what the user sees; the URL
  // is only a fallback. Here the container says 999/42 — that wins over the URL.
  const conflicting = 'Your typing speed is 999WPMAccuracy42%';
  const r = parseResult(RESULT_URL, conflicting);
  assert.equal(r.wpm, 999);
  assert.equal(r.accuracy, 42);
});

test('reports the displayed speed, not the raw URL number, when they diverge', () => {
  // Real-world case: an instant-typed run completes early. The URL carries a raw
  // 4880, but the results screen shows 16 WPM / better than 19.13%. Report the
  // displayed figure so WPM and percentile come from one consistent source.
  const url = 'https://thetypingcat.com/typing-speed-test-result/1m/1/4880/100';
  const container =
    'Your typing speed is 16WPMAccuracy100%Typing Speed16WPMIt is better than 19.13% of all users';
  const r = parseResult(url, container);
  assert.equal(r.wpm, 16);
  assert.equal(r.accuracy, 100);
  assert.equal(r.percentile, 19.13);
});

test('summary omits the percentile clause when it is unknown', () => {
  const r = parseResult(RESULT_URL, null);
  assert.equal(r.summary, '80 WPM, 100% accuracy');
});

test('returns nulls and an empty summary for unrecognized input', () => {
  const r = parseResult('https://example.com/', null);
  assert.equal(r.wpm, null);
  assert.equal(r.accuracy, null);
  assert.equal(r.percentile, null);
  assert.equal(r.summary, '');
});

test('tolerates non-string inputs without throwing', () => {
  const r = parseResult(null, undefined);
  assert.equal(r.wpm, null);
  assert.equal(r.accuracy, null);
  assert.equal(r.summary, '');
});
