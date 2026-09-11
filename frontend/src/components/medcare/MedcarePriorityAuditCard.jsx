import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function MedcarePriorityAuditCard({ onOpenQueue, priorityCount = 6 }) {
  const [activeDay, setActiveDay] = useState('Rab');

  const weekSchedule = [
    { day: 'Sen', height: 40, active: false },
    { day: 'Sel', height: 60, active: false },
    { day: 'Rab', height: 85, active: true },
    { day: 'Kam', height: 35, active: false },
    { day: 'Jum', height: 70, active: false },
    { day: 'Sab', height: 50, active: false },
    { day: 'Min', height: 25, active: false }
  ];

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
            Kasus Phantom Kritis
            <span className="med-counter-freq">Target Selesai Minggu Ini</span>
          </div>
        </div>

        {/* Weekly Mini Schedule Bars */}
        <div className="med-week-bars">
          {weekSchedule.map((item) => {
            const isSelected = activeDay === item.day;
            return (
              <div
                key={item.day}
                className="med-week-bar-col"
                onClick={() => setActiveDay(item.day)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className={`med-week-bar ${isSelected || item.active ? 'active' : ''}`}
                  style={{
                    height: `${item.height}%`,
                    opacity: isSelected || item.active ? 1 : 0.4
                  }}
                />
                <span className="med-week-day-label">{item.day}</span>
              </div>
            );
          })}
        </div>

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
