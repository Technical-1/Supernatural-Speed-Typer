// Parses thetypingcat's end-of-test result. The displayed results screen is the
// source of truth for what the user sees ("Your typing speed is N WPM"), so it is
// the primary source for WPM/accuracy and the only source for the "better than
// X% of all users" percentile. The results URL path
// (/typing-speed-test-result/<length>/<attempt>/<wpm>/<accuracy>) is a fallback:
// it can carry a raw figure that diverges from the display on instant-typed runs.

function toNum(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function parseResult(url, containerText) {
  let wpm = null;
  let accuracy = null;
  let percentile = null;

  // Primary source: the displayed results container.
  if (typeof containerText === 'string') {
    const w =
      containerText.match(/your typing speed is\s*(\d+)\s*WPM/i) ||
      containerText.match(/(\d+)\s*WPM/i);
    if (w) wpm = toNum(w[1]);
    const a =
      containerText.match(/Accuracy\s*(\d+)\s*%/i) || containerText.match(/(\d+)\s*%/);
    if (a) accuracy = toNum(a[1]);
    const p = containerText.match(/better than\s*([\d.]+)\s*%\s*of all users/i);
    if (p) percentile = toNum(p[1]);
  }

  // Fallback: the results URL path, used only for fields the display didn't yield.
  if ((wpm === null || accuracy === null) && typeof url === 'string') {
    const m = url.match(/typing-speed-test-result\/[^/]+\/\d+\/(\d+)\/(\d+)/);
    if (m) {
      if (wpm === null) wpm = toNum(m[1]);
      if (accuracy === null) accuracy = toNum(m[2]);
    }
  }

  const parts = [];
  if (wpm !== null) parts.push(`${wpm} WPM`);
  if (accuracy !== null) parts.push(`${accuracy}% accuracy`);
  let summary = parts.join(', ');
  if (summary && percentile !== null) {
    summary += ` — better than ${percentile}% of all users`;
  }

  return { wpm, accuracy, percentile, summary };
}

module.exports = { parseResult };
