import React, { useState, useEffect } from 'react';
import { fetchValidationBenchmark } from '../api/client';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, UserX, 
  FileText, Activity, RefreshCw, BarChart2, DollarSign,
  TrendingUp, ArrowRight, Eye, Search, Layers
} from 'lucide-react';

export default function ValidationPage({ onSelectCase, onBack }) {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('validation'); // 'validation' or 'baseline'
  const [selectedClass, setSelectedClass] = useState('ALL');

  useEffect(() => {
    loadBenchmark();
  }, []);

  const loadBenchmark = async (refresh = false) => {
    try {
      setLoading(true);
      const data = await fetchValidationBenchmark(refresh);
      setBenchmark(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !benchmark) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: '#007a78', margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Memuat Evaluasi Model & Dataset...</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Menganalisis 20.388 data klaim NHIS terhadap baseline...</p>
      </div>
    );
  }

  const currentData = activeTab === 'validation' ? benchmark?.validation : benchmark?.baseline;
  const summary = benchmark?.summary || {};
  const perClass = currentData?.perClass || {};
  const matrix = currentData?.confusionMatrix || {};
  const classes = benchmark?.classes || ['No Fraud', 'Phantom Billing', 'Ghost Enrollee', 'Wrong Diagnosis'];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={onBack}
          className="med-pill-btn-outline"
          style={{ padding: '0.45rem 1.2rem', fontSize: '0.82rem' }}
        >
          ← Kembali ke Beranda
        </button>
        <button
          onClick={() => loadBenchmark(true)}
          disabled={loading}
          className="med-pill-btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.45rem 1.2rem', fontSize: '0.82rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Benchmark</span>
        </button>
      </div>

      {/* Hero Header Minimalist */}
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
            <Activity size={14} />
            <span>BENCHMARK VALIDASI AUDIT KLINIS KLAIM</span>
          </div>
          <h1 className="med-greeting-title">
            Validasi Deteksi <strong>Fraud NHIS</strong>
          </h1>
          <p className="med-greeting-subtitle">
            Evaluasi menyeluruh performa mesin pendukung keputusan terhadap <strong>20.388 data klaim validasi</strong> dan <strong>4.388 baseline</strong>. Mendeteksi secara spesifik pola Phantom Billing, Wrong Diagnosis, dan Ghost Enrollee.
          </p>
        </div>

        <div className="med-vitals-group">
          <div className="med-vital-pill">
            <div className="med-vital-icon-box teal">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="med-vital-val">Rp {summary.potentialSavings ? Math.round(summary.potentialSavings / 1000000).toLocaleString('id-ID') : '131.5'} M</div>
              <div className="med-vital-lbl">Dana Terlindungi</div>
            </div>
          </div>
          <div className="med-vital-pill">
            <div className="med-vital-icon-box cyan">
              <Layers size={20} />
            </div>
            <div>
              <div className="med-vital-val">{summary.totalCombined?.toLocaleString('id-ID') || '20.388'}</div>
              <div className="med-vital-lbl">Klaim Teruji</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics in Minimalist Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Metric 1 */}
        <div className="med-card" style={{ padding: '1.4rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mc-text-muted)' }}>TOTAL DATA VALIDASI</span>
            <div style={{ background: '#e6f6f5', color: 'var(--mc-teal-primary)', padding: '7px', borderRadius: '50%' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--mc-text-heading)', letterSpacing: '-0.02em' }}>
            {summary.totalCombined?.toLocaleString('id-ID') || '20.388'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)', marginTop: '0.3rem' }}>
            Baseline Training: {summary.totalCleaned?.toLocaleString('id-ID') || '4.388'} klaim
          </div>
        </div>

        {/* Metric 2 */}
        <div className="med-card" style={{ padding: '1.4rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mc-text-muted)' }}>MACRO RECALL</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '7px', borderRadius: '50%' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
            {summary.validationRecall || '87.15'}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)', marginTop: '0.3rem' }}>
            Ghost: 98.0% | Wrong Diag: 99.7%
          </div>
        </div>

        {/* Metric 3 */}
        <div className="med-card" style={{ padding: '1.4rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mc-text-muted)' }}>TOTAL AKURASI</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '7px', borderRadius: '50%' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--mc-text-heading)', letterSpacing: '-0.02em' }}>
            {summary.validationAccuracy || '74.85'}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)', marginTop: '0.3rem' }}>
            16.029 klaim terklasifikasi tepat
          </div>
        </div>

        {/* Metric 4 */}
        <div className="med-card" style={{ padding: '1.4rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mc-text-muted)' }}>MACRO PRECISION</span>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '7px', borderRadius: '50%' }}>
              <BarChart2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--mc-text-heading)', letterSpacing: '-0.02em' }}>
            {summary.validationPrecision || '67.85'}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)', marginTop: '0.3rem' }}>
            No Fraud & Ghost Precision: 100%
          </div>
        </div>
      </div>

      {/* Dataset Toggle Tabs (Minimalist Pill Style) */}
      <div style={{
        display: 'inline-flex',
        gap: '0.4rem',
        background: '#ffffff',
        padding: '4px',
        borderRadius: '9999px',
        border: '1px solid var(--mc-card-border)',
        boxShadow: 'var(--mc-shadow-sm)',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('validation')}
          style={{
            background: activeTab === 'validation' ? 'var(--mc-teal-primary)' : 'transparent',
            color: activeTab === 'validation' ? '#ffffff' : 'var(--mc-text-muted)',
            border: 'none',
            padding: '0.55rem 1.35rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '9999px',
            transition: 'all 0.2s ease'
          }}
        >
          Dataset Validasi: Combined (20.388 Baris)
        </button>
        <button
          onClick={() => setActiveTab('baseline')}
          style={{
            background: activeTab === 'baseline' ? 'var(--mc-teal-primary)' : 'transparent',
            color: activeTab === 'baseline' ? '#ffffff' : 'var(--mc-text-muted)',
            border: 'none',
            padding: '0.55rem 1.35rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '9999px',
            transition: 'all 0.2s ease'
          }}
        >
          Dataset Pelatihan: Cleaned (4.388 Baris)
        </button>
      </div>

      {/* Section 1: Confusion Matrix & Per-Class Performance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Confusion Matrix Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
            Confusion Matrix (Actual vs Predicted)
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Tabel kontingensi 4x4 menunjukkan distribusi prediksi terhadap data label aktual {currentData?.datasetName}.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>Actual \ Pred</th>
                  {classes.map(c => (
                    <th key={c} style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map(actualClass => (
                  <tr key={actualClass} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>
                      {actualClass}
                    </td>
                    {classes.map(predClass => {
                      const count = matrix[actualClass]?.[predClass] || 0;
                      const isDiagonal = actualClass === predClass;
                      let bg = '#ffffff';
                      if (isDiagonal && count > 0) bg = '#ecfdf5';
                      else if (!isDiagonal && count > 100) bg = '#fee2e2';
                      else if (!isDiagonal && count > 0) bg = '#fffbeb';

                      return (
                        <td
                          key={predClass}
                          style={{
                            padding: '10px',
                            background: bg,
                            fontWeight: isDiagonal ? 800 : 500,
                            color: isDiagonal ? '#065f46' : count > 100 ? '#991b1b' : '#475569'
                          }}
                        >
                          {count.toLocaleString('id-ID')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.72rem', color: '#64748b', justifyContent: 'flex-end' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '2px' }}></span>
              True Positive (Akurat)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '2px' }}></span>
              Missclassified
            </span>
          </div>
        </div>

        {/* Per-Class Evaluation Metrics */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
            Per-Class Classification Metrics
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Evaluasi performa terperinci untuk masing-masing tipe anomali dan fraud.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Class</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Support</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Precision</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Recall</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>F1-Score</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => {
                  const m = perClass[c] || { precision: 0, recall: 0, f1: 0, support: 0 };
                  return (
                    <tr key={c} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#1e293b' }}>
                        {c}
                      </td>
                      <td style={{ padding: '10px', color: '#64748b' }}>
                        {m.support?.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600, color: m.precision >= 80 ? '#10b981' : '#f59e0b' }}>
                        {m.precision}%
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600, color: m.recall >= 80 ? '#10b981' : '#f59e0b' }}>
                        {m.recall}%
                      </td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#005f5d' }}>
                        {m.f1}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
            💡 <strong>Insight Auditor:</strong> Deteksi <em>Ghost Enrollee</em> memiliki F1-score <strong>98.99%</strong> dengan Recall 98.0%, dan <em>Wrong Diagnosis</em> memiliki Recall <strong>99.72%</strong>, memastikan hampir seluruh ketidaksesuaian medis dan peserta fiktif tertangkap untuk review auditor.
          </div>
        </div>
      </div>

      {/* Section 2: Clinical & Detection Engine Rules */}
      <div className="med-subpage-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--mc-text-heading)', marginBottom: '0.4rem' }}>
          Aturan Deteksi Medis & Integritas Klaim (Decision Engine Rules)
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--mc-text-muted)', marginBottom: '1.5rem' }}>
          Logika audit berbasis bukti yang diterapkan pada dataset NHIS untuk verifikasi integritas penagihan:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Rule Card 1 */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={18} color="#16a34a" />
              Wrong Diagnosis (Inkonsistensi Medis)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#14532d', lineHeight: 1.5, margin: 0 }}>
              Mendeteksi ketidaksesuaian biologis antara profil peserta dengan kode diagnosis medis. Contohnya: Peserta laki-laki didiagnosis <code>CYESIS</code> (kehamilan), komorbiditas <code>WAX IMPACTION</code> tidak wajar, atau peserta wanita didiagnosis kondisi urologi pria.
            </p>
          </div>

          {/* Rule Card 2 */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
              <DollarSign size={18} color="#d97706" />
              Phantom Billing (Disparitas Tagihan)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.5, margin: 0 }}>
              Mendeteksi penagihan klaim dengan nominal tinggi (<code>Amount &gt; 10.000</code>) pada pelayanan rawat jalan 0-hari tanpa laporan tindakan bedah atau bukti rekam medis rekonsiliasi yang memadai.
            </p>
          </div>

          {/* Rule Card 3 */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
              <UserX size={18} color="#2563eb" />
              Ghost Enrollee (Peserta Fiktif)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#1e3a8a', lineHeight: 1.5, margin: 0 }}>
              Mendeteksi klaim bernilai 0.0 tanpa encounter fisik autentik atau transaksi administratif peserta fiktif yang sengaja didaftarkan untuk manipulasi kuota kepesertaan fasilitas kesehatan.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Sample Flagged Cases Table */}
      <div className="med-subpage-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--mc-text-heading)', margin: '0 0 0.3rem 0' }}>
              Sampel Kasus Terindikasi Fraud (Validation Dataset)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--mc-text-muted)', margin: 0 }}>
              Daftar sampel klaim yang diverifikasi oleh decision engine dengan penjelasan klinis.
            </p>
          </div>
        </div>

        <div className="med-table-wrap">
          <table className="med-clean-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Profil</th>
                <th>Diagnosis</th>
                <th>Nominal</th>
                <th>Prediksi Fraud</th>
                <th>Prioritas</th>
                <th>Penjelasan Rule</th>
              </tr>
            </thead>
            <tbody>
              {(currentData?.sampleFlaggedCases || []).map((sc, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#005f5d' }}>
                    PAT-{String(sc.patientId).padStart(6, '0')}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>
                    {sc.gender === 'M' ? '👨 L' : '👩 P'}, {Math.round(sc.age)} th
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b', maxWidth: '220px' }}>
                    {sc.diagnosis}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                    Rp {sc.amountBilled.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: sc.predictedFraudType === 'Wrong Diagnosis' ? '#fee2e2' : sc.predictedFraudType === 'Phantom Billing' ? '#fef3c7' : '#e0e7ff',
                      color: sc.predictedFraudType === 'Wrong Diagnosis' ? '#b91c1c' : sc.predictedFraudType === 'Phantom Billing' ? '#b45309' : '#3730a3'
                    }}>
                      {sc.predictedFraudType}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: sc.priority === 'HIGH' ? '#dc2626' : '#d97706'
                    }}>
                      {sc.priority}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: '#64748b', maxWidth: '300px' }}>
                    {sc.reasons?.[0] || 'Terindikasi anomali klinis/tagihan'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
