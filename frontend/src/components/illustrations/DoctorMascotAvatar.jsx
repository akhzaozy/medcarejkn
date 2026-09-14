import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Super Cool Interactive Doctor Avatar:
 * 1. IDLE: Natural gentle breathing, periodic blinking, friendly clinical smile.
 * 2. USERNAME FOCUSED: Eyes look down attentively toward username input.
 * 3. PASSWORD FOCUSED (Hidden): Doctor brings up hands in white sleeves to cover eyes completely (Privacy Mode)!
 * 4. PASSWORD PEEK (Show Password): Doctor peeks through fingers with one eye winking and a cheeky smile!
 */
export default function DoctorMascotAvatar({
  isPasswordFocused = false,
  showPassword = false,
  isUsernameFocused = false
}) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Natural blinking effect when idle
  useEffect(() => {
    if (isPasswordFocused) return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPasswordFocused]);

  const isCoveringEyes = isPasswordFocused && !showPassword;
  const isPeeking = isPasswordFocused && showPassword;

  return (
    <div style={{
      width: '120px',
      height: '120px',
      margin: '0 auto 0.75rem auto',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none'
    }}>
      {/* Outer Glowing Teal Ring */}
      <div style={{
        position: 'absolute',
        inset: '-4px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(0, 122, 120, 0.35) 0%, rgba(14, 165, 233, 0.25) 100%)',
        filter: 'blur(6px)',
        zIndex: 0
      }} />

      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        style={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          borderRadius: '50%',
          border: '2px solid rgba(0, 122, 120, 0.35)',
          boxShadow: '0 8px 24px -4px rgba(0, 122, 120, 0.22)'
        }}
      >
        <defs>
          <clipPath id="avatarCircleClip">
            <circle cx="100" cy="100" r="98" />
          </clipPath>

          {/* Clinical Room Radial Gradient Background */}
          <radialGradient id="portalBg" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#f0fdfa" />
            <stop offset="60%" stopColor="#ccfbf1" />
            <stop offset="100%" stopColor="#99f6e4" />
          </radialGradient>

          {/* Skin Tone Gradient */}
          <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffdfba" />
            <stop offset="100%" stopColor="#f7ba8a" />
          </linearGradient>

          {/* Coat Gradient */}
          <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Stethoscope Gradient */}
          <linearGradient id="stethoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#005f5d" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        <g clipPath="url(#avatarCircleClip)">
          {/* Background Portal */}
          <rect width="200" height="200" fill="url(#portalBg)" />

          {/* ================= DOCTOR BODY (BREATHING ANIMATION) ================= */}
          <motion.g
            animate={
              isCoveringEyes
                ? { y: 3, scale: 0.98 }
                : isPeeking
                ? { y: 1, rotate: -2 }
                : isUsernameFocused
                ? { y: 2, scale: 1.01 }
                : { y: [0, -1.5, 0] }
            }
            transition={
              isCoveringEyes || isPeeking || isUsernameFocused
                ? { type: 'spring', stiffness: 320, damping: 22 }
                : { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
            }
          >
            {/* Shoulders & White Lab Coat */}
            <path
              d="M 52 195 C 54 148 72 134 100 134 C 128 134 146 148 148 195 Z"
              fill="url(#coatGrad)"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Inner Teal Scrubs */}
            <polygon points="86,134 114,134 100,154" fill="#007a78" />

            {/* Coat Lapels */}
            <path d="M 82 134 L 92 160 L 88 195" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <path d="M 118 134 L 108 160 L 112 195" fill="none" stroke="#cbd5e1" strokeWidth="2" />

            {/* Stethoscope around neck */}
            <path
              d="M 80 138 C 76 166 86 178 100 178 C 114 178 124 166 120 138"
              fill="none"
              stroke="url(#stethoGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Stethoscope Chest Piece */}
            <circle cx="100" cy="180" r="5" fill="#64748b" stroke="#007a78" strokeWidth="2" />
            <circle cx="100" cy="180" r="2" fill="#ffffff" />

            {/* Solid Neck */}
            <rect x="91" y="112" width="18" height="24" rx="5" fill="url(#skinGrad)" />

            {/* ================= HEAD & FACE ================= */}
            <motion.g
              animate={
                isUsernameFocused
                  ? { y: 2, rotate: -1.5 }
                  : isCoveringEyes
                  ? { y: 3, rotate: 1 }
                  : { y: 0, rotate: 0 }
              }
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              {/* Ears */}
              <circle cx="68" cy="98" r="7" fill="url(#skinGrad)" />
              <circle cx="132" cy="98" r="7" fill="url(#skinGrad)" />

              {/* Head Contour */}
              <ellipse cx="100" cy="95" rx="30" ry="29" fill="url(#skinGrad)" />

              {/* Doctor Hair */}
              <path
                d="M 70 94 C 68 66 82 56 100 56 C 118 56 132 66 130 94 C 124 82 116 76 108 76 C 100 76 96 82 90 82 C 82 82 76 78 70 94 Z"
                fill="#1e293b"
              />

              {/* Doctor Head Mirror / Medical Cap Badge */}
              <rect x="88" y="50" width="24" height="12" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              <circle cx="100" cy="56" r="4" fill="#007a78" />
              <path d="M 98 56 L 102 56 M 100 54 L 100 58" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

              {/* Eyebrows */}
              <motion.path
                d={isCoveringEyes ? "M 80 84 Q 88 88 94 86" : "M 80 85 Q 88 80 94 84"}
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <motion.path
                d={
                  isPeeking
                    ? "M 106 82 Q 112 76 120 81" // Raised curious eyebrow when peeking!
                    : isCoveringEyes
                    ? "M 106 86 Q 112 88 120 84"
                    : "M 106 84 Q 112 80 120 85"
                }
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Glasses Frame (Modern Circular Doctor Glasses) */}
              <circle cx="86" cy="96" r="10" fill="none" stroke="#005f5d" strokeWidth="2" opacity="0.85" />
              <circle cx="114" cy="96" r="10" fill="none" stroke="#005f5d" strokeWidth="2" opacity="0.85" />
              <line x1="96" y1="96" x2="104" y2="96" stroke="#005f5d" strokeWidth="2" opacity="0.85" />

              {/* EYES (ANIMATED PUPILS & BLINKING) */}
              <g>
                {/* Left Eye */}
                <ellipse
                  cx="86"
                  cy={isUsernameFocused ? 97.5 : 96}
                  rx="3.5"
                  ry={isBlinking || isCoveringEyes ? 0.3 : 3.5}
                  fill="#0f172a"
                />
                {!isBlinking && !isCoveringEyes && (
                  <circle cx="85" cy={isUsernameFocused ? 96.5 : 95} r="1.2" fill="#ffffff" />
                )}

                {/* Right Eye */}
                <ellipse
                  cx="114"
                  cy={isUsernameFocused ? 97.5 : 96}
                  rx="3.5"
                  ry={
                    isPeeking
                      ? 3.8 // Peeking eye is wide awake & bright!
                      : isBlinking || isCoveringEyes
                      ? 0.3
                      : 3.5
                  }
                  fill="#0f172a"
                />
                {(!isBlinking || isPeeking) && !isCoveringEyes && (
                  <circle cx="113" cy={isUsernameFocused ? 96.5 : 95} r="1.2" fill="#ffffff" />
                )}
              </g>

              {/* Cute Nose */}
              <ellipse cx="100" cy="103" rx="2" ry="1.5" fill="#e89e70" />

              {/* Rosy Cheeks when Covering Eyes / Peeking */}
              {(isCoveringEyes || isPeeking) && (
                <g opacity="0.65">
                  <ellipse cx="76" cy="105" rx="5" ry="3.5" fill="#f43f5e" />
                  <ellipse cx="124" cy="105" rx="5" ry="3.5" fill="#f43f5e" />
                </g>
              )}

              {/* Mouth Expressions */}
              <motion.path
                d={
                  isPeeking
                    ? "M 93 112 Q 100 119 107 113" // Cheeky happy grin
                    : isCoveringEyes
                    ? "M 95 113 Q 100 111 105 113" // Shy privacy line
                    : "M 93 112 Q 100 117 107 112"  // Pleasant doctor smile
                }
                fill="none"
                stroke="#b91c1c"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </motion.g>

            {/* ================= HANDS COVERING EYES (PEEK-A-BOO ANIMATION) ================= */}
            {/* Left Hand: Covers Left Eye when Password Focused */}
            <motion.g
              initial={false}
              animate={
                isCoveringEyes || isPeeking
                  ? { y: 0, opacity: 1, scale: 1 }
                  : { y: 45, opacity: 0, scale: 0.8 }
              }
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 24
              }}
            >
              {/* White Sleeve Cuff */}
              <path d="M 60 148 L 74 120 L 88 126 L 76 156 Z" fill="url(#coatGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Left Hand / Palm over left eye */}
              <ellipse cx="84" cy="98" rx="9" ry="11" fill="url(#skinGrad)" stroke="#e89e70" strokeWidth="1.5" />
              {/* Fingers */}
              <line x1="79" y1="92" x2="81" y2="103" stroke="#e89e70" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="84" y1="90" x2="85" y2="104" stroke="#e89e70" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="89" y1="92" x2="89" y2="103" stroke="#e89e70" strokeWidth="1.2" strokeLinecap="round" />
            </motion.g>

            {/* Right Hand: Covers Right Eye or Peeks Down when Eye Toggle clicked */}
            <motion.g
              initial={false}
              animate={
                isPeeking
                  ? { y: 16, x: 6, rotate: 12, opacity: 1 } // Peeks down smoothly to reveal right eye!
                  : isCoveringEyes
                  ? { y: 0, x: 0, rotate: 0, opacity: 1 }   // Fully covers right eye!
                  : { y: 45, x: 0, opacity: 0 }             // Resting below
              }
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 24
              }}
            >
              {/* White Sleeve Cuff */}
              <path d="M 140 148 L 126 120 L 112 126 L 124 156 Z" fill="url(#coatGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Right Hand / Palm */}
              <ellipse cx="116" cy="98" rx="9" ry="11" fill="url(#skinGrad)" stroke="#e89e70" strokeWidth="1.5" />
              {/* Fingers */}
              <line x1="111" y1="92" x2="111" y2="103" stroke="#e89e70" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="116" y1="90" x2="115" y2="104" stroke="#e89e70" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="121" y1="92" x2="119" y2="103" stroke="#e89e70" strokeWidth="1.2" strokeLinecap="round" />
            </motion.g>

            {/* Sparkle effect when peeking */}
            {isPeeking && (
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <path
                  d="M 124 80 L 126 84 L 130 86 L 126 88 L 124 92 L 122 88 L 118 86 L 122 84 Z"
                  fill="#f59e0b"
                />
              </motion.g>
            )}
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
