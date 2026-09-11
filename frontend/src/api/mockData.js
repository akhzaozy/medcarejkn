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
    username: 'staff.jkn',
    email: 'ahmad.fauzi@bpjs-kesehatan.go.id',
    password: 'jkn',
    name: 'Ahmad Fauzi, S.E.',
    role: 'jkn_staff',
    roleLabel: 'Verifikator JKN Pusat',
    title: 'Staff Verifikator Klaim BPJS Kesehatan',
    unit: 'Kedeputian Jaminan Pelayanan Kesehatan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Memantau Antrean Audit Klaim Nasional',
      'Melakukan Penugasan Berkas ke DPJP',
      'Mengunci & Menerbitkan Berita Acara Rekonsiliasi',
      'Akses Rekapitulasi Potensi Fraud Faskes'
    ]
  }
];

export function getMockCaseDetails(caseId) {
  const c = MOCK_CASES.find(item => item.case_id === caseId) || MOCK_CASES[0];
  return {
    case: {
      ...c,
      admission_date: '2026-02-24',
      discharge_date: '2026-02-28',
      los: 4,
      tariff_ina_cbg: c.total_amount * 0.7,
      disparity_amount: c.exposure_amount,
      hospital_class: 'KELAS_B',
      primary_diagnosis: 'K35.8 (Apendisitis Akut Lainnya)',
      secondary_diagnoses: ['E11.9 (Diabetes Melitus Tipe 2)', 'I10 (Hipertensi Esensial)'],
      primary_procedure: '47.01 (Apendektomi Laparoskopi)',
      secondary_procedures: ['89.52 (Elektrokardiogram)', '99.29 (Injeksi Antibiotik)']
    },
    claimItems: [
      {
        item_id: 'ITM-001',
        item_code: 'PROC-47.01',
        item_description: 'Tindakan Laparoskopi Apendektomi',
        item_type: 'PROCEDURE',
        quantity: 1,
        unit_price: 28000000,
        total_price: 28000000,
        evidence_status: 'MISSING',
        disparity_note: 'Tidak ada laporan pembedahan / video laparoskopi terarsip'
      },
      {
        item_id: 'ITM-002',
        item_code: 'ANASTH-01',
        item_description: 'Pelayanan Anestesi Umum Inhalasi',
        item_type: 'ANESTHESIA',
        quantity: 1,
        unit_price: 7000000,
        total_price: 7000000,
        evidence_status: 'MISSING',
        disparity_note: 'Lembar pemantauan tanda vital kamar operasi kosong'
      },
      {
        item_id: 'ITM-003',
        item_code: 'ROOM-VIP',
        item_description: 'Rawat Inap Ruang Khusus Isolasi Bedah',
        item_type: 'ACCOMMODATION',
        quantity: 4,
        unit_price: 2500000,
        total_price: 10000000,
        evidence_status: 'VERIFIED',
        disparity_note: 'Tercatat di sistem administrasi ruang rawat'
      }
    ],
    evidenceLinks: [
      {
        evidence_id: 'EVD-001',
        evidence_type: 'SURGICAL_REPORT',
        title: 'Laporan Operasi Bedah',
        status: 'UNAVAILABLE',
        note: 'Dokumen tidak ditemukan dalam arsip rekam medis elektronik RS',
        confidence_score: 0.12
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
        title: 'Catatan Keperawatan Rawat Inap',
        status: 'AVAILABLE',
        note: 'Catatan infus dan vital sign bangsal reguler lengkap',
        confidence_score: 0.95
      }
    ],
    riskSignals: [
      {
        signal_id: 'SIG-001',
        severity: 'CRITICAL',
        code: 'PHANTOM_SURGERY',
        title: 'Tindakan Bedah Mayor Tanpa Catatan Anestesi',
        description: 'Tindakan invasif dilaporkan tapi tidak ada bukti pembiusan yang sah.'
      },
      {
        signal_id: 'SIG-002',
        severity: 'HIGH',
        code: 'BILLING_GAP',
        title: 'Disparitas Tarif Melebihi Standar INA-CBG',
        description: 'Selisih tagihan faskes dengan bukti pendukung mencapai Rp 32.000.000.'
      }
    ],
    reviewOutcomes: [
      {
        outcome_id: 'OUT-001',
        reviewer_id: 'dr. Anindya Kusuma, Sp.PK',
        outcome: 'NEEDS_MORE_EVIDENCE',
        notes: 'Meminta konfirmasi rekam medis fisik dari komite medik RS terkait bukti anastesi.',
        created_at: '2026-03-02T14:30:00Z'
      }
    ],
    auditLogs: [
      {
        log_id: 'LOG-001',
        action: 'CASE_ASSIGNED',
        actor: 'Sistem Deteksi Otomatis',
        timestamp: '2026-03-01T08:30:00Z',
        detail: 'Kasus ditugaskan otomatis ke dr. Anindya Kusuma, Sp.PK'
      },
      {
        log_id: 'LOG-002',
        action: 'EVIDENCE_AUDITED',
        actor: 'dr. Anindya Kusuma, Sp.PK',
        timestamp: '2026-03-02T14:30:00Z',
        detail: 'Hasil telaah awal: Perlu bukti tambahan rekam medis'
      }
    ]
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
