import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedcareAuditTimelineCard({ onOpenQueue, onSelectCase }) {
  const [selectedDay, setSelectedDay] = useState(6);

  const days = [
    { dayName: 'Sen', dayNum: 4 },
    { dayName: 'Sel', dayNum: 5 },
    { dayName: 'Rab', dayNum: 6 },
    { dayName: 'Kam', dayNum: 7 },
    { dayName: 'Jum', dayNum: 8 },
    { dayName: 'Sab', dayNum: 9 },
  ];

  const auditSchedule = {
    6: [
      {
        id: 'CASE-PB-001',
        time: '09:00',
        role: 'RS Citra Medika',
        code: 'Klaim Rp 45 jt',
        description: 'Phantom Billing: Operasi Laparoskopi Tanpa Bukti Anastesi',
        avatars: [
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1594824813501-483017a54460?w=100&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'CASE-PB-002',
        time: '11:00',
        role: 'RSUD Sehat Sentosa',
        code: 'Klaim Rp 18,5 jt',
        description: 'Tindakan Hemodialisa Fiktif (Pasien Tidak Hadir di RS)',
        avatars: [
          'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&auto=format&fit=crop&q=80'
        ]
      }
    ],
    4: [
      {
        id: 'CASE-PB-003',
        time: '14:00',
        role: 'RS Hermina Utama',
        code: 'Klaim Rp 32 jt',
        description: 'Upcoding Severity Level 3 Tanpa Komplikasi Medis',
        avatars: [
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80'
        ]
      }
    ],
    5: [
      {
        id: 'CASE-PB-004',
        time: '10:30',
        role: 'RS Permata Bunda',
        code: 'Klaim Rp 14 jt',
        description: 'Duplikasi Tagihan Obat Kemoterapi Rawat Jalan',
        avatars: [
          'https://images.unsplash.com/photo-1594824813501-483017a54460?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&auto=format&fit=crop&q=80'
        ]
      }
    ],
    7: [
      {
        id: 'CASE-PB-005',
        time: '15:00',
        role: 'RS Pelita Sehat',
        code: 'Klaim Rp 28 jt',
        description: 'Ghost Enrollee: Kartu JKN Digunakan Oknum Tidak Dikenal',
        avatars: [
          'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&auto=format&fit=crop&q=80'
        ]
      }
    ],
    8: [
      {
        id: 'CASE-PB-006',
        time: '08:45',
        role: 'Klinik Utama Sejahtera',
        code: 'Klaim Rp 8,5 jt',
        description: 'Klaim Rawat Jalan Berulang Pada Hari Yang Sama',
        avatars: [
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&auto=format&fit=crop&q=80'
        ]
      }
    ],
    9: []
  };

  const currentList = auditSchedule[selectedDay] || [];

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

      {/* Calendar Day Strip */}
      <div className="med-calendar-strip" role="tablist">
        {days.map((d) => {
          const isActive = selectedDay === d.dayNum;
          return (
            <button
              key={d.dayNum}
              className={`med-calendar-day ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedDay(d.dayNum)}
              role="tab"
              aria-selected={isActive}
            >
              <span className="med-cal-dayname">{d.dayName}</span>
              <span className="med-cal-daynum">{String(d.dayNum).padStart(2, '0')}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline Section */}
      <div className="med-timeline">
        <div className="med-timeline-track" />
        <AnimatePresence mode="wait">
          {currentList.length > 0 ? (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              {currentList.map((item) => (
                <div
                  key={item.id}
                  className="med-timeline-item"
                  onClick={() => onSelectCase && onSelectCase(item.id)}
                  title="Klik untuk membuka detail investigasi kasus"
                >
                  <div className="med-timeline-badge">{item.time}</div>
                  <div className="med-timeline-content">
                    <div className="med-timeline-title-row">
                      <span className="med-timeline-role">{item.role}</span>
                      <span className="med-timeline-count">{item.code}</span>
                    </div>
                    <div className="med-timeline-sub">{item.description}</div>
                    <div className="med-avatar-cluster">
                      {item.avatars.map((av, idx) => (
                        <img
                          key={idx}
                          src={av}
                          alt="Reviewer"
                          className="med-cluster-avatar"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80';
                          }}
                        />
                      ))}
                    </div>
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
              Tidak ada jadwal audit pada tanggal ini.
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
