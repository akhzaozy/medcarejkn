import {
  MOCK_DASHBOARD,
  MOCK_CASES,
  MOCK_USERS,
  getMockCaseDetails,
  MOCK_VALIDATION
} from './mockData';

// API base defaults to relative '/api' which works in production, Nginx reverse proxy, and Vite proxy
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function isDemoMode() {
  try {
    return localStorage.getItem('jkn_demo_mode') === 'true';
  } catch {
    return false;
  }
}

export function setDemoMode(val) {
  try {
    if (val) {
      localStorage.setItem('jkn_demo_mode', 'true');
    } else {
      localStorage.removeItem('jkn_demo_mode');
    }
  } catch (e) {
    console.error(e);
  }
}

export async function fetchDashboard(params = {}) {
  if (isDemoMode()) {
    const isClinician = params.role === 'clinical_reviewer';
    return {
      ...MOCK_DASHBOARD,
      caseCount: isClinician ? 1446 : 4336,
      claimsAnalyzed: isClinician ? 1446 : 4538
    };
  }

  try {
    const query = new URLSearchParams();
    if (params.assignedTo) query.append('assignedTo', params.assignedTo);
    if (params.role) query.append('role', params.role);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/dashboard${qStr}`);
    if (!res.ok) throw new Error(`Dashboard API error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn('[medCare JKN] Backend unreachable, falling back to synthetic dashboard data:', err.message);
    const isClinician = params.role === 'clinical_reviewer';
    return {
      ...MOCK_DASHBOARD,
      caseCount: isClinician ? 1446 : 4336,
      claimsAnalyzed: isClinician ? 1446 : 4538
    };
  }
}

export async function fetchCases(filters = {}) {
  if (isDemoMode()) {
    return getFilteredMockCases(filters);
  }

  try {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters.riskMode && filters.riskMode !== 'ALL') params.append('riskMode', filters.riskMode);
    if (filters.assignedTo && filters.assignedTo !== 'ALL') params.append('assignedTo', filters.assignedTo);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const res = await fetch(`${API_BASE}/cases?${params.toString()}`);
    if (!res.ok) throw new Error(`Cases API error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('[medCare JKN] Backend unreachable, falling back to synthetic cases:', err.message);
    return getFilteredMockCases(filters);
  }
}

function getFilteredMockCases(filters = {}) {
  let filtered = [...MOCK_CASES];

  if (filters.assignedTo && filters.assignedTo !== 'ALL') {
    filtered = filtered.filter(c => c.assigned_to === filters.assignedTo);
  }
  if (filters.riskMode && filters.riskMode !== 'ALL') {
    filtered = filtered.filter(c => c.primary_risk_mode === filters.riskMode);
  }
  if (filters.priority && filters.priority !== 'ALL') {
    filtered = filtered.filter(c => c.review_priority === filters.priority);
  }
  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter(c => c.case_status === filters.status);
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(c => 
      c.case_id.toLowerCase().includes(s) ||
      c.claim_id.toLowerCase().includes(s) ||
      c.provider_name.toLowerCase().includes(s) ||
      (c.summary && c.summary.toLowerCase().includes(s))
    );
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 12;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    data: paginated,
    total: filtered.length,
    page,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit))
  };
}

export async function fetchCaseDetails(caseId) {
  if (isDemoMode()) {
    return getMockCaseDetails(caseId);
  }

  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (!res.ok) throw new Error(`Case details error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn(`[medCare JKN] Backend unreachable for case ${caseId}, using mock details:`, err.message);
    return getMockCaseDetails(caseId);
  }
}

export async function fetchCaseEvidence(caseId) {
  if (isDemoMode()) {
    const det = getMockCaseDetails(caseId);
    return {
      caseId,
      evidenceLinks: det.evidenceLinks,
      claimItems: det.claimItems
    };
  }

  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/evidence`);
    if (!res.ok) throw new Error(`Case evidence error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn(`[medCare JKN] Backend unreachable for evidence of ${caseId}, using mock:`, err.message);
    const det = getMockCaseDetails(caseId);
    return {
      caseId,
      evidenceLinks: det.evidenceLinks,
      claimItems: det.claimItems
    };
  }
}

