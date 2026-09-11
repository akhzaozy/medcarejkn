/**
 * Evidence Reconciliation Module
 * 
 * Performs deterministic reconciliation between claimed items and supporting evidence.
 * Strict Guardrails:
 * - UNAVAILABLE ≠ UNSUPPORTED
 * - UNSUPPORTED ≠ PROVEN FRAUD
 * - UNAVAILABLE -> NO_CONCLUSION
 */

export function reconcileItem({
  claimedQty,
  supportedQty,
  evidenceAvailable,
  utilizationSignal = false,
  recordSimilaritySignal = false
}) {
  const claimed = Number(claimedQty) || 0;
  let supported = Number(supportedQty) || 0;
  
  // Guardrail 1: Evidence Unavailable
  if (evidenceAvailable === false || evidenceAvailable === 'NO' || evidenceAvailable === 'UNAVAILABLE') {
    return {
      availability: 'UNAVAILABLE',
      status: 'UNAVAILABLE',
      gap: claimed,
      coveragePct: 0,
      primarySignal: null,
      reviewPriority: 'NO_CONCLUSION',
      reason: 'Evidence is unavailable in records. Guardrail active: Indication cannot be evaluated as fraud without supporting documentation.'
    };
  }

  // Normalization
  supported = Math.max(0, Math.min(supported, claimed));
  const gap = Math.max(0, claimed - supported);
  const coveragePct = claimed === 0 ? 100 : Math.round((supported / claimed) * 10000) / 100;

  // Fully Supported
  if (supported >= claimed) {
    if (utilizationSignal || recordSimilaritySignal) {
      return {
        availability: 'AVAILABLE',
        status: 'SUPPORTED',
        gap: 0,
        coveragePct: 100,
        primarySignal: 'PATTERN_REVIEW',
        reviewPriority: 'MEDIUM',
        reason: 'Service evidence fully matches claimed quantity, but pattern anomaly (utilization/similarity) was detected for secondary review.'
      };
    }
    return {
      availability: 'AVAILABLE',
      status: 'SUPPORTED',
      gap: 0,
      coveragePct: 100,
      primarySignal: null,
      reviewPriority: 'LOW',
      reason: 'Claimed quantity is fully corroborated by matching service evidence.'
    };
  }

  // Partially Supported
  if (supported > 0) {
    return {
      availability: 'AVAILABLE',
      status: 'PARTIAL',
      gap,
      coveragePct,
      primarySignal: 'PARTIAL_SUPPORT',
      reviewPriority: 'MEDIUM',
      reason: `Only partial service evidence (${supported}/${claimed}) was found. Evidence gap: ${gap}.`
    };
  }

  // Unsupported (Phantom Billing indication)
  return {
    availability: 'AVAILABLE',
    status: 'UNSUPPORTED',
    gap,
    coveragePct: 0,
    primarySignal: 'PHANTOM_BILLING',
    reviewPriority: 'HIGH',
    reason: 'Evidence records are available for this encounter, but zero matching supporting evidence was found for the claimed service items.'
  };
}
