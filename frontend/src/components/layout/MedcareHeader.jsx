import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Sparkles, Bell, MessageSquare, 
  FileText, CheckCheck, Clock, ChevronRight, Check
} from 'lucide-react';
import { isDemoMode, getNotifications, markNotificationsAsRead } from '../../api/client';

export default function MedcareHeader({ 
  activeSection = 'landing', 
  onNavigate, 
  onOpenQueue, 
  onOpenInput, 
  onOpenGuide,
  onSelectCase,
  currentUser, 
  onLogout 
}) {
  const isClinician = currentUser?.role === 'clinical_reviewer';
  const displayName = currentUser?.name || 'Ahmad Fauzi, S.E.';
  const displayRole = isClinician ? 'Reviewer Klinis' : (currentUser?.roleLabel || 'Staff JKN');

  const [notifications, setNotifications] = useState(() => getNotifications());
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      setNotifications(e.detail || getNotifications());
    };
    window.addEventListener('jkn_notifications_updated', handleUpdate);
    return () => window.removeEventListener('jkn_notifications_updated', handleUpdate);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    const updated = markNotificationsAsRead();
    setNotifications(updated);
  };

  const handleNotificationClick = (n) => {
    setShowNotifDropdown(false);
    if (n.caseId && onSelectCase) {
      onSelectCase(n.caseId);
    } else if (onOpenQueue) {
      onOpenQueue();
    }
  };

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

      {/* Navigation Pills */}
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

      {/* Header Right: Notification Bell, Profile, & Logout */}
      <div className="med-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* NOTIFICATION BELL TOGGLE */}
        {currentUser && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              type="button"
              id="btn-navbar-notifications"
              onClick={() => setShowNotifDropdown(prev => !prev)}
              title="Notifikasi sanggahan & progres audit"
              style={{
                background: showNotifDropdown ? '#e6f6f5' : '#ffffff',
                border: showNotifDropdown ? '1.5px solid #007a78' : '1px solid #e2e8f0',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showNotifDropdown ? '#007a78' : '#475569',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(225, 29, 72, 0.4)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION DROPDOWN POPOVER */}
            <AnimatePresence>
              {showNotifDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '360px',
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.16)',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}
                >
                  {/* Dropdown Header */}
                  <div style={{
                    padding: '0.9rem 1.1rem',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        Notifikasi Kasus
                      </span>
                      {unreadCount > 0 && (
                        <span style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '10px'
                        }}>
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#007a78',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <CheckCheck size={13} />
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  {/* Dropdown Items List */}
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {notifications && notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          style={{
                            padding: '0.85rem 1.1rem',
                            borderBottom: '1px solid #f8fafc',
                            background: n.read ? '#ffffff' : '#f0fdfa',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '10px',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = n.read ? '#ffffff' : '#f0fdfa'}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: n.type === 'dispute' ? '#fef3c7' : (n.type === 'ml' ? '#e6f6f5' : '#eff6ff'),
                            color: n.type === 'dispute' ? '#d97706' : (n.type === 'ml' ? '#007a78' : '#2563eb'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {n.type === 'dispute' ? <MessageSquare size={16} /> : (n.type === 'ml' ? <Sparkles size={16} /> : <FileText size={16} />)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                                {n.title}
                              </span>
                              {n.caseId && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  color: '#007a78',
                                  background: '#e6f6f5',
                                  padding: '1px 5px',
                                  borderRadius: '4px'
                                }}>
                                  {n.caseId}
                                </span>
                              )}
                            </div>
                            <p style={{
                              fontSize: '0.74rem',
                              color: '#475569',
                              margin: '0 0 4px 0',
                              lineHeight: 1.35,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word'
                            }}>
                              {n.message}
                            </p>
                            <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} />
                              {new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                        Tidak ada notifikasi baru saat ini.
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div style={{
                    padding: '0.65rem 1rem',
                    background: '#f8fafc',
                    borderTop: '1px solid #f1f5f9',
                    textAlign: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifDropdown(false);
                        if (onOpenQueue) onOpenQueue();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#007a78',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Buka Semua Antrean Audit Kasus
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* User Profile Badge */}
        {currentUser ? (
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
        ) : (
          <button
            className="btn-pill-primary"
            onClick={onLogout}
            style={{ padding: '0.55rem 1.3rem', fontSize: '0.85rem' }}
          >
            Masuk / Login
          </button>
        )}

        {/* Logout Button */}
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
