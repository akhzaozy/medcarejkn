import React, { useEffect, useState } from 'react';
import { fetchCaseDetails, fetchCaseEvidence, submitReviewOutcome, assignCaseReviewer } from '../api/client';
import { PriorityBadge, StatusBadge, CaseStatusPill } from '../components/common/Badge';
import { 
  formatRiskMode, formatCaseStatus, formatEncounterType, 
  formatGender, formatAgeGroup, formatCurrency, 
  formatDateIndo, formatDateTimeIndo, formatServiceType 
} from '../utils/formatters';
import { 
  ArrowLeft, FileText, CheckCircle2, AlertTriangle, Clock, 
  Send, ShieldAlert, FileSearch, UserCheck, HelpCircle, 
  UserPlus, Stethoscope, CheckCheck, Receipt, ClipboardCheck,
  ChevronRight, AlertCircle, Sparkles, Building2, User, Activity
} from 'lucide-react';

export default function CaseDetailPage({ caseId, onBack, currentUser }) {
  const [details, setDetails] = useState(null);
  const [evidenceChain, setEvidenceChain] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review form state (Tenaga Kesehatan)
  const [outcome, setOutcome] = useState('NEEDS_MORE_EVIDENCE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Assignment state (Staff JKN)
  const [assignee, setAssignee] = useState('dr.anindya');
  const [assigneeName, setAssigneeName] = useState('dr. Anindya Kusuma, Sp.PK');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      const [det, evid] = await Promise.all([
        fetchCaseDetails(caseId),
        fetchCaseEvidence(caseId)
      ]);
      setDetails(det);
      setEvidenceChain(evid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReviewer = async (e) => {
    e.preventDefault();
    try {
      setAssigning(true);
      await assignCaseReviewer(caseId, {
        assignedTo: assignee,
        assignedName: assigneeName,
        note: assignNotes || 'Diarahkan oleh Staff JKN untuk audit klinis mendalam',
        assignedBy: currentUser?.name || 'Staff JKN'
      });
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3500);
      await loadCaseData();
    } catch (err) {
      console.error(err);
      alert('Gagal mengarahkan case ke reviewer: ' + (err.message || 'Error'));
    } finally {
      setAssigning(false);
    }
  };

  const handleSubmitOutcome = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const reviewerActor = currentUser?.name || 'dr. Anindya Kusuma, Sp.PK (Tenaga Kesehatan)';
      await submitReviewOutcome(caseId, {
        outcome,
        notes,
        reviewerId: reviewerActor
      });
      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 3000);
      await loadCaseData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan hasil review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '5rem 2rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#007a78',
          borderRadius: '50%',
          margin: '0 auto 1rem auto',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Memuat Berkas Investigasi</div>
        <div style={{ fontSize: '0.84rem' }}>Menghubungkan rantai bukti medis kasus {caseId}...</div>
      </div>
    );
  }

  if (!details || !details.case) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#e11d48' }}>
        <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Kasus {caseId} Tidak Ditemukan</div>
        <div style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Berkas mungkin telah diarsipkan atau ID klaim tidak valid.
        </div>
        <button className="btn-pill-primary" onClick={onBack}>Kembali ke Antrean</button>
      </div>
    );
  }

  const { case: c, claimItems, evidenceLinks, riskSignals, reviewOutcomes, auditLogs } = details;

  const isPhantom = c.primary_risk_mode === 'PHANTOM_BILLING';
  const isUnavailable = c.review_priority === 'NO_CONCLUSION' || c.primary_risk_mode === 'UNAVAILABLE_EVIDENCE';
  const isPattern = c.primary_risk_mode === 'PATTERN_REVIEW';

  const riskLabel = formatRiskMode(c.primary_risk_mode);
  const statusLabel = formatCaseStatus(c.case_status);
  const encounterLabel = formatEncounterType(c.encounter_type);
  const genderLabel = formatGender(c.sex);
  const ageLabel = formatAgeGroup(c.age_group);
  const totalClaim = formatCurrency(c.total_amount);
  const totalGapCount = c.evidence_gap !== null ? `${c.evidence_gap} Prosedur` : 'Tidak Ada Data';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onBack}
          className="med-pill-btn-outline"
          style={{ padding: '0.45rem 1.15rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Antrean Telaah</span>
        </button>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>Berkas Klaim</span>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ fontWeight: 800, color: '#007a78', fontSize: '0.92rem' }}>
          {c.case_id}
        </span>
      </div>

      {/* ==================== 1. CASE PROGRESS LIFECYCLE STEPPER ==================== */}
      <div className="med-subpage-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#007a78" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#007a78', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Alur Penanganan Berkas Klaim
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Status Terkini: <strong style={{ color: '#005f5d' }}>{statusLabel}</strong>
          </div>
        </div>

        {/* 5-Step Process Timeline */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Step 1: Claim In */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '14px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#16a34a', color: '#fff', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={13} />
              </div>
              <strong style={{ fontSize: '0.8rem', color: '#16a34a' }}>1. Klaim Diajukan</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Faskes menginput {encounterLabel}
            </div>
          </div>

          {/* Step 2: Anomaly Detected */}
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '14px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e11d48', color: '#fff', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={13} />
              </div>
              <strong style={{ fontSize: '0.8rem', color: '#e11d48' }}>2. Deteksi Anomali</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {riskLabel}
            </div>
          </div>

          {/* Step 3: Staff Assignment */}
          <div style={{
            background: c.assigned_to ? '#f0fdf4' : '#eff6ff',
            border: `1px solid ${c.assigned_to ? '#bbf7d0' : '#bfdbfe'}`,
            borderRadius: '14px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: c.assigned_to ? '#16a34a' : '#2563eb',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {c.assigned_to ? <CheckCircle2 size={13} /> : '3'}
              </div>
              <strong style={{ fontSize: '0.8rem', color: c.assigned_to ? '#16a34a' : '#2563eb' }}>
                3. Disposisi Penelaah
              </strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {c.assigned_name ? c.assigned_name.split(',')[0] : 'Menunggu arahan Staff JKN'}
            </div>
          </div>

          {/* Step 4: Clinical Review */}
          <div style={{
            background: reviewOutcomes && reviewOutcomes.length > 0 ? '#f0fdf4' : c.case_status === 'IN_REVIEW' ? '#fffbeb' : '#f8fafc',
            border: `1px solid ${reviewOutcomes && reviewOutcomes.length > 0 ? '#bbf7d0' : c.case_status === 'IN_REVIEW' ? '#fde68a' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: reviewOutcomes && reviewOutcomes.length > 0 ? '#16a34a' : c.case_status === 'IN_REVIEW' ? '#d97706' : '#94a3b8',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {reviewOutcomes && reviewOutcomes.length > 0 ? <CheckCircle2 size={13} /> : '4'}
              </div>
              <strong style={{ fontSize: '0.8rem', color: reviewOutcomes && reviewOutcomes.length > 0 ? '#16a34a' : c.case_status === 'IN_REVIEW' ? '#d97706' : '#64748b' }}>
                4. Telaah Medis DPJP
              </strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Rekonsiliasi EMR vs Berkas Klaim
            </div>
          </div>

          {/* Step 5: Final Decision */}
          <div style={{
            background: c.case_status === 'CONFIRMED' || c.case_status === 'NOT_CONFIRMED' ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${c.case_status === 'CONFIRMED' || c.case_status === 'NOT_CONFIRMED' ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: c.case_status === 'CONFIRMED' || c.case_status === 'NOT_CONFIRMED' ? '#16a34a' : '#94a3b8',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {c.case_status === 'CONFIRMED' || c.case_status === 'NOT_CONFIRMED' ? <CheckCircle2 size={13} /> : '5'}
              </div>
              <strong style={{ fontSize: '0.8rem', color: c.case_status === 'CONFIRMED' || c.case_status === 'NOT_CONFIRMED' ? '#16a34a' : '#64748b' }}>
                5. Kesimpulan Audit
              </strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {reviewOutcomes && reviewOutcomes.length > 0 ? formatCaseStatus(reviewOutcomes[0].outcome) : 'Menunggu kesimpulan dokter'}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. CASE HEADER CARD ==================== */}
      <div className="med-subpage-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.65rem' }}>
              <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {c.case_id}
              </h1>
              <PriorityBadge priority={c.review_priority} />
              <CaseStatusPill status={c.case_status} />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap', lineHeight: 1.6 }}>
              <div>Nomor Klaim: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{c.claim_id}</strong></div>
              <div>Faskes: <strong style={{ color: '#0f172a' }}>{c.provider_name}</strong> ({c.provider_id})</div>
              <div>Pasien: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{c.patient_id || 'PAT-SYN-001'}</strong> ({genderLabel}, {ageLabel})</div>
              <div>Tgl Layanan: <strong style={{ color: '#0f172a' }}>{formatDateIndo(c.service_date)}</strong></div>
            </div>

            {/* Assignment Tag */}
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Tenaga Kesehatan Ditugaskan:</span>
              {c.assigned_name ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  <Stethoscope size={14} />
                  {c.assigned_name}
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}>
                  <AlertTriangle size={13} />
                  Belum Ditugaskan ke Dokter Penelaah
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Total Nilai Tagihan Klaim
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, margin: '4px 0' }}>
              {totalClaim}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#007a78', fontWeight: 700, background: '#e6f6f5', padding: '3px 10px', borderRadius: '6px', display: 'inline-block' }}>
              {encounterLabel}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 3. EXECUTIVE SUMMARY (RINGKASAN AUDIT KLINIS) ==================== */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '20px',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <FileSearch size={18} color="#007a78" />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Ringkasan Temuan Audit Klinis
          </h3>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: isPhantom ? '#fff1f2' : '#f0fdf4',
            color: isPhantom ? '#e11d48' : '#16a34a',
            border: `1px solid ${isPhantom ? '#fecdd3' : '#bbf7d0'}`
          }}>
            {riskLabel}
          </span>
        </div>

        <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.65, margin: '0 0 1.25rem 0' }}>
          Klaim berkas <strong>{c.case_id}</strong> diajukan oleh <strong>{c.provider_name}</strong> atas pelayanan pasien <strong>{c.patient_id || 'PAT-SYN-001'}</strong> ({genderLabel}, {ageLabel}) dengan nilai tagihan <strong>{totalClaim}</strong>. 
          Pemeriksaan audit klinis mengidentifikasi indikasi <strong>{riskLabel}</strong> karena {c.review_focus || 'ditemukan ketidaksesuaian lembar tagihan rumah sakit dengan catatan rekam jejak medis fisik'}. 
          Tingkat pembuktian rekam medis terverifikasi adalah <strong>{c.evidence_coverage_pct || 0}%</strong>, sehingga terdapat selisih pembuktian (evidence gap) sebesar <strong>{totalGapCount}</strong> yang tidak memiliki dukungan dokumen medis.
        </p>

        {/* 4 Metric Facts Box */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem'
        }}>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nilai Tagihan Faskes</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>{totalClaim}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Jumlah Item Ditagih</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{claimItems?.length || 1} Prosedur</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Dokumen Pendukung</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: evidenceLinks?.length > 0 ? '#16a34a' : '#e11d48', marginTop: '2px' }}>
              {evidenceLinks?.length || 0} Berkas Terhubung
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tingkat Pembuktian</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: Number(c.evidence_coverage_pct) < 50 ? '#e11d48' : '#16a34a', marginTop: '2px' }}>
              {c.evidence_coverage_pct || 0}% Terverifikasi
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 4. SIDE-BY-SIDE: TAGIHAN FASKES VS FAKTA REKAM MEDIS ==================== */}
      <div className="med-subpage-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={19} color="#007a78" />
            Komparasi Berdampingan: Lembar Tagihan Faskes vs Rekam Medis Fisik
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
            Perbandingan langsung antara berkas klaim yang ditagihkan faskes dengan bukti catatan pelayanan pada rekam jejak medis.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Column 1: Yang Ditagihkan Faskes (Klaim) */}
          <div style={{ background: '#fff9f9', border: '1.5px solid #fecdd3', borderRadius: '18px', padding: '1.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={16} color="#e11d48" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#be123c', margin: 0 }}>
                  Lembar Tagihan Faskes (Klaim)
                </h4>
                <div style={{ fontSize: '0.72rem', color: '#9f1239' }}>Data berkas yang diajukan untuk reimbursement</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #fecdd3', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Total Tagihan:</span>
                <strong style={{ color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{totalClaim}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #fecdd3', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Kategori Pelayanan:</span>
                <strong>{encounterLabel} (Lama Rawat: 0 Hari)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #fecdd3', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Rincian Tindakan:</span>
                <strong>{claimItems?.length || 1} Prosedur Tindakan</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #fecdd3', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Faskes Penagih:</span>
                <strong>{c.provider_name}</strong>
              </div>
            </div>
          </div>

          {/* Column 2: Fakta di Rekam Medis Fisik */}
          <div style={{ background: '#f6fdfa', border: '1.5px solid #a7f3d0', borderRadius: '18px', padding: '1.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardCheck size={16} color="#059669" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#047857', margin: 0 }}>
                  Fakta Rekam Medis Terverifikasi
                </h4>
                <div style={{ fontSize: '0.72rem', color: '#065f46' }}>Hasil penelusuran audit dokumen fisik & EMR</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #a7f3d0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Ketercakupan Bukti:</span>
                <strong style={{ color: Number(c.evidence_coverage_pct) < 50 ? '#e11d48' : '#059669' }}>
                  {c.evidence_coverage_pct || 0}% Terverifikasi
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #a7f3d0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Selisih Pembuktian:</span>
                <strong style={{ color: '#e11d48' }}>{totalGapCount} Tanpa Berkas</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #a7f3d0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Catatan SIMRS/EMR:</span>
                <strong>{evidenceLinks?.length > 0 ? `${evidenceLinks.length} berkas fisik terhubung` : '0 Berkas Terhubung (Zero Match)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #a7f3d0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Rekomendasi Telaah:</span>
                <strong style={{ color: '#b45309' }}>
                  {c.review_priority === 'NO_CONCLUSION' ? 'Perlu Konfirmasi Fisik' : 'Terindikasi Kuat Disparitas'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 5. PANDUAN TUGAS DOKTER PENELAAH ==================== */}
      <div style={{
        background: currentUser?.role === 'staff_jkn' ? '#eff6ff' : '#ecfdf5',
        border: `1.5px solid ${currentUser?.role === 'staff_jkn' ? '#bfdbfe' : '#a7f3d0'}`,
        borderRadius: '16px',
        padding: '1rem 1.4rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: currentUser?.role === 'staff_jkn' ? '#dbeafe' : '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Stethoscope size={18} color={currentUser?.role === 'staff_jkn' ? '#1d4ed8' : '#047857'} />
        </div>
        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: currentUser?.role === 'staff_jkn' ? '#1d4ed8' : '#047857' }}>
            {currentUser?.role === 'staff_jkn' 
              ? 'Panduan Tugas Anda (Staff JKN):' 
              : `Panduan Tugas Anda (${currentUser?.name || 'Dokter Penelaah Klinis'}):`}
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
            {currentUser?.role === 'staff_jkn'
              ? 'Tinjau ringkasan berkas dan temuan disparitas di bawah. Gunakan formulir disposisi di kanan bawah untuk mengarahkan kasus kepada dokter spesialis terkait.'
              : 'Periksa rincian item tindakan dan rantai dokumen pendukung di bawah. Tetapkan kesimpulan medis (Confirmed/Needs Evidence/Valid) serta cantumkan pertimbangan klinis Anda.'}
          </p>
        </div>
      </div>

      {/* ==================== 6. EVIDENCE CHAIN TRACEABILITY ==================== */}
      <div className="med-subpage-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSearch size={18} color="#007a78" />
            Penelusuran Rantai Keterbuktian Medis (Evidence Chain)
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
            Hierarki audit pembuktian: Berkas Kasus &rarr; Klaim Faskes &rarr; Item Tindakan &rarr; Dokumen Bukti Fisik
          </p>
        </div>

        {/* Clean Connected Stepper Nodes (NO ASCII arrows) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          background: '#f8fafc',
          padding: '0.85rem 1.15rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            padding: '0.45rem 1.1rem',
            borderRadius: '10px',
            background: '#007a78',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            {c.case_id}
          </div>

          <ChevronRight size={16} color="#94a3b8" />

          <div style={{
            padding: '0.45rem 1.1rem',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#0f172a',
            fontVariantNumeric: 'tabular-nums'
          }}>
            Klaim: {c.claim_id} ({totalClaim})
          </div>

          <ChevronRight size={16} color="#94a3b8" />

          <div style={{
            padding: '0.4rem 1rem',
            borderRadius: '10px',
            background: Number(c.evidence_coverage_pct) < 50 ? '#fff1f2' : '#ecfdf5',
            border: `1px solid ${Number(c.evidence_coverage_pct) < 50 ? '#fecdd3' : '#a7f3d0'}`,
            color: Number(c.evidence_coverage_pct) < 50 ? '#e11d48' : '#047857',
            fontSize: '0.82rem',
            fontWeight: 800
          }}>
            Selisih Pembuktian: {totalGapCount} (Ketercakupan: {c.evidence_coverage_pct || 0}%)
          </div>
        </div>

        {/* Child Claim Items Tree */}
        <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #e2e8f0' }}>
          {(evidenceChain?.items || []).map((item, idx) => (
            <div key={item.claimItemId} style={{ marginBottom: idx === (evidenceChain.items.length - 1) ? '0' : '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  minWidth: '300px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 800, color: '#007a78', fontSize: '0.85rem' }}>
                      Item: {item.claimItemId}
                    </span>
                    <StatusBadge status={item.calculatedStatus} />
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                    {formatServiceType(item.serviceType)}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Klaim: <strong style={{ color: '#0f172a' }}>{item.claimedQuantity} Prosedur</strong></span>
                    <span>Bukti: <strong style={{ color: item.supportedQuantity === 0 ? '#e11d48' : '#059669' }}>{item.supportedQuantity} Berkas</strong></span>
                    <span>Gap: <strong style={{ color: item.evidenceGap > 0 ? '#e11d48' : '#059669' }}>{item.evidenceGap} Tindakan</strong></span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '280px' }}>
                  {item.evidenceRecords && item.evidenceRecords.length > 0 ? (
                    item.evidenceRecords.map(rec => (
                      <div key={rec.id} style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={16} color="#007a78" />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                              {rec.evidenceType} — <span style={{ fontWeight: 600, color: '#334155' }}>{rec.sourceSystem}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Ref: {rec.documentRef || 'REC-VERIFIED'} • Tanggal: {rec.recordedAt ? formatDateIndo(rec.recordedAt) : '-'}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                          Bukti: {rec.quantity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      background: '#fff1f2',
                      border: '1px dashed #fecdd3',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      color: '#be123c',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <AlertTriangle size={18} color="#e11d48" />
                      <div>
                        <strong>Tidak Ditemukan Berkas Pendukung (Zero Match):</strong>
                        <div style={{ fontSize: '0.75rem', color: '#9f1239', marginTop: '2px' }}>
                          Tidak ada catatan EMR/SIMRS, lembar laboratorium, radiologi, atau resep fisik yang memvalidasi tindakan ini.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== 7. CLAIM ITEMS TABLE ==================== */}
      <div className="med-subpage-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#007a78" />
          Rincian Item Tindakan &amp; Rekonsiliasi Kesenjangan Bukti
        </h3>
        <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
          Tabel perbandingan matematis antara kuantitas tindakan yang ditagih faskes dengan berkas fisik terverifikasi.
        </p>

        <div className="med-table-wrap">
          <table className="med-clean-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Jenis Layanan</th>
                <th>Kode Diagnosa/Prosedur</th>
                <th>Qty Klaim</th>
                <th>Qty Bukti</th>
                <th>Selisih (Gap)</th>
                <th>Ketercakupan</th>
                <th>Status Verifikasi</th>
                <th>Nilai Tagihan</th>
              </tr>
            </thead>
            <tbody>
              {(evidenceChain?.items || []).map((item) => (
                <tr key={item.claimItemId}>
                  <td style={{ fontWeight: 800, color: '#007a78' }}>{item.claimItemId}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatServiceType(item.serviceType)}</td>
                  <td style={{ color: '#475569', fontWeight: 600 }}>{item.serviceCode}</td>
                  <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{item.claimedQuantity} Prosedur</td>
                  <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: item.supportedQuantity === 0 ? '#e11d48' : '#059669' }}>
                    {item.supportedQuantity} Berkas
                  </td>
                  <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: item.evidenceGap > 0 ? '#e11d48' : '#059669' }}>
                    {item.evidenceGap} Tindakan
                  </td>
                  <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{item.coveragePct}%</td>
                  <td><StatusBadge status={item.calculatedStatus} /></td>
                  <td style={{ fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(item.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 8. REVIEW OUTCOME & AUDIT TRAIL PANELS ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* PANEL 1: Role-Specific Action */}
        {currentUser?.role === 'staff_jkn' ? (
          /* Staff JKN Action: Assign Case to Clinical Reviewer */
          <div className="med-subpage-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <UserPlus size={18} color="#007a78" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Disposisi Berkas ke Dokter Penelaah
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Sebagai <strong>Staff JKN Pusat</strong>, arahkan berkas anomali ini kepada dokter penelaah klinis (DPJP) untuk pemeriksaan telaah rekam medis.
            </p>

            {assignSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', color: '#059669', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                Berkas berhasil ditugaskan kepada {assigneeName}.
              </div>
            )}

            <form onSubmit={handleAssignReviewer}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Pilih Dokter Spesialis Penelaah
                </label>
                <select
                  value={assignee}
                  onChange={(e) => {
                    setAssignee(e.target.value);
                    const mapName = {
                      'dr.anindya': 'dr. Anindya Kusuma, Sp.PK',
                      'dr.budi': 'dr. Budi Santoso, Sp.A',
                      'dr.ratna': 'dr. Ratna Dewi, Sp.PD'
                    };
                    setAssigneeName(mapName[e.target.value] || 'Tenaga Kesehatan');
                  }}
                  className="med-pill-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="dr.anindya">dr. Anindya Kusuma, Sp.PK (Spesialis Patologi Klinik)</option>
                  <option value="dr.budi">dr. Budi Santoso, Sp.A (Spesialis Anak)</option>
                  <option value="dr.ratna">dr. Ratna Dewi, Sp.PD (Spesialis Penyakit Dalam)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Catatan Arahan &amp; Catatan Investigasi Staff
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Mohon dokter meninjau kesesuaian tindakan di laboratorium patologi dan validitas rekam medis faskes..."
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="med-pill-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <UserPlus size={16} />
                {assigning ? 'Menugaskan...' : `Tugaskan Kasus ke ${assigneeName}`}
              </button>
            </form>
          </div>
        ) : (
          /* Clinical Reviewer Action: Submit Review Outcome */
          <div className="med-subpage-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <Stethoscope size={18} color="#007a78" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Keputusan Telaah Klinis Dokter (Review Outcome)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Sebagai <strong>Dokter Penelaah Klinis</strong> ({currentUser?.name}), evaluasi item tindakan klaim, periksa bukti fisik, dan tetapkan hasil audit medis.
            </p>

            {submissionSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', color: '#059669', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                Keputusan telaah klinis berhasil disimpan &amp; dicatat ke histori audit trail!
              </div>
            )}

            <form onSubmit={handleSubmitOutcome}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>
                  Pilih Hasil Telaah Klinis
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  {[
                    { id: 'NEEDS_MORE_EVIDENCE', label: 'Perlu Konfirmasi Berkas', desc: 'Membutuhkan berkas fisik tambahan dari faskes' },
                    { id: 'CONFIRMED', label: 'Terverifikasi Fraud / Phantom', desc: 'Disparitas terbukti nyata tanpa bukti pelayanan' },
                    { id: 'NOT_CONFIRMED', label: 'Klaim Wajar (Valid)', desc: 'Klaim dapat dipertanggungjawabkan medis' },
                    { id: 'FALSE_POSITIVE', label: 'False Positive', desc: 'Anomali akibat kesalahan teknis/rule sistem' }
                  ].map(opt => {
                    const isPicked = outcome === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setOutcome(opt.id)}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '14px',
                          background: isPicked ? '#f0fdf4' : '#f8fafc',
                          border: `1.5px solid ${isPicked ? '#10b981' : '#e2e8f0'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isPicked ? '#047857' : '#0f172a' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.35 }}>
                          {opt.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Catatan Pertimbangan Medis &amp; Rekomendasi Klinis
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan temuan klinis, hasil telaah rekam medis pasien, kesesuaian diagnosis & tindakan..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="med-pill-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Send size={16} />
                {submitting ? 'Menyimpan...' : 'Simpan Telaah Klinis & Update Kasus'}
              </button>
            </form>
          </div>
        )}

        {/* PANEL 2: Audit Trail Card (Visible to Both) */}
        <div className="med-subpage-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Clock size={18} color="#007a78" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Histori &amp; Log Akuntabilitas Kasus (Audit Trail)
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
            Catatan permanen setiap tindakan penugasan, perubahan status, dan telaah medis pada berkas ini.
          </p>

          <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map(log => (
                <div
                  key={log.audit_id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{
                      fontWeight: 800,
                      color: '#007a78',
                      fontSize: '0.78rem',
                      background: '#e6f6f5',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {log.action}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                      {formatDateTimeIndo(log.created_at)}
                    </span>
                  </div>
                  <div style={{ color: '#334155', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {log.detail}
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#64748b' }}>
                    Penanggung Jawab: <strong style={{ color: '#0f172a' }}>{log.actor_id}</strong>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                Belum ada aktivitas tercatat pada kasus ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
