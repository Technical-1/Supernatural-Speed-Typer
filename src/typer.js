const NEWLINE_MARKER = '⏎';

async function typePassage(keyboard, text, { delayMs = 0 } = {}) {
  for (const ch of text) {
    if (ch === NEWLINE_MARKER) {
      await keyboard.press('Enter');
    } else {
      await keyboard.type(ch, { delay: delayMs });
    }
  }
}

module.exports = { typePassage, NEWLINE_MARKER };
