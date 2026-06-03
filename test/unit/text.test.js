const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stripStatsPrefix } = require('../../src/text');

const PASSAGE = 'The quick brown fox⏎jumps over';

test('slices an exact known statsText off the front', () => {
  const stats = 'AccuracySpeedTimeErrors100%0WPM0CPM60s0/0';
  assert.equal(stripStatsPrefix(stats + PASSAGE, stats), PASSAGE);
});

test('regex fallback strips the stat run when statsText is null', () => {
  const raw = 'AccuracySpeedTimeErrors100%0WPM0CPM60s0/0' + PASSAGE;
  assert.equal(stripStatsPrefix(raw, null), PASSAGE);
});

test('returns text unchanged when there is no stats prefix', () => {
  assert.equal(stripStatsPrefix(PASSAGE, null), PASSAGE);
});

test('non-string input yields empty string', () => {
  assert.equal(stripStatsPrefix(null, null), '');
  assert.equal(stripStatsPrefix(undefined, 'x'), '');
});

test('does not over-strip a passage starting with a bare stat word', () => {
  // No numeric stat token follows, so the stats regex must not match.
  assert.equal(stripStatsPrefix('Time flies when typing', null), 'Time flies when typing');
  assert.equal(stripStatsPrefix('Accuracy is the goal', null), 'Accuracy is the goal');
});

test('still strips a glued labels+values stats bar via regex', () => {
  assert.equal(stripStatsPrefix('Errors0/0Hello there', null), 'Hello there');
});

test('ignores a non-string statsText and falls back to the regex', () => {
  const raw = 'AccuracySpeedTimeErrors100%0WPM0CPM60s0/0' + PASSAGE;
  assert.equal(stripStatsPrefix(raw, 123), PASSAGE);
});