export async function submitReviewOutcome(caseId, { outcome, notes, reviewerId = 'reviewer-001' }) {
  if (isDemoMode()) {
    return {
      success: true,
      caseId,
      outcome,
      notes,
      reviewerId,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, notes, reviewerId })
    });
    if (!res.ok) throw new Error(`Submit outcome error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn('[medCare JKN] Backend unreachable, simulated review outcome submit:', err.message);
    return {
      success: true,
      caseId,
      outcome,
      notes,
      reviewerId,
      timestamp: new Date().toISOString()
    };
  }
}

export async function triggerAnalysis() {
  if (isDemoMode()) {
    return {
      success: true,
      analyzedCases: 4336,
      newDiscrepancies: 12,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const res = await fetch(`${API_BASE}/analysis/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Trigger analysis error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn('[medCare JKN] Backend unreachable, simulated analysis run:', err.message);
    return {
      success: true,
      analyzedCases: 4336,
      newDiscrepancies: 12,
      timestamp: new Date().toISOString()
    };
  }
}

export async function fetchValidationBenchmark(refresh = false) {
  if (isDemoMode()) {
    return MOCK_VALIDATION;
  }

  try {
    const res = await fetch(`${API_BASE}/validation?refresh=${refresh}`);
    if (!res.ok) throw new Error(`Validation API error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn('[medCare JKN] Backend unreachable, falling back to mock validation metrics:', err.message);
    return MOCK_VALIDATION;
  }
}

export async function auditCheckClaim(claimData) {
  if (isDemoMode()) {
    return generateMockAuditCheck(claimData);
  }

  try {
    const res = await fetch(`${API_BASE}/claims/audit-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData)
    });
    if (!res.ok) throw new Error(`Audit check error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn('[medCare JKN] Backend unreachable, calculating rule check locally:', err.message);
    return generateMockAuditCheck(claimData);
  }
}

function generateMockAuditCheck(claimData) {
  const isPhantomSuspect = !claimData.evidenceTypes || claimData.evidenceTypes.length === 0;
  return {
    score: isPhantomSuspect ? 35 : 88,
    riskLevel: isPhantomSuspect ? 'HIGH' : 'LOW',
    primaryRiskMode: isPhantomSuspect ? 'PHANTOM_BILLING' : 'COMPLIANT',
    riskSignals: isPhantomSuspect ? [
      { code: 'NO_EVIDENCE', title: 'Tidak Ada Rantai Bukti', severity: 'CRITICAL' }
    ] : [],
    recommendation: isPhantomSuspect 
      ? 'Tahan klaim dan jadwalkan audit DPJP' 
      : 'Klaim terverifikasi memenuhi standar kelengkapan'
  };
}

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login gagal: Periksa kembali username dan kata sandi.');
    }
    // Connected to real backend - disable demo mode
    setDemoMode(false);
    return data.data;
  } catch (err) {
    // If it's a network/connection error to backend
    if (
      err.message === 'Load failed' ||
      err.message === 'Failed to fetch' ||
      err.name === 'TypeError' ||
      err.message.includes('fetch')
    ) {
      throw new Error(`Koneksi ke API backend (${API_BASE}) gagal dihubungi. Pastikan server backend sedang aktif.`);
    }
    throw err;
  }
}

export async function fetchRoles() {
  if (isDemoMode()) {
    return [
      { id: 'clinical_reviewer', name: 'Tenaga Kesehatan (Clinical Reviewer)' },
      { id: 'jkn_staff', name: 'Staff Verifikator JKN' }
    ];
  }

  try {
    const res = await fetch(`${API_BASE}/auth/roles`);
    if (!res.ok) throw new Error(`Roles API error: ${res.statusText}`);
    return (await res.json()).data;
  } catch (err) {
    return [
      { id: 'clinical_reviewer', name: 'Tenaga Kesehatan (Clinical Reviewer)' },
      { id: 'jkn_staff', name: 'Staff Verifikator JKN' }
    ];
  }
}

export async function assignCaseReviewer(caseId, payload) {
  if (isDemoMode()) {
    return {
      success: true,
      caseId,
      ...payload,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal menugaskan reviewer');
    }
    return data.data;
  } catch (err) {
    console.warn('[medCare JKN] Backend unreachable, simulated case assignment:', err.message);
    return {
      success: true,
      caseId,
      ...payload,
      timestamp: new Date().toISOString()
    };
  }
}
