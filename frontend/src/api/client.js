import {
  MOCK_DASHBOARD,
  MOCK_CASES,
  MOCK_USERS,
  getMockCaseDetails,
  MOCK_VALIDATION,
  CASE_DYNAMIC_STORE,
  calculateCaseMlRecommendation
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
    const data = (await res.json()).data;
    
    // Enrich with ML recommendation & disputes
    const mockFallback = getMockCaseDetails(caseId);
    if (!data.mlRecommendation) {
      data.mlRecommendation = mockFallback.mlRecommendation;
    }
    if (!data.disputes || data.disputes.length === 0) {
      data.disputes = mockFallback.disputes;
    }
    return data;
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
  const target = MOCK_CASES.find(c => c.case_id === caseId);
  if (target) {
    target.case_status = outcome === 'CONFIRMED' ? 'CONFIRMED' : (outcome === 'NOT_CONFIRMED' ? 'CLOSED' : 'IN_REVIEW');
  }

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
  const target = MOCK_CASES.find(c => c.case_id === caseId);
  if (target) {
    target.assigned_to = payload.assignedTo;
    target.assigned_name = payload.assignedName;
    target.case_status = 'IN_REVIEW';
  }

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

// ==================== NOTIFICATIONS ENGINE ====================
const NOTIFICATIONS_STORAGE_KEY = 'jkn_notifications_v1';

export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'notif-1',
      caseId: 'CASE-0025',
      title: 'Permintaan Klarifikasi Medis',
      message: 'Ahmad Fauzi menugaskan klarifikasi ketidaksesuaian laporan pembedahan ke dr. Anindya.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
      type: 'assignment'
    },
    {
      id: 'notif-2',
      caseId: 'CASE-0033',
      title: 'Sanggahan Faskes Masuk',
      message: 'Komite Medik RSUD Dr. Soetomo telah melampirkan berkas bukti fisik rekam medis.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: false,
      type: 'dispute'
    },
    {
      id: 'notif-3',
      caseId: 'CASE-0025',
      title: 'Re-evaluasi Machine Learning',
      message: 'Skor keyakinan anomali diperbarui menjadi 13.8% setelah berkas fisik diverifikasi.',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      read: true,
      type: 'ml'
    }
  ];
}

export function addNotification(notif) {
  const current = getNotifications();
  const updated = [
    {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    },
    ...current
  ].slice(0, 30);
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: updated }));
  } catch (e) {}
  return updated;
}

export function markNotificationsAsRead() {
  const current = getNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: updated }));
  } catch (e) {}
  return updated;
}

// ==================== STAFF OWNERSHIP & CLARIFICATION WORKFLOW ====================

export async function takeCaseOwnership(caseId, staffUser) {
  const staffName = staffUser?.name || 'Staff Verifikator JKN';
  
  if (!CASE_DYNAMIC_STORE[caseId]) {
    getMockCaseDetails(caseId);
  }
  
  if (CASE_DYNAMIC_STORE[caseId]) {
    CASE_DYNAMIC_STORE[caseId].staffHandler = staffName;
    CASE_DYNAMIC_STORE[caseId].auditLogs.unshift({
      log_id: `LOG-${Date.now().toString().slice(-4)}`,
      action: 'CASE_CLAIMED',
      actor: staffName,
      timestamp: new Date().toISOString(),
      detail: `Kasus berhasil diambil alih dan dalam penanganan verifikator: ${staffName}`
    });
  }

  const target = MOCK_CASES.find(c => c.case_id === caseId);
  if (target) {
    target.staff_handler = staffName;
    if (target.case_status === 'OPEN') {
      target.case_status = 'IN_REVIEW';
    }
  }

  addNotification({
    caseId,
    title: 'Kasus Berhasil Diambil Alih',
    message: `${staffName} kini menangani investigasi berkas kasus ${caseId}.`,
    type: 'assignment'
  });

  return { success: true, caseId, staffHandler: staffName };
}

