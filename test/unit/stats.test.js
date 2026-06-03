const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseLiveStats } = require('../../src/stats');

// The .indicators textContent arrives glued together, like the real site:
// "AccuracySpeedTimeErrors<acc>%<wpm>WPM<cpm>CPM<time>s<err>/<err>"
test('parses wpm and cpm from a live indicators string', () => {
  const s = parseLiveStats('AccuracySpeedTimeErrors100%4200WPM8400CPM7s0/0');
  assert.equal(s.wpm, 4200);
  assert.equal(s.cpm, 8400);
});

test('returns null for a field that is absent', () => {
  const wpmOnly = parseLiveStats('100%4200WPM7s');
  assert.equal(wpmOnly.wpm, 4200);
  assert.equal(wpmOnly.cpm, null);
  const cpmOnly = parseLiveStats('100%8400CPM7s');
  assert.equal(cpmOnly.wpm, null);
  assert.equal(cpmOnly.cpm, 8400);
});

test('returns nulls for non-string or empty input', () => {
  assert.deepEqual(parseLiveStats(null), { wpm: null, cpm: null });
  assert.deepEqual(parseLiveStats(undefined), { wpm: null, cpm: null });
  assert.deepEqual(parseLiveStats(''), { wpm: null, cpm: null });
});

const { mergePeak } = require('../../src/stats');

const EMPTY_PEAK = { wpm: null, cpm: null };

test('mergePeak keeps the larger of each field', () => {
  const p1 = mergePeak(EMPTY_PEAK, { wpm: 1200, cpm: 2400 });
  assert.deepEqual(p1, { wpm: 1200, cpm: 2400 });
  const p2 = mergePeak(p1, { wpm: 4200, cpm: 2000 });
  assert.deepEqual(p2, { wpm: 4200, cpm: 2400 });
});

test('mergePeak treats null as "no value" on either side', () => {
  assert.deepEqual(mergePeak(EMPTY_PEAK, { wpm: null, cpm: 8400 }), { wpm: null, cpm: 8400 });
  assert.deepEqual(mergePeak({ wpm: 50, cpm: 100 }, { wpm: null, cpm: null }), { wpm: 50, cpm: 100 });
});

test('mergePeak tolerates a missing sample object', () => {
  assert.deepEqual(mergePeak(EMPTY_PEAK, null), { wpm: null, cpm: null });
});

const { formatPeak } = require('../../src/stats');

test('formatPeak renders both fields', () => {
  assert.equal(formatPeak({ wpm: 4200, cpm: 8400 }), '4200 WPM, 8400 CPM');
});

test('formatPeak omits a null field', () => {
  assert.equal(formatPeak({ wpm: 4200, cpm: null }), '4200 WPM');
  assert.equal(formatPeak({ wpm: null, cpm: 8400 }), '8400 CPM');
});

test('formatPeak returns an empty string when nothing was captured', () => {
  assert.equal(formatPeak({ wpm: null, cpm: null }), '');
  assert.equal(formatPeak(null), '');
});
