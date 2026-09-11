import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/medcare-minimalist.css';

import MedcareHeader from '../components/layout/MedcareHeader';
import MedcareVitalsBanner from '../components/medcare/MedcareVitalsBanner';
import MedcareAuditTimelineCard from '../components/medcare/MedcareAuditTimelineCard';
import MedcareDailyVerificationCard from '../components/medcare/MedcareDailyVerificationCard';
import MedcareIntegrityScoreCard from '../components/medcare/MedcareIntegrityScoreCard';
import MedcareFraudReportChartCard from '../components/medcare/MedcareFraudReportChartCard';
import MedcarePriorityAuditCard from '../components/medcare/MedcarePriorityAuditCard';
import MedcareFieldVerificationCard from '../components/medcare/MedcareFieldVerificationCard';

import MedcareAuditScheduleModal from '../components/medcare/MedcareAuditScheduleModal';
import MedcareVerificationDetailModal from '../components/medcare/MedcareVerificationDetailModal';

export default function MedcareMinimalistDashboard({
  dashboardData,
  onSelectCase,
  onOpenQueue,
  onOpenValidation,
  onOpenInput,
  currentUser,
  onLogout,
  hideHeader = false
}) {
  const [activeTab, setActiveTab] = useState('landing');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const data = dashboardData || {
    claimsAnalyzed: 4538,
    highPriorityCases: 172,
    caseCount: 6,
    financials: { totalBilled: 1998734, totalExposure: 22530892 }
  };

  const dashboardBody = (
    <>
      {/* Personalized Welcome Banner & Quick Vital Metrics */}
      <MedcareVitalsBanner
        userName={currentUser?.name || 'dr. Anindya Kusuma, Sp.PK'}
        vitals={{
          claimsAnalyzed: data.claimsAnalyzed || (currentUser?.role === 'clinical_reviewer' ? 1446 : 4336),
          totalExposureMiliar: (data.financials?.totalExposure ? data.financials.totalExposure / 1000000 : 22.53),
          priorityCases: data.caseCount || (currentUser?.role === 'clinical_reviewer' ? 1446 : 4336)
        }}
      />

        {/* 3-Column Grid Dashboard Layout */}
        <motion.div
          className="med-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* LEFT COLUMN: Antrean Audit Timeline & Rekap Berkas Harian */}
          <div className="med-col med-col-left">
            <MedcareAuditTimelineCard
              onOpenQueue={onOpenQueue}
              onSelectCase={(caseId) => {
                if (onSelectCase) onSelectCase(caseId);
                else showToast(`Membuka kasus ${caseId}`);
              }}
            />

            <MedcareDailyVerificationCard
              onOpenQueue={onOpenQueue}
            />
          </div>

          {/* CENTER COLUMN: Skor Integritas Klaim & Laporan Tren Fraud */}
          <div className="med-col med-col-center">
            <MedcareIntegrityScoreCard
              score={92}
              reconciliationRate="94%"
              resolvedCases={String(data.caseCount || (currentUser?.role === 'clinical_reviewer' ? '1.446' : '4.336'))}
            />

            <div id="medcare-fraud-report-section">
              <MedcareFraudReportChartCard />
            </div>
          </div>

          {/* RIGHT COLUMN: Rencana Audit Prioritas & Verifikasi Lapangan */}
          <div className="med-col med-col-right">
            <MedcarePriorityAuditCard
              onOpenQueue={onOpenQueue}
              priorityCount={data.caseCount || (currentUser?.role === 'clinical_reviewer' ? 1446 : 4336)}
            />

            <MedcareFieldVerificationCard
              onOpenDetails={() => setIsVerificationOpen(true)}
            />
          </div>
        </motion.div>

      {/* Interactive Modals */}
      <MedcareAuditScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onBookingSuccess={(details) => {
          showToast(`Jadwal audit ${details.hospital} ditetapkan pada ${details.date} pukul ${details.time}`);
        }}
      />

      <MedcareVerificationDetailModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: '#ffffff',
            padding: '0.6rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🩺</span>
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </>
  );

  if (hideHeader) {
    return dashboardBody;
  }

  return (
    <div className="med-container">
      <div className="med-inner">
        <MedcareHeader
          activeSection="landing"
          onNavigate={() => {}}
          onOpenQueue={onOpenQueue}
          onOpenInput={onOpenInput}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        {dashboardBody}
      </div>
    </div>
  );
}
