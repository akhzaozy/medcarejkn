import React from 'react';
import { motion } from 'framer-motion';

export default function MedcareFieldVerificationCard({ onOpenDetails }) {
  return (
    <motion.div
      className="med-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="med-card-header" style={{ marginBottom: '0.75rem' }}>
        <div className="med-card-title-group">
          <div className="med-card-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className="med-card-title">Verifikasi Lapangan</h3>
        </div>
        <button
          className="med-card-link"
          onClick={onOpenDetails}
          title="Lihat riwayat dan rincian verifikasi"
        >
          Lacak &gt;
        </button>
      </div>

      {/* Organic Route Map Visual */}
      <div className="med-route-map-box">
        <svg
          viewBox="0 0 320 160"
          className="med-map-svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Background & Road Networks */}
          <rect width="320" height="160" fill="#eef5f6" />
          <line x1="10" y1="40" x2="310" y2="40" stroke="#dce8eb" strokeWidth="6" strokeLinecap="round" />
          <line x1="40" y1="10" x2="40" y2="150" stroke="#dce8eb" strokeWidth="5" strokeLinecap="round" />
          <line x1="180" y1="20" x2="180" y2="150" stroke="#dce8eb" strokeWidth="5" strokeLinecap="round" />
          <line x1="280" y1="10" x2="280" y2="150" stroke="#dce8eb" strokeWidth="7" strokeLinecap="round" />
          <line x1="30" y1="110" x2="300" y2="110" stroke="#dce8eb" strokeWidth="5" strokeLinecap="round" />

          {/* Curved Secondary Road */}
          <path
            d="M 50 150 Q 110 90 200 80 T 310 70"
            fill="none"
            stroke="#e2edf0"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Verification Route Vector (Teal Path) */}
          <path
            d="M 280 40 L 250 80 Q 230 110 210 110 L 170 110 Q 150 110 135 90 L 90 45"
            fill="none"
            stroke="#007a78"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Origin Pin (Kantor Cabang BPJS) */}
          <circle cx="280" cy="40" r="5.5" fill="#007a78" stroke="#ffffff" strokeWidth="2" />

          {/* Destination Pin (RS Citra Medika) */}
          <circle cx="90" cy="45" r="7" fill="#007a78" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="90" cy="45" r="2.5" fill="#ffffff" />

          {/* Pulsing Auditor Pin */}
          <g transform="translate(180, 110)">
            <circle cx="0" cy="0" r="8" fill="rgba(0, 122, 120, 0.25)" className="med-online-pulse" />
            <circle cx="0" cy="0" r="4.5" fill="#007a78" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Floating ETA Status */}
        <div className="med-delivery-status-pill">
          <div className="med-online-pulse" />
          <span>Auditor Menuju Faskes • 18 mnt</span>
        </div>
      </div>

      {/* Verification details */}
      <div className="med-faskes-details">
        <div>
          <div className="med-faskes-name">RS Citra Medika</div>
          <div className="med-faskes-sub">Uji Petik Bukti Fisik Rekam Medis &amp; Log Farmasi</div>
        </div>
        <button
          className="med-action-btn"
          onClick={onOpenDetails}
          title="Buka data berkas verifikasi faskes"
        >
          Berkas
        </button>
      </div>
    </motion.div>
  );
}
