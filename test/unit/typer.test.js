const { test } = require('node:test');
const assert = require('node:assert/strict');
const { typePassage, NEWLINE_MARKER } = require('../../src/typer');

function fakeKeyboard() {
  const calls = [];
  return {
    calls,
    async type(ch, opts) { calls.push({ kind: 'type', ch, opts }); },
    async press(key) { calls.push({ kind: 'press', key }); },
  };
}

test('NEWLINE_MARKER is the return glyph', () => {
  assert.equal(NEWLINE_MARKER, '⏎');
});

test('types each char and presses Enter for the newline marker', async () => {
  const kb = fakeKeyboard();
  await typePassage(kb, 'ab⏎c', { delayMs: 0 });
  assert.deepEqual(kb.calls, [
    { kind: 'type', ch: 'a', opts: { delay: 0 } },
    { kind: 'type', ch: 'b', opts: { delay: 0 } },
    { kind: 'press', key: 'Enter' },
    { kind: 'type', ch: 'c', opts: { delay: 0 } },
  ]);
});

test('passes the configured delay through to keyboard.type', async () => {
  const kb = fakeKeyboard();
  await typePassage(kb, 'x', { delayMs: 80 });
  assert.equal(kb.calls[0].opts.delay, 80);
});

test('defaults delay to 0 when opts is omitted', async () => {
  const kb = fakeKeyboard();
  await typePassage(kb, 'x');
  assert.equal(kb.calls[0].opts.delay, 0);
});
