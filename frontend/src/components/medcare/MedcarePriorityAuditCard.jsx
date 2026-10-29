import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function MedcarePriorityAuditCard({ onOpenQueue, priorityCount = 0, pendingCount = 0 }) {

  return (
    <motion.div
      className="med-card med-treatment-card"
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
              <path d="M5 22h14" />
              <path d="M5 2h14" />
              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
            </svg>
          </div>
          <h3 className="med-card-title">Rencana Audit Prioritas</h3>
        </div>
      </div>

      {/* Body & Big Counter */}
      <div className="med-treatment-body">
        <div className="med-counter-row">
          <span className="med-big-counter">{String(priorityCount).padStart(2, '0')}</span>
          <div className="med-counter-desc">
            Kasus Prioritas Tinggi
            <span className="med-counter-freq">Dari antrean aktif Anda</span>
          </div>
        </div>

        <p style={{color:'var(--mc-text-muted)',fontSize:'.84rem'}}>Total {pendingCount.toLocaleString('id-ID')} kasus masih memerlukan telaah. Prioritas membantu pengurutan, keputusan tetap pada penelaah.</p>

        {/* Action Button */}
        <button
          className="med-btn-treatment"
          onClick={onOpenQueue}
          title="Buka antrean review kasus"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Mulai Telaah Audit</span>
        </button>
      </div>
    </motion.div>
  );
}
