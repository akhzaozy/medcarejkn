import React from 'react';
import { motion } from 'framer-motion';

export default function MedcareMinimalistHeader({
  activeTab = 'Dashboard',
  onTabChange,
  currentUser,
  onLogout,
  onOpenProfile
}) {
  const navItems = [
    { key: 'Dashboard', label: 'Dashboard' },
    { key: 'Antrean Audit', label: 'Antrean Audit' },
    { key: 'Simulasi Klaim', label: 'Simulasi Klaim' }
  ];

  const displayName = currentUser?.name || 'dr. Anindya Kusuma, Sp.PK';
  const displayRole = currentUser?.role === 'clinical_reviewer' ? 'Reviewer Klinis' : 'Staff JKN Pusat';

  return (
    <motion.header
      className="med-header"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Brand Logo */}
      <div className="med-logo" onClick={() => onTabChange && onTabChange('Dashboard')}>
        <div className="med-logo-badge" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
          </svg>
        </div>
        <div className="med-logo-text">
          medCare<span>JKN</span>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="med-nav" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              id={`nav-item-${item.key.toLowerCase().replace(/\s+/g, '-')}`}
              className={`med-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange && onTabChange(item.key)}
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

      {/* User Profile Badge */}
      <div className="med-header-right">
        <div
          className="med-profile-badge"
          onClick={onOpenProfile}
          id="btn-user-profile"
          role="button"
          tabIndex={0}
          title="Klik untuk melihat info akun / keluar"
        >
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

        {onLogout && (
          <button
            onClick={onLogout}
            title="Keluar sistem"
            style={{
              background: '#ffffff',
              border: '1px solid var(--mc-card-border)',
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </motion.header>
  );
}
