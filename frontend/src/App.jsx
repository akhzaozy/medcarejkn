import React, { useState, useEffect, lazy, Suspense } from 'react';
import './index.css';
import './styles/medcare.css';
import './styles/medcare-minimalist.css';

import MedcareHeader from './components/layout/MedcareHeader';
const MedcareLanding=lazy(()=>import('./pages/MedcareLanding'));
const CasesPage=lazy(()=>import('./pages/CasesPage'));
const CaseDetailPage=lazy(()=>import('./pages/CaseDetailPage'));
const ValidationPage=lazy(()=>import('./pages/ValidationPage'));
const BpjsAuditPage=lazy(()=>import('./pages/BpjsAuditPage'));
const ClaimAuditInputPage=lazy(()=>import('./pages/ClaimAuditInputPage'));
const GuidePage=lazy(()=>import('./pages/GuidePage'));
import LoginPage from './pages/LoginPage';
const BpjsDataPage=lazy(()=>import('./pages/BpjsDataPage'));
import PageErrorBoundary from './components/common/PageErrorBoundary';
import {publicUser} from '../../shared/userIdentity.js';
import { fetchDashboard,logoutUser,isDemoMode } from './api/client';
import './styles/responsive.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jkn_user');
      if(!saved)return null;
      const safe=publicUser(JSON.parse(saved));localStorage.setItem('jkn_user',JSON.stringify(safe));return safe;
    } catch {
      return null;
    }
  });

  const [view, setView] = useState(() => {
    try {
      const saved = localStorage.getItem('jkn_user');
      return saved ? (window.location.hash === '#data-bpjs' ? 'bpjs' : window.location.hash === '#audit-bpjs' ? 'input' : 'landing') : 'login';
    } catch {
      return 'login';
    }
  });
  useEffect(()=>{const expired=()=>{localStorage.removeItem('jkn_user');localStorage.removeItem('jkn_token');setCurrentUser(null);setView('login');};window.addEventListener('jkn_session_expired',expired);return()=>window.removeEventListener('jkn_session_expired',expired);},[]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [dashboardError,setDashboardError]=useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [auditTab,setAuditTab]=useState('patients');
  const [auditCohort,setAuditCohort]=useState('Reguler');

  useEffect(() => {
    if (!currentUser) return;
    if (view === 'bpjs') window.history.replaceState(null, '', '#data-bpjs');
    else if (view === 'input') window.history.replaceState(null, '', '#audit-bpjs');
    else if (['#data-bpjs','#audit-bpjs'].includes(window.location.hash)) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [view, currentUser]);

  useEffect(() => {
    if (currentUser && view==='landing') loadDashboard();
  }, [currentUser,view]);

  const loadDashboard = async (user = currentUser) => {
    try {
      const params = {};
      if (user?.role === 'clinical_reviewer') {
        params.assignedTo = user.username;
        params.role = user.role;
      }
      setDashboardError('');
      const data = await fetchDashboard(params);
      setDashboardData(data);
    } catch (err) {
      setDashboardError(err.message);
    }
  };

  const handleLoginSuccess = (user, token) => {
    user=publicUser(user);
    setCurrentUser(user);
    try {
      localStorage.setItem('jkn_user', JSON.stringify(user));
      if (token) localStorage.setItem('jkn_token', token);
    } catch (e) {
      console.error(e);
    }
    setView(window.location.hash === '#data-bpjs' ? 'bpjs' : window.location.hash === '#audit-bpjs' ? 'input' : 'landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    try {
      localStorage.removeItem('jkn_user');
      localStorage.removeItem('jkn_token');
    } catch (e) {
      console.error(e);
    }
    setView('login');
  };

  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setView('case-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setSelectedCaseId(null);
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQueue = () => {
    setSelectedCaseId(null);
    setView('cases');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenValidation = () => {
    setSelectedCaseId(null);
    setView('validation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInput = () => {
    setAuditTab('patients');
    setAuditCohort('Reguler');
    setSelectedCaseId(null);
    setView('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBpjsAudit = (cohort='Reguler',tab='patients') => {
    setAuditCohort(cohort);setAuditTab(tab);setSelectedCaseId(null);setView('input');
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleOpenGuide = () => {
    setSelectedCaseId(null);
    setView('guide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSection = (sectionId) => {
    if (view !== 'landing') {
      setView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (view === 'login' || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // UNIFIED APP SHELL: Single shared MedcareHeader across all views for 100% serumpun navigation
  return (
    <div className="med-container">
      <div className="med-inner">
        <MedcareHeader
          activeSection={view}
          onNavigate={handleNavigateSection}
          onOpenQueue={handleOpenQueue}
          onOpenValidation={handleOpenValidation}
          onOpenInput={handleOpenInput}
          onOpenGuide={handleOpenGuide}
          onOpenBpjs={() => { setView('bpjs'); window.scrollTo({ top: 0 }); }}
          onSelectCase={handleSelectCase}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {isDemoMode() && <p className="demo-mode-banner" role="status">Mode Demo — data tidak disimpan</p>}
        <main style={{ minHeight: view === 'input' ? 0 : '70vh' }}><PageErrorBoundary key={view+selectedCaseId} onBack={handleBackToLanding}><Suspense fallback={<p role="status">Memuat halaman…</p>}>
          {view === 'bpjs' && <BpjsDataPage currentUser={currentUser} onSelectCase={handleSelectCase} onOpenPatients={handleOpenBpjsAudit} />}
          {view === 'landing' && (dashboardError ? <section className="med-subpage-card" role="alert"><h2>Ringkasan belum dapat dimuat</h2><p>{dashboardError}</p><button className="btn-pill-primary" onClick={()=>loadDashboard()}>Coba lagi</button></section> : !dashboardData ? <p role="status">Memuat ringkasan…</p> : (
            <MedcareLanding
              dashboardData={dashboardData}
              onSelectCase={handleSelectCase}
              onOpenQueue={handleOpenQueue}
              onOpenInput={handleOpenInput}
              onOpenGuide={handleOpenGuide}
              currentUser={currentUser}
              onLogout={handleLogout}
              hideHeader={true}
            />
          ))}

          {view === 'guide' && (
            <GuidePage
              onSelectCase={handleSelectCase}
              onOpenQueue={handleOpenQueue}
              onOpenInput={handleOpenInput}
              onBackToLanding={handleBackToLanding}
            />
          )}

          {view === 'input' && (
            <ClaimAuditInputPage
              onSelectCase={handleSelectCase}
              onOpenQueue={handleOpenQueue}
              onBack={handleBackToLanding}
              currentUser={currentUser}
            />
          )}

          {view === 'cases' && (
            <div style={{ paddingTop: '0.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  className="btn-pill-outline"
                  onClick={handleBackToLanding}
                  style={{ padding: '0.45rem 1.2rem', fontSize: '0.8rem' }}
                >
                  ← Kembali ke Beranda
                </button>
                
              </div>
              <CasesPage onSelectCase={handleSelectCase} currentUser={currentUser} />
            </div>
          )}

          {view === 'validation' && (
            <ValidationPage
              onOpenQueue={handleOpenQueue}
              onSelectCase={handleSelectCase}
              onBack={handleBackToLanding}
              currentUser={currentUser}
            />
          )}

          {view === 'case-detail' && selectedCaseId && (
            <div style={{ paddingTop: '0.5rem' }}>
              <CaseDetailPage
                caseId={selectedCaseId}
                onBack={() => setView('cases')}
                currentUser={currentUser}
              />
            </div>
          )}
        </Suspense></PageErrorBoundary></main>

        {/* Minimalist medCare Footer — matches landing page */}
        {view !== 'input' && <footer style={{
          background: 'var(--mc-card-bg)',
          borderTop: '1px solid var(--mc-card-border)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginTop: '3rem',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 5px)', gridGap: '3px' }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--mc-teal-primary, #007a78)' }} />
              ))}
            </div>
            <span style={{ fontWeight: 800, color: '#1a3339', fontSize: '1.1rem' }}>medCare</span>
            <span style={{ fontWeight: 700, color: 'var(--mc-teal-primary, #007a78)', fontSize: '0.95rem' }}>JKN</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--mc-text-muted)', maxWidth: '550px', margin: '0 auto' }}>
            Prototipe audit berbasis bukti dan eksplorasi data sampel BPJS. Data simulasi audit dan data BPJS ditampilkan dengan cakupan masing-masing.
          </p>
        </footer>}
      </div>
    </div>
  );
}
