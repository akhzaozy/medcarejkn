import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { loginUser, setDemoMode } from '../api/client';
import DoctorMascotAvatar from '../components/illustrations/DoctorMascotAvatar';
import AnimatedAlertModal from '../components/common/AnimatedAlertModal';
import { 
  User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, 
  CheckCircle2, ShieldCheck, Sparkles, Stethoscope, 
  FileText, Activity, KeyRound, Building2
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('dr.anindya');
  const [password, setPassword] = useState('nakes');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeAccountType, setActiveAccountType] = useState('clinician'); // 'clinician' or 'staff'
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
    details: '',
    primaryAction: null,
    secondaryAction: null
  });

  // Doctor & Staff Accounts
  const clinicianAccounts = [
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

  const staffAccounts = [
    {
      id: 'staff.ahmad',
      username: 'staff.ahmad',
      pass: 'jkn',
      name: 'Ahmad Fauzi, S.E.',
      role: 'Senior Verifikator JKN',
      cases: '2.168 Kasus',
      badge: 'Verifikator 1'
    },
    {
      id: 'staff.adit',
      username: 'staff.adit',
      pass: 'jkn',
      name: 'Aditya Pratama, S.Kep.',
      role: 'Verifikator Klaim JKN',
      cases: '2.168 Kasus',
      badge: 'Verifikator 2'
    }
  ];

  const handleSelectAccount = (acc) => {
    setUsername(acc.username);
    setPassword(acc.pass);
    setError(null);
  };

  const handleDirectDemoLogin = () => {
    setDemoMode(true);
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
    const trimmed = username.trim().toLowerCase();
    
    let user = {
      id: 'usr-clinician-001',
      username: 'dr.anindya',
      email: 'dr.anindya@klinik.ac.id',
      name: 'dr. Anindya Kusuma, Sp.PK',
      role: 'clinical_reviewer',
      roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
      title: 'Dokter Verifikator Klinis / Spesialis Patologi',
      unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)'
    };

    if (trimmed.includes('budi')) {
      user = {
        ...user,
        id: 'usr-clinician-002',
        username: 'dr.budi',
        name: 'dr. Budi Santoso, Sp.A',
        title: 'Dokter Spesialis Anak'
      };
    } else if (trimmed.includes('ratna')) {
      user = {
        ...user,
        id: 'usr-clinician-003',
        username: 'dr.ratna',
        name: 'dr. Ratna Dewi, Sp.PD',
        title: 'Dokter Spesialis Penyakit Dalam'
      };
    } else if (trimmed.includes('adit')) {
      user = {
        id: 'usr-staff-002',
        username: 'staff.adit',
        email: 'aditya.pratama@bpjs-kesehatan.go.id',
        name: 'Aditya Pratama, S.Kep.',
        role: 'staff_jkn',
        roleLabel: 'Verifikator JKN',
        title: 'Verifikator Klaim & Investigasi Faskes',
        unit: 'Kedeputian Jaminan Pelayanan Kesehatan'
      };
    } else if (trimmed.includes('staff') || trimmed.includes('ahmad') || trimmed.includes('fauzi') || activeAccountType === 'staff') {
      user = {
        id: 'usr-staff-001',
        username: 'staff.ahmad',
        email: 'ahmad.fauzi@bpjs-kesehatan.go.id',
        name: 'Ahmad Fauzi, S.E.',
        role: 'staff_jkn',
        roleLabel: 'Senior Verifikator JKN',
        title: 'Senior Verifikator & Triage Klaim BPJS',
        unit: 'Kedeputian Jaminan Pelayanan Kesehatan'
      };
    }

    onLoginSuccess(user, 'mock-jwt-offline-token');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setError('Silakan masukkan username.');
      return;
    }
    if (!password) {
      setError('Silakan masukkan kata sandi (contoh: nakes).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await loginUser({ username: username.trim(), password });
      onLoginSuccess(res.user, res.token);
    } catch (err) {
      console.warn('[LoginPage] Login error encountered:', err.message);
      // If error indicates bad password, display it
      if (err.message && !err.message.includes('backend') && !err.message.includes('fetch')) {
        setError(err.message);
      } else {
        // Graceful fallback login so demo never fails
        handleDirectDemoLogin();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(circle at 20% 25%, #004d4b 0%, #081719 65%, #030808 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      fontFamily: "'Figtree', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Outer Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '1060px',
          background: '#ffffff',
          borderRadius: '26px',
          boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'grid',
          gridTemplateColumns: '1.08fr 1fr',
          overflow: 'hidden'
        }}
      >
        {/* ==================== LEFT COLUMN: Clinical Brand & Quick Accounts ==================== */}
        <div style={{
          background: 'linear-gradient(155deg, #003635 0%, #004d4b 40%, #007a78 100%)',
          padding: '2.5rem 2.25rem',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Subtle glowing ambient gradient */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'rgba(45, 212, 191, 0.15)',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }} />

          {/* 1. Header & Brand Emblem */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.1 }}>
                  medCare<span style={{ color: '#a7f3d0' }}>JKN</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                  Portal Integritas &amp; Rekonsiliasi Klaim Medis
                </div>
              </div>
            </div>

            {/* Narrative Hero */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.85rem'
            }}>
              <ShieldCheck size={14} color="#a7f3d0" />
              <span>Audit &amp; Rekonsiliasi Klinis DPJP</span>
            </div>

            <h1 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              margin: '0 0 0.65rem 0',
              color: '#ffffff'
            }}>
              Pencegahan Fraud &amp; Rekonsiliasi Bukti Digital
            </h1>

            <p style={{
              fontSize: '0.86rem',
              lineHeight: 1.55,
              color: 'rgba(255, 255, 255, 0.86)',
              margin: 0,
              maxWidth: '420px'
            }}>
              Sebanyak <strong>4.336 berkas klaim</strong> terdistribusi merata ke 3 dokter penelaah klinis untuk menjamin objektivitas pemeriksaan medis.
            </p>
          </div>

          {/* 2. Quick Account Selector Section */}
          <div style={{ position: 'relative', zIndex: 2, marginTop: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.85)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Pilih Profil Cepat (Klik untuk Isi):
              </span>

              {/* Role Toggle */}
              <div style={{
                display: 'inline-flex',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                padding: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAccountType('clinician');
                    handleSelectAccount(clinicianAccounts[0]);
                  }}
                  style={{
                    border: 'none',
                    background: activeAccountType === 'clinician' ? '#ffffff' : 'transparent',
                    color: activeAccountType === 'clinician' ? '#004d4b' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Dokter DPJP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAccountType('staff');
                    handleSelectAccount(staffAccounts[0]);
                  }}
                  style={{
                    border: 'none',
                    background: activeAccountType === 'staff' ? '#ffffff' : 'transparent',
                    color: activeAccountType === 'staff' ? '#004d4b' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Staff JKN
                </button>
              </div>
            </div>

            {/* Clinicians List */}
            {activeAccountType === 'clinician' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {clinicianAccounts.map((doc) => {
                  const isSelected = username === doc.username;
                  return (
                    <motion.div
                      key={doc.id}
                      onClick={() => handleSelectAccount(doc)}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(10px)',
                        border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem',
                        color: isSelected ? '#004d4b' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 6px 16px rgba(0, 0, 0, 0.25)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isSelected ? '#e6f6f5' : 'rgba(255, 255, 255, 0.2)',
                          color: isSelected ? '#007a78' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.76rem'
                        }}>
                          <Stethoscope size={16} />
                        </div>
                        <div>
                          <div style={{
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            color: isSelected ? '#0f172a' : '#ffffff',
                            lineHeight: 1.2
                          }}>
                            {doc.name}
                          </div>
                          <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: isSelected ? '#007a78' : 'rgba(255, 255, 255, 0.8)'
                          }}>
                            {doc.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: isSelected ? '#f0fdf4' : 'rgba(255, 255, 255, 0.2)',
                          color: isSelected ? '#15803d' : '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {doc.cases}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Staff Accounts List (Ahmad & Adit) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {staffAccounts.map((st) => {
                  const isSelected = username === st.username;
                  return (
                    <motion.div
                      key={st.id}
                      onClick={() => handleSelectAccount(st)}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(10px)',
                        border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '14px',
                        padding: '0.85rem 1rem',
                        color: isSelected ? '#004d4b' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: isSelected ? '0 6px 16px rgba(0, 0, 0, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: isSelected ? '#e6f6f5' : 'rgba(255, 255, 255, 0.2)',
                          color: isSelected ? '#007a78' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800
                        }}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? '#0f172a' : '#ffffff' }}>
                              {st.name}
                            </span>
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              background: isSelected ? '#e6f6f5' : 'rgba(255, 255, 255, 0.25)',
                              color: isSelected ? '#007a78' : '#ffffff',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}>
                              {st.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isSelected ? '#007a78' : 'rgba(255, 255, 255, 0.8)' }}>
                            {st.role}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: isSelected ? '#eff6ff' : 'rgba(255, 255, 255, 0.2)',
                        color: isSelected ? '#1d4ed8' : '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {st.cases}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: Professional Login Form ==================== */}
        <div style={{
          padding: '2rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            {/* Super Cool Interactive Doctor Mascot Avatar (Eyes follow input, hands cover eyes, peeks) */}
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
                margin: '0 0 0.25rem 0'
              }}>
                Masuk ke Portal Audit
              </h2>
              <p style={{
                fontSize: '0.84rem',
                color: '#64748b',
                margin: 0,
                lineHeight: 1.4
              }}>
                Silakan gunakan akun dokter penelaah atau masukkan kredensial Anda
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
                  padding: '0.7rem 0.9rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Username Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.4rem'
                }}>
                  Username Akun
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setIsUsernameFocused(false)}
                    placeholder="dr.anindya / dr.budi / dr.ratna"
                    autoComplete="username"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.5rem',
                      borderRadius: '12px',
                      border: `1.5px solid ${isUsernameFocused ? '#007a78' : '#e2e8f0'}`,
                      fontSize: '0.9rem',
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

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155'
                  }}>
                    Kata Sandi
                  </label>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#007a78',
                    background: '#e6f6f5',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    Sandi default: <strong>nakes</strong>
                  </span>
                </div>

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
                      padding: '0.8rem 2.75rem 0.8rem 2.5rem',
                      borderRadius: '12px',
                      border: `1.5px solid ${isPasswordFocused ? '#007a78' : '#e2e8f0'}`,
                      fontSize: '0.9rem',
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

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.985 }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #007a78 0%, #005f5d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.88rem 1.25rem',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(0, 122, 120, 0.32)',
                  marginTop: '0.4rem',
                  transition: 'box-shadow 0.2s'
                }}
              >
                <span>{loading ? 'Memverifikasi Akses...' : 'Masuk ke Sistem'}</span>
                <ArrowRight size={17} />
              </motion.button>

              {/* Direct Demo Mode button */}
              <button
                type="button"
                onClick={handleDirectDemoLogin}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.72rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                <Sparkles size={14} color="#007a78" />
                <span>Masuk Cepat Mode Demo (Data Sintetis V4)</span>
              </button>
            </form>
          </div>

          {/* Footer with Compliance & Version Badge */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              lineHeight: 1.5
            }}>
              🔒 Portal Keamanan &amp; Integritas Rekam Medis Sesuai Permenkes No. 16/2019
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Alert Modal */}
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
