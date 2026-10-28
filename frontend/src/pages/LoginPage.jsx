import React, { useState } from 'react';
import '../styles/login.css';
import { loginUser, setDemoMode } from '../api/client';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('dr.anindya');
  const [password, setPassword] = useState('nakes');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeAccountType, setActiveAccountType] = useState('clinician'); // 'clinician' or 'staff'
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

  const accounts = activeAccountType === 'clinician' ? clinicianAccounts : staffAccounts;
  const selectedAccount = [...clinicianAccounts, ...staffAccounts].find(account => account.username === username);

  const chooseRole = (role) => {
    setActiveAccountType(role);
    handleSelectAccount(role === 'clinician' ? clinicianAccounts[0] : staffAccounts[0]);
    setShowPassword(false);
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <header className="login-brandbar">
          <a className="login-brand" href="#" aria-label="medCare JKN">
            <span className="login-brand-mark" aria-hidden="true">+</span>
            <span>medCare <span className="login-brand-jkn">JKN</span></span>
          </a>
          <span className="login-environment">Simulasi lomba</span>
        </header>

        <div className="login-columns">
          <section className="login-profiles" aria-labelledby="login-profiles-title">
            <div className="login-intro">
              <p className="login-eyebrow">PORTAL AUDIT KLAIM</p>
              <h1 id="login-profiles-title">Telaah klaim,<br />mulai dari buktinya.</h1>
              <p>Telusuri riwayat layanan peserta dan cocokkan bukti pelayanan dalam satu ruang kerja.</p>
            </div>

            <div className="login-account-picker">
              <div className="login-section-heading">
                <h2>Pilih akun simulasi</h2>
                <span>Terisi otomatis</span>
              </div>
              <div className="login-role-switch" role="group" aria-label="Jenis akun simulasi">
                <button type="button" aria-pressed={activeAccountType === 'clinician'} onClick={() => chooseRole('clinician')} disabled={loading}>Dokter penelaah</button>
                <button type="button" aria-pressed={activeAccountType === 'staff'} onClick={() => chooseRole('staff')} disabled={loading}>Staf JKN</button>
              </div>
              <div className="login-account-list">
                {accounts.map(account => (
                  <button
                    key={account.id}
                    type="button"
                    className="login-account"
                    aria-pressed={username === account.username}
                    onClick={() => { handleSelectAccount(account); setShowPassword(false); }}
                    disabled={loading}
                  >
                    <span className="login-initials" aria-hidden="true">{account.name.replace(/^dr\. /, '').split(' ').slice(0, 2).map(part => part[0]).join('')}</span>
                    <span className="login-account-copy"><strong>{account.name}</strong><span>{account.role}</span></span>
                    <span className="login-account-choice" aria-hidden="true"><span /></span>
                  </button>
                ))}
              </div>
              <p className="login-account-help">Pilihan akun menentukan peran Anda saat menelaah klaim.</p>
            </div>
          </section>

          <section className="login-form-panel" aria-labelledby="login-form-title">
            <div className="login-form-heading">
              <p className="login-eyebrow">SELAMAT DATANG</p>
              <h2 id="login-form-title">Masuk ke medCare</h2>
              <p>Gunakan akun yang dipilih atau masukkan akun Anda.</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-field">
                <label htmlFor="login-username">Username</label>
                <input id="login-username" name="username" type="text" value={username} onChange={event => { setUsername(event.target.value); setError(null); }} placeholder="Masukkan username" autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
              </div>
              <div className="login-field">
                <label htmlFor="login-password">Kata sandi</label>
                <div className="login-password-wrap">
                  <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => { setPassword(event.target.value); setError(null); }} placeholder="Masukkan kata sandi" autoComplete="current-password" disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : 'login-password-hint'} />
                  <button type="button" className="login-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={showPassword} disabled={loading}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <p id="login-password-hint" className="login-field-hint">{selectedAccount ? <>Sandi akun simulasi: <strong>{selectedAccount.pass}</strong></> : 'Pilih akun simulasi untuk mengisi username dan sandi.'}</p>
              </div>
              {error && <div id="login-error" className="login-error" role="alert">{error}</div>}
              <button type="submit" className="login-submit" disabled={loading} aria-busy={loading}><span>{loading ? 'Memeriksa akun…' : 'Masuk ke ruang audit'}</span><ArrowRight size={18} aria-hidden="true" /></button>
              <div className="login-divider"><span>atau</span></div>
              <button type="button" className="login-demo" onClick={handleDirectDemoLogin} disabled={loading}>Coba mode demo</button>
            </form>
            <div className="login-demo-note"><strong>Ruang simulasi untuk lomba</strong><p>Eksplorasi data sampel BPJS dan skenario audit. Hasil telaah digunakan untuk demonstrasi.</p></div>
          </section>
        </div>
        <footer className="login-footer"><span>medCare JKN · Audit klaim berbasis bukti</span><span>Data sampel BPJS edisi 2025</span></footer>
      </div>
    </main>
  );
}
