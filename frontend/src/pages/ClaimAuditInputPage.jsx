import React, { useState } from 'react';
import { auditCheckClaim } from '../api/client';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, UserX, 
  DollarSign, ArrowRight, Activity, Smartphone, FileSearch, 
  Stethoscope, Calendar, RefreshCw, Send, Check
} from 'lucide-react';

const PRESETS = [
  {
    id: 'phantom',
    title: 'Klaim Fiktif (Phantom Billing)',
    badge: 'Disparitas Berkas',
    badgeColor: '#e11d48',
    badgeBg: '#fff1f2',
    icon: ShieldAlert,
    desc: 'Tagihan tindakan rawat jalan tanpa didukung bukti fisik rekam medis.',
    data: {
      patientId: 'JKN-90214',
      gender: 'F',
      age: 45,
      dateEncounter: '2025-03-10',
      dateDischarge: '2025-03-10',
      diagnosis: 'HTN CAUSE MALARIA ANEAMIA',
      amountBilled: 25000,
      providerId: 'PROV-002'
    }
  },
  {
    id: 'wrong_diag',
    title: 'Inkonsistensi Diagnosa',
    badge: 'Validitas Klinis',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    icon: AlertTriangle,
    desc: 'Ketidaksesuaian klinis diagnosa obstetrik pada pasien laki-laki.',
    data: {
      patientId: 'JKN-44102',
      gender: 'M',
      age: 35,
      dateEncounter: '2025-02-13',
      dateDischarge: '2025-02-13',
      diagnosis: 'CYESIS LMP',
      amountBilled: 6160,
      providerId: 'PROV-001'
    }
  },
  {
    id: 'ghost',
    title: 'Peserta Tanpa Presensi',
    badge: 'Uji Kehadiran',
    badgeColor: '#2563eb',
    badgeBg: '#eff6ff',
    icon: UserX,
    desc: 'Riwayat tagihan tercatat tanpa rekaman kehadiran fisik pada faskes.',
    data: {
      patientId: 'JKN-11093',
      gender: 'M',
      age: 48,
      dateEncounter: '2025-02-18',
      dateDischarge: '2025-02-18',
      diagnosis: 'TONSILITIS OBSTRUCTIVE SLEEP APEANA',
      amountBilled: 0,
      providerId: 'PROV-003'
    }
  },
  {
    id: 'valid',
    title: 'Klaim Wajar & Terverifikasi',
    badge: 'Klaim Valid',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    icon: CheckCircle2,
    desc: 'Pelayanan poli refraksi reguler dengan rekam jejak pemeriksaan lengkap.',
    data: {
      patientId: 'JKN-77301',
      gender: 'F',
      age: 58,
      dateEncounter: '2025-02-18',
      dateDischarge: '2025-02-18',
      diagnosis: 'REFRACTIVE ERROR',
      amountBilled: 8400,
      providerId: 'PROV-004'
    }
  }
];

