import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedcareAuditTimelineCard({ onOpenQueue, onSelectCase, cases = [] }) {

  return (
    <motion.div
      className="med-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      whileHover={{ y: -2 }}
    >
      {/* Card Header */}
      <div className="med-card-header">
        <div className="med-card-title-group">
          <div className="med-card-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="med-card-title">Antrean Audit Klinis</h3>
        </div>
        <button
          className="med-card-link"
          onClick={onOpenQueue}
          title="Buka daftar lengkap antrean kasus"
        >
          Lihat Semua &gt;
        </button>
      </div>

      {/* Timeline Section */}
      <div className="med-timeline">
        <div className="med-timeline-track" />
        <AnimatePresence mode="wait">
          {cases.length > 0 ? (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              {cases.map((item) => (
                <div
                  key={item.case_id}
                  className="med-timeline-item"
                  onClick={() => onSelectCase && onSelectCase(item.case_id)}
                  title="Klik untuk membuka detail investigasi kasus"
                >
                  <div className="med-timeline-badge">{item.review_priority}</div>
                  <div className="med-timeline-content">
                    <div className="med-timeline-title-row">
                      <span className="med-timeline-role">{item.provider_name || (item.case_type==='pattern'?'Pola agregat BPJS':'Faskes belum dicatat')}</span>
                      <span className="med-timeline-count">{item.case_id}</span>
                    </div>
                    <div className="med-timeline-sub">{item.review_focus || item.primary_risk_mode}</div>
                    <div className="med-timeline-sub">{item.assigned_name || 'Belum didisposisi'}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                color: 'var(--mc-text-muted)',
                fontSize: '0.85rem'
              }}
            >
              Belum ada kasus aktif pada antrean akun ini.
              <div style={{ marginTop: '0.6rem' }}>
                <button
                  onClick={onOpenQueue}
                  className="med-action-btn"
                >
                  Buka Semua Antrean
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
