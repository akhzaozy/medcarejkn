import React from 'react';

export default function HeroDoctorArt() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '460px', margin: '0 auto', height: '430px' }}>
      {/* Background Smooth Cyan Circle Backdrop */}
      <div
        style={{
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #007a78 0%, #10b981 60%, #6ee7b7 100%)',
          position: 'absolute',
          top: '25px',
          right: '20px',
          zIndex: 1,
          boxShadow: '0 20px 45px rgba(14, 165, 233, 0.28)'
        }}
      />

      {/* Floating Stethoscope Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '15px',
          zIndex: 10,
          background: '#ffffff',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.25)',
          border: '3px solid #e6f6f5'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007a78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      </div>

      {/* Floating Heart / Pulse Badge */}
      <div
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          zIndex: 10,
          background: '#007a78',
          borderRadius: '16px',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.35)',
          border: '3px solid #ffffff'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5v14" />
        </svg>
      </div>

      {/* High-Resolution Transparent Doctor Image */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}
      >
        <img
          src="/images/doctor_hd_transparent.png"
          alt="Healthcare Specialist Doctor"
          style={{
            maxHeight: '410px',
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 15px 25px rgba(14, 165, 233, 0.25))'
          }}
          onError={(e) => {
            // fallback to male doctor photo if needed
            e.target.src = '/images/doctor_male.jpg';
          }}
        />
      </div>
    </div>
  );
}
