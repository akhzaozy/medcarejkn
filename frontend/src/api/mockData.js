// Synthetic / Demo Mock Dataset for medCare JKN
// Used when Backend is offline or when running in Demo Mode

export const MOCK_DASHBOARD = {
  claimsAnalyzed: 4538,
  highPriorityCases: 172,
  caseCount: 4336,
  financials: {
    totalBilled: 19987340,
    totalExposure: 22530892
  },
  topHospitals: [
    { name: 'RS Citra Medika', count: 42, exposure: 450000000 },
    { name: 'RSUD Sehat Sentosa', count: 38, exposure: 380000000 },
    { name: 'RS Hermina Utama', count: 29, exposure: 320000000 },
    { name: 'RS Permata Bunda', count: 24, exposure: 240000000 }
  ],
  riskBreakdown: {
    PHANTOM_BILLING: 1820,
    UPCODING: 1240,
    UNNECESSARY_PROCEDURES: 856,
    DUPLICATE_CLAIM: 420
  }
};

export const MOCK_CASES = [
  {
    case_id: 'CASE-PB-001',
    claim_id: 'CLM-2026-00142',
    patient_id: 'PAT-SYN-001',
    primary_risk_mode: 'PHANTOM_BILLING',
    review_priority: 'HIGH',
    case_status: 'OPEN',
    affected_items: 3,
    evidence_gap: 2,
    evidence_coverage_pct: 33.3,
    total_amount: 45000000,
    exposure_amount: 32000000,
    assigned_to: 'dr.anindya',
    assigned_name: 'dr. Anindya Kusuma, Sp.PK',
    created_at: '2026-03-01T08:30:00Z',
    provider_name: 'RS Citra Medika',
    encounter_type: 'RAWAT_INAP',
    sex: 'L',
    age_group: '45-59',
    summary: 'Operasi Laparoskopi Ditagihkan Tanpa Bukti Anastesi & Catatan Bedah'
  },
  {
    case_id: 'CASE-PB-002',
    claim_id: 'CLM-2026-00189',
    patient_id: 'PAT-SYN-002',
    primary_risk_mode: 'PHANTOM_BILLING',
    review_priority: 'HIGH',
    case_status: 'IN_REVIEW',
    affected_items: 2,
    evidence_gap: 2,
    evidence_coverage_pct: 0.0,
    total_amount: 18500000,
    exposure_amount: 18500000,
    assigned_to: 'dr.anindya',
    assigned_name: 'dr. Anindya Kusuma, Sp.PK',
    created_at: '2026-03-02T10:15:00Z',
    provider_name: 'RSUD Sehat Sentosa',
    encounter_type: 'RAWAT_JALAN',
    sex: 'P',
    age_group: '60+',
    summary: 'Tindakan Hemodialisa Fiktif — Log Fingerprint Pasien Tidak Ditemukan'
  },
  {
    case_id: 'CASE-PB-003',
    claim_id: 'CLM-2026-00204',
    patient_id: 'PAT-SYN-003',
    primary_risk_mode: 'UPCODING',
    review_priority: 'MEDIUM',
    case_status: 'OPEN',
    affected_items: 1,
    evidence_gap: 1,
    evidence_coverage_pct: 50.0,
    total_amount: 32000000,
    exposure_amount: 14000000,
    assigned_to: 'dr.budi',
    assigned_name: 'dr. Budi Santoso, Sp.A',
    created_at: '2026-03-03T11:45:00Z',
    provider_name: 'RS Hermina Utama',
    encounter_type: 'RAWAT_INAP',
    sex: 'L',
    age_group: '30-44',
    summary: 'Upcoding Severity Level 3 Tanpa Komplikasi Medis yang Memadai'
  },
  {
    case_id: 'CASE-PB-004',
    claim_id: 'CLM-2026-00255',
    patient_id: 'PAT-SYN-004',
    primary_risk_mode: 'DUPLICATE_CLAIM',
    review_priority: 'LOW',
    case_status: 'CONFIRMED',
    affected_items: 2,
    evidence_gap: 0,
    evidence_coverage_pct: 100.0,
    total_amount: 14000000,
    exposure_amount: 14000000,
    assigned_to: 'dr.ratna',
    assigned_name: 'dr. Ratna Dewi, Sp.PD',
    created_at: '2026-03-04T14:20:00Z',
    provider_name: 'RS Permata Bunda',
    encounter_type: 'RAWAT_JALAN',
    sex: 'P',
    age_group: '18-29',
    summary: 'Duplikasi Tagihan Obat Kemoterapi Rawat Jalan dalam Siklus Sama'
  },
  {
    case_id: 'CASE-PB-005',
    claim_id: 'CLM-2026-00312',
    patient_id: 'PAT-SYN-005',
    primary_risk_mode: 'PHANTOM_BILLING',
    review_priority: 'HIGH',
    case_status: 'OPEN',
    affected_items: 4,
    evidence_gap: 3,
    evidence_coverage_pct: 25.0,
    total_amount: 56000000,
    exposure_amount: 42000000,
    assigned_to: 'dr.anindya',
    assigned_name: 'dr. Anindya Kusuma, Sp.PK',
    created_at: '2026-03-05T09:10:00Z',
    provider_name: 'RS Siloam Graha',
    encounter_type: 'RAWAT_INAP',
    sex: 'L',
    age_group: '60+',
    summary: 'Pemasangan Ring Jantung (Stent) Fiktif Tanpa Arsip Rekaman Angiografi'
  },
  {
    case_id: 'CASE-PB-006',
    claim_id: 'CLM-2026-00388',
    patient_id: 'PAT-SYN-006',
    primary_risk_mode: 'UNNECESSARY_PROCEDURES',
    review_priority: 'MEDIUM',
    case_status: 'OPEN',
    affected_items: 2,
    evidence_gap: 1,
    evidence_coverage_pct: 60.0,
    total_amount: 21500000,
    exposure_amount: 9800000,
    assigned_to: 'dr.budi',
    assigned_name: 'dr. Budi Santoso, Sp.A',
    created_at: '2026-03-06T13:00:00Z',
    provider_name: 'RS Harapan Kita Mandiri',
    encounter_type: 'RAWAT_INAP',
    sex: 'P',
    age_group: '45-59',
    summary: 'Endoskopi Saluran Cerna Berulang Tanpa Indikasi Diagnosis Tambahan'
  },
  {
    case_id: 'CASE-PB-007',
    claim_id: 'CLM-2026-00421',
    patient_id: 'PAT-SYN-007',
    primary_risk_mode: 'PHANTOM_BILLING',
    review_priority: 'HIGH',
    case_status: 'IN_REVIEW',
    affected_items: 3,
    evidence_gap: 2,
    evidence_coverage_pct: 33.0,
    total_amount: 38000000,
    exposure_amount: 28000000,
    assigned_to: 'dr.anindya',
    assigned_name: 'dr. Anindya Kusuma, Sp.PK',
    created_at: '2026-03-07T15:30:00Z',
    provider_name: 'RS Santo Borromeus',
    encounter_type: 'RAWAT_INAP',
    sex: 'L',
    age_group: '30-44',
    summary: 'Klaim Rawat ICU 5 Hari Padahal Pasien Berada di Bangsal Kelas 2'
  },
  {
    case_id: 'CASE-PB-008',
    claim_id: 'CLM-2026-00490',
    patient_id: 'PAT-SYN-008',
    primary_risk_mode: 'PHANTOM_BILLING',
    review_priority: 'HIGH',
    case_status: 'OPEN',
    affected_items: 2,
    evidence_gap: 2,
    evidence_coverage_pct: 0.0,
    total_amount: 26500000,
    exposure_amount: 26500000,
    assigned_to: 'dr.ratna',
    assigned_name: 'dr. Ratna Dewi, Sp.PD',
    created_at: '2026-03-08T10:00:00Z',
    provider_name: 'RS Medika Utama',
    encounter_type: 'RAWAT_JALAN',
    sex: 'P',
    age_group: '60+',
    summary: 'Terapi Radioterapi Ditagihkan Tanpa Log Mesin Linear Accelerator'
  }
];

