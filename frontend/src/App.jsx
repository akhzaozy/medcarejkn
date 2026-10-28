import React, { useState, useEffect } from 'react';
import './index.css';
import './styles/medcare.css';
import './styles/medcare-minimalist.css';

import MedcareHeader from './components/layout/MedcareHeader';
import MedcareLanding from './pages/MedcareLanding';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ValidationPage from './pages/ValidationPage';
import BpjsAuditPage from './pages/BpjsAuditPage';
import GuidePage from './pages/GuidePage';
import LoginPage from './pages/LoginPage';
import BpjsDataPage from './pages/BpjsDataPage';
import { fetchDashboard } from './api/client';
import './styles/responsive.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jkn_user');
      return saved ? JSON.parse(saved) : null;
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
  const [selectedCaseId, setSelectedCaseId] = useState(null);
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
    if (currentUser) {
      loadDashboard();
    }
  }, [currentUser]);

  const loadDashboard = async (user = currentUser) => {
    try {
      const params = {};
      if (user?.role === 'clinical_reviewer') {
        params.assignedTo = user.username;
        params.role = user.role;
      }
      const data = await fetchDashboard(params);
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (user, token) => {
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
          activeSection={view==='input' && auditTab==='queue' ? 'cases' : view}
          onNavigate={handleNavigateSection}
          onOpenQueue={() => handleOpenBpjsAudit('Reguler','queue')}
          onOpenInput={handleOpenInput}
          onOpenGuide={handleOpenGuide}
          onOpenBpjs={() => { setView('bpjs'); window.scrollTo({ top: 0 }); }}
          onSelectCase={handleSelectCase}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main style={{ minHeight: view === 'input' ? 0 : '70vh' }}>
          {view === 'bpjs' && <BpjsDataPage onOpenPatients={handleOpenBpjsAudit} />}
          {view === 'landing' && (
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
          )}

          {view === 'guide' && (
            <GuidePage
              onSelectCase={handleSelectCase}
              onOpenQueue={handleOpenQueue}
              onOpenInput={handleOpenInput}
              onBackToLanding={handleBackToLanding}
            />
          )}

          {view === 'input' && (
            <BpjsAuditPage
              onTabChange={setAuditTab}
              initialTab={auditTab}
              initialCohort={auditCohort}
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
                <button className="btn-pill-primary" style={{marginLeft:12}} onClick={()=>handleOpenBpjsAudit('Reguler','queue')}>Antrean audit pasien BPJS</button>
              </div>
              <CasesPage onSelectCase={handleSelectCase} currentUser={currentUser} />
            </div>
          )}

          {view === 'validation' && (
            <ValidationPage
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
        </main>

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
