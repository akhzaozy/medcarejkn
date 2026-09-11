import React, { useEffect, useState } from 'react';
import { fetchDashboard } from '../api/client';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { ShieldAlert, HelpCircle, FileCheck2, ArrowUpRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function DashboardPage({ onSelectCase, onNavigateToCases }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Memuat metrik dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--status-unsupported)' }}>
        Gagal memuat data dashboard. Pastikan backend aktif.
      </div>
    );
  }

  const dist = data.distribution || { SUPPORTED: 20, PARTIAL: 8, UNSUPPORTED: 8, UNAVAILABLE: 4 };
  const totalClaims = data.claimsAnalyzed || 40;

  return (
    <div>
      {/* Demo Focus Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          Decision Support Intelligence Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Triase awal dan pemeriksaan berbasis rekonsiliasi bukti klaim JKN terhadap catatan pelayanan faskes.
        </p>
      </div>

      {/* Mandatory Demo Case Shortcuts */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Mandatory Demo Test Cases
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>Sesuai PRD & Skenario Arsitektur</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Demo 1: CASE-0025 */}
          <div
            className="card"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid var(--prio-high)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => onSelectCase('CASE-0025')}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--prio-high)', fontSize: '1rem' }}>
                  CASE-0025
                </span>
                <span className="badge badge-prio-high">HIGH PRIORITY</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Indikasi Phantom Billing
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Klaim ada (10 unit), bukti tersedia, namun 0 unit pelayanan matched. Gap: 10, Coverage: 0%.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              <span>Buka Investigasi & Evidence Chain</span>
              <ArrowUpRight size={16} />
            </div>
          </div>

          {/* Demo 2: CASE-0033 */}
          <div
            className="card"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid var(--prio-no-conclusion)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => onSelectCase('CASE-0033')}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--prio-no-conclusion)', fontSize: '1rem' }}>
                  CASE-0033
                </span>
                <span className="badge badge-prio-no-conclusion">NO CONCLUSION</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Guardrail: Evidence Unavailable
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Evidence tidak tersedia. Guardrail aktif: <strong>UNAVAILABLE ≠ FRAUD</strong>. Sistem tidak menarik kesimpulan sepihak.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              <span>Periksa Guardrail Safety</span>
              <ArrowUpRight size={16} />
            </div>
          </div>

          {/* Demo 3: CASE-0037 */}
          <div
            className="card"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid var(--prio-medium)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => onSelectCase('CASE-0037')}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--prio-medium)', fontSize: '1rem' }}>
                  CASE-0037
                </span>
                <span className="badge badge-prio-medium">PATTERN REVIEW</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Pola Anomali Terdeteksi
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Pelayanan didukung penuh oleh evidence, namun pola utilisasi faskes memerlukan tinjauan kontekstual reviewer.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              <span>Analisis Pola Faskes</span>
              <ArrowUpRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpi">
        <div className="kpi-card" style={{ '--kpi-color': 'var(--accent-cyan)' }}>
          <div className="kpi-title">Claims Analyzed</div>
          <div className="kpi-value">{data.claimsAnalyzed}</div>
          <div className="kpi-subtext">Total klaim dalam dataset sintetis V4</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--prio-high)' }}>
          <div className="kpi-title">High Priority Cases</div>
          <div className="kpi-value" style={{ color: 'var(--prio-high)' }}>{data.highPriorityCases}</div>
          <div className="kpi-subtext">Indikasi Phantom Billing / Zero Match</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--prio-no-conclusion)' }}>
          <div className="kpi-title">No Conclusion (Unavailable)</div>
          <div className="kpi-value" style={{ color: 'var(--prio-no-conclusion)' }}>{data.noConclusionCases}</div>
          <div className="kpi-subtext">Evidence belum tersedia (Aman)</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--accent-blue)' }}>
          <div className="kpi-title">Total Active Cases</div>
          <div className="kpi-value">{data.caseCount}</div>
          <div className="kpi-subtext">Kasus terdaftar di antrean reviewer</div>
        </div>
      </div>

      {/* Evidence Reconciliation Distribution */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>
              Evidence Reconciliation Status Distribution
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Proporsi hasil rekonsiliasi antara item yang diajukan dengan rekam pelayanan
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--status-supported)' }}>● Supported: {dist.SUPPORTED}</span>
            <span style={{ color: 'var(--status-partial)' }}>● Partial: {dist.PARTIAL}</span>
            <span style={{ color: 'var(--status-unsupported)' }}>● Unsupported: {dist.UNSUPPORTED}</span>
            <span style={{ color: 'var(--status-unavailable)' }}>● Unavailable: {dist.UNAVAILABLE}</span>
          </div>
        </div>

        {/* Distribution Progress Bar */}
        <div style={{ height: '14px', width: '100%', display: 'flex', borderRadius: '7px', overflow: 'hidden', background: '#0a0e19', marginBottom: '1rem' }}>
          <div style={{ width: `${(dist.SUPPORTED / totalClaims) * 100}%`, background: 'var(--status-supported)' }} title={`Supported: ${dist.SUPPORTED}`} />
          <div style={{ width: `${(dist.PARTIAL / totalClaims) * 100}%`, background: 'var(--status-partial)' }} title={`Partial: ${dist.PARTIAL}`} />
          <div style={{ width: `${(dist.UNSUPPORTED / totalClaims) * 100}%`, background: 'var(--status-unsupported)' }} title={`Unsupported: ${dist.UNSUPPORTED}`} />
          <div style={{ width: `${(dist.UNAVAILABLE / totalClaims) * 100}%`, background: 'var(--status-unavailable)' }} title={`Unavailable: ${dist.UNAVAILABLE}`} />
        </div>

        {/* Guardrail Callout */}
        <div style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Info size={18} color="var(--accent-cyan)" />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Prinsip Guardrail Sistem:</strong> UNAVAILABLE ≠ UNSUPPORTED | UNSUPPORTED ≠ PROVEN FRAUD | RISK SIGNAL ≠ FINAL DECISION. Sistem membantu triase human reviewer, bukan memvonis secara otomatis.
          </div>
        </div>
      </div>

      {/* Top Priority Cases Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Priority Triaging Queue (Top 10)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Kasus dengan disparitas bukti tertinggi yang membutuhkan peninjauan awal
            </p>
          </div>
          <button
            className="nav-btn active"
            onClick={onNavigateToCases}
            style={{ fontSize: '0.8rem' }}
          >
            Buka Semua Kasus ({data.caseCount})
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Claim ID</th>
                <th>Fasilitas Kesehatan</th>
                <th>Risk Mode</th>
                <th>Priority</th>
                <th>Evidence Gap</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(data.topCases || []).map((c) => (
                <tr key={c.case_id}>
                  <td style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {c.case_id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.claim_id}</td>
                  <td>{c.provider_name}</td>
                  <td style={{ fontWeight: 600 }}>{c.primary_risk_mode}</td>
                  <td><PriorityBadge priority={c.review_priority} /></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {c.evidence_gap !== null ? `${c.evidence_gap} unit (${c.evidence_coverage_pct}%)` : '-'}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
                      {c.case_status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => onSelectCase(c.case_id)}
                    >
                      Investigasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
