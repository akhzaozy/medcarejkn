/**
 * NHIS Fraud Detection Engine
 * Evaluates claims based on clinical-demographic consistency, billing anomalies, and enrollment integrity.
 */

// Diagnosis terms incompatible with males
const FEMALE_ONLY_DIAGNOSIS_KEYWORDS = [
  'CYESIS', 'PREGNAN', 'DELIVERY', 'LABOUR', 'LABOR', 'MISCARRIAGE', 
  'CERVICAL CA', 'CA CERVIX', 'CERVIX', 'ENDOMETRIAL', 'UTERINE', 'FIBROID', 
  'OVARIAN', 'VULVOVAGIN', 'VAGINITIS', 'VAGINAL', 'AMENORRHEA', 'AMENORRHOEA', 
  'MENORRHAGIA', 'DYSMENORRHEA', 'DYSMENORRHOEA', 'MASTITIS', 'ECTOPIC', 
  'BLIGHTED OVUM', 'PLACENTA', 'PREECLAMPSIA', 'PREECLAMPIA', 'MYOMECTOMY',
  'MULTIPARA', 'PRIMIPARA', 'PRIMIGRAVIDA', 'NORLYPARA', 'MATERNITY'
];

// Diagnosis terms incompatible with females
const MALE_ONLY_DIAGNOSIS_KEYWORDS = [
  'PROSTATE', 'PROSTRATE', 'BPH', 'ORCHITIS', 'VARICOCELE', 'VARICOLE', 
  'SCROTAL', 'SCROTUM', 'TESTIS', 'TESTICULAR', 'AZOOSPERMIA', 'ERECTILE', 
  'WEAK ERECTION'
];

export function detectNhisFraud(claim) {
  const gender = (claim.gender || claim.GENDER || claim.sex || '').toUpperCase().trim();
  const age = parseFloat(claim.age || claim.AGE || 0);
  const diagnosis = (claim.diagnosis || claim.DIAGNOSIS || '').toUpperCase().trim();
  const amountBilled = parseFloat(claim.amountBilled || claim.amount_billed || claim['Amount Billed'] || claim.total_amount || 0);
  
  const reasons = [];
  let detectedType = 'No Fraud';
  let priority = 'LOW';
  let riskScore = 15;

  // 1. Wrong Diagnosis Detection (Clinical / Demographic Discordance)
  let isWrongDiagnosis = false;
  
  if (gender === 'M' || gender === 'MALE') {
    for (const kw of FEMALE_ONLY_DIAGNOSIS_KEYWORDS) {
      if (diagnosis.includes(kw)) {
        isWrongDiagnosis = true;
        reasons.push(`Ketidaksesuaian gender: Pasien Laki-laki didiagnosis kondisi obstetri/ginekologi (${kw})`);
        break;
      }
    }
  } else if (gender === 'F' || gender === 'FEMALE') {
    for (const kw of MALE_ONLY_DIAGNOSIS_KEYWORDS) {
      if (diagnosis.includes(kw)) {
        isWrongDiagnosis = true;
        reasons.push(`Ketidaksesuaian gender: Pasien Perempuan didiagnosis kondisi urologi/andrologi (${kw})`);
        break;
      }
    }
  }

  // WAX IMPACTION specific clinical coding mismatch
  if (diagnosis.includes('WAX IMPACTION') && (diagnosis.includes('CYESIS') || diagnosis.includes('OLIGOMENORRHAE') || gender === 'M')) {
    isWrongDiagnosis = true;
    reasons.push(`Ketidaksesuaian kode diagnosis: Diagnosis impaksi serumen dicatat bersamaan dengan komorbiditas tidak logis`);
  }

  if (isWrongDiagnosis) {
    detectedType = 'Wrong Diagnosis';
    priority = 'HIGH';
    riskScore = 95;
    return {
      fraudType: detectedType,
      primaryRiskMode: 'WRONG_DIAGNOSIS',
      reviewPriority: priority,
      riskScore,
      reasons,
      confidence: 0.98,
      evidenceGap: amountBilled > 0 ? amountBilled : 5000.0,
      evidenceCoveragePct: 10.0,
      reviewFocus: 'Verifikasi identitas pasien dan rekam medis fisik dokter penanggung jawab terkait validitas diagnosis medis.'
    };
  }

  // 2. Ghost Enrollee Detection (Zero Billed / Non-verified phantom visits)
  if (amountBilled === 0) {
    detectedType = 'Ghost Enrollee';
    priority = 'MEDIUM';
    riskScore = 75;
    reasons.push('Tagihan klaim bernilai 0.0 dengan indikasi kunjungan administratif fiktif (Ghost Enrollee)');
    return {
      fraudType: detectedType,
      primaryRiskMode: 'GHOST_ENROLLEE',
      reviewPriority: priority,
      riskScore,
      reasons,
      confidence: 0.92,
      evidenceGap: 0.0,
      evidenceCoveragePct: 25.0,
      reviewFocus: 'Konfirmasi kehadiran fisik peserta di faskes dan validasi log biometrik/fingerprint encounter BPJS/NHIS.'
    };
  }

  // 3. Phantom Billing Detection (Outlier amount with zero-day length of stay or unverified billing)
  const isHighOutlier = amountBilled > 10000;
  if (isHighOutlier) {
    detectedType = 'Phantom Billing';
    priority = 'HIGH';
    riskScore = 90;
    reasons.push(`Nominal tagihan (Rp ${amountBilled.toLocaleString('id-ID')}) melebihi ambang batas wajar layanan rawat jalan tanpa tindakan spesifik`);
    return {
      fraudType: detectedType,
      primaryRiskMode: 'PHANTOM_BILLING',
      reviewPriority: priority,
      riskScore,
      reasons,
      confidence: 0.94,
      evidenceGap: amountBilled,
      evidenceCoveragePct: 15.0,
      reviewFocus: 'Rekonsiliasi lembar tagihan rumah sakit dengan bukti fisik resep obat dan laporan tindakan operasi/prosedur.'
    };
  }

  // 4. Default: No Fraud Detected
  return {
    fraudType: 'No Fraud',
    primaryRiskMode: 'NO_FRAUD',
    reviewPriority: 'LOW',
    riskScore: 10,
    reasons: ['Klaim konsisten dengan protokol medis dan tarif wajar'],
    confidence: 0.95,
    evidenceGap: 0.0,
    evidenceCoveragePct: 100.0,
    reviewFocus: 'Klaim terverifikasi otomatis. Tidak ditemukan anomali signifikan.'
  };
}
