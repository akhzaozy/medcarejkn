import React from 'react';

export default function CalendarArt() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '360px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
      <svg viewBox="0 0 340 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="calTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#005f5d" />
          </linearGradient>
          <linearGradient id="calBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="calBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#007a78" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <filter id="calShadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="16" stdDeviation="12" floodOpacity="0.22" floodColor="#005f5d" />
          </filter>
        </defs>

        {/* 3D Slanted Calendar */}
        <g filter="url(#calShadow)" transform="rotate(-5 170 160)">
          {/* Blue thick base / shadow layer */}
          <rect x="50" y="70" width="240" height="200" rx="24" fill="url(#calBase)" />

          {/* White calendar page face */}
          <rect x="50" y="55" width="240" height="200" rx="24" fill="url(#calBody)" stroke="#e2e8f0" strokeWidth="2" />

          {/* Top header bar */}
          <rect x="50" y="55" width="240" height="60" rx="24" fill="url(#calTop)" />
          {/* Square bottom corners of header */}
          <rect x="50" y="90" width="240" height="25" fill="url(#calTop)" />

          {/* Calendar Rings */}
          <rect x="90" y="42" width="16" height="28" rx="8" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />
          <rect x="234" y="42" width="16" height="28" rx="8" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />

          {/* Calendar Date Grid Squares */}
          <rect x="75" y="130" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="117" y="130" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="159" y="130" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="201" y="130" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="243" y="130" width="30" height="26" rx="6" fill="#005f5d" />

          <rect x="75" y="168" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="117" y="168" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="159" y="168" width="30" height="26" rx="6" fill="#10b981" />
          <rect x="201" y="168" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="243" y="168" width="30" height="26" rx="6" fill="#005f5d" />

          <rect x="75" y="206" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="117" y="206" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="159" y="206" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="201" y="206" width="30" height="26" rx="6" fill="#005f5d" />
          <rect x="243" y="206" width="30" height="26" rx="6" fill="#005f5d" />
        </g>
      </svg>
    </div>
  );
}
