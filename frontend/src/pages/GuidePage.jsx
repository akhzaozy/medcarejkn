import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, HelpCircle, ShieldAlert, CheckCircle2, AlertTriangle, 
  ArrowRight, FileSearch, Stethoscope, UserCheck, Scale, 
  Sparkles, Layers, Search, Database, ChevronRight, Eye,
  Info, Zap, PlayCircle, ExternalLink, BookmarkCheck
} from 'lucide-react';

export default function GuidePage({ 
  onSelectCase, 
  onOpenQueue, 
  onOpenInput, 
  onBackToLanding 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, workflow, glossary, guardrails, demo

  const tabs = [
    { id: 'overview', label: 'Ringkasan Cepat', icon: Zap },
    { id: 'workflow', label: 'Alur 4 Langkah Sistem', icon: Layers },
    { id: 'glossary', label: 'Glosarium Bahasa Awam', icon: BookOpen },
    { id: 'guardrails', label: '3 Guardrail & Peran Nakes', icon: Scale },
    { id: 'demo', label: 'Skenario Demo Juri', icon: PlayCircle }
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Breadcrumb & Header Title */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <button
            onClick={onBackToLanding}
            className="med-pill-btn-outline"
            style={{ 
              padding: '0.45rem 1.25rem', 
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            ← Kembali ke Dashboard
          </button>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--mc-teal-light, #e6f6f5)',
            color: 'var(--mc-teal-primary, #007a78)',
            border: '1px solid rgba(0, 122, 120, 0.2)',
            padding: '4px 12px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={12} />
            Panduan Resmi untuk Dewan Juri &amp; Pengguna Awam
          </span>
        </div>

        {/* Hero Banner Card */}
        <div style={{
          background: 'linear-gradient(135deg, #004d4b 0%, #007a78 60%, #0ea5e9 100%)',
          borderRadius: '24px',
          padding: '2.5rem 2.5rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 36px -10px rgba(0, 122, 120, 0.35)'
        }}>
          {/* Subtle decorative circles */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-60px',
            right: '160px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              <HelpCircle size={14} />
              Pusat Pemahaman Cepat
            </div>
            
            <h1 style={{
              fontSize: '2.15rem',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '0.85rem',
              letterSpacing: '-0.02em'
            }}>
              Bagaimana medCare JKN Bekerja?
            </h1>
            
            <p style={{
              fontSize: '1.02rem',
              lineHeight: 1.6,
              opacity: 0.92,
              marginBottom: '1.5rem',
              fontWeight: 400
            }}>
              Aplikasi ini adalah <strong>asisten cerdas (Decision-Support System)</strong> untuk membantu tenaga kesehatan dan verifikator mendeteksi indikasi klaim fiktif JKN. Sistem bertindak sebagai <em>radar peringatan dini</em>, sementara <strong>keputusan akhir tetap 100% berada di tangan dokter / nakes penelaah</strong>.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('workflow')}
                style={{
                  background: '#ffffff',
                  color: '#005f5d',
                  border: 'none',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  transition: 'transform 0.15s ease'
                }}
              >
                Lihat Alur 4 Langkah <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setActiveTab('demo')}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <PlayCircle size={16} /> Panduan Skenario Demo Juri
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigators */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: '#ffffff',
        padding: '0.45rem',
        borderRadius: '16px',
        border: '1px solid var(--mc-card-border, #e3ecee)',
        marginBottom: '2rem',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto',
                minWidth: '170px',
                padding: '0.7rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--mc-teal-primary, #007a78)' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(0, 122, 120, 0.25)' : 'none'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* TAB 1: RINGKASAN CEPAT */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}
          >
            {/* Card 1: Masalah */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              border: '1px solid #fee2e2',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#fff1f2',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                1. Masalah yang Diselesaikan
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                Setiap bulan ada jutaan klaim BPJS Kesehatan yang masuk dari faskes se-Indonesia. Sebagian kecil klaim berisi <strong>tindakan fiktif</strong> (misal: mengaku operasi padahal tidak, atau menagih obat yang tidak pernah diserahkan). 
              </p>
              <div style={{ marginTop: '1rem', background: '#fff5f5', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.5 }}>
                <strong>Tantangan Dokter Auditor:</strong> Memeriksa manual lembar demi lembar rekam medis sangat lambat dan memicu kelelahan tinggi (*burnout*).
              </div>
            </div>

            {/* Card 2: Solusi Medcare */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              border: '1px solid #e0f2fe',
              boxShadow: '0 8px 24px rgba(14, 165, 233, 0.05)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <FileSearch size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                2. Apa yang Dilakukan medCare?
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                medCare bekerja secara otomatis seperti <strong>"asisten pemeriksa bukti digital"</strong>. Sistem mencocokkan setiap item tagihan rumah sakit langsung ke dokumen rekam medis digital (CPPT dokter, hasil lab, laporan operasi).
              </p>
              <div style={{ marginTop: '1rem', background: '#f0f9ff', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#075985', lineHeight: 1.5 }}>
                <strong>Hasil Otomatis:</strong> Sistem langsung menghitung berapa rupiah selisih yang tidak berdokumen (*Evidence Gap*) dan memunculkan alarm peringatan.
              </div>
            </div>

            {/* Card 3: Peran Manusia */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              border: '1px solid #dcfce7',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.05)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Stethoscope size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                3. Keputusan Mutlak di Tangan Nakes
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                Sistem <strong>TIDAK PERNAH</strong> langsung memotong tagihan atau menghakimi rumah sakit secara sepihak. Sinyal sistem hanyalah tanda peringatan awal.
              </p>
              <div style={{ marginTop: '1rem', background: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#166534', lineHeight: 1.5 }}>
                <strong>Peran Dokter Penelaah:</strong> Dokter membuka berkas asli di sistem, membaca resume medis, dan mengklik tombol penetapan: <em>Terbukti Fraud, Salah Input, atau Dokumen Kurang</em>.
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: ALUR 4 LANGKAH SISTEM */}
        {activeTab === 'workflow' && (
          <motion.div
            key="workflow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid var(--mc-card-border, #e3ecee)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ maxWidth: '720px', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                Alur Kerja 4 Langkah: Dari Data Klaim Sampai Putusan Dokter
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5 }}>
                Berikut adalah visualisasi bagaimana data klaim bergerak di dalam medCare JKN sehingga dokter penelaah dapat bekerja dengan cepat dan akurat.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', position: 'relative' }}>
              {/* Step 1 */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '18px',
                padding: '1.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '20px',
                  background: 'var(--mc-teal-primary, #007a78)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '999px'
                }}>
                  Langkah 1
                </div>
                <div style={{ color: 'var(--mc-teal-primary, #007a78)', marginBottom: '1rem', marginTop: '0.5rem' }}>
                  <Database size={28} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                  Pengumpulan Berkas
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.55 }}>
                  Data tagihan faskes (obat, tindakan, kamar) masuk bersama berkas rekam medis elektronik (RME) pasien.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '18px',
                padding: '1.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '20px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '999px'
                }}>
                  Langkah 2
                </div>
                <div style={{ color: '#0284c7', marginBottom: '1rem', marginTop: '0.5rem' }}>
                  <Layers size={28} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                  Pencocokan Bukti Otomatis
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.55 }}>
                  Sistem mengecek satu per satu: <em>Ada tagihan USG? Mana foto USG-nya? Ada tindakan infus? Mana catatan perawatnya?</em>
                </p>
              </div>

              {/* Step 3 */}
              <div style={{
                background: '#fff1f2',
                borderRadius: '18px',
                padding: '1.75rem 1.5rem',
                border: '1px solid #fecdd3',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '20px',
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '999px'
                }}>
                  Langkah 3
                </div>
                <div style={{ color: '#e11d48', marginBottom: '1rem', marginTop: '0.5rem' }}>
                  <ShieldAlert size={28} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#9f1239', marginBottom: '0.4rem' }}>
                  Alarm &amp; Selisih Uang
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#881337', lineHeight: 1.55 }}>
                  Jika bukti tidak cocok, sistem memberi status <strong>"Evidence Gap"</strong> (nominal klaim tanpa bukti) dan menetapkan prioritas audit TINGGI.
                </p>
              </div>

              {/* Step 4 */}
              <div style={{
                background: '#ecfdf5',
                borderRadius: '18px',
                padding: '1.75rem 1.5rem',
                border: '1px solid #a7f3d0',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '20px',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '999px'
                }}>
                  Langkah 4
                </div>
                <div style={{ color: '#059669', marginBottom: '1rem', marginTop: '0.5rem' }}>
                  <UserCheck size={28} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46', marginBottom: '0.4rem' }}>
                  Pemeriksaan &amp; Vonis Nakes
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#064e3b', lineHeight: 1.55 }}>
                  Dokter membuka antrean, menelaah catatan medis fisik, dan mengesahkan putusan akhir secara legal.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={20} style={{ color: 'var(--mc-teal-primary, #007a78)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}>
                  Ingin melihat bagaimana dokter meninjau kasus secara langsung?
                </span>
              </div>
              <button
                onClick={onOpenQueue}
                className="btn-pill-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Buka Antrean Kasus Nyata <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 3: GLOSARIUM BAHASA AWAM */}
        {activeTab === 'glossary' && (
          <motion.div
            key="glossary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid var(--mc-card-border, #e3ecee)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ maxWidth: '720px', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                Kamus Istilah Bahasa Manusia (Biar Tidak Bingung)
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5 }}>
                Penjelasan istilah teknis medis dan istilah audit yang sering muncul di dalam aplikasi dengan bahasa sehari-hari.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {/* Item 1 */}
              <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px' }}>MODUS FRAUD</span>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Phantom Billing (Tagihan Siluman)</h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
                  Kondisi di mana rumah sakit menagih biaya obat, pemeriksaan lab, atau tindakan operasi yang sebenarnya <strong>sama sekali tidak pernah dilakukan</strong> kepada pasien.
                </p>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Contoh: Pasien sakit maag biasa, tetapi ditagihkan pemeriksaan USG Jantung Rp 3.500.000 tanpa ada hasil foto USG.
                </div>
              </div>

              {/* Item 2 */}
              <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: '6px' }}>MODUS FRAUD</span>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Ghost Enrollee (Pasien Hantu)</h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
                  Klaim tagihan BPJS atas nama nomor kartu peserta, tetapi pasien tersebut sebenarnya <strong>tidak pernah menginjakkan kaki</strong> di fasilitas kesehatan pada hari itu.
                </p>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Contoh: Ada tagihan berobat rawat jalan, tetapi tidak ada sidik jari (fingerprint biometrik) kehadiran pasien.
                </div>
              </div>

              {/* Item 3 */}
              <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '6px' }}>ANOMALI KLINIS</span>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Wrong Diagnosis (Diagnosa Ganjil)</h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
                  Ketidaksesuaian diagnosis klinis yang tidak logis secara medis antara data demografi pasien dengan kode penyakit yang diklaim.
                </p>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Contoh: Pasien berjenis kelamin Laki-laki ditagihkan kode tindakan persalinan kandungan / cyesis.
                </div>
              </div>

              {/* Item 4 */}
              <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px' }}>METRIK SISTEM</span>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Evidence Gap (Celah Bukti)</h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
                  Selisih jumlah kuantitas atau rupiah tagihan yang <strong>tidak memiliki dokumen rekam medis yang cocok</strong>. Ini adalah potensi kerugian dana BPJS yang harus diaudit.
                </p>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Contoh: Ditagih 10 ampul obat antibiotik, tetapi perawat hanya mencatat injeksi 2 ampul → Gap: 8 ampul.
                </div>
              </div>

              {/* Item 5 */}
              <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: '6px' }}>STATUS SISTEM</span>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Risk Signal (Sinyal Risiko)</h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
                  Alarm peringatan awal yang dimunculkan oleh algoritma sistem untuk menarik perhatian dokter. <strong>Bukan vonis bersalah</strong>, melainkan pengingat bahwa berkas ini butuh perhatian ekstra.
                </p>
              </div>

              {/* Item 6 */}
              <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#f3e8ff', color: '#7e22ce', padding: '2px 8px', borderRadius: '6px' }}>LEGALITAS</span>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Review Outcome (Putusan Dokter)</h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
                  Vonis resmi yang diklik oleh dokter pemeriksa setelah membaca semua bukti. Opsinya: <em>CONFIRMED</em> (terbukti fraud), <em>FALSE POSITIVE</em> (klaim ternyata sah), atau <em>NEEDS MORE EVIDENCE</em> (minta berkas faskes).
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: 3 GUARDRAILS & PERAN NAKES */}
        {activeTab === 'guardrails' && (
          <motion.div
            key="guardrails"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid var(--mc-card-border, #e3ecee)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ maxWidth: '750px', marginBottom: '2.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                background: '#fef3c7',
                color: '#b45309',
                padding: '3px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                Prinsip Keadilan &amp; Perlindungan Faskes
              </span>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', marginTop: '0.6rem', marginBottom: '0.5rem' }}>
                3 Guardrail: Menjamin Rumah Sakit Tidak Dituduh Sembarangan
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5 }}>
                Mengapa sistem ini aman dan tidak akan merugikan hubungan BPJS Kesehatan dengan rumah sakit? Karena sistem dikunci oleh 3 aturan etika wajib:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Guardrail 1 */}
              <div style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '20px',
                padding: '1.75rem',
                border: '1px solid #cbd5e1',
                borderTop: '4px solid #0ea5e9'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', marginBottom: '0.4rem' }}>
                  GUARDRAIL #1
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                  UNAVAILABLE ≠ UNSUPPORTED
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                  Jika dokumen rekam medis dari faskes <strong>belum terunggah atau belum ditemukan</strong>, sistem <strong>DILARANG</strong> langsung melabeli klaim tersebut fiktif. 
                </p>
                <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '10px', fontSize: '0.8rem', color: '#075985' }}>
                  <strong>Prinsip:</strong> Keterlambatan administrasi bukan berarti manipulasi. Statusnya dialihkan menjadi "Minta Berkas Tambahan".
                </div>
              </div>

              {/* Guardrail 2 */}
              <div style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '20px',
                padding: '1.75rem',
                border: '1px solid #cbd5e1',
                borderTop: '4px solid #f59e0b'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309', marginBottom: '0.4rem' }}>
                  GUARDRAIL #2
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                  UNSUPPORTED ≠ PROVEN FRAUD
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                  Jika ada bukti yang tidak cocok dengan klaim, itu adalah <strong>anomali berkas</strong>, bukan bukti pasti tindak pidana kecurangan. Bisa saja staf salah mengetik kode saat input komputer.
                </p>
                <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#fffbeb', borderRadius: '10px', fontSize: '0.8rem', color: '#92400e' }}>
                  <strong>Prinsip:</strong> Menghormati asas praduga tak bersalah bagi tenaga medis dan faskes mitra BPJS.
                </div>
              </div>

              {/* Guardrail 3 */}
              <div style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '20px',
                padding: '1.75rem',
                border: '1px solid #cbd5e1',
                borderTop: '4px solid #10b981'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', marginBottom: '0.4rem' }}>
                  GUARDRAIL #3
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                  RISK SIGNAL ≠ FINAL DECISION
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                  Sinyal warna merah dan skor risiko dari komputer hanyalah <strong>bantuan triase</strong>. Keputusan membatalkan klaim atau menyetujui klaim <strong>hanya sah jika diputuskan oleh dokter penelaah manusia</strong>.
                </p>
                <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#ecfdf5', borderRadius: '10px', fontSize: '0.8rem', color: '#065f46' }}>
                  <strong>Prinsip:</strong> Sistem adalah asisten dokter (Human-in-the-Loop), bukan pengganti dokter.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: SKENARIO DEMO JURI */}
        {activeTab === 'demo' && (
          <motion.div
            key="demo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid var(--mc-card-border, #e3ecee)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ maxWidth: '750px', marginBottom: '2rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                Panduan Presentasi
              </span>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', marginTop: '0.6rem', marginBottom: '0.5rem' }}>
                4 Skenario Siap Uji untuk Dewan Juri
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5 }}>
                Untuk memudahkan dewan juri menguji kemampuan sistem, klik salah satu tombol skenario di bawah ini untuk melihat demo interaktifnya:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Skenario 1 */}
              <div style={{
                border: '1px solid #fecdd3',
                borderRadius: '18px',
                padding: '1.5rem',
                background: '#fff1f2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
                  <ShieldAlert size={18} style={{ color: '#e11d48' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9f1239' }}>SKENARIO #1</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Deteksi Klaim Fiktif (Phantom)
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                  Klaim obat &amp; tindakan ditagihkan 10 unit, tetapi lembar tindakan di rekam medis terbukti 0 (kosong).
                </p>
                <button
                  onClick={() => onSelectCase ? onSelectCase('CASE-0025') : onOpenQueue()}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(225, 29, 72, 0.25)'
                  }}
                >
                  <Eye size={14} /> Buka Kasus CASE-0025
                </button>
              </div>

              {/* Skenario 2 */}
              <div style={{
                border: '1px solid #fde68a',
                borderRadius: '18px',
                padding: '1.5rem',
                background: '#fffbeb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
                  <AlertTriangle size={18} style={{ color: '#d97706' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309' }}>SKENARIO #2</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Inkonsistensi Diagnosa (Pria Hamil)
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                  Simulasi interaktif klaim medis pasien pria dengan diagnosa kandungan <em>(Cyesis LMP)</em>.
                </p>
                <button
                  onClick={onOpenInput}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  <Sparkles size={14} /> Coba Simulasi Klaim
                </button>
              </div>

              {/* Skenario 3 */}
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '18px',
                padding: '1.5rem',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
                  <HelpCircle size={18} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>SKENARIO #3</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Berkas Belum Lengkap (Unavailable)
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                  Melihat bagaimana sistem mengaktifkan Guardrail #1 sehingga tidak menuduh fraud sembarangan.
                </p>
                <button
                  onClick={() => onSelectCase ? onSelectCase('CASE-0033') : onOpenQueue()}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: '#475569',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={14} /> Buka Kasus CASE-0033
                </button>
              </div>

              {/* Skenario 4 */}
              <div style={{
                border: '1px solid #a7f3d0',
                borderRadius: '18px',
                padding: '1.5rem',
                background: '#ecfdf5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857' }}>SKENARIO #4</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Antrean Audit &amp; Penetapan Vonis
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                  Melihat seluruh antrean kasus dokter dan mencoba mengesahkan form putusan audit.
                </p>
                <button
                  onClick={onOpenQueue}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--mc-teal-primary, #007a78)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(0, 122, 120, 0.25)'
                  }}
                >
                  <Layers size={14} /> Buka Antrean Audit Lengkap
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