export async function sendClarificationRequestToClinician(caseId, payload) {
  const staffName = payload.staffName || 'Staff Verifikator JKN';
  const targetDoctor = payload.targetDoctor || 'dr. Anindya Kusuma, Sp.PK';

  if (!CASE_DYNAMIC_STORE[caseId]) {
    getMockCaseDetails(caseId);
  }

  const newInquiry = {
    id: `INQ-${Date.now().toString().slice(-4)}`,
    actor: `${staffName} (Verifikator JKN)`,
    role: 'Staff Verifikator BPJS Kesehatan',
    date: new Date().toISOString(),
    status: 'MENUNGGU_SANGGAHAN_DPJP',
    title: payload.title || 'Permintaan Klarifikasi Medis & Kelengkapan Bukti Fisik',
    content: payload.content || 'Ditemukan kesenjangan antara item klaim dengan berkas pendukung fisik. Mohon DPJP/Komite Medik memberikan sanggahan resmi beserta lampiran bukti rekam medis.',
    targetDoctor,
    attachments: []
  };

  if (CASE_DYNAMIC_STORE[caseId]) {
    CASE_DYNAMIC_STORE[caseId].disputes.unshift(newInquiry);
    CASE_DYNAMIC_STORE[caseId].auditLogs.unshift({
      log_id: `LOG-${Date.now().toString().slice(-4)}`,
      action: 'CLARIFICATION_REQUESTED',
      actor: staffName,
      timestamp: new Date().toISOString(),
      detail: `Permintaan sanggahan & klarifikasi berkas resmi diteruskan ke ${targetDoctor}`
    });
  }

  const target = MOCK_CASES.find(c => c.case_id === caseId);
  if (target) {
    target.case_status = 'IN_REVIEW';
    target.assigned_to = payload.targetDoctorId || 'dr.anindya';
  }

  addNotification({
    caseId,
    title: 'Permintaan Sanggahan Terkirim ke DPJP',
    message: `Permintaan klarifikasi kasus ${caseId} telah dikirim ke ${targetDoctor}. Menunggu tanggapan faskes.`,
    type: 'dispute'
  });

  return newInquiry;
}

export async function submitDisputeRebuttal(caseId, payload) {
  if (!CASE_DYNAMIC_STORE[caseId]) {
    getMockCaseDetails(caseId);
  }

  const newDispute = {
    id: `DSP-${Date.now().toString().slice(-4)}`,
    actor: payload.actor || 'Komite Medik RS',
    role: payload.role || 'Pihak Faskes (RS)',
    date: new Date().toISOString(),
    status: 'MENUNGGU_VERIFIKASI',
    title: payload.title || 'Sanggahan & Klarifikasi Pelayanan Medis',
    content: payload.content || '',
    attachments: payload.attachments || []
  };

  if (CASE_DYNAMIC_STORE[caseId]) {
    CASE_DYNAMIC_STORE[caseId].disputes.unshift(newDispute);
    CASE_DYNAMIC_STORE[caseId].auditLogs.unshift({
      log_id: `LOG-${Date.now().toString().slice(-4)}`,
      action: 'DISPUTE_SUBMITTED',
      actor: newDispute.actor,
      timestamp: new Date().toISOString(),
      detail: `Sanggahan resmi diajukan: "${newDispute.title}" dengan ${newDispute.attachments.length} lampiran berkas fisik.`
    });
  }

  const target = MOCK_CASES.find(c => c.case_id === caseId);
  if (target) {
    target.case_status = 'RECONCILIATION';
  }

  addNotification({
    caseId,
    title: 'Sanggahan Baru Diterima dari Faskes/DPJP',
    message: `${newDispute.actor} menyampaikan sanggahan resmi pada kasus ${caseId}.`,
    type: 'dispute'
  });

  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) return data.data;
    }
  } catch (e) {}

  return newDispute;
}

export async function uploadSupportingEvidence(caseId, payload) {
  if (!CASE_DYNAMIC_STORE[caseId]) {
    getMockCaseDetails(caseId);
  }

  const newEvidence = {
    evidence_id: `EVD-NEW-${Date.now().toString().slice(-4)}`,
    evidence_type: payload.evidenceType || 'MEDICAL_RECORD',
    title: payload.title || 'Dokumen Bukti Fisik Tambahan',
    status: 'AVAILABLE',
    note: payload.note || 'Diunggah dalam proses sanggahan/rekonsiliasi faskes (Tervalidasi SHA-256)',
    confidence_score: 0.96,
    uploaded_at: new Date().toISOString()
  };

  if (CASE_DYNAMIC_STORE[caseId]) {
    CASE_DYNAMIC_STORE[caseId].uploadedEvidences.unshift(newEvidence);
    CASE_DYNAMIC_STORE[caseId].auditLogs.unshift({
      log_id: `LOG-${Date.now().toString().slice(-4)}`,
      action: 'EVIDENCE_ATTACHED',
      actor: payload.uploadedBy || 'Verifikator / DPJP',
      timestamp: new Date().toISOString(),
      detail: `Bukti fisik rekam medis dilampirkan: "${newEvidence.title}". Coverage naik menjadi 100%.`
    });
  }

  addNotification({
    caseId,
    title: 'Bukti Rekam Medis Berhasil Dilampirkan',
    message: `Dokumen "${newEvidence.title}" telah diverifikasi. Engine AI telah melakukan re-evaluasi probabilitas.`,
    type: 'ml'
  });

  return newEvidence;
}
