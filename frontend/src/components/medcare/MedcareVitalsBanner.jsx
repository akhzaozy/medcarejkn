import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';

export default function MedcareVitalsBanner({
  userName = 'dr. Anindya',
  vitals = {
    claimsAnalyzed: 4538,
    totalExposureMiliar: 22.53,
    priorityCases: 6
  }
}) {
  const claimsRef = useRef(null);
  const exposureRef = useRef(null);
  const priorityRef = useRef(null);

  useEffect(() => {
    // Number counter animation with Anime.js
    const counterObj = {
      claims: 1200,
      exposure: 5.0,
      priority: 0
    };

    anime({
      targets: counterObj,
      claims: vitals.claimsAnalyzed,
      exposure: vitals.totalExposureMiliar,
      priority: vitals.priorityCases,
      easing: 'easeOutExpo',
      duration: 1800,
      round: false,
      update: () => {
        if (claimsRef.current) {
          claimsRef.current.textContent = Math.round(counterObj.claims).toLocaleString('id-ID');
        }
        if (exposureRef.current) {
          exposureRef.current.textContent = `Rp ${counterObj.exposure.toFixed(2)} M`;
        }
        if (priorityRef.current) {
          priorityRef.current.textContent = `${String(Math.round(counterObj.priority)).padStart(2, '0')} Kasus`;
        }
      }
    });
  }, [vitals]);

  return (
    <div className="med-hero-row">
      {/* Left: Greeting */}
      <motion.div
        className="med-greeting-col"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="med-greeting-title">
          Selamat datang kembali, <strong>{userName}</strong>
        </h1>
        <p className="med-greeting-subtitle">
          Berikut pembaruan integritas klaim &amp; audit phantom billing hari ini
        </p>
      </motion.div>

      {/* Right: Quick Metrics */}
      <motion.div
        className="med-vitals-group"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Metric 1: Klaim Teranalisis */}
        <motion.div
          className="med-vital-pill"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="med-vital-icon-box teal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h6.28" stroke="#007a78" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <div className="med-vital-val" ref={claimsRef}>
              {vitals.claimsAnalyzed.toLocaleString('id-ID')}
            </div>
            <div className="med-vital-lbl">Klaim Teranalisis</div>
          </div>
        </motion.div>

        {/* Metric 2: Potensi Kerugian Fraud */}
        <motion.div
          className="med-vital-pill"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="med-vital-icon-box cyan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="med-vital-val" ref={exposureRef}>
              Rp {vitals.totalExposureMiliar.toFixed(2)} M
            </div>
            <div className="med-vital-lbl">Eksposur Risiko Fraud</div>
          </div>
        </motion.div>

        {/* Metric 3: Kasus Prioritas */}
        <motion.div
          className="med-vital-pill"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="med-vital-icon-box badge-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="med-vital-val" ref={priorityRef}>
              {String(vitals.priorityCases).padStart(2, '0')} Kasus
            </div>
            <div className="med-vital-lbl">Prioritas Phantom Billing</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
