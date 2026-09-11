import React from 'react';

export function DoctorAvatar1() {
  return (
    <svg viewBox="0 0 160 160" style={{ width: '110px', height: '110px', display: 'block' }}>
      <ellipse cx="80" cy="65" rx="35" ry="35" fill="#1e293b" />
      <circle cx="55" cy="70" r="14" fill="#1e293b" />
      <circle cx="105" cy="70" r="14" fill="#1e293b" />
      {/* Body */}
      <path d="M 40 140 C 40 105, 120 105, 120 140 Z" fill="#ffffff" />
      <polygon points="68,105 92,105 80,135" fill="#10b981" />
      {/* Face */}
      <circle cx="80" cy="70" r="24" fill="#a16207" />
      {/* Glasses */}
      <circle cx="72" cy="68" r="6" fill="none" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="88" cy="68" r="6" fill="none" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="78" y1="68" x2="82" y2="68" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M 74 79 Q 80 84 86 79" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
      {/* Stethoscope */}
      <path d="M 60 112 C 60 135, 100 135, 100 112" fill="none" stroke="#007a78" strokeWidth="2.5" />
    </svg>
  );
}

export function DoctorAvatar2() {
  return (
    <svg viewBox="0 0 160 160" style={{ width: '110px', height: '110px', display: 'block' }}>
      <path d="M 50 60 C 50 35, 110 35, 110 60 C 112 68, 108 72, 108 72 C 104 55, 56 55, 52 72 Z" fill="#92400e" />
      {/* Body */}
      <path d="M 38 140 C 38 105, 122 105, 122 140 Z" fill="#ffffff" />
      <polygon points="70,105 90,105 80,135" fill="#f8fafc" />
      <polygon points="76,112 84,112 86,138 80,143 74,138" fill="#005f5d" />
      {/* Face */}
      <circle cx="80" cy="65" r="23" fill="#fed7aa" />
      <circle cx="73" cy="64" r="2.5" fill="#1e293b" />
      <circle cx="87" cy="64" r="2.5" fill="#1e293b" />
      <path d="M 74 74 Q 80 79 86 74" fill="none" stroke="#9a3412" strokeWidth="1.8" strokeLinecap="round" />
      {/* Stethoscope */}
      <path d="M 58 112 C 58 135, 102 135, 102 112" fill="none" stroke="#007a78" strokeWidth="2.5" />
    </svg>
  );
}

export function DoctorAvatar3() {
  return (
    <svg viewBox="0 0 160 160" style={{ width: '110px', height: '110px', display: 'block' }}>
      <ellipse cx="80" cy="55" rx="30" ry="22" fill="#475569" />
      {/* Body */}
      <path d="M 40 140 C 40 105, 120 105, 120 140 Z" fill="#ffffff" />
      <polygon points="68,105 92,105 80,135" fill="#10b981" />
      {/* Face */}
      <circle cx="80" cy="66" r="23" fill="#ffedd5" />
      <circle cx="72" cy="65" r="6" fill="none" stroke="#334155" strokeWidth="1.5" />
      <circle cx="88" cy="65" r="6" fill="none" stroke="#334155" strokeWidth="1.5" />
      <line x1="78" y1="65" x2="82" y2="65" stroke="#334155" strokeWidth="1.5" />
      <path d="M 75 76 Q 80 80 85 76" fill="none" stroke="#9a3412" strokeWidth="1.8" strokeLinecap="round" />
      {/* Stethoscope */}
      <path d="M 60 112 C 60 135, 100 135, 100 112" fill="none" stroke="#005f5d" strokeWidth="2.5" />
    </svg>
  );
}
