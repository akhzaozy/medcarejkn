import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Sparkles } from 'lucide-react';
import { isDemoMode } from '../../api/client';


export default function MedcareHeader({ 
  activeSection = 'landing', 
  onNavigate, 
  onOpenQueue, 
  onOpenInput,
  onOpenGuide,
  currentUser,
  onLogout
}) {
  const isClinician = currentUser?.role === 'clinical_reviewer';
  const displayName = currentUser?.name || 'dr. Anindya Kusuma, Sp.PK';
  const displayRole = isClinician ? 'Reviewer Klinis' : 'Staff JKN Pusat';

  // 100% UNIFIED NAV ITEMS (SERUMPUN) ACROSS ALL PAGES
  const navItems = [
    { key: 'landing', label: 'Dashboard', onClick: () => onNavigate && onNavigate('landing') },
    { key: 'cases', label: 'Antrean Audit', onClick: onOpenQueue },
    { key: 'input', label: 'Simulasi Klaim', onClick: onOpenInput },
    { key: 'guide', label: 'Panduan', onClick: onOpenGuide }
  ];

  return (
    <motion.header
      className="med-header"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Brand Logo with Medical Emblem */}
      <div className="med-logo" onClick={() => onNavigate && onNavigate('landing')}>
        <div className="med-logo-badge" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
          </svg>
        </div>
        <div className="med-logo-text">
          medCare<span>JKN</span>
        </div>
      </div>

      {/* Navigation Pills — frosted glass, identical & serumpun across all views */}
      <nav className="med-nav" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = 
            (item.key === 'landing' && (activeSection === 'landing' || activeSection === 'home')) ||
            (item.key === 'cases' && (activeSection === 'cases' || activeSection === 'case-detail')) ||
            (item.key === 'input' && activeSection === 'input') ||
            (item.key === 'guide' && activeSection === 'guide');

          return (
            <button
              key={item.key}
              id={`nav-item-${item.key}`}
              className={`med-nav-item ${isActive ? 'active' : ''}`}
              onClick={item.onClick}
            >
              {item.label}
              {isActive && (
                <motion.div
                  className="med-nav-active-pill"
                  layoutId="activeTabUnderline"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Badge & Logout */}
      <div className="med-header-right">
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDemoMode() && (
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                padding: '3px 8px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={11} />
                Mode Demo
              </span>
            )}
            <div className="med-profile-badge" title="Info akun">
              <img
                src="/assets/user_fedrik.jpg"
                alt={displayName}
                className="med-profile-avatar"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
                }}
              />
              <div>
                <div className="med-profile-name">{displayName}</div>
                <div className="med-profile-sub">{displayRole}</div>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="btn-pill-primary"
            onClick={onLogout}
            style={{ padding: '0.55rem 1.3rem', fontSize: '0.85rem' }}
          >
            Masuk / Login
          </button>
        )}

        {onLogout && currentUser && (
          <button
            onClick={onLogout}
            title="Keluar sistem"
            style={{
              background: 'var(--mc-card-bg, #ffffff)',
              border: '1px solid var(--mc-card-border, #e3ecee)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </motion.header>
  );
}
