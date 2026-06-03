// Parses thetypingcat's live stats bar (.indicators) and tracks the peak speed
// across samples. The live WPM/CPM readout spikes to the real burst figure
// mid-test, while the end-of-test screen caps superhuman runs — so the peak of
// the live readout is the number worth reporting.

function parseLiveStats(text) {
  if (typeof text !== 'string') return { wpm: null, cpm: null };
  const w = text.match(/(\d+)\s*WPM/i);
  const c = text.match(/(\d+)\s*CPM/i);
  return {
    wpm: w ? Number(w[1]) : null,
    cpm: c ? Number(c[1]) : null,
  };
}

function maxOrNull(a, b) {
  if (a == null) return b == null ? null : b;
  if (b == null) return a;
  return a > b ? a : b;
}

function mergePeak(peak, sample) {
  const p = peak || { wpm: null, cpm: null };
  const s = sample || { wpm: null, cpm: null };
  return {
    wpm: maxOrNull(p.wpm, s.wpm),
    cpm: maxOrNull(p.cpm, s.cpm),
  };
}

module.exports = { parseLiveStats, mergePeak };
