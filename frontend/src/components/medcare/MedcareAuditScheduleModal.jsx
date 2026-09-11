import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedcareAuditScheduleModal({ isOpen, onClose, onBookingSuccess }) {
  const [selectedHospital, setSelectedHospital] = useState('RS Citra Medika');
  const [selectedTime, setSelectedTime] = useState('09:00 WIB');
  const [selectedDate, setSelectedDate] = useState('2026-09-15');
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen) return null;

  const hospitals = [
    { title: 'RS Citra Medika', type: 'Faskes Rujukan Lanjutan (FKRTL)', cases: '12 Kasus Prioritas' },
    { title: 'RSUD Sehat Sentosa', type: 'RS Tipe B Daerah', cases: '8 Kasus Prioritas' },
    { title: 'RS Hermina Utama', type: 'RS Swasta Terakreditasi', cases: '5 Kasus Prioritas' },
    { title: 'Klinik Rawat Inap Sejahtera', type: 'Faskes Tingkat Pertama (FKTP)', cases: '3 Kasus Prioritas' }
  ];

  const handleConfirm = (e) => {
    e.preventDefault();
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      if (onBookingSuccess) onBookingSuccess({ hospital: selectedHospital, time: selectedTime, date: selectedDate });
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="med-modal-backdrop" onClick={onClose}>
        <motion.div
          className="med-telehealth-modal"
          style={{ maxWidth: '580px', padding: '1.75rem' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--mc-text-heading)' }}>
                Jadwalkan Klarifikasi Audit Faskes
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--mc-text-muted)' }}>
                Pilih fasilitas kesehatan, tanggal, dan waktu telaah klinis
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--mc-text-muted)' }}
            >
              ✕
            </button>
          </div>

          {isBooked ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center', padding: '2rem 1rem' }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#e6f6f5',
                color: '#007a78',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.8rem'
              }}>
                ✓
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--mc-text-heading)' }}>Jadwal Audit Ditetapkan!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--mc-text-muted)', margin: 0 }}>
                {selectedHospital} pada {selectedDate} pukul {selectedTime}. Undangan berita acara terkirim ke manajemen faskes.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleConfirm}>
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--mc-text-heading)', marginBottom: '0.5rem' }}>
                  Fasilitas Kesehatan Tujuan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {hospitals.map((item) => {
                    const isSelected = selectedHospital === item.title;
                    return (
                      <div
                        key={item.title}
                        onClick={() => setSelectedHospital(item.title)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #007a78' : '1px solid var(--mc-card-border)',
                          background: isSelected ? '#edf8f7' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? '#007a78' : 'var(--mc-text-heading)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--mc-text-muted)', marginTop: '0.2rem' }}>
                          {item.cases}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--mc-text-heading)', marginBottom: '0.4rem' }}>
                    Tanggal Sesi
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--mc-card-border)',
                      fontFamily: 'var(--mc-font)',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--mc-text-heading)', marginBottom: '0.4rem' }}>
                    Waktu Klarifikasi
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--mc-card-border)',
                      fontFamily: 'var(--mc-font)',
                      fontSize: '0.85rem',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option>09:00 WIB</option>
                    <option>11:00 WIB</option>
                    <option>14:00 WIB</option>
                    <option>16:00 WIB</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--mc-card-border)',
                    background: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: '#007a78',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 122, 120, 0.25)'
                  }}
                >
                  Konfirmasi Jadwal
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
