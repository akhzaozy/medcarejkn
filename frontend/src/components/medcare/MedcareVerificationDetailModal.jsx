import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedcareVerificationDetailModal({ isOpen, onClose }) {
  const [verified, setVerified] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="med-modal-backdrop" onClick={onClose}>
        <motion.div
          className="med-telehealth-modal"
          style={{ maxWidth: '620px', padding: '1.75rem' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="med-vital-icon-box teal" style={{ width: '38px', height: '38px' }}>
                🏥
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--mc-text-heading)' }}>
                  Verifikasi Bukti Fisik Lapangan
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--mc-text-muted)' }}>
                  Surat Tugas #ST-BPJS-2026-089 • Tim Auditor Lapangan KC
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--mc-text-muted)' }}
            >
              ✕
            </button>
          </div>

          {/* Status Bar */}
          <div style={{ background: '#f0fdfc', border: '1px solid #ccfbf1', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f766e' }}>Tim Verifikator Menuju Lokasi</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f766e' }}>Estimasi Tiba: 18 menit (1.4 km)</span>
            </div>
            <div style={{ height: '6px', background: '#d1fae5', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: '#007a78', borderRadius: '4px' }}
                initial={{ width: '0%' }}
                animate={{ width: '74%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--mc-text-muted)' }}>
              <span>Kantor Cabang BPJS</span>
              <span>Dalam Perjalanan (Auditor: Hendra S.)</span>
              <span>RS Citra Medika</span>
            </div>
          </div>

          {/* Checklist */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', color: 'var(--mc-text-heading)' }}>
              Objek Rekonsiliasi Lapangan
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--mc-card-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--mc-text-heading)' }}>Buku Register Kamar Operasi &amp; Anestesi</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)' }}>Mencocokkan tanda tangan dokter bedah dan perawat pendamping</div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#007a78', background: '#e6f6f5', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>Wajib</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--mc-card-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--mc-text-heading)' }}>Log Dispensing Obat Farmasi Rawat Inap</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)' }}>Validasi pengeluaran cairan infus dan obat antibiotik parenteral</div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#007a78', background: '#e6f6f5', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>Wajib</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--mc-card-border)' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--mc-text-muted)' }}>
              Faskes Terperiksa: <strong>RS Citra Medika (Kelas B)</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => setVerified(true)}
                disabled={verified}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: verified ? '#10b981' : '#007a78',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: verified ? 'default' : 'pointer'
                }}
              >
                {verified ? '✓ Bukti Terverifikasi' : 'Verifikasi Hasil Uji Petik'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
