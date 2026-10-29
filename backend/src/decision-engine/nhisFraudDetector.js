// Compatibility adapter for legacy import/evaluation entry points.
// Structured evidence is required; demographics and billing alone do not prove an anomaly.
import {analyzeClaim} from '../../../shared/riskEngine.js';
export const detectNhisFraud=claim=>analyzeClaim(claim);
