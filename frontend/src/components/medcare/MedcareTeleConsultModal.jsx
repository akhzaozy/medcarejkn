import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedcareTeleConsultModal({ isOpen, onClose, doctorName = 'dr. Alexander Baker, Sp.B' }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (isOpen) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div className="med-modal-backdrop" onClick={onClose}>
        <motion.div
          className="med-telehealth-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--mc-card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="med-online-pulse" />
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--mc-text-heading)' }}>
                  Sesi Klarifikasi Rekam Medis: {doctorName}
                </h4>
                <div style={{ fontSize: '0.76rem', color: 'var(--mc-text-muted)' }}>
                  Komite Medis RS Citra Medika • Kasus #CASE-PB-001 (Klaim Rp 45.000.000)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                background: '#eef8f8',
                color: '#007a78',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatTime(callDuration)}
              </span>

              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: 'var(--mc-text-muted)',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: '440px' }}>
            {/* Video Screen */}
            <div style={{ background: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {!isVideoOff ? (
                <img
                  src="/assets/doctor_telehealth.jpg"
                  alt="Doctor Stream"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '0.5rem' }}>
                    <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                  <div>Kamera Dimatikan</div>
                </div>
              )}

              {/* Auditor Small Box PIP */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '100px',
                  height: '75px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
                  background: '#1e293b'
                }}
              >
                <img
                  src="/assets/user_fedrik.jpg"
                  alt="Reviewer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Controls */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                padding: '0.5rem 1rem',
                borderRadius: '9999px'
              }}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isMuted ? '🔇' : '🎙️'}
                </button>

                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isVideoOff ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isVideoOff ? '🚫' : '📹'}
                </button>

                <button
                  onClick={onClose}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  📞
                </button>
              </div>
            </div>

            {/* Sidebar Notes */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fafcfc', borderLeft: '1px solid var(--mc-card-border)' }}>
              <div>
                <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--mc-text-heading)' }}>
                  Data Rekonsiliasi Kasus
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--mc-card-border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--mc-text-muted)' }}>Tagihan Diajukan</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ef4444' }}>Rp 45,0 Jt</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--mc-card-border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--mc-text-muted)' }}>Bukti Rekam Medis</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f59e0b' }}>Tidak Ditemukan</div>
                  </div>
                </div>

                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--mc-text-heading)' }}>
                  Poin Konfirmasi DPJP
                </h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--mc-text-body)', lineHeight: 1.6 }}>
                  <li>Konfirmasi kehadiran pasien atas nama Ny. Hartati pada tgl 14 Agustus</li>
                  <li>Klarifikasi ketiadaan lembar laporan operasi laparoskopi bedah digestif</li>
                  <li>Pencocokan lembar resep anestesi dengan buku inventori kamar operasi</li>
                </ul>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--mc-card-border)' }}>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--mc-card-border)',
                    background: '#ffffff',
                    color: 'var(--mc-text-heading)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Selesaikan &amp; Simpan Berita Acara
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
