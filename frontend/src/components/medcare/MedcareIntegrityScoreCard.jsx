import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';

export default function MedcareIntegrityScoreCard({ data = {} }) {
  const score=data.evidenceCoverage;
  const pct=n=>data.caseCount?Math.round(n/data.caseCount*100):0;
  const auditMeters=[
    {label:'Kasus dengan ketercakupan bukti tercatat',percent:pct(data.measuredCases ?? 0),tag:`${data.measuredCases ?? 0} kasus`,color:'#007a78'},
    {label:'Kasus telah ditelaah',percent:pct(data.completedReview ?? 0),tag:`${data.completedReview ?? 0} kasus`,color:'#005f5d'},
    {label:'Kasus belum didisposisi',percent:pct(data.unassigned ?? 0),tag:`${data.unassigned ?? 0} kasus`,color:'#0d9488'}
  ];

  return (
    <motion.div
      className="med-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="med-card-header">
        <div className="med-card-title-group">
          <div className="med-card-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3 className="med-card-title">Ketercakupan Bukti</h3>
        </div>


      </div>

      {/* Main Score Row */}
      <div className="med-score-row">
        <div>
          <div className="med-score-big">
            {score == null ? '—' : `${Math.round(score)}%`}
          </div>
          <div className="med-score-pill"><span>Rata-rata kasus dengan data bukti</span></div>
        </div>

        {/* Right mini metrics */}
        <div className="med-score-cards-right">
          <div className="med-mini-metric-box">
            <div className="med-mini-val" style={{ color: '#007a78' }}>{data.measuredCases ?? 0}</div>
            <div className="med-mini-lbl">Kasus Terukur</div>
          </div>
          <div className="med-mini-metric-box">
            <div className="med-mini-val" style={{ color: '#005f5d' }}>{data.completedReview ?? 0}</div>
            <div className="med-mini-lbl">Kasus Dituntaskan</div>
          </div>
        </div>
      </div>

      {/* Natural Clinical Audit Reconciliation Meters */}
      <div className="med-audit-meters">
        {auditMeters.map((m) => (
          <div key={m.label} className="med-audit-meter-row">
            <div className="med-meter-header">
              <span className="med-meter-label">{m.label}</span>
              <div className="med-meter-stat">
                <span className="med-meter-percent">{m.percent}%</span>
                <span className="med-meter-tag">{m.tag}</span>
              </div>
            </div>
            <div className="med-meter-track">
              <div
                className="med-meter-fill"
                style={{
                  width: `${m.percent}%`,
                  background: m.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
