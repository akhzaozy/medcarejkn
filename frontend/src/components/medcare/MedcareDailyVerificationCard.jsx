import React from 'react';
import { motion } from 'framer-motion';

export default function MedcareDailyVerificationCard({ onOpenQueue }) {
  return (
    <motion.div
      className="med-daily-summary-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <div className="med-card-header" style={{ marginBottom: 0 }}>
        <div className="med-card-title-group">
          <div className="med-card-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h3 className="med-card-title" style={{ fontSize: '0.94rem' }}>Status Berkas Harian</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--mc-text-muted)' }}>Proses rekonsiliasi berkas klaim</span>
          </div>
        </div>

        <button
          className="med-card-link"
          onClick={onOpenQueue}
          title="Buka seluruh antrean kasus"
        >
          Lihat &gt;
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div className="med-daily-stat-row">
          <div className="med-daily-stat-left">
            <div className="med-daily-stat-dot teal" />
            <span className="med-daily-stat-name">Klaim Terekonsiliasi Otomatis</span>
          </div>
          <span className="med-daily-stat-num">28 Berkas</span>
        </div>

        <div className="med-daily-stat-row">
          <div className="med-daily-stat-left">
            <div className="med-daily-stat-dot amber" />
            <span className="med-daily-stat-name">Perlu Uji Petik Faskes</span>
          </div>
          <span className="med-daily-stat-num" style={{ color: '#d97706' }}>4 Berkas</span>
        </div>

        <div className="med-daily-stat-row">
          <div className="med-daily-stat-left">
            <div className="med-daily-stat-dot slate" />
            <span className="med-daily-stat-name">Menunggu Konfirmasi DPJP</span>
          </div>
          <span className="med-daily-stat-num" style={{ color: '#64748b' }}>2 Berkas</span>
        </div>
      </div>

      <button
        className="med-btn-treatment"
        onClick={onOpenQueue}
        style={{
          marginTop: '0.25rem',
          padding: '0.7rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 700
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span>Periksa Seluruh Berkas</span>
      </button>
    </motion.div>
  );
}
