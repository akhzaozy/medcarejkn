const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

export async function fetchDashboard(params = {}) {
  const query = new URLSearchParams();
  if (params.assignedTo) query.append('assignedTo', params.assignedTo);
  if (params.role) query.append('role', params.role);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/dashboard${qStr}`);
  if (!res.ok) throw new Error(`Dashboard API error: ${res.statusText}`);
  return (await res.json()).data;
}

export async function fetchCases(filters = {}) {
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
  const json = await res.json();
  return json;
}

export async function fetchCaseDetails(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Case details error: ${res.statusText}`);
  return (await res.json()).data;
}

export async function fetchCaseEvidence(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/evidence`);
  if (!res.ok) throw new Error(`Case evidence error: ${res.statusText}`);
  return (await res.json()).data;
}

export async function submitReviewOutcome(caseId, { outcome, notes, reviewerId = 'reviewer-001' }) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/outcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome, notes, reviewerId })
  });
  if (!res.ok) throw new Error(`Submit outcome error: ${res.statusText}`);
  return (await res.json()).data;
}

export async function triggerAnalysis() {
  const res = await fetch(`${API_BASE}/analysis/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Trigger analysis error: ${res.statusText}`);
  return (await res.json()).data;
}

export async function fetchValidationBenchmark(refresh = false) {
  const res = await fetch(`${API_BASE}/validation?refresh=${refresh}`);
  if (!res.ok) throw new Error(`Validation API error: ${res.statusText}`);
  return (await res.json()).data;
}

export async function auditCheckClaim(claimData) {
  const res = await fetch(`${API_BASE}/claims/audit-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claimData)
  });
  if (!res.ok) throw new Error(`Audit check error: ${res.statusText}`);
  return (await res.json()).data;
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
    return data.data;
  } catch (err) {
    if (err.message === 'Load failed' || err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(`Koneksi ke API backend (${API_BASE}) gagal dihubungi. Pastikan server backend sedang aktif.`);
    }
    throw err;
  }
}

export async function fetchRoles() {
  const res = await fetch(`${API_BASE}/auth/roles`);
  if (!res.ok) throw new Error(`Roles API error: ${res.statusText}`);
  return (await res.json()).data;
}

export async function assignCaseReviewer(caseId, payload) {
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
}