export const MOCK_USERS = [
  {
    id: 'usr-clinician-001',
    username: 'dr.anindya',
    email: 'dr.anindya@klinik.ac.id',
    password: 'nakes',
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
  },
  {
    id: 'usr-clinician-002',
    username: 'dr.budi',
    email: 'dr.budi@klinik.ac.id',
    password: 'nakes',
    name: 'dr. Budi Santoso, Sp.A',
    role: 'clinical_reviewer',
    roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
    title: 'Dokter Spesialis Anak',
    unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Membuka Kasus yang Ditugaskan',
      'Memeriksa Item Klaim & Kode Tindakan Medis',
      'Menelusuri Rantai Bukti (Evidence Chain)',
      'Menganalisis Evidence Gap & Disparitas Tarif',
      'Memberikan Keputusan Akhir (Review Outcome)',
      'Menambahkan Catatan Rekomendasi Klinis'
    ]
  },
  {
    id: 'usr-clinician-003',
    username: 'dr.ratna',
    email: 'dr.ratna@klinik.ac.id',
    password: 'nakes',
    name: 'dr. Ratna Dewi, Sp.PD',
    role: 'clinical_reviewer',
    roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
    title: 'Dokter Spesialis Penyakit Dalam',
    unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Membuka Kasus yang Ditugaskan',
      'Memeriksa Item Klaim & Kode Tindakan Medis',
      'Menelusuri Rantai Bukti (Evidence Chain)',
      'Menganalisis Evidence Gap & Disparitas Tarif',
      'Memberikan Keputusan Akhir (Review Outcome)',
      'Menambahkan Catatan Rekomendasi Klinis'
    ]
  },
  {
    id: 'usr-staff-001',
    username: 'staff.ahmad',
    email: 'ahmad.fauzi@bpjs-kesehatan.go.id',
    password: 'jkn',
    name: 'Ahmad Fauzi, S.E.',
    role: 'staff_jkn',
    roleLabel: 'Senior Verifikator JKN',
    title: 'Senior Verifikator & Triage Klaim BPJS',
    unit: 'Kedeputian Jaminan Pelayanan Kesehatan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Memantau Antrean Audit Klaim Nasional',
      'Mengambil Alih Kasus (Take Ownership)',
      'Mengirimkan Klarifikasi ke DPJP',
      'Mengunci & Menerbitkan Berita Acara Rekonsiliasi'
    ]
  },
  {
    id: 'usr-staff-002',
    username: 'staff.adit',
    email: 'aditya.pratama@bpjs-kesehatan.go.id',
    password: 'jkn',
    name: 'Aditya Pratama, S.Kep.',
    role: 'staff_jkn',
    roleLabel: 'Verifikator Klaim JKN',
    title: 'Verifikator Klaim & Investigasi Faskes',
    unit: 'Kedeputian Jaminan Pelayanan Kesehatan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Memantau Antrean Audit Klaim Nasional',
      'Mengambil Alih Kasus (Take Ownership)',
      'Mengirimkan Klarifikasi ke DPJP',
      'Menganalisis Kesenjangan Bukti'
    ]
  }
];

