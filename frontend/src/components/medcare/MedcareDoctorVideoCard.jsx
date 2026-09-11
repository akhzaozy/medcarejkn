import React from 'react';
import { motion } from 'framer-motion';

export default function MedcareDoctorVideoCard({
  doctorName = 'dr. Alexander Baker, Sp.B',
  hospital = 'Komite Medis RS Citra Medika',
  onStartConsultation
}) {
  return (
    <motion.div
      className="med-doctor-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      whileHover={{ scale: 1.015 }}
      onClick={onStartConsultation}
      title="Klik untuk membuka sesi tele-klarifikasi rekam medis"
    >
      <img
        src="/assets/doctor_telehealth.jpg"
        alt={doctorName}
        className="med-doctor-img"
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80';
        }}
      />
      <div className="med-doctor-overlay">
        <div className="med-doctor-top-actions">
          <div className="med-doctor-expand-btn" aria-label="Buka Klarifikasi Online">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </div>

        <div className="med-doctor-badge-bottom">
          <div className="med-online-pulse" />
          <span className="med-doctor-badge-text">Sesi Klarifikasi DPJP Online</span>
        </div>
      </div>
    </motion.div>
  );
}