export default function ClaimAuditInputPage({ onSelectCase, onOpenQueue, onBack }) {
  const [formData, setFormData] = useState({
    patientId: 'JKN-90214',
    gender: 'F',
    age: 45,
    dateEncounter: '2025-03-10',
    dateDischarge: '2025-03-10',
    diagnosis: 'HTN CAUSE MALARIA ANEAMIA',
    amountBilled: 25000,
    providerId: 'PROV-001',
    saveCase: true
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      ...preset.data
    }));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await auditCheckClaim(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError('Gagal menjalankan deteksi audit. Pastikan backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={onBack}
          className="med-pill-btn-outline"
          style={{ padding: '0.45rem 1.2rem', fontSize: '0.82rem' }}
        >
          ← Kembali ke Beranda
        </button>

        <button
          onClick={onOpenQueue}
          className="med-pill-btn-primary"
          style={{ padding: '0.45rem 1.2rem', fontSize: '0.82rem' }}
        >
          Buka Antrean Reviewer
        </button>
      </div>

      {/* Header Minimalist with Context Narrative */}
      <div className="med-hero-row" style={{ alignItems: 'flex-start', marginBottom: '2.25rem' }}>
        <div className="med-greeting-col">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#e6f6f5',
            color: '#007a78',
            border: '1px solid #c5ebe9',
            padding: '5px 14px',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 700,
            marginBottom: '0.6rem'
          }}>
            <Smartphone size={14} />
            <span>SIMULASI PELAPORAN & RIWAYAT MOBILE JKN</span>
          </div>
          <h1 className="med-greeting-title">
            Simulasi Klaim & <strong>Phantom Checker</strong>
          </h1>
          <p className="med-greeting-subtitle">
            Input proksi riwayat pelayanan Mobile JKN untuk mendeteksi secara langsung apakah transaksi klaim terindikasi <strong>Phantom Billing</strong>, inkonsistensi medis, atau wajar.
          </p>
        </div>

        <div className="med-vitals-group">
          <div className="med-vital-pill">
            <div className="med-vital-icon-box teal">
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="med-vital-val">KMK No. 26</div>
              <div className="med-vital-lbl">Standar Tarif Klaim</div>
            </div>
          </div>
          <div className="med-vital-pill">
            <div className="med-vital-icon-box cyan">
              <Activity size={20} />
            </div>
            <div>
              <div className="med-vital-val">Seketika</div>
              <div className="med-vital-lbl">Uji Keselarasan Medis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Presets / Skenario Simulasi */}
      <div className="med-subpage-card" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--mc-text-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={17} color="var(--mc-teal-primary)" />
          <span>Skenario Simulasi Uji Integritas Klaim (Pilih Contoh Kasus):</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {PRESETS.map((preset) => {
            const isSelected = formData.diagnosis === preset.data.diagnosis && formData.amountBilled === preset.data.amountBilled;
            const IconComponent = preset.icon;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  background: isSelected ? 'var(--mc-teal-light)' : '#ffffff',
                  border: isSelected
                    ? '2px solid var(--mc-teal-primary)'
                    : '1px solid var(--mc-card-border)',
                  borderRadius: '18px',
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? 'var(--mc-shadow-teal)' : 'var(--mc-shadow-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: preset.badgeBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={17} color={preset.badgeColor} />
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: preset.badgeBg,
                      color: preset.badgeColor,
                      border: `1px solid ${preset.badgeColor}33`
                    }}>
                      {preset.badge}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? 'var(--mc-teal-dark)' : 'var(--mc-text-heading)', marginBottom: '0.3rem' }}>
                    {preset.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)', lineHeight: 1.45 }}>
                    {preset.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form (Left) & Real-time Audit Result (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Form Card */}
        <div className="med-subpage-card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
            Formulir Riwayat Pelayanan
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--mc-text-muted)', marginBottom: '1.75rem' }}>
            Masukkan data encounter medis untuk memverifikasi ada/tidaknya indikasi Phantom Billing.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                  ID Pasien / Peserta
                </label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={e => handleInputChange('patientId', e.target.value)}
                  className="med-pill-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={e => handleInputChange('gender', e.target.value)}
                  className="med-pill-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="F">Perempuan (F)</option>
                  <option value="M">Laki-laki (M)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                  Usia Peserta (Tahun)
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => handleInputChange('age', e.target.value)}
                  className="med-pill-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                  Fasilitas Kesehatan (Faskes)
                </label>
                <select
                  value={formData.providerId}
                  onChange={e => handleInputChange('providerId', e.target.value)}
                  className="med-pill-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="PROV-001">RSUP Dr. Sardjito</option>
                  <option value="PROV-002">RSUD Kota Yogyakarta</option>
                  <option value="PROV-003">RS PKU Muhammadiyah</option>
                  <option value="PROV-004">Klinik Pratama Sehat Utama</option>
                  <option value="PROV-005">Puskesmas Gondomanan</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                  Tanggal Kunjungan (Encounter)
                </label>
                <input
                  type="date"
                  value={formData.dateEncounter}
                  onChange={e => handleInputChange('dateEncounter', e.target.value)}
                  className="med-pill-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                  Tanggal Pulang (Discharge)
                </label>
                <input
                  type="date"
                  value={formData.dateDischarge}
                  onChange={e => handleInputChange('dateDischarge', e.target.value)}
                  className="med-pill-input"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                Diagnosis Medis Klinis
              </label>
              <input
                type="text"
                placeholder="Contoh: HTN, CYESIS LMP, WAX IMPACTION, REFRACTIVE ERROR..."
                value={formData.diagnosis}
                onChange={e => handleInputChange('diagnosis', e.target.value)}
                className="med-pill-input"
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.35rem' }}>
                Nominal Tagihan Klaim (Amount Billed)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--mc-text-muted)' }}>Rp</span>
                <input
                  type="number"
                  value={formData.amountBilled}
                  onChange={e => handleInputChange('amountBilled', e.target.value)}
                  className="med-pill-input"
                  style={{ paddingLeft: '2.6rem', fontWeight: 700 }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--mc-bg)', padding: '0.85rem 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="saveCaseCheck"
                checked={formData.saveCase}
                onChange={e => handleInputChange('saveCase', e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--mc-teal-primary)' }}
              />
              <label htmlFor="saveCaseCheck" style={{ fontSize: '0.8rem', color: 'var(--mc-text-body)', cursor: 'pointer' }}>
                Simpan klaim ini dan buat kasus di database antrean triase auditor
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="med-pill-btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.92rem', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Mengevaluasi Riwayat Klaim...</span>
                </>
              ) : (
                <>
                  <FileSearch size={18} />
                  <span>Audit & Cek Kategori Klaim Sekarang</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Audit Result Display */}
        <div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="med-subpage-card" style={{
              padding: '3rem 2rem',
              border: '2px dashed var(--mc-card-border)',
              textAlign: 'center'
            }}>
              <div style={{ width: '56px', height: '56px', background: '#e6f6f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--mc-teal-primary)' }}>
                <Stethoscope size={28} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--mc-text-heading)', margin: '0 0 0.4rem 0' }}>
                Siap Melakukan Deteksi
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--mc-text-muted)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
                Pilih salah satu contoh preset di atas atau ketik langsung data riwayat pelayanan untuk mengecek apakah tergolong Phantom Billing.
              </p>
            </div>
          )}

          {result && (
            <div className="med-subpage-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  HASIL ANALISIS DECISION SUPPORT
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: result.reviewPriority === 'HIGH' ? '#fee2e2' : result.reviewPriority === 'MEDIUM' ? '#fef3c7' : '#ecfdf5',
                  color: result.reviewPriority === 'HIGH' ? '#dc2626' : result.reviewPriority === 'MEDIUM' ? '#d97706' : '#16a34a'
                }}>
                  PRIORITAS {result.reviewPriority}
                </span>
              </div>

              {/* Status Header Box */}
              <div style={{
                background: result.isPhantom ? '#fff7ed' : result.fraudType === 'No Fraud' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${result.isPhantom ? '#fdba74' : result.fraudType === 'No Fraud' ? '#bbf7d0' : '#fecaca'}`,
                padding: '1.5rem',
                borderRadius: '20px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: result.isPhantom ? '#ffedd5' : result.fraudType === 'No Fraud' ? '#dcfce7' : '#fee2e2',
                  color: result.isPhantom ? '#ea580c' : result.fraudType === 'No Fraud' ? '#16a34a' : '#dc2626'
                }}>
                  {result.isPhantom ? <DollarSign size={24} /> : result.fraudType === 'No Fraud' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mc-text-muted)', textTransform: 'uppercase' }}>
                    Klasifikasi Kategori
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: result.isPhantom ? '#c2410c' : result.fraudType === 'No Fraud' ? '#15803d' : '#b91c1c'
                  }}>
                    {result.isPhantom ? 'TERINDIKASI PHANTOM BILLING' : result.fraudType.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--mc-text-body)', marginTop: '2px' }}>
                    Skor Risiko: <strong>{result.riskScore}%</strong> | Primary Risk Mode: <code>{result.primaryRiskMode}</code>
                  </div>
                </div>
              </div>

              {/* Metric Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid var(--mc-card-border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--mc-text-muted)', fontWeight: 700 }}>EVIDENCE DISPARITY (GAP)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--mc-text-heading)', marginTop: '2px' }}>
                    Rp {result.evidenceGap ? result.evidenceGap.toLocaleString('id-ID') : '0'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--mc-text-muted)', marginTop: '2px' }}>Selisih potensi klaim fiktif</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid var(--mc-card-border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--mc-text-muted)', fontWeight: 700 }}>EVIDENCE COVERAGE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: result.evidenceCoveragePct >= 80 ? '#10b981' : '#dc2626', marginTop: '2px' }}>
                    {result.evidenceCoveragePct}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--mc-text-muted)', marginTop: '2px' }}>Tingkat ketercukupan bukti</div>
                </div>
              </div>

              {/* Reasons */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--mc-text-heading)', margin: '0 0 0.5rem 0' }}>
                  Temuan & Indikasi Anomali:
                </h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--mc-text-body)', lineHeight: 1.6 }}>
                  {result.reasons.map((r, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Review Guidance */}
              <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '1.1rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f766e', marginBottom: '4px' }}>
                  PANDUAN REKONSILIASI AUDITOR:
                </div>
                <div style={{ fontSize: '0.8rem', color: '#115e59', lineHeight: 1.5 }}>
                  {result.reviewFocus}
                </div>
              </div>

              {/* Saved Record Link */}
              {result.savedRecord && (
                <div style={{
                  background: 'var(--mc-bg)',
                  border: '1px solid var(--mc-card-border)',
                  borderRadius: '16px',
                  padding: '1.1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--mc-text-muted)', fontWeight: 700 }}>KASUS BERHASIL DIBUAT:</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--mc-teal-primary)' }}>
                      {result.savedRecord.caseId} (Klaim: {result.savedRecord.claimId})
                    </div>
                  </div>
                  <button
                    className="med-pill-btn-primary"
                    onClick={() => onSelectCase(result.savedRecord.caseId)}
                    style={{ padding: '0.45rem 1.15rem', fontSize: '0.8rem' }}
                  >
                    Buka Detail Kasus →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