// Persistent dynamic state store for cases during session
export const CASE_DYNAMIC_STORE = {};

export function calculateCaseMlRecommendation(caseObj, uploadedEvidences = [], disputes = []) {
  const hasUploadedEvidence = uploadedEvidences && uploadedEvidences.length > 0;
  const hasHospitalDispute = disputes && disputes.some(d => d.role?.includes('Fasilitas Kesehatan') || d.role?.includes('Pihak Faskes') || d.role?.includes('DPJP') || d.role?.includes('Dokter'));

  if (hasUploadedEvidence) {
    // Evidence attached! Anomaly resolved or greatly reduced
    return {
      suggestedOutcome: 'NOT_CONFIRMED',
      confidenceScore: 13.8,
      modelName: 'Medcare-Reconcile-HybridRule-v4.2 (Re-evaluated)',
      predictedRiskLevel: 'LOW',
      suggestedNotes: `Inferensi AI (Re-evaluasi Berkas): Bukti fisik pendukung rekam medis (${uploadedEvidences.map(e => e.title).join(', ')}) telah diverifikasi keabsahannya. Celah bukti kuantitas telah terpenuhi (Coverage 100%). Rekomendasi ML: Klaim valid dan dapat disetujui.`,
      drivers: [
        `Kesenjangan Bukti (Evidence Gap): 0 item (Terselesaikan)`,
        `Validitas Berkas Fisik: ${uploadedEvidences.length} dokumen baru terverifikasi SHA-256`,
        `Kepatuhan Regulasi PMK No. 16/2019: Terpenuhi`
      ]
    };
  }

  if (hasHospitalDispute) {
    // Dispute received from hospital, but awaiting full verification
    return {
      suggestedOutcome: 'NEEDS_MORE_EVIDENCE',
      confidenceScore: 61.4,
      modelName: 'Medcare-Reconcile-HybridRule-v4.2 (Re-evaluated)',
      predictedRiskLevel: 'MEDIUM',
      suggestedNotes: `Inferensi AI (Re-evaluasi Sanggahan): Klarifikasi resmi dari pihak faskes/DPJP telah diterima. Namun dokumen fisik asli berstempel basah/tanda tangan basah DPJP masih belum lengkap di arsip digital. Rekomendasi ML: Mintakan konfirmasi berkas fisik penunjang.`,
      drivers: [
        `Tanggapan resmi faskes: ${disputes[0]?.title || 'Sanggahan Diterima'}`,
        `Tingkat Ketercakupan Dokumen Saat Ini: ${caseObj.evidence_coverage_pct || 33}%`,
        `Status Rekonsiliasi: Dialog aktif antara Verifikator & DPJP`
      ]
    };
  }

  // Default initial assessment before rebuttal or new evidence
  if (caseObj.primary_risk_mode === 'PHANTOM_BILLING') {
    return {
      suggestedOutcome: 'NEEDS_MORE_EVIDENCE',
      confidenceScore: 94.6,
      modelName: 'Medcare-Reconcile-HybridRule-v4.2',
      predictedRiskLevel: caseObj.review_priority || 'HIGH',
      suggestedNotes: `Berdasarkan inferensi model Machine Learning, teridentifikasi indikasi Phantom Billing dengan skor keyakinan 94.6%. Terdapat ${caseObj.affected_items || 2} item tagihan tanpa berkas anestesi/bedah terarsip (Evidence Coverage: ${caseObj.evidence_coverage_pct || 33}%). Direkomendasikan meminta klarifikasi fisik dari Komite Medik faskes.`,
      drivers: [
        `Tingkat Ketercakupan Dokumen: ${caseObj.evidence_coverage_pct || 33}% (Batas Minimum Aman: 80%)`,
        `Disparitas Biaya Tagihan: Rp ${Number(caseObj.exposure_amount || 0).toLocaleString('id-ID')}`,
        `Ketiadaan Arsip Rekam Anestesi Spesialis & Laporan Pembedahan Kamar Operasi di ${caseObj.provider_name}`
      ]
    };
  }

  if (caseObj.primary_risk_mode === 'WRONG_DIAGNOSIS') {
    return {
      suggestedOutcome: 'NEEDS_MORE_EVIDENCE',
      confidenceScore: 89.2,
      modelName: 'Medcare-Reconcile-HybridRule-v4.2',
      predictedRiskLevel: caseObj.review_priority || 'HIGH',
      suggestedNotes: `Inferensi AI mendeteksi inkonsistensi koding klinis antara diagnosa utama klaim dengan resume terapi penunjang di ${caseObj.provider_name}. Skor keyakinan anomali 89.2%. Disarankan verifikasi diagnosa oleh Dokter DPJP Spesialis.`,
      drivers: [
        `Inkonsistensi Diagnosa INA-CBG terhadap Rekam Medis CPPT`,
        `Disparitas Biaya: Rp ${Number(caseObj.exposure_amount || 0).toLocaleString('id-ID')}`,
        `Hasil pemeriksaan penunjang kritis belum mencerminkan tingkat keparahan klaim`
      ]
    };
  }

  // Ghost enrollee or general
  return {
    suggestedOutcome: 'CONFIRMED',
    confidenceScore: 96.2,
    modelName: 'Medcare-Reconcile-HybridRule-v4.2',
    predictedRiskLevel: 'CRITICAL',
    suggestedNotes: `Inferensi AI mendeteksi potensi Ghost Enrollee pada faskes ${caseObj.provider_name}. Tidak ditemukan log presensi biometrik sidik jari pasien pada tanggal pelayanan. Skor anomali 96.2%.`,
    drivers: [
      `Presensi Biometrik Pasien: 0 log tercatat di server fingerprint BPJS`,
      `Validitas Kependudukan Dukcapil: Perlu klarifikasi identitas fisik`,
      `Disparitas Tagihan: Rp ${Number(caseObj.exposure_amount || 0).toLocaleString('id-ID')}`
    ]
  };
}

