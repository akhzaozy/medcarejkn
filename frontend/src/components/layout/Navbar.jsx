import React, { useState } from 'react';
import { Shield, Activity, RefreshCw, Layers, ClipboardList } from 'lucide-react';
import { triggerAnalysis } from '../../api/client';

export default function Navbar({ activeTab, setActiveTab, onAnalysisCompleted }) {
  const [running, setRunning] = useState(false);

  const handleRunAnalysis = async () => {
    try {
      setRunning(true);
      await triggerAnalysis();
      if (onAnalysisCompleted) onAnalysisCompleted();
    } catch (err) {
      console.error(err);
      alert('Gagal menjalankan engine analysis');
    } finally {
      setRunning(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Shield size={20} />
        </div>
        <div>
          <div className="brand-title">
            JKN Integrity Intelligence
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', borderRadius: '4px' }}>
              MVP: Phantom Billing
            </span>
          </div>
          <div className="brand-tagline">
            Detect the Gap. Trace the Evidence. Guide the Review.
          </div>
        </div>
      </div>

      <nav className="header-nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Activity size={16} />
          Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          <ClipboardList size={16} />
          Investigation Queue
        </button>
      </nav>

      <div className="header-actions">
        <div className="demo-disclaimer" title="Data disimulasikan sesuai format proposal & PRD">
          <Layers size={13} />
          <span>SYNTHETIC V4 (NON-PROD)</span>
        </div>

        <button
          className="btn-primary"
          onClick={handleRunAnalysis}
          disabled={running}
          style={{ opacity: running ? 0.7 : 1 }}
        >
          <RefreshCw size={14} className={running ? 'spin-anim' : ''} />
          {running ? 'Evaluating...' : 'Run Decision Engine'}
        </button>
      </div>
    </header>
  );
}
