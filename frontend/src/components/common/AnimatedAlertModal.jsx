import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';

/**
 * Animated Alert Popup / Modal Component
 * Modern glassmorphic alert with bouncing spring physics, pulsing glowing rings,
 * and high-impact visual feedback.
 */
export default function AnimatedAlertModal({
  isOpen = false,
  onClose,
  type = 'error', // 'error' | 'warning' | 'success' | 'info'
  title = 'Terjadi Kesalahan',
  message = 'Permintaan tidak dapat diproses saat ini.',
  details = null,
  primaryAction = null,
  secondaryAction = null
}) {
  if (!isOpen) return null;

  const configMap = {
    error: {
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.25)',
      borderColor: 'rgba(239, 68, 68, 0.35)',
      badgeBg: 'rgba(239, 68, 68, 0.12)',
      badgeText: '#dc2626',
      badgeLabel: 'KONEKSI / KREDENSIAL',
      icon: ShieldAlert
    },
    warning: {
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.25)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeText: '#d97706',
      badgeLabel: 'PERINGATAN SISTEM',
      icon: AlertTriangle
    },
    success: {
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.25)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      badgeText: '#059669',
      badgeLabel: 'BERHASIL',
      icon: CheckCircle2
    },
    info: {
      color: '#007a78',
      bgGlow: 'rgba(0, 122, 120, 0.25)',
      borderColor: 'rgba(0, 122, 120, 0.35)',
      badgeBg: 'rgba(0, 122, 120, 0.12)',
      badgeText: '#007a78',
      badgeLabel: 'INFORMASI MEDIS',
      icon: Info
    }
  };

  const current = configMap[type] || configMap.error;
  const IconComponent = current.icon;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        fontFamily: "'Figtree', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        {/* Backdrop with Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.72) 0%, rgba(3, 7, 18, 0.88) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 16 }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 26
          }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            background: '#ffffff',
            borderRadius: '26px',
            overflow: 'hidden',
            boxShadow: `0 25px 60px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px ${current.borderColor}, 0 0 40px -10px ${current.bgGlow}`,
            padding: '2.25rem 2rem 1.85rem 2rem',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          {/* Close X Button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.1rem',
                right: '1.1rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              <X size={16} />
            </button>
          )}

          {/* Glowing Animated Icon Centerpiece */}
          <div style={{
            position: 'relative',
            width: '76px',
            height: '76px',
            margin: '0 auto 1.25rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Pulsing Outer Glow Ring */}
            <motion.div
              animate={{
                scale: [1, 1.35, 1],
                opacity: [0.55, 0, 0.55]
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: current.bgGlow,
                filter: 'blur(4px)'
              }}
            />

            {/* Inner Ring */}
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${current.badgeBg} 0%, rgba(255, 255, 255, 0.9) 100%)`,
              border: `2px solid ${current.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px -4px ${current.bgGlow}`
            }}>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 18, delay: 0.1 }}
              >
                <IconComponent size={34} color={current.color} strokeWidth={2.4} />
              </motion.div>
            </div>
          </div>

          {/* Badge Label */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: current.badgeBg,
            color: current.badgeText,
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: current.color
            }} />
            {current.badgeLabel}
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            margin: '0 0 0.5rem 0'
          }}>
            {title}
          </h3>

          {/* Message */}
          <p style={{
            fontSize: '0.86rem',
            lineHeight: 1.5,
            color: '#64748b',
            margin: '0 0 1rem 0'
          }}>
            {message}
          </p>

          {/* Detail / Error Snippet box if provided */}
          {details && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.78rem',
              color: '#475569',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              textAlign: 'left',
              wordBreak: 'break-word',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: current.color, fontWeight: 700 }}>Kode:</span>
              <span>{details}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            marginTop: '0.5rem'
          }}>
            {primaryAction && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={primaryAction.onClick}
                style={{
                  width: '100%',
                  background: type === 'error'
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #007a78 0%, #005f5d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.82rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 8px 20px -4px ${current.bgGlow}`
                }}
              >
                <span>{primaryAction.label}</span>
                <ArrowRight size={16} />
              </motion.button>
            )}

            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
