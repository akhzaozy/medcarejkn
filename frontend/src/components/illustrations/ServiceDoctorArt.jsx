import React from 'react';
import { FileSearch, Pill, Stethoscope, Activity, ShieldCheck } from 'lucide-react';

export default function ServiceDoctorArt() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto', height: '460px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Tall Cyan Arch Background */}
      <div
        style={{
          position: 'absolute',
          width: '260px',
          height: '380px',
          borderRadius: '130px 130px 40px 40px',
          background: 'linear-gradient(180deg, #007a78 0%, #005f5d 100%)',
          boxShadow: '0 20px 40px rgba(14, 165, 233, 0.25)',
          zIndex: 1
        }}
      />

      {/* Floating Badge 1: Top Left - Rekam SIMRS */}
      <div
        style={{
          position: 'absolute',
          top: '35px',
          left: '0px',
          zIndex: 10,
          background: '#ffffff',
          borderRadius: '9999px',
          padding: '6px 14px',
          boxShadow: '0 8px 20px rgba(14, 165, 233, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #e6f6f5'
        }}
      >
        <div style={{ background: '#e6f6f5', borderRadius: '50%', padding: '6px', color: '#007a78' }}>
          <FileSearch size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>Rekam SIMRS</span>
      </div>

      {/* Floating Badge 2: Mid Left - Dispense Log */}
      <div
        style={{
          position: 'absolute',
          top: '160px',
          left: '-10px',
          zIndex: 10,
          background: '#ffffff',
          borderRadius: '9999px',
          padding: '6px 14px',
          boxShadow: '0 8px 20px rgba(14, 165, 233, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #e6f6f5'
        }}
      >
        <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: '6px', color: '#10b981' }}>
          <Pill size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>Dispense Obat</span>
      </div>

      {/* Floating Badge 3: Bottom Left - Tindakan Medis */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '10px',
          zIndex: 10,
          background: '#ffffff',
          borderRadius: '9999px',
          padding: '6px 14px',
          boxShadow: '0 8px 20px rgba(14, 165, 233, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #e6f6f5'
        }}
      >
        <div style={{ background: '#fef3c7', borderRadius: '50%', padding: '6px', color: '#f59e0b' }}>
          <Activity size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>Tindakan Medis</span>
      </div>

      {/* Floating Badge 4: Top Right - Evidence Match */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '5px',
          zIndex: 10,
          background: '#ffffff',
          borderRadius: '9999px',
          padding: '6px 14px',
          boxShadow: '0 8px 20px rgba(14, 165, 233, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #e6f6f5'
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>Evidence Match</span>
        <div style={{ background: '#e6f6f5', borderRadius: '50%', padding: '6px', color: '#007a78' }}>
          <ShieldCheck size={15} />
        </div>
      </div>

      {/* Floating Badge 5: Mid Right - Kesesuaian Bukti */}
      <div
        style={{
          position: 'absolute',
          bottom: '110px',
          right: '-5px',
          zIndex: 10,
          background: '#ffffff',
          borderRadius: '9999px',
          padding: '6px 14px',
          boxShadow: '0 8px 20px rgba(14, 165, 233, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #e6f6f5'
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>Kesesuaian Bukti</span>
        <div style={{ background: '#f0fdf4', borderRadius: '50%', padding: '6px', color: '#16a34a' }}>
          <Stethoscope size={15} />
        </div>
      </div>

      {/* Real Doctor Character Image inside the Arch */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '240px',
          height: '380px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '120px 120px 30px 30px'
        }}
      >
        <img
          src="/images/cartoon_doctor.png"
          alt="Clinical Intelligence Verificator"
          style={{
            maxHeight: '370px',
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))'
          }}
          onError={(e) => {
            e.target.src = '/images/female_doctor_hd.png';
          }}
        />
      </div>
    </div>
  );
}
