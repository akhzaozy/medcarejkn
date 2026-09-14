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
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login gagal: Periksa kembali username dan kata sandi.');
    }
    // Connected to real backend - disable demo mode
    setDemoMode(false);
    return data.data;
  } catch (err) {
    // If it's an explicit authentication rejection (401/wrong password) from server, re-throw it
    const isNetworkError = 
      err.message === 'Load failed' ||
      err.message === 'Failed to fetch' ||
      err.name === 'TypeError' ||
      err.message.includes('fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('Failed') ||
      err.message.includes('ECONNREFUSED');

    if (!isNetworkError && err.message && !err.message.includes('backend')) {
      throw err;
    }

    // Graceful offline fallback: authenticate locally so demo/presentation never gets blocked
    console.warn('[medCare JKN] Backend unreachable, authenticating locally in demo mode...');
    setDemoMode(true);
    const trimmedUser = (credentials.username || '').trim().toLowerCase();
    const isStaff = trimmedUser.includes('staff') || trimmedUser.includes('fauzi') || trimmedUser.includes('jkn');
    
    let user;
    if (isStaff) {
      user = {
        id: 'usr-staff-001',
        username: 'staff.jkn',
        email: 'staff.jkn@bpjs-kesehatan.go.id',
        name: 'Ahmad Fauzi, S.E.',
        role: 'staff_jkn',
        roleLabel: 'Staff JKN',
        title: 'Staff Verifikator & Triage Klaim BPJS',
        unit: 'Kantor Cabang Utama / Bidang Penjaminan Manfaat',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        capabilities: [
          'Melihat Dashboard Global & Metrik Finansial',
          'Melihat Investigation Queue Seluruh Faskes',
          'Melihat Risk Signal & Disparitas Awal',
          'Membuka & Memverifikasi Berkas Klaim',
          'Mengarahkan & Menugaskan Kasus ke Tenaga Kesehatan'
        ]
      };
    } else if (trimmedUser.includes('budi')) {
      user = {
        id: 'usr-clinician-002',
        username: 'dr.budi',
        email: 'dr.budi@klinik.ac.id',
        name: 'dr. Budi Santoso, Sp.A',
        role: 'clinical_reviewer',
        roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
        title: 'Dokter Verifikator Klinis / Spesialis Anak',
        unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
        capabilities: [
          'Membuka Kasus yang Ditugaskan',
          'Memeriksa Item Klaim & Kode Tindakan Medis',
          'Menelusuri Rantai Bukti (Evidence Chain)',
          'Menganalisis Evidence Gap & Disparitas Tarif',
          'Memberikan Keputusan Akhir (Review Outcome)',
          'Menambahkan Catatan Rekomendasi Klinis'
        ]
      };
    } else if (trimmedUser.includes('ratna')) {
      user = {
        id: 'usr-clinician-003',
        username: 'dr.ratna',
        email: 'dr.ratna@klinik.ac.id',
        name: 'dr. Ratna Dewi, Sp.PD',
        role: 'clinical_reviewer',
        roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
        title: 'Dokter Verifikator Klinis / Spesialis Penyakit Dalam',
        unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
        avatar: 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80',
        capabilities: [
          'Membuka Kasus yang Ditugaskan',
          'Memeriksa Item Klaim & Kode Tindakan Medis',
          'Menelusuri Rantai Bukti (Evidence Chain)',
          'Menganalisis Evidence Gap & Disparitas Tarif',
          'Memberikan Keputusan Akhir (Review Outcome)',
          'Menambahkan Catatan Rekomendasi Klinis'
        ]
      };
    } else {
      user = {
        id: 'usr-clinician-001',
        username: 'dr.anindya',
        email: 'dr.anindya@klinik.ac.id',
        name: 'dr. Anindya Kusuma, Sp.PK',
        role: 'clinical_reviewer',
        roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
        title: 'Dokter Verifikator Klinis / Spesialis Patologi',
        unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        capabilities: [
          'Membuka Kasus yang Ditugaskan',
          'Memeriksa Item Klaim & Kode Tindakan Medis',
          'Menelusuri Rantai Bukti (Evidence Chain)',
          'Menganalisis Evidence Gap & Disparitas Tarif',
          'Memberikan Keputusan Akhir (Review Outcome)',
          'Menambahkan Catatan Rekomendasi Klinis'
        ]
      };
    }

    return {
      token: `mock-jwt-${user.role}-${Date.now()}`,
      user
    };
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
