import React, { useEffect, useState } from 'react';
import { fetchCases } from '../api/client';
import { PriorityBadge } from '../components/common/Badge';
import { 
  formatRiskMode, formatCaseStatus, formatEncounterType, 
  formatGender, formatAgeGroup, formatCurrency 
} from '../utils/formatters';
import { 
  Search, Filter, RefreshCw, ShieldAlert, ArrowRight, Layers, 
  FileCheck, LayoutGrid, Table, CheckCircle2, Clock, AlertTriangle, 
  Stethoscope, FileText, ChevronRight, ChevronDown, ChevronUp, Lock, UserPlus 
} from 'lucide-react';

export default function CasesPage({ onSelectCase, currentUser }) {
  const isClinician = currentUser?.role === 'clinical_reviewer';
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (visual & easy to read) or 'table'
  const [activeQueueTab, setActiveQueueTab] = useState(isClinician ? 'assigned' : 'all');
  const [activePipelineStage, setActivePipelineStage] = useState('ALL'); // 'ALL', 'OPEN', 'IN_REVIEW', 'COMPLETED'
  const [showAllCards, setShowAllCards] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12; // 12 kasus per halaman (super ringan dan instan dimuat)

  const [filters, setFilters] = useState({
    search: '',
    priority: 'ALL',
    status: 'ALL',
    riskMode: isClinician ? 'PHANTOM_BILLING' : 'ALL',
    assignedTo: isClinician ? currentUser.username : 'ALL'
  });

  useEffect(() => {
    loadCases();
  }, [filters, activeQueueTab, page]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const queryFilters = { ...filters, page, limit };
      if (isClinician && currentUser) {
        queryFilters.assignedTo = currentUser.username;
        if (queryFilters.riskMode === 'ALL') {
          queryFilters.riskMode = 'PHANTOM_BILLING';
        }
      } else if (activeQueueTab === 'assigned' && currentUser) {
        queryFilters.assignedTo = currentUser.username;
      } else if (activeQueueTab === 'all') {
        delete queryFilters.assignedTo;
      }
      const res = await fetchCases(queryFilters);
      
      const rawData = res?.data || (Array.isArray(res) ? res : []);
      const totalCount = res?.total !== undefined ? res.total : rawData.length;
      const totalP = res?.totalPages || Math.ceil(totalCount / limit) || 1;

      setCases(rawData);
      setTotalCases(totalCount);
      setTotalPages(totalP);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStageSelect = (stage) => {
    setActivePipelineStage(stage);
    if (stage === 'ALL') {
      handleFilterChange('status', 'ALL');
    } else if (stage === 'OPEN') {
      handleFilterChange('status', 'OPEN');
    } else if (stage === 'IN_REVIEW') {
      handleFilterChange('status', 'IN_REVIEW');
    } else if (stage === 'COMPLETED') {
      handleFilterChange('status', 'CONFIRMED');
    }
  };

  const handleSwitchTab = (tab) => {
    if (isClinician) return; // Prevent clinician from accessing other doctors' cases
    setActiveQueueTab(tab);
    if (tab === 'assigned') {
      setFilters(prev => ({ ...prev, assignedTo: currentUser?.username || 'ALL' }));
    } else {
      setFilters(prev => {
        const copy = { ...prev };
        delete copy.assignedTo;
        return copy;
      });
    }
  };

  // Helper stats for pipeline
  const countOpen = cases.filter(c => c.case_status === 'OPEN').length;
  const countInReview = cases.filter(c => c.case_status === 'IN_REVIEW').length;
  const countCompleted = cases.filter(c => c.case_status === 'CONFIRMED' || c.case_status === 'NOT_CONFIRMED' || c.case_status === 'CLOSED').length;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Editorial Minimalist Hero Header */}
      <div className="med-hero-row" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div className="med-greeting-col">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isClinician ? '#ecfdf5' : '#e6f6f5',
            color: isClinician ? '#059669' : '#007a78',
            border: `1px solid ${isClinician ? '#a7f3d0' : '#c5ebe9'}`,
            padding: '5px 14px',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 700,
            marginBottom: '0.6rem'
          }}>
            {isClinician ? <Stethoscope size={14} /> : <FileCheck size={14} />}
            <span>{isClinician ? 'ANTREAN TELAAH MEDIS DOKTER' : 'ANTREAN & TRIABILITAS VERIFIKASI KLAIM'}</span>
          </div>
          <h1 className="med-greeting-title">
            {isClinician ? (
              <>Audit <strong>Phantom Billing Dokter</strong></>
            ) : (
              <>Antrean Investigasi &amp; <strong>Verifikasi Klaim</strong></>
            )}
          </h1>
          <p className="med-greeting-subtitle">
            {isClinician ? (
              <>Antrean khusus penelaahan klinis untuk <strong>{currentUser?.name || 'dr. Anindya Kusuma, Sp.PK'}</strong> berfokus pada audit disparitas tagihan <strong>Phantom Billing</strong>.</>
            ) : (
              <>Daftar antrean kasus klaim JKN yang teridentifikasi untuk penelaahan berbasis disparitas bukti klinis dan rekam medis.</>
            )}
          </p>
        </div>

        <div className="med-vitals-group">
          <div className="med-vital-pill">
            <div className={`med-vital-icon-box ${isClinician ? 'teal' : 'cyan'}`}>
              <FileText size={20} />
            </div>
            <div>
              <div className="med-vital-val">{totalCases}</div>
              <div className="med-vital-lbl">Total Kasus</div>
            </div>
          </div>
          <button
            onClick={loadCases}
            className="med-pill-btn-primary"
            style={{ padding: '0.7rem 1.4rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
            Refresh Data
          </button>
        </div>
      </div>



      {/* ---------------- PIPELINE STAGE TRACKER (ALUR PROSES KASUS) ---------------- */}
      <div className="med-subpage-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#007a78', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PIPELINE ALUR INVESTIGASI
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
              Tahapan Penanganan Kasus
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Klik tahapan di bawah untuk menyaring kasus langsung sesuai progresnya:
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {/* Stage ALL */}
          <div
            onClick={() => handleStageSelect('ALL')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              background: activePipelineStage === 'ALL' ? '#edf3f4' : '#f8fafc',
              border: `2px solid ${activePipelineStage === 'ALL' ? '#007a78' : '#e2e8f0'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>SEMUA KASUS</span>
              <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>
                {cases.length}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              Total Antrean Terbuka
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
              Seluruh rekam audit JKN
            </div>
          </div>

          {/* Stage 1: OPEN (Menunggu Triage Staff JKN) */}
          <div
            onClick={() => handleStageSelect('OPEN')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              background: activePipelineStage === 'OPEN' ? '#eff6ff' : '#f8fafc',
              border: `2px solid ${activePipelineStage === 'OPEN' ? '#2563eb' : '#e2e8f0'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb' }}>TAHAP 1: KASUS BARU</span>
              <span style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8' }}>
                {countOpen}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              Menunggu Disposisi Staff
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
              Kasus baru perlu diarahkan ke dokter
            </div>
          </div>

          {/* Stage 2: IN_REVIEW (Sedang Ditelaah Nakes) */}
          <div
            onClick={() => handleStageSelect('IN_REVIEW')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              background: activePipelineStage === 'IN_REVIEW' ? '#fffbeb' : '#f8fafc',
              border: `2px solid ${activePipelineStage === 'IN_REVIEW' ? '#d97706' : '#e2e8f0'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706' }}>TAHAP 2: DALAM TELAAH</span>
              <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, color: '#b45309' }}>
                {countInReview}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              Di Meja Tenaga Kesehatan
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
              Sedang diverifikasi rekam medis
            </div>
          </div>

          {/* Stage 3: COMPLETED (Keputusan Terbit) */}
          <div
            onClick={() => handleStageSelect('COMPLETED')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              background: activePipelineStage === 'COMPLETED' ? '#f0fdf4' : '#f8fafc',
              border: `2px solid ${activePipelineStage === 'COMPLETED' ? '#10b981' : '#e2e8f0'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a' }}>TAHAP 3: SELESAI</span>
              <span style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, color: '#15803d' }}>
                {countCompleted}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              Outcome Medis Terbit
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
              Tercatat di audit trail permanen
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Clean White Pill Style) */}
      {/* Filter Toolbar (Clean White Pill Style) */}
      <div className="med-subpage-card" style={{ padding: '1.25rem 1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.45rem' }}>
              Pencarian Cepat
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--mc-text-muted)' }} />
              <input
                type="text"
                placeholder="Cari Case ID, Claim ID, Faskes..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="med-pill-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.45rem' }}>
              Prioritas Pemeriksaan
            </label>
            <select
              value={filters.priority}
              onChange={e => handleFilterChange('priority', e.target.value)}
              className="med-pill-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="HIGH">HIGH (Phantom Billing)</option>
              <option value="MEDIUM">MEDIUM (Pattern / Partial)</option>
              <option value="NO_CONCLUSION">NO CONCLUSION (Unavailable)</option>
              <option value="LOW">LOW (Corroborated)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--mc-text-heading)', marginBottom: '0.45rem' }}>
              Status Kasus
            </label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="med-pill-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">OPEN (Belum Ditinjau)</option>
              <option value="IN_REVIEW">IN_REVIEW (Sedang Ditinjau)</option>
              <option value="NEEDS_MORE_EVIDENCE">NEEDS_MORE_EVIDENCE</option>
              <option value="CONFIRMED">CONFIRMED (Terkonfirmasi)</option>
              <option value="CLOSED">CLOSED (Selesai)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="med-subpage-card">
        {/* Top Control Bar: Results info, Clinician Tab, & View Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.92rem', color: '#475569', fontWeight: 600 }}>
            {isClinician ? (
              <>Menampilkan <strong style={{ color: '#059669' }}>{cases.length}</strong> kasus Phantom Billing terverifikasi khusus Anda</>
            ) : (
              <>Menampilkan <strong style={{ color: '#007a78' }}>{cases.length}</strong> kasus klaim aktif</>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Clinician Isolation Badge */}
            {isClinician ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <Stethoscope size={14} />
                <span>Dokter: {currentUser?.name || 'dr. Anindya'}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                <button
                  onClick={() => handleSwitchTab('assigned')}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeQueueTab === 'assigned' ? '#059669' : 'transparent',
                    color: activeQueueTab === 'assigned' ? '#ffffff' : '#64748b'
                  }}
                >
                  🩺 Ditugaskan ke Saya
                </button>
                <button
                  onClick={() => handleSwitchTab('all')}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeQueueTab === 'all' ? '#007a78' : 'transparent',
                    color: activeQueueTab === 'all' ? '#ffffff' : '#64748b'
                  }}
                >
                  Semua Antrean Kasus
                </button>
              </div>
            )}

            {/* View Mode Toggle: Cards (Easier to read) vs Table */}
            <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '3px', borderRadius: '12px' }}>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '9px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: viewMode === 'cards' ? '#007a78' : 'transparent',
                  color: viewMode === 'cards' ? '#ffffff' : '#64748b'
                }}
              >
                <LayoutGrid size={14} />
                <span>Kartu Visual (Mudah Dibaca)</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '9px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: viewMode === 'table' ? '#007a78' : 'transparent',
                  color: viewMode === 'table' ? '#ffffff' : '#64748b'
                }}
              >
                <Table size={14} />
                <span>Tabel Lengkap</span>
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- VIEW MODE 1: VISUAL CARDS (SANGAT MUDAH DIBACA) ---------------- */}
        {viewMode === 'cards' && (
          <div>
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 0.75rem auto', color: '#007a78' }} />
                <div>Memuat antrean penelaahan kasus...</div>
              </div>
            ) : cases.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                Tidak ada kasus yang memenuhi kriteria filter saat ini.
              </div>
            ) : (
              <div>
                {/* Visual count header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    Menampilkan <strong style={{ color: isClinician ? '#059669' : '#007a78' }}>{totalCases > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalCases)}</strong> dari <strong>{totalCases.toLocaleString('id-ID')}</strong> total kasus (Halaman {page} dari {totalPages})
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700 }}>
                    ⚡ Mode Cepat (12 Data/Halaman)
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {cases.map(c => {
                    const isPhantom = c.primary_risk_mode === 'PHANTOM_BILLING';
                    const isGhost = c.primary_risk_mode === 'GHOST_ENROLLEE';
                    const isWrong = c.primary_risk_mode === 'WRONG_DIAGNOSIS';

                    return (
                      <div
                        key={c.case_id}
                        style={{
                          background: '#ffffff',
                          border: isPhantom ? '1.5px solid #fecdd3' : '1.5px solid #e2e8f0',
                          borderRadius: '20px',
                          padding: '1.5rem',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = isClinician ? '#059669' : '#007a78';
                          e.currentTarget.style.boxShadow = isClinician ? '0 10px 25px rgba(5, 150, 105, 0.12)' : '0 10px 25px rgba(0, 122, 120, 0.12)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = isPhantom ? '#fecdd3' : '#e2e8f0';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div>
                          {/* Top Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                            <div>
                              <span style={{ fontWeight: 800, color: isClinician ? '#059669' : '#007a78', fontSize: '1.05rem' }}>
                                {c.case_id}
                              </span>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                Klaim: <span style={{ fontWeight: 700, color: '#334155' }}>{c.claim_id}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <PriorityBadge priority={c.review_priority} />
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: c.case_status === 'OPEN' ? '#e6f6f5' : c.case_status === 'IN_REVIEW' ? '#fef3c7' : '#ecfdf5',
                                color: c.case_status === 'OPEN' ? '#007a78' : c.case_status === 'IN_REVIEW' ? '#b45309' : '#059669'
                              }}>
                                {formatCaseStatus(c.case_status)}
                              </span>
                            </div>
                          </div>

                          {/* Faskes & Pasien */}
                          <div style={{ marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                              {c.provider_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                              <span>Pasien: <strong style={{ color: '#334155' }}>{c.patient_id || 'PAT-SYN-001'}</strong></span>
                              <span>•</span>
                              <span>{formatGender(c.sex)}, {formatAgeGroup(c.age_group)}</span>
                              <span>•</span>
                              <span style={{ color: '#007a78', fontWeight: 600 }}>{formatEncounterType(c.encounter_type)}</span>
                            </div>
                          </div>

                          {/* "MENGAPA KASUS INI TERDETEKSI?" Box */}
                          <div style={{
                            background: isPhantom ? '#fff1f2' : isWrong ? '#fef2f2' : isGhost ? '#eff6ff' : '#f8fafc',
                            border: `1px solid ${isPhantom ? '#fecdd3' : isWrong ? '#fee2e2' : isGhost ? '#bfdbfe' : '#e2e8f0'}`,
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.3rem' }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                background: isPhantom ? '#ffe4e6' : isWrong ? '#fef3c7' : isGhost ? '#dbeafe' : '#e6f6f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <ShieldAlert size={12} color={isPhantom ? '#e11d48' : isWrong ? '#d97706' : isGhost ? '#2563eb' : '#007a78'} />
                              </div>
                              <span style={{
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                color: isPhantom ? '#be123c' : isWrong ? '#b45309' : isGhost ? '#1d4ed8' : '#005f5d'
                              }}>
                                {formatRiskMode(c.primary_risk_mode)}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.45, margin: 0 }}>
                              {c.review_focus || c.affected_items || 'Pemeriksaan rekonsiliasi data klaim terhadap berkas rekam medis faskes.'}
                            </p>
                          </div>

                          {/* Financial & Evidence Meter */}
                          <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                                  Total Tagihan Faskes
                                </span>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                                  Rp {Number(c.total_amount).toLocaleString('id-ID')}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                                  Ketercakupan Bukti: <strong style={{ color: Number(c.evidence_coverage_pct) < 50 ? '#e11d48' : '#059669' }}>{c.evidence_coverage_pct}%</strong>
                                </span>
                                <div style={{ fontSize: '0.75rem', color: Number(c.evidence_gap) > 0 ? '#e11d48' : '#64748b', fontWeight: 700 }}>
                                  Gap: {c.evidence_gap !== null ? `${c.evidence_gap} unit hilang` : 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(100, Math.max(0, Number(c.evidence_coverage_pct) || 0))}%`,
                                height: '100%',
                                background: Number(c.evidence_coverage_pct) < 50 ? '#f43f5e' : '#10b981',
                                borderRadius: '9999px'
                              }} />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Assignee status & Action Button */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {c.assigned_name ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#047857', fontWeight: 700 }}>
                                <Stethoscope size={13} />
                                {c.assigned_name}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Belum diarahkan</span>
                            )}
                          </div>

                          <button
                            onClick={() => onSelectCase(c.case_id)}
                            style={{
                              background: isClinician ? '#059669' : '#007a78',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '9999px',
                              padding: '0.45rem 1rem',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: isClinician ? '0 2px 8px rgba(5, 150, 105, 0.25)' : '0 2px 8px rgba(0, 122, 120, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{isClinician ? 'Buka Telaah' : 'Lihat Detail Kasus'}</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ---------------- VIEW MODE 2: DETAILED TABLE ---------------- */}
        {viewMode === 'table' && (
          <div className="med-table-wrap">
            <table className="med-clean-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Claim ID</th>
                  <th>Fasilitas Kesehatan</th>
                  {!isClinician && (
                    <th>Mode Risiko</th>
                  )}
                  <th>Prioritas</th>
                  <th>Disparitas Bukti</th>
                  <th>Nilai Klaim</th>
                  <th>Ditugaskan Ke</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isClinician ? 9 : 10} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      Memuat antrean penelaahan kasus...
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={isClinician ? 9 : 10} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      Tidak ada kasus yang memenuhi kriteria filter.
                    </td>
                  </tr>
                ) : (
                  cases.map((c, index) => (
                    <tr
                      key={c.case_id}
                      style={{
                        background: index % 2 === 0 ? '#ffffff' : '#fbfcfe',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#edf3f4'}
                      onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fbfcfe'}
                    >
                      <td style={{ padding: '1.1rem 1.25rem', fontWeight: 800, color: '#007a78' }}>
                        {c.case_id}
                      </td>
                      <td style={{ padding: '1.1rem 1.25rem', fontWeight: 600, color: '#334155' }}>
                        {c.claim_id}
                      </td>
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.provider_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.provider_id} • {formatEncounterType(c.encounter_type)}</div>
                      </td>
                      {!isClinician && (
                        <td style={{ padding: '1.1rem 1.25rem' }}>
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: c.primary_risk_mode === 'PHANTOM_BILLING' ? '#e11d48' : c.primary_risk_mode === 'GHOST_ENROLLEE' ? '#2563eb' : '#059669'
                          }}>
                            {formatRiskMode(c.primary_risk_mode)}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <PriorityBadge priority={c.review_priority} />
                      </td>
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        {c.evidence_gap !== null ? (
                          <div>
                            <strong style={{ color: c.evidence_gap > 0 ? '#e11d48' : '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                              {c.evidence_gap} unit gap
                            </strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                              {c.evidence_coverage_pct}% coverage
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Unavailable</span>
                        )}
                      </td>
                      <td style={{ padding: '1.1rem 1.25rem', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        Rp {Number(c.total_amount).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        {c.assigned_name ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#065f46',
                            background: '#d1fae5',
                            padding: '3px 8px',
                            borderRadius: '8px'
                          }}>
                            🩺 {c.assigned_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Belum Ditugaskan</span>
                        )}
                      </td>
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background: c.case_status === 'OPEN' ? '#e6f6f5' : c.case_status === 'IN_REVIEW' ? '#fef3c7' : '#ecfdf5',
                          color: c.case_status === 'OPEN' ? '#007a78' : c.case_status === 'IN_REVIEW' ? '#b45309' : '#059669',
                          border: c.case_status === 'OPEN' ? '1px solid #c5ebe9' : c.case_status === 'IN_REVIEW' ? '1px solid #fde68a' : '1px solid #a7f3d0'
                        }}>
                          {c.case_status}
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <button
                          onClick={() => onSelectCase(c.case_id)}
                          style={{
                            background: isClinician ? '#059669' : '#007a78',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '0.45rem 1rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(0, 122, 120, 0.25)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{isClinician ? 'Telaah' : 'Detail'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- PAGINATION CONTROLLER BAR (SUPER RINGAN & CEPAT) ---------------- */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2rem',
            padding: '1.2rem 1.5rem',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
              Menampilkan data ke <strong style={{ color: isClinician ? '#059669' : '#007a78' }}>{(page - 1) * limit + 1} - {Math.min(page * limit, totalCases)}</strong> dari <strong>{totalCases.toLocaleString('id-ID')}</strong> kasus total (Halaman {page} dari {totalPages})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPage(prev => Math.max(1, prev - 1));
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                style={{
                  background: page <= 1 ? '#f1f5f9' : '#ffffff',
                  color: page <= 1 ? '#94a3b8' : '#0f172a',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ◀ Sebelumnya
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(() => {
                  const buttons = [];
                  const maxVisible = 5;
                  let start = Math.max(1, page - 2);
                  let end = Math.min(totalPages, start + maxVisible - 1);
                  if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  for (let p = start; p <= end; p++) {
                    const isActive = p === page;
                    buttons.push(
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        style={{
                          background: isActive ? (isClinician ? '#059669' : '#007a78') : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          border: isActive ? 'none' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {p}
                      </button>
                    );
                  }
                  return buttons;
                })()}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => {
                  setPage(prev => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                style={{
                  background: page >= totalPages ? '#f1f5f9' : '#ffffff',
                  color: page >= totalPages ? '#94a3b8' : '#0f172a',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Berikutnya ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
