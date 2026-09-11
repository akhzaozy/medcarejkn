/**
 * Case Priority Evaluator
 */

export function determinePriority({
  evidenceStatus,
  primarySignal,
  evidenceGap,
  coveragePct
}) {
  if (evidenceStatus === 'UNAVAILABLE') {
    return 'NO_CONCLUSION';
  }

  if (primarySignal === 'PHANTOM_BILLING' || evidenceStatus === 'UNSUPPORTED') {
    return 'HIGH';
  }

  if (primarySignal === 'PATTERN_REVIEW' || evidenceStatus === 'PARTIAL') {
    return 'MEDIUM';
  }

  if (evidenceStatus === 'SUPPORTED') {
    return 'LOW';
  }

  return 'MEDIUM';
}
