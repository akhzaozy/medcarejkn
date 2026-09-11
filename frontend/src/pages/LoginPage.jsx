import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { loginUser } from '../api/client';
import DoctorMascotAvatar from '../components/illustrations/DoctorMascotAvatar';
import AnimatedAlertModal from '../components/common/AnimatedAlertModal';
import { 
  User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, 
  Stethoscope, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('dr.anindya');
  const [password, setPassword] = useState('nakes');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
    details: '',
    primaryAction: null,
    secondaryAction: null
  });

  // Doctors & Staff information for quick fill on left panel
  const doctorAccounts = [
    {
      id: 'dr.anindya',
      username: 'dr.anindya',
      pass: 'nakes',
      name: 'dr. Anindya Kusuma, Sp.PK',
      role: 'Spesialis Patologi Klinis',
      cases: '1.446 Kasus',
      badge: 'DPJP 1'
    },
    {
      id: 'dr.budi',
      username: 'dr.budi',
      pass: 'nakes',
      name: 'dr. Budi Santoso, Sp.A',
      role: 'Spesialis Anak',
      cases: '1.445 Kasus',
      badge: 'DPJP 2'
    },
    {
      id: 'dr.ratna',
      username: 'dr.ratna',
      pass: 'nakes',
      name: 'dr. Ratna Dewi, Sp.PD',
      role: 'Spesialis Penyakit Dalam',
      cases: '1.445 Kasus',
      badge: 'DPJP 3'
    }
  ];

  const handleSelectDoctor = (doc) => {
    setUsername(doc.username);
    setPassword(doc.pass);
    setError(null);
  };

  const handleFallbackLogin = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
    const trimmed = username.trim().toLowerCase();
    let fallbackUser = {
      id: 'usr-clinician-001',
      username: 'dr.anindya',
      email: 'dr.anindya@klinik.ac.id',
      name: 'dr. Anindya Kusuma, Sp.PK',
      role: 'clinical_reviewer',
      roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
      title: 'Dokter Verifikator Klinis / Spesialis Patologi',
      unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
      capabilities: [
        'Membuka Kasus yang Ditugaskan',
        'Memeriksa Item Klaim & Kode Tindakan Medis',
        'Menelusuri Rantai Bukti (Evidence Chain)',
        'Menganalisis Evidence Gap & Disparitas Tarif',
        'Memberikan Keputusan Akhir (Review Outcome)',
        'Menambahkan Catatan Rekomendasi Klinis'
      ]
    };

    if (trimmed.includes('budi')) {
      fallbackUser = {
        ...fallbackUser,
        id: 'usr-clinician-002',
        username: 'dr.budi',
        name: 'dr. Budi Santoso, Sp.A',
        title: 'Dokter Spesialis Anak'
      };
    } else if (trimmed.includes('ratna')) {
      fallbackUser = {
        ...fallbackUser,
        id: 'usr-clinician-003',
        username: 'dr.ratna',
        name: 'dr. Ratna Dewi, Sp.PD',
        title: 'Dokter Spesialis Penyakit Dalam'
      };
    } else if (trimmed.includes('staff') || trimmed.includes('fauzi')) {
      fallbackUser = {
        id: 'usr-staff-001',
        username: 'staff.jkn',
        email: 'ahmad.fauzi@bpjs-kesehatan.go.id',
        name: 'Ahmad Fauzi, S.E.',
        role: 'jkn_staff',
        roleLabel: 'Verifikator JKN Pusat',
        title: 'Staff Verifikator Klaim BPJS Kesehatan',
        unit: 'Kedeputian Jaminan Pelayanan Kesehatan',
        capabilities: [
          'Memantau Antrean Audit Klaim Nasional',
          'Melakukan Penugasan Berkas ke DPJP',
          'Mengunci & Menerbitkan Berita Acara Rekonsiliasi',
          'Akses Rekapitulasi Potensi Fraud Faskes'
        ]
      };
    }
    onLoginSuccess(fallbackUser, 'mock-jwt-offline-token');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setError('Silakan masukkan username.');
      setAlertConfig({
        isOpen: true,
        type: 'warning',
        title: 'Username Diperlukan',
        message: 'Mohon masukkan username verifikator sebelum melanjutkan.',
        details: 'MISSING_USERNAME',
        primaryAction: {
          label: 'Mengerti',
          onClick: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
        }
      });
      return;
    }
    if (!password) {
      setError('Silakan masukkan kata sandi.');
      setAlertConfig({
        isOpen: true,
        type: 'warning',
        title: 'Kata Sandi Diperlukan',
        message: 'Mohon ketikkan kata sandi Anda.',
        details: 'MISSING_PASSWORD',
        primaryAction: {
          label: 'Ketik Sandi',
          onClick: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
        }
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await loginUser({ username: username.trim(), password });
      onLoginSuccess(res.user, res.token);
    } catch (err) {
      const errMsg = err.message || 'Username atau kata sandi salah. Silakan coba lagi.';
      setError(errMsg);
      const isConnectionError = errMsg.includes('Koneksi') || errMsg.includes('backend') || errMsg.includes('Load failed') || errMsg.includes('Failed to fetch') || errMsg.includes('port 3000');

      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: isConnectionError ? 'Koneksi Server Terputus' : 'Autentikasi Gagal',
        message: isConnectionError
          ? 'Sistem mendeteksi server backend port 3000 belum siap atau sambungan terputus. Anda dapat langsung masuk dengan Mode Demo tanpa hambatan.'
          : 'Username atau kata sandi tidak cocok dengan data verifikator terdaftar. Silakan periksa kembali akun Anda.',
        details: errMsg,
        primaryAction: {
          label: isConnectionError ? 'Masuk Mode Demo Langsung' : 'Coba Lagi',
          onClick: isConnectionError
            ? () => handleFallbackLogin()
            : () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
        },
        secondaryAction: {
          label: 'Tutup',
          onClick: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 15% 20%, #0d282b 0%, #081719 60%, #040c0d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      fontFamily: "'Figtree', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '1020px',
          height: 'min(92vh, 640px)',
          background: '#ffffff',
          borderRadius: '26px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(0, 122, 120, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* ==================== LEFT COLUMN: Dashboard Teal Identity ==================== */}
        <div style={{
          background: 'linear-gradient(150deg, #004d4b 0%, #005f5d 35%, #007a78 80%, #0d9488 100%)',
          padding: '2.25rem 2.25rem',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Orbs */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'rgba(45, 212, 191, 0.2)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }} />

          {/* Top: Brand Logo */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.1 }}>
                  medCare<span style={{ color: '#a7f3d0' }}>JKN</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>
                  Portal Telaah Integritas Klaim Medis
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Narrative */}
          <div style={{ position: 'relative', zIndex: 2, margin: '1rem 0' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.85rem'
            }}>
              <span>Audit &amp; Rekonsiliasi Klinis</span>
              <span>🩺</span>
            </div>

            <h1 style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              margin: '0 0 0.6rem 0',
              color: '#ffffff'
            }}>
              Pencegahan Fraud &amp; Rekonsiliasi DPJP
            </h1>
            <p style={{
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: 'rgba(255, 255, 255, 0.88)',
              margin: 0,
              maxWidth: '380px'
            }}>
              Sebanyak <strong>4.336 berkas klaim</strong> terbagi merata ke dalam 3 dokter penelaah klinis untuk menjamin objektivitas audit medis.
            </p>
          </div>

          {/* Bottom: 3 Doctor Quick Select Cards */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.75)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Pilih Dokter Penelaah (Klik untuk isi cepat):
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.6rem'
            }}>
              {doctorAccounts.map((doc, idx) => {
                const isSelected = username === doc.username;
                return (
                  <motion.div
                    key={doc.id}
                    onClick={() => handleSelectDoctor(doc)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.14)',
                      backdropFilter: 'blur(12px)',
                      border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '14px',
                      padding: '0.75rem 0.65rem',
                      color: isSelected ? '#005f5d' : '#ffffff',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 8px 18px rgba(0, 0, 0, 0.22)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '88px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.35rem'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isSelected ? '#007a78' : 'rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 800
                      }}>
                        {idx + 1}
                      </div>
                      {isSelected && <CheckCircle2 size={15} color="#007a78" />}
                    </div>

                    <div>
                      <div style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        lineHeight: 1.2,
                        color: isSelected ? '#0f172a' : '#ffffff',
                        marginBottom: '2px'
                      }}>
                        {doc.name.split(',')[0]}
                      </div>
                      <div style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: isSelected ? '#007a78' : 'rgba(255, 255, 255, 0.85)'
                      }}>
                        {doc.cases}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: Clean Login Form ==================== */}
        <div style={{
          padding: '2.25rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff',
          position: 'relative'
        }}>
          {/* Animated Doctor Mascot (Hands smoothly cover eyes when typing password) */}
          <DoctorMascotAvatar
            isPasswordFocused={isPasswordFocused}
            showPassword={showPassword}
            isUsernameFocused={isUsernameFocused}
          />

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: '0 0 0.2rem 0'
            }}>
              Masuk ke Portal
            </h2>
            <p style={{
              fontSize: '0.8rem',
              color: '#64748b',
              margin: 0
            }}>
              Silakan masukkan kredensial akun telaah Anda
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.6rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.78rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* CLEAN LOGIN FORM: USERNAME & PASSWORD ONLY */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {/* 1. Username Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '0.35rem'
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                  placeholder="Masukkan username (contoh: dr.anindya)"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '0.78rem 1rem 0.78rem 2.45rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${isUsernameFocused ? '#007a78' : '#e2e8f0'}`,
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    background: isUsernameFocused ? '#ffffff' : '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    boxShadow: isUsernameFocused ? '0 0 0 3px rgba(0, 122, 120, 0.12)' : 'none'
                  }}
                />
                <User
                  size={17}
                  color={isUsernameFocused ? '#007a78' : '#94a3b8'}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transition: 'color 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* 2. Password Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '0.35rem'
              }}>
                Kata Sandi
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="Masukkan kata sandi..."
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.78rem 2.75rem 0.78rem 2.45rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${isPasswordFocused ? '#007a78' : '#e2e8f0'}`,
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    background: isPasswordFocused ? '#ffffff' : '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    boxShadow: isPasswordFocused ? '0 0 0 3px rgba(0, 122, 120, 0.12)' : 'none'
                  }}
                />
                <Lock
                  size={17}
                  color={isPasswordFocused ? '#007a78' : '#94a3b8'}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transition: 'color 0.2s ease'
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '8px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 3. Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #007a78 0%, #005f5d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(0, 122, 120, 0.32)',
                marginTop: '0.35rem',
                transition: 'background 0.2s'
              }}
            >
              <span>{loading ? 'Memverifikasi Akses...' : 'Masuk ke Sistem'}</span>
              <ArrowRight size={17} />
            </motion.button>
          </form>

          {/* Quick Credential Hint / Staff Switcher */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#64748b'
          }}>
            <div>
              <span>Ingin masuk sebagai <strong>Staff JKN</strong>?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setUsername('staff.jkn');
                setPassword('jkn');
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#007a78',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '2px 6px',
                textDecoration: 'underline'
              }}
            >
              staff.jkn (4.336 Kasus)
            </button>
          </div>

          {/* Footer compliance */}
          <div style={{
            fontSize: '0.66rem',
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: '1rem',
            lineHeight: 1.4
          }}>
            Portal Keamanan &amp; Integritas Rekam Medis BPJS Kesehatan 2026
          </div>
        </div>
      </motion.div>

      {/* Modern Animated Alert Modal with Spring Bounces and Pulsing Glow */}
      <AnimatedAlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        details={alertConfig.details}
        primaryAction={alertConfig.primaryAction}
        secondaryAction={alertConfig.secondaryAction}
      />
    </div>
  );
}
