import React from 'react';
import {normalizeAuditResult} from '../../../../shared/riskEngine.js';
export default function AuditResultHeadline({analysis}) {const result=normalizeAuditResult(analysis||{});return <span>{result.fraudType==='No Fraud'?'Tidak ada sinyal pada data tersedia':result.fraudType==='PHANTOM_BILLING'?'Indikasi anomali — perlu diperiksa':result.fraudType}</span>;}
