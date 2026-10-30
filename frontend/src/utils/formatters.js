/**
 * Medical & Audit Terminology Formatters
 * Replaces raw enums and AI-style text with professional Indonesian clinical audit terms.
 */

export const RISK_MODE_LABELS = {
  'PHANTOM_BILLING': 'Indikasi Phantom Billing',
  'UPCODING': 'Indikasi Upcoding',
  'EVIDENCE_REVIEW': 'Kesenjangan Bukti Layanan',
  'FOCUS': 'Semua Fokus Utama',
  'UNAVAILABLE_EVIDENCE': 'Berkas Fisik Belum Tersedia',
  'PATTERN_REVIEW': 'Tinjauan Pola Faskes',
  'WRONG_DIAGNOSIS': 'Ketidaksesuaian Diagnosa',
  'GHOST_ENROLLEE': 'Status Peserta Perlu Verifikasi',
  'NO_FRAUD':'Tidak ada sinyal pada data tersedia',
  'UNAVAILABLE':'Bukti belum tersedia',
  'UNNECESSARY_PROCEDURES':'Indikasi Prosedur Perlu Telaah',
  'DUPLICATE_CLAIM':'Indikasi Klaim Serupa',
  'ALL': 'Semua Kategori'
};

export const CASE_STATUS_LABELS = {
  'OPEN': 'Menunggu Telaah',
  'NEW': 'Baru Diajukan',
  'IN_REVIEW': 'Sedang Ditelaah',
  'CONFIRMED': 'Temuan Dikonfirmasi Reviewer',
  'NOT_CONFIRMED': 'Temuan Tidak Dikonfirmasi',
  'NEEDS_MORE_EVIDENCE': 'Perlu Konfirmasi Berkas',
  'FALSE_POSITIVE': 'False Positive (Anomali Teknis)'
};

export const ENCOUNTER_TYPE_LABELS = {
  'RAWAT_INAP': 'Rawat Inap',
  'RAWAT_JALAN': 'Rawat Jalan',
  'IGD': 'Instalasi Gawat Darurat',
  'RUJUKAN': 'Rujukan Lanjutan'
};

export const PRIORITY_LABELS = {
  'HIGH': 'Prioritas Tinggi',
  'MEDIUM': 'Prioritas Sedang',
  'LOW': 'Prioritas Rendah',
  'NO_CONCLUSION': 'Belum Ada Kesimpulan'
};

export const SERVICE_TYPE_LABELS = {
  'PAKET_INA_CBG': 'Paket INA-CBG',
  'OBAT_KRONIS': 'Obat Kronis & Farmasi',
  'TINDAKAN_BEDAH': 'Tindakan Bedah / Operasi',
  'LABORATORIUM': 'Pemeriksaan Laboratorium',
  'RADIOLOGI': 'Pemeriksaan Radiologi',
  'KONSULTASI_DOKTER': 'Konsultasi Spesialis'
};

export function formatRiskMode(val) {
  if (!val) return 'Tidak Terklasifikasi';
  return RISK_MODE_LABELS[val] || val.replace(/_/g, ' ');
}

export function formatCaseStatus(val) {
  if (!val) return '-';
  return CASE_STATUS_LABELS[val] || val.replace(/_/g, ' ');
}

export function formatEncounterType(val) {
  if (!val) return '-';
  return ENCOUNTER_TYPE_LABELS[val] || val.replace(/_/g, ' ');
}

export function formatPriority(val) {
  if (!val) return '-';
  return PRIORITY_LABELS[val] || val;
}

export function formatServiceType(val) {
  if (!val) return '-';
  return SERVICE_TYPE_LABELS[val] || val.replace(/_/g, ' ');
}

export function formatGender(val) {
  if (val === 'F') return 'Perempuan';
  if (val === 'U') return 'Tidak tersedia';
  if (val === 'M' || val === 'L') return 'Laki-laki';
  return val || '-';
}

export function formatAgeGroup(val) {
  if (!val) return '';
  return val
    .replace('DEWASA', 'Dewasa')
    .replace('LANSIA', 'Lansia')
    .replace('ANAK', 'Anak')
    .replace('BAYI', 'Bayi');
}

export function formatCurrency(num) {
  if (num === null || num === undefined) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',timeZone:'Asia/Jakarta'
    }) + ' WIB';
  } catch {
    return dateStr;
  }
}
