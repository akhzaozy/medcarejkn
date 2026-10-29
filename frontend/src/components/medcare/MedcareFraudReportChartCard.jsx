import React from 'react';
import { motion } from 'framer-motion';
export default function MedcareFraudReportChartCard({series=[]}) {
  const max=Math.max(1,...series.map(r=>r.count));
  return <motion.div className="med-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
    <div className="med-card-header"><h3 className="med-card-title">Kasus Masuk per Bulan</h3></div>
    <p style={{fontSize:'.75rem',color:'var(--mc-text-muted)'}}>Berdasarkan tanggal pencatatan kasus pada antrean akun Anda.</p>
    {series.length?<div className="med-week-bars" style={{height:180}}>{series.map(r=><div key={r.period} className="med-week-bar-col" title={`${r.period}: ${r.count} kasus, ${r.high} prioritas tinggi`}><span style={{fontSize:'.75rem'}}>{r.count}</span><div className="med-week-bar active" style={{height:`${Math.max(2,r.count/max*100)}%`,minHeight:2}}/><span className="med-week-day-label">{r.period.slice(2)}</span></div>)}</div>:<p style={{color:'var(--mc-text-muted)'}}>Belum ada data tren.</p>}
  </motion.div>;
}
