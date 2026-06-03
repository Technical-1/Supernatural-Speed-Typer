// Tolerant fallback for when the live stats text is unavailable: strips the
// leading stats bar, which is an optional run of labels ("Accuracy"/"Speed"/
// "Time"/"Errors") followed by at least one numeric value token ("100%", "0WPM",
// "0CPM", "60s", "0/0"). Requiring a numeric token prevents over-stripping a
// passage that merely begins with one of those words (e.g. "Time flies").
const STATS_PREFIX_RE =
  /^(?:Accuracy|Speed|Time|Errors)*(?:\d+%|\d+\s*WPM|\d+\s*CPM|\d+s|\d+\/\d+)+/;

function stripStatsPrefix(rawText, statsText) {
  if (typeof rawText !== 'string') return '';
  if (typeof statsText === 'string' && statsText && rawText.startsWith(statsText)) {
    return rawText.slice(statsText.length);
  }
  return rawText.replace(STATS_PREFIX_RE, '');
}

module.exports = { stripStatsPrefix, STATS_PREFIX_RE };
