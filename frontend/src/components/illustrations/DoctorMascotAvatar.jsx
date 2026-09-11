import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Doctor Running & Hiding Behind Door
 * - Solid, cohesive chibi doctor anatomy (solid neck, collar, coat, legs - no floating head!).
 * - Normal: Stands proudly in doorway, blinks naturally, glances down on username focus.
 * - Typing Password: Dashes inside/behind the clinic door, and the door SLAMS SHUT!
 * - Show Password (Peek): Door creaks open, Doctor peeks his head & shoulder out holding the door!
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
      setTimeout(() => setIsBlinking(false), 160);
    }, 3600);
    return () => clearInterval(interval);
  }, [isPasswordFocused]);

  const isHiding = isPasswordFocused && !showPassword;
  const isPeeking = isPasswordFocused && showPassword;

  return (
    <div style={{
      width: '145px',
      height: '145px',
      margin: '0 auto 0.6rem auto',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none'
    }}>
      <svg
        viewBox="0 0 220 200"
        width="100%"
        height="100%"
        style={{ overflow: 'hidden', borderRadius: '50%' }}
      >
        <defs>
          {/* Circular Clip for Scene */}
          <clipPath id="doorSceneClip">
            <circle cx="110" cy="100" r="96" />
          </clipPath>

          {/* Wall / Room Background */}
          <radialGradient id="clinicWallGrad" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#f0faf9" />
            <stop offset="70%" stopColor="#d5f2ef" />
            <stop offset="100%" stopColor="#b6e8e4" />
          </radialGradient>

          {/* Floor Gradient */}
          <linearGradient id="clinicFloorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Doctor Skin */}
          <linearGradient id="docSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fba979" />
          </linearGradient>

          {/* Lab Coat */}
          <linearGradient id="docCoat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Modern Teal Door Gradient */}
          <linearGradient id="tealDoorGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#005f5d" />
            <stop offset="50%" stopColor="#007a78" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>

          {/* Drop Shadow */}
          <filter id="sceneShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#003533" floodOpacity="0.18" />
          </filter>
        </defs>

        <g clipPath="url(#doorSceneClip)">
          {/* 1. ROOM BACKGROUND */}
          <rect width="220" height="200" fill="url(#clinicWallGrad)" />

          {/* Clinic Room Flooring */}
          <rect x="0" y="165" width="220" height="35" fill="url(#clinicFloorGrad)" />
          {/* Baseboard trim */}
          <line x1="0" y1="165" x2="220" y2="165" stroke="#007a78" strokeWidth="2.5" opacity="0.4" />

          {/* Background Wall Certificate / Hospital Plaque */}
          <g opacity="0.45">
            <rect x="24" y="44" width="28" height="36" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="30" y="50" width="16" height="4" rx="1" fill="#007a78" />
            <line x1="30" y1="60" x2="46" y2="60" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="30" y1="66" x2="43" y2="66" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="38" cy="72" r="2.5" fill="#f59e0b" />
          </g>

          {/* 2. DOORWAY OPENING */}
          {/* Door Frame Architrave */}
          <rect x="76" y="24" width="112" height="142" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          {/* Inner Room Darkness */}
          <rect x="83" y="31" width="98" height="134" rx="2" fill="#081e20" />

          {/* ================= 3. DOCTOR CHARACTER (FULL COHESIVE BODY) ================= */}
          <motion.g
            initial={false}
            animate={
              isHiding
                ? { x: -65, y: 0, opacity: 0 } // Runs inside behind the closed door!
                : isPeeking
                ? { x: -26, y: 2, opacity: 1 }  // Peeks head & shoulder around door frame!
                : {
                    x: 0,
                    y: isUsernameFocused ? 3 : 0,
                    opacity: 1
                  }
            }
            transition={{
              type: 'spring',
              stiffness: isHiding ? 400 : 280,
              damping: isHiding ? 20 : 24
            }}
            filter="url(#sceneShadow)"
          >
            {/* Run Dash Lines when running to hide */}
            {isHiding && (
              <g opacity="0.8">
                <line x1="165" y1="130" x2="190" y2="130" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="158" y1="145" x2="188" y2="145" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="166" y1="158" x2="182" y2="158" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {/* Doctor Trousers / Legs */}
            <rect x="122" y="156" width="9" height="12" rx="2" fill="#004d4b" />
            <rect x="133" y="156" width="9" height="12" rx="2" fill="#004d4b" />

            {/* Doctor Shoes */}
            <ellipse cx="126" cy="168" rx="7.5" ry="4" fill="#1e293b" />
            <ellipse cx="138" cy="168" rx="7.5" ry="4" fill="#1e293b" />

            {/* Lab Coat Body (Seamlessly connects from shoulders y:104 down to y:162) */}
            <path
              d="M 112 162 C 114 122 122 106 132 106 C 142 106 150 122 152 162 Z"
              fill="url(#docCoat)"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {/* Inner Teal Scrubs */}
            <polygon points="126,106 138,106 132,122" fill="#007a78" />

            {/* Coat Collar Lapels */}
            <path
              d="M 122 106 L 128 126 L 126 162"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <path
              d="M 142 106 L 136 126 L 138 162"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {/* Teal Stethoscope */}
            <path
              d="M 122 110 C 120 134 126 142 132 142 C 138 142 144 134 142 110"
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="132" cy="143" r="3.2" fill="#64748b" stroke="#007a78" strokeWidth="1.5" />
            <circle cx="132" cy="143" r="1.5" fill="#f8fafc" />

            {/* SOLID NECK (Overlaps head y:92-98 and torso y:104-108 -> ZERO GAP!) */}
            <rect
              x="126"
              y="92"
              width="12"
              height="16"
              rx="4"
              fill="url(#docSkin)"
            />

            {/* Arms & Hands */}
            {isPeeking ? (
              /* Peeking Hands firmly holding door edge */
              <g>
                {/* Left hand gripping door frame */}
                <ellipse cx="114" cy="116" rx="4.5" ry="5.5" fill="url(#docSkin)" stroke="#fba979" strokeWidth="1" />
                <ellipse cx="114" cy="128" rx="4.5" ry="5.5" fill="url(#docSkin)" stroke="#fba979" strokeWidth="1" />
              </g>
            ) : (
              /* Normal arms and hands */
              <g>
                {/* Left arm */}
                <path
                  d="M 114 112 Q 108 128 116 140"
                  fill="none"
                  stroke="url(#docCoat)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="116" cy="140" r="4" fill="url(#docSkin)" />

                {/* Right arm */}
                <path
                  d="M 150 112 Q 156 128 148 140"
                  fill="none"
                  stroke="url(#docCoat)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="148" cy="140" r="4" fill="url(#docSkin)" />
              </g>
            )}

            {/* ================= DOCTOR HEAD & FACE ================= */}
            <g>
              {/* Ears */}
              <circle cx="112" cy="80" r="5" fill="url(#docSkin)" />
              <circle cx="152" cy="80" r="5" fill="url(#docSkin)" />

              {/* Head Contour (cy: 78, ry: 21 -> reaches y: 99, perfectly covering neck top) */}
              <ellipse cx="132" cy="78" rx="22" ry="21" fill="url(#docSkin)" />

              {/* Hair Style */}
              <path
                d="M 110 76 C 109 56 119 48 132 48 C 145 48 155 56 154 76 C 150 66 143 62 138 62 C 132 62 128 66 123 66 C 117 66 113 62 110 76 Z"
                fill="#262f36"
              />

              {/* Doctor Cap with Teal Cross */}
              <rect x="121" y="42" width="22" height="11" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="130" y="44" width="4" height="7" rx="0.5" fill="#007a78" />
              <rect x="129" y="45" width="6" height="5" rx="0.5" fill="#007a78" />

              {/* Rosy Cheeks */}
              <ellipse cx="120" cy="86" rx="4" ry="2.5" fill="#f87171" opacity="0.4" />
              <ellipse cx="144" cy="86" rx="4" ry="2.5" fill="#f87171" opacity="0.4" />

              {/* Eyebrows */}
              <path
                d="M 119 69 Q 124 66 128 69"
                stroke="#334155"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 136 69 Q 140 66 145 69"
                stroke="#334155"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* EYES */}
              {isPeeking ? (
                /* Peeking: Left eye big & curious, Right eye shy */
                <g>
                  {/* Big Curious Eye */}
                  <ellipse cx="124" cy="76" rx="5.5" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                  <circle cx="124" cy="76" r="3.2" fill="#0f172a" />
                  <circle cx="123" cy="74.5" r="1.3" fill="#ffffff" />

                  {/* Right Eye */}
                  <ellipse cx="140" cy="76" rx="4.5" ry="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                  <circle cx="140" cy="76" r="2.6" fill="#0f172a" />
                  <circle cx="139" cy="75" r="1" fill="#ffffff" />
                </g>
              ) : isBlinking ? (
                /* Blink */
                <g>
                  <line x1="119" y1="76" x2="129" y2="76" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="135" y1="76" x2="145" y2="76" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              ) : (
                /* Normal Eyes (Glance down on username focus) */
                <g>
                  {/* Left Eye */}
                  <ellipse cx="124" cy="76" rx="4.8" ry="5.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                  <motion.circle
                    cx="124"
                    cy="76"
                    r="3"
                    fill="#0f172a"
                    animate={{
                      cy: isUsernameFocused ? 78 : 76,
                      cx: isUsernameFocused ? 125 : 124
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                  <circle cx="123" cy="74.5" r="1.2" fill="#ffffff" />

                  {/* Right Eye */}
                  <ellipse cx="140" cy="76" rx="4.8" ry="5.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                  <motion.circle
                    cx="140"
                    cy="76"
                    r="3"
                    fill="#0f172a"
                    animate={{
                      cy: isUsernameFocused ? 78 : 76,
                      cx: isUsernameFocused ? 141 : 140
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                  <circle cx="139" cy="74.5" r="1.2" fill="#ffffff" />
                </g>
              )}

              {/* Nose */}
              <circle cx="132" cy="82" r="1.3" fill="#fba979" />

              {/* Smiling Mouth */}
              <path
                d={isPeeking ? "M 129 88 Q 132 92 135 88" : "M 128 87 Q 132 91 136 87"}
                fill="none"
                stroke="#9a3412"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          </motion.g>

          {/* ================= 4. THE CLINIC DOOR ================= */}
          {/*
            Hinged on the left (x: 83)
            - Idle/Username: Door is wide open (scaleX: 0.12, x: 86)
            - Hiding (!showPassword): Door SLAMS SHUT (x: 0, scaleX: 1) completely hiding the room & doctor!
            - Peeking (showPassword): Door open a crack (x: 26, scaleX: 0.82)
          */}
          <motion.g
            initial={false}
            animate={
              isHiding
                ? { x: 0, scaleX: 1 }     // Fully Closed! Doctor is completely hidden!
                : isPeeking
                ? { x: 26, scaleX: 0.82 } // Door open a crack (Peeking)
                : { x: 86, scaleX: 0.12 } // Wide open (Doctor standing proudly)
            }
            transition={{
              type: 'spring',
              stiffness: isHiding ? 420 : 280,
              damping: isHiding ? 22 : 24
            }}
            style={{ transformOrigin: '83px 100px' }}
            filter="url(#sceneShadow)"
          >
            {/* The Door Leaf */}
            <rect
              x="83"
              y="31"
              width="98"
              height="134"
              rx="2"
              fill="url(#tealDoorGrad)"
              stroke="#004d4b"
              strokeWidth="2"
            />

            {/* Inset Door Paneling */}
            <rect x="91" y="39" width="82" height="52" rx="3" fill="#004d4b" opacity="0.35" />
            <rect x="91" y="100" width="82" height="56" rx="3" fill="#004d4b" opacity="0.35" />

            {/* Circular Glass Porthole Window with Medical Cross */}
            <circle cx="132" cy="65" r="16" fill="#a7f3d0" stroke="#ffffff" strokeWidth="2" opacity="0.85" />
            <rect x="130" y="55" width="4" height="20" rx="1" fill="#007a78" />
            <rect x="122" y="63" width="20" height="4" rx="1" fill="#007a78" />

            {/* Room Sign: "RUANG DOKTER DPJP" */}
            <rect x="104" y="106" width="56" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <text
              x="132"
              y="117"
              textAnchor="middle"
              fontSize="6"
              fontWeight="800"
              fill="#005f5d"
              letterSpacing="0.5"
            >
              RUANG DOKTER
            </text>

            {/* Status Privacy Light on Door */}
            <circle
              cx="132"
              cy="129"
              r="4"
              fill={isHiding ? "#ef4444" : "#10b981"}
              stroke="#ffffff"
              strokeWidth="1.2"
            />

            {/* Modern Brushed Metal Door Handle */}
            <rect x="92" y="94" width="6" height="18" rx="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
            <circle cx="95" cy="98" r="2.2" fill="#0f172a" />
          </motion.g>

          {/* Outer Ring Border */}
          <circle cx="110" cy="100" r="95" fill="none" stroke="#007a78" strokeWidth="2.5" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}
