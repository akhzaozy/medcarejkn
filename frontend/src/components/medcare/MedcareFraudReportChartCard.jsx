import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';

export default function MedcareFraudReportChartCard() {
  const [activeTab, setActiveTab] = useState('Tren 6 Bulan');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const primaryPathRef = useRef(null);
  const secondaryPathRef = useRef(null);
  const areaPathRef = useRef(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

  const tabData = {
    'Tren 6 Bulan': {
      primary: [35, 42, 65, 58, 88, 76],
      secondary: [20, 28, 48, 62, 50, 85],
      primaryLabel: 'Klaim Tervalidasi',
      secondaryLabel: 'Deteksi Anomali',
      guidelineMonthIndex: 4 // Mei
    },
    'Kategori Risiko': {
      primary: [30, 48, 60, 65, 80, 92],
      secondary: [20, 30, 40, 50, 60, 70],
      primaryLabel: 'Phantom Billing',
      secondaryLabel: 'Upcoding',
      guidelineMonthIndex: 5 // Jun
    },
    'Benchmark 2026': {
      primary: [25, 40, 55, 70, 75, 82],
      secondary: [22, 35, 48, 55, 68, 74],
      primaryLabel: 'Target Integritas',
      secondaryLabel: 'Baseline Historis',
      guidelineMonthIndex: 3 // Apr
    }
  };

  const currentDataset = tabData[activeTab];

  const svgWidth = 500;
  const svgHeight = 170;
  const paddingX = 30;
  const paddingY = 20;

  const computeSmoothPath = (data) => {
    const minVal = 0;
    const maxVal = 100;
    const usableWidth = svgWidth - paddingX * 2;
    const usableHeight = svgHeight - paddingY * 2;
    const stepX = usableWidth / (data.length - 1);

    const points = data.map((val, i) => {
      const x = paddingX + i * stepX;
      const y = svgHeight - paddingY - (val / (maxVal - minVal)) * usableHeight;
      return { x, y, val };
    });

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const areaD = `${d} L ${points[points.length - 1].x},${svgHeight - paddingY} L ${points[0].x},${svgHeight - paddingY} Z`;

    return { lineD: d, areaD, points };
  };

  const primaryComputed = computeSmoothPath(currentDataset.primary);
  const secondaryComputed = computeSmoothPath(currentDataset.secondary);

  useEffect(() => {
    // Animate SVG path strokes drawing smoothly with Anime.js
    if (primaryPathRef.current) {
      const length = primaryPathRef.current.getTotalLength();
      primaryPathRef.current.style.strokeDasharray = length;
      primaryPathRef.current.style.strokeDashoffset = length;

      anime({
        targets: primaryPathRef.current,
        strokeDashoffset: [length, 0],
        easing: 'easeInOutCubic',
        duration: 1200
      });
    }

    if (secondaryPathRef.current) {
      const length = secondaryPathRef.current.getTotalLength();
      secondaryPathRef.current.style.strokeDasharray = length;
      secondaryPathRef.current.style.strokeDashoffset = length;

      anime({
        targets: secondaryPathRef.current,
        strokeDashoffset: [length, 0],
        easing: 'easeInOutCubic',
        duration: 1400,
        delay: 150
      });
    }

    if (areaPathRef.current) {
      anime({
        targets: areaPathRef.current,
        opacity: [0, 0.25],
        duration: 1000,
        easing: 'linear'
      });
    }
  }, [activeTab]);

  const guidelinePoint = primaryComputed.points[currentDataset.guidelineMonthIndex];

  return (
    <motion.div
      className="med-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="med-card-header">
        <div className="med-card-title-group">
          <div className="med-card-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h3 className="med-card-title">Laporan Tren Klaim &amp; Audit</h3>
        </div>

        {/* Tab Switcher */}
        <div className="med-chart-tabs" role="tablist">
          {['Tren 6 Bulan', 'Kategori Risiko', 'Benchmark 2026'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                className={`med-chart-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={isActive}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="med-chart-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="med-svg-chart"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="medChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007a78" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#007a78" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          {[0.25, 0.5, 0.75].map((pct, idx) => {
            const y = svgHeight - paddingY - pct * (svgHeight - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            );
          })}

          {/* Guideline */}
          {guidelinePoint && (
            <line
              x1={guidelinePoint.x}
              y1={paddingY}
              x2={guidelinePoint.x}
              y2={svgHeight - paddingY}
              className="med-chart-guideline"
            />
          )}

          {/* Area */}
          <path
            ref={areaPathRef}
            d={primaryComputed.areaD}
            fill="url(#medChartGradient)"
          />

          {/* Secondary Path (Slate Line) */}
          <path
            ref={secondaryPathRef}
            d={secondaryComputed.lineD}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Primary Path (Deep Teal Stroke) */}
          <path
            ref={primaryPathRef}
            d={primaryComputed.lineD}
            fill="none"
            stroke="#007a78"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Points */}
          {primaryComputed.points.map((pt, i) => {
            const isHovered = hoveredPoint === i;
            const isGuideline = i === currentDataset.guidelineMonthIndex;
            return (
              <g
                key={i}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered || isGuideline ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#007a78"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'r 0.2s ease, stroke-width 0.2s ease' }}
                />
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={9}
                    fill="rgba(0, 122, 120, 0.15)"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {hoveredPoint !== null && (
          <div
            style={{
              position: 'absolute',
              top: `${primaryComputed.points[hoveredPoint].y - 42}px`,
              left: `${(primaryComputed.points[hoveredPoint].x / svgWidth) * 100}%`,
              transform: 'translateX(-50%)',
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              whiteSpace: 'nowrap',
              zIndex: 10
            }}
          >
            {months[hoveredPoint]}: {currentDataset.primary[hoveredPoint]}% akurasi deteksi
          </div>
        )}
      </div>

      {/* Month Labels */}
      <div className="med-chart-x-labels">
        {months.map((m, idx) => (
          <span
            key={m}
            className="med-chart-x-label"
            style={{
              color: hoveredPoint === idx ? '#007a78' : undefined,
              fontWeight: hoveredPoint === idx ? 700 : 500
            }}
          >
            {m}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
