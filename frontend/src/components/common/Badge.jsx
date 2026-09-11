import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatPriority, formatCaseStatus } from '../../utils/formatters';

export function StatusBadge({ status }) {
  const norm = (status || '').toUpperCase();
  if (norm === 'SUPPORTED' || norm === 'VALID' || norm === 'NOT_CONFIRMED') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: '#ecfdf5',
        color: '#059669',
        border: '1px solid #a7f3d0'
      }}>
        <CheckCircle2 size={13} />
        Terverifikasi Lengkap
      </span>
    );
  }
  if (norm === 'PARTIAL' || norm === 'PARTIAL_SUPPORT' || norm === 'NEEDS_MORE_EVIDENCE') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: '#fffbeb',
        color: '#d97706',
        border: '1px solid #fde68a'
      }}>
        <AlertTriangle size={13} />
        Perlu Konfirmasi Berkas
      </span>
    );
  }
  if (norm === 'UNSUPPORTED' || norm === 'PHANTOM_BILLING' || norm === 'CONFIRMED') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: '#fff1f2',
        color: '#e11d48',
        border: '1px solid #fecdd3'
      }}>
        <XCircle size={13} />
        Tanpa Bukti Fisik
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      background: '#f1f5f9',
      color: '#64748b',
      border: '1px solid #cbd5e1'
    }}>
      <HelpCircle size={13} />
      Belum Ada Berkas
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const norm = (priority || '').toUpperCase();
  if (norm === 'HIGH') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: '0.02em',
        background: '#fff1f2',
        color: '#e11d48',
        border: '1px solid #fecdd3',
        boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)'
      }}>
        <ShieldAlert size={13} />
        Prioritas Tinggi
      </span>
    );
  }
  if (norm === 'MEDIUM') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: '0.02em',
        background: '#fef3c7',
        color: '#b45309',
        border: '1px solid #fde68a'
      }}>
        <AlertTriangle size={13} />
        Prioritas Sedang
      </span>
    );
  }
  if (norm === 'LOW') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: '0.02em',
        background: '#ecfdf5',
        color: '#059669',
        border: '1px solid #a7f3d0'
      }}>
        <CheckCircle2 size={13} />
        Prioritas Rendah
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 800,
      letterSpacing: '0.02em',
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0'
    }}>
      <HelpCircle size={13} />
      Belum Ada Kesimpulan
    </span>
  );
}

export function CaseStatusPill({ status }) {
  const label = formatCaseStatus(status);
  const norm = (status || '').toUpperCase();
  let bg = '#f1f5f9';
  let color = '#475569';
  let border = '#cbd5e1';

  if (norm === 'CONFIRMED') {
    bg = '#fff1f2';
    color = '#e11d48';
    border = '#fecdd3';
  } else if (norm === 'NOT_CONFIRMED') {
    bg = '#ecfdf5';
    color = '#059669';
    border = '#a7f3d0';
  } else if (norm === 'IN_REVIEW') {
    bg = '#fef3c7';
    color = '#b45309';
    border = '#fde68a';
  } else if (norm === 'OPEN' || norm === 'NEW') {
    bg = '#e6f6f5';
    color = '#007a78';
    border = '#b2dfdb';
  }

  return (
    <span style={{
      fontSize: '0.75rem',
      fontWeight: 800,
      padding: '4px 12px',
      borderRadius: '9999px',
      background: bg,
      color: color,
      border: `1px solid ${border}`,
      letterSpacing: '0.02em'
    }}>
      Status: {label}
    </span>
  );
}
