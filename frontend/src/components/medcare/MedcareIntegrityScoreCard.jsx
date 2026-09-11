import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';

export default function MedcareIntegrityScoreCard({
  score = 92,
  reconciliationRate = '94%',
  resolvedCases = '172'
}) {
  const scoreRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Animate score counter
    const obj = { val: 70 };
    anime({
      targets: obj,
      val: score,
      round: 1,
      easing: 'easeOutExpo',
      duration: 1600,
      update: () => {
        if (scoreRef.current) {
          scoreRef.current.textContent = `${obj.val}%`;
        }
      }
    });
  }, [score]);

  const auditMeters = [
    {
      label: 'Rekonsiliasi Resume Medis & Rawat',
      percent: 94,
      tag: 'Sesuai Standar',
      color: '#007a78'
    },
    {
      label: 'Validitas Keaktifan Peserta & SEP',
      percent: 98,
      tag: 'Terverifikasi Sah',
      color: '#005f5d'
    },
    {
      label: 'Kesesuaian Tarif INA-CBG & LOS',
      percent: 89,
      tag: 'Batas Wajar',
      color: '#0d9488'
    }
  ];

  return (
    <motion.div
      className="med-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="med-card-header">
        <div className="med-card-title-group">
          <div className="med-card-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3 className="med-card-title">Skor Integritas Klaim</h3>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              fontSize: '0.76rem',
              color: 'var(--mc-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Informasi"
          >
            i
          </button>
          {showTooltip && (
            <div
              style={{
                position: 'absolute',
                top: '32px',
                right: 0,
                width: '240px',
                background: '#1e293b',
                color: '#ffffff',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.74rem',
                zIndex: 10,
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                lineHeight: 1.4
              }}
            >
              Dihitung otomatis oleh Decision Support Engine berbasis 3 pilar: Rekonsiliasi Rekam Medis, Validitas SEP, dan Deteksi Anomali Phantom Billing.
            </div>
          )}
        </div>
      </div>

      {/* Main Score Row */}
      <div className="med-score-row">
        <div>
          <div className="med-score-big" ref={scoreRef}>
            {score}%
          </div>
          <div className="med-score-pill">
            <span>+2.4% sejak audit terakhir</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </div>

        {/* Right mini metrics */}
        <div className="med-score-cards-right">
          <div className="med-mini-metric-box">
            <div className="med-mini-val" style={{ color: '#007a78' }}>{reconciliationRate}</div>
            <div className="med-mini-lbl">Rekonsiliasi Sah</div>
          </div>
          <div className="med-mini-metric-box">
            <div className="med-mini-val" style={{ color: '#005f5d' }}>{resolvedCases}</div>
            <div className="med-mini-lbl">Kasus Dituntaskan</div>
          </div>
        </div>
      </div>

      {/* Natural Clinical Audit Reconciliation Meters */}
      <div className="med-audit-meters">
        {auditMeters.map((m) => (
          <div key={m.label} className="med-audit-meter-row">
            <div className="med-meter-header">
              <span className="med-meter-label">{m.label}</span>
              <div className="med-meter-stat">
                <span className="med-meter-percent">{m.percent}%</span>
                <span className="med-meter-tag">{m.tag}</span>
              </div>
            </div>
            <div className="med-meter-track">
              <div
                className="med-meter-fill"
                style={{
                  width: `${m.percent}%`,
                  background: m.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