export function getMockCaseDetails(caseId) {
  const c = MOCK_CASES.find(item => item.case_id === caseId) || MOCK_CASES[0];
  
  if (!CASE_DYNAMIC_STORE[caseId]) {
    // Initialize case state: OPEN cases have NO pre-existing fake disputes!
    const isPhantom = c.primary_risk_mode === 'PHANTOM_BILLING';
    const isWrong = c.primary_risk_mode === 'WRONG_DIAGNOSIS';
    const isGhost = c.primary_risk_mode === 'GHOST_ENROLLEE';

    let primaryDiag = 'K35.8 (Apendisitis Akut Lainnya)';
    let primaryProc = '47.01 (Apendektomi Laparoskopi)';
    let claimItems = [];
    let evidenceLinks = [];

    if (isPhantom) {
      primaryDiag = 'K35.8 (Apendisitis Akut Lainnya)';
      primaryProc = '47.01 (Apendektomi Laparoskopi)';
      claimItems = [
        {
          item_id: 'ITM-001',
          item_code: 'PROC-47.01',
          item_description: 'Tindakan Laparoskopi Apendektomi',
          item_type: 'PROCEDURE',
          quantity: 1,
          unit_price: 24500000,
          total_price: 24500000,
          evidence_status: 'MISSING',
          disparity_note: 'Tidak ada laporan pembedahan / video intraoperatif bertanda tangan DPJP bedah'
        },
        {
          item_id: 'ITM-002',
          item_code: 'ANASTH-01',
          item_description: 'Pelayanan Anestesi Umum Inhalasi',
          item_type: 'ANESTHESIA',
          quantity: 1,
          unit_price: 6800000,
          total_price: 6800000,
          evidence_status: 'MISSING',
          disparity_note: 'Lembar catatan hemodinamik pemulihan anestesi kosong'
        },
        {
          item_id: 'ITM-003',
          item_code: 'ROOM-BEDAH',
          item_description: 'Rawat Inap Ruang Perawatan Bedah',
          item_type: 'ACCOMMODATION',
          quantity: 3,
          unit_price: 1400000,
          total_price: 4200000,
          evidence_status: 'VERIFIED',
          disparity_note: 'Catatan perawat bangsal reguler terverifikasi'
        }
      ];
      evidenceLinks = [
        {
          evidence_id: 'EVD-001',
          evidence_type: 'SURGICAL_REPORT',
          title: `Laporan Operasi Bedah (${c.provider_name})`,
          status: 'UNAVAILABLE',
          note: 'Dokumen fisik tidak ditemukan dalam arsip digital faskes',
          confidence_score: 0.10
        },
        {
          evidence_id: 'EVD-002',
          evidence_type: 'ANESTHESIA_LOG',
          title: 'Catatan Rekam Anestesi',
          status: 'UNAVAILABLE',
          note: 'Tidak ada tanda tangan dokter spesialis anestesiologi',
          confidence_score: 0.05
        },
        {
          evidence_id: 'EVD-003',
          evidence_type: 'NURSING_NOTE',
          title: 'Catatan Keperawatan Rawat Inap (CPPT)',
          status: 'AVAILABLE',
          note: 'Catatan infus dan vital sign bangsal reguler lengkap',
          confidence_score: 0.95
        }
      ];
    } else if (isWrong) {
      primaryDiag = 'J45.9 (Asma Bronkial Eksaserbasi Akut Berat)';
      primaryProc = '96.71 (Continuous Mechanical Ventilation < 96 jam)';
      claimItems = [
        {
          item_id: 'ITM-001',
          item_code: 'ICU-VENT-01',
          item_description: 'Pelayanan Rawat Intensif ICU dengan Ventilator Mekanik',
          item_type: 'ACCOMMODATION',
          quantity: 3,
          unit_price: 5500000,
          total_price: 16500000,
          evidence_status: 'MISSING',
          disparity_note: 'Hasil Analisa Gas Darah (AGD) tidak menunjukkan gagal nafas akut'
        },
        {
          item_id: 'ITM-002',
          item_code: 'MED-NEBUL-02',
          item_description: 'Terapi Inhalasi & Bronkodilator Kontinu',
          item_type: 'DRUG',
          quantity: 6,
          unit_price: 450000,
          total_price: 2700000,
          evidence_status: 'MISSING',
          disparity_note: 'Hanya tercatat 1 kali nebulisasi di IGD sebelum rawat inap'
        },
        {
          item_id: 'ITM-003',
          item_code: 'XRAY-THORAX',
          item_description: 'Pemeriksaan Radiologi Foto Rontgen Thorax PA',
          item_type: 'DIAGNOSTIC',
          quantity: 1,
          unit_price: 750000,
          total_price: 750000,
          evidence_status: 'VERIFIED',
          disparity_note: 'Foto rontgen terarsip, cor dan pulmo batas normal'
        }
      ];
      evidenceLinks = [
        {
          evidence_id: 'EVD-001',
          evidence_type: 'LAB_RESULT',
          title: `Hasil Laboratorium Analisa Gas Darah (${c.provider_name})`,
          status: 'UNAVAILABLE',
          note: 'Tidak ditemukan bukti AGD yang mendukung indikasi ventilator',
          confidence_score: 0.15
        },
        {
          evidence_id: 'EVD-002',
          evidence_type: 'NURSING_NOTE',
          title: 'Lembar Observasi Ventilator ICU',
          status: 'UNAVAILABLE',
          note: 'Data PEEP & fraksi oksigen tidak terekam pada rekam medis',
          confidence_score: 0.08
        },
        {
          evidence_id: 'EVD-003',
          evidence_type: 'RADIOLOGY_IMAGE',
          title: 'Hasil Foto Rontgen Thorax PA',
          status: 'AVAILABLE',
          note: 'Hasil radiologi normal, tidak mendukung status asma berat mengancam jiwa',
          confidence_score: 0.90
        }
      ];
    } else {
      // Ghost Enrollee
      primaryDiag = 'N18.5 (Gagal Ginjal Kronik Stadium 5)';
      primaryProc = '39.95 (Hemodialisis Berkala)';
      claimItems = [
        {
          item_id: 'ITM-001',
          item_code: 'HD-REG-01',
          item_description: 'Paket Tindakan Hemodialisis Rutin',
          item_type: 'PROCEDURE',
          quantity: 1,
          unit_price: 4950000,
          total_price: 4950000,
          evidence_status: 'MISSING',
          disparity_note: 'Log mesin dialisis faskes tidak mencatat identitas dialyzer pasien'
        },
        {
          item_id: 'ITM-002',
          item_code: 'PRESENSI-FINGER',
          item_description: 'Validasi Biometrik Presensi Sidik Jari Pasien',
          item_type: 'ADMINISTRATIVE',
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          evidence_status: 'MISSING',
          disparity_note: 'Tidak ada rekaman sidik jari pasien pada mesin presensi elektronik faskes'
        },
        {
          item_id: 'ITM-003',
          item_code: 'MED-EPO-3000',
          item_description: 'Paket Obat Eritropoietin (EPO) 3000 IU',
          item_type: 'DRUG',
          quantity: 2,
          unit_price: 850000,
          total_price: 1700000,
          evidence_status: 'MISSING',
          disparity_note: 'Formulir serah terima farmasi tanpa tanda tangan penerima'
        }
      ];
      evidenceLinks = [
        {
          evidence_id: 'EVD-001',
          evidence_type: 'PATIENT_SIGNATURE',
          title: 'Presensi Biometrik Sidik Jari Pasien (Fingerprint BPJS)',
          status: 'UNAVAILABLE',
          note: 'Tidak ada log presensi sidik jari pada tanggal pelayanan klaim',
          confidence_score: 0.02
        },
        {
          evidence_id: 'EVD-002',
          evidence_type: 'MEDICAL_RECORD',
          title: 'Log Operasional Mesin Hemodialisis',
          status: 'UNAVAILABLE',
          note: 'Nomor seri mesin tidak tercatat di rekam medis digital',
          confidence_score: 0.05
        },
        {
          evidence_id: 'EVD-003',
          evidence_type: 'ADMINISTRATIVE',
          title: 'Surat Rujukan Berjenjang FKTP',
          status: 'AVAILABLE',
          note: 'Surat rujukan aktif dan terdaftar di sistem V-Claim',
          confidence_score: 0.92
        }
      ];
    }

    // Default disputes: empty for OPEN cases! Only set if case was already in review
    let initialDisputes = [];
    if (c.case_status === 'IN_REVIEW' || c.case_status === 'RECONCILIATION') {
      initialDisputes = [
        {
          id: `DSP-${caseId.replace(/[^0-9]/g, '') || '01'}`,
          actor: `Komite Medik ${c.provider_name}`,
          role: 'Fasilitas Kesehatan (Rumah Sakit)',
          date: '2026-03-03T11:20:00Z',
          status: 'MENUNGGU_VERIFIKASI',
          title: `Klarifikasi Prosedur Medis di ${c.provider_name}`,
          content: `Menanggapi audit klaim pada kasus ${c.case_id}, pelayanan medis telah diberikan sesuai standar profesi di ${c.provider_name}. Berkas rekam medis manual saat ini sedang dalam proses pemindahan dari instalasi terkait.`,
          attachments: [
            { name: `Surat_Pengantar_Klarifikasi_${c.provider_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, size: '2.1 MB', type: 'PDF' }
          ]
        }
      ];
    }

    CASE_DYNAMIC_STORE[caseId] = {
      handledBy: c.assigned_to ? (c.assigned_to.includes('budi') ? 'dr. Budi Santoso, Sp.A' : c.assigned_to.includes('ratna') ? 'dr. Ratna Dewi, Sp.PD' : 'dr. Anindya Kusuma, Sp.PK') : null,
      staffHandler: null,
      primaryDiagnosis: primaryDiag,
      primaryProcedure: primaryProc,
      claimItems,
      evidenceLinks,
      disputes: initialDisputes,
      uploadedEvidences: [],
      auditLogs: [
        {
          log_id: 'LOG-001',
          action: 'SYSTEM_DETECTION',
          actor: 'Sistem Deteksi Anomali medCare JKN',
          timestamp: '2026-03-01T08:30:00Z',
          detail: `Kasus diidentifikasi berisiko ${c.primary_risk_mode} dengan nilai eksposur Rp ${Number(c.exposure_amount || 0).toLocaleString('id-ID')}`
        }
      ]
    };
  }

  const stored = CASE_DYNAMIC_STORE[caseId];
  const mlRec = calculateCaseMlRecommendation(c, stored.uploadedEvidences, stored.disputes);

  return {
    case: {
      ...c,
      patient_id: c.patient_id || 'PAT-SYN-001',
      service_date: c.service_date || '2026-02-24',
      admission_date: '2026-02-24',
      discharge_date: '2026-02-28',
      los: 4,
      tariff_ina_cbg: c.total_amount * 0.7,
      disparity_amount: c.exposure_amount,
      hospital_class: 'KELAS_B',
      primary_diagnosis: stored.primaryDiagnosis,
      secondary_diagnoses: ['E11.9 (Diabetes Melitus Tipe 2)', 'I10 (Hipertensi Esensial)'],
      primary_procedure: stored.primaryProcedure,
      secondary_procedures: ['89.52 (Elektrokardiogram)', '99.29 (Injeksi Obat)'],
      handled_by: stored.handledBy,
      staff_handler: stored.staffHandler
    },
    claimItems: stored.claimItems,
    evidenceLinks: [
      ...stored.uploadedEvidences,
      ...stored.evidenceLinks
    ],
    riskSignals: [
      {
        signal_id: 'SIG-001',
        severity: 'CRITICAL',
        code: c.primary_risk_mode,
        title: `Deteksi Anomali ${c.primary_risk_mode}`,
        description: `Disparitas berkas pendukung pada ${c.provider_name} mencapai Rp ${Number(c.exposure_amount || 0).toLocaleString('id-ID')}.`
      }
    ],
    reviewOutcomes: [],
    auditLogs: stored.auditLogs,
    mlRecommendation: mlRec,
    disputes: stored.disputes
  };
}

export const MOCK_VALIDATION = {
  f1Score: 0.942,
  precision: 0.958,
  recall: 0.927,
  accuracy: 0.961,
  totalAudited: 4538,
  reconciledCount: 4210,
  falsePositiveRate: 0.042,
  modelName: 'Medcare-Reconcile-RuleEngine-v4.2',
  lastBenchmarkRun: '2026-03-10T12:00:00Z',
  rulePerformance: [
    { rule: 'RULE-01: Phantom Billing Surgery Gap', detected: 1820, accuracy: '98.2%' },
    { rule: 'RULE-02: Upcoding Severity Inconsistency', detected: 1240, accuracy: '94.5%' },
    { rule: 'RULE-03: Duplicate Chemotherapy Claim', detected: 420, accuracy: '99.1%' },
    { rule: 'RULE-04: Unnecessary Repeated Endoscopy', detected: 856, accuracy: '91.8%' }
  ]
};
