import React from 'react';
import { motion } from 'framer-motion';
export default function MedcareFieldVerificationCard({schedules=[],onSelectCase}) {
  return <motion.div className="med-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
    <div className="med-card-header"><h3 className="med-card-title">Jadwal Klarifikasi</h3></div>
    {schedules.length?schedules.map(s=><button className="med-btn-treatment" key={s.id} onClick={()=>onSelectCase?.(s.case_id)} style={{textAlign:'left',marginBottom:8,whiteSpace:'normal'}}><span>{s.payload.title || 'Klarifikasi'}<small style={{display:'block',fontWeight:400}}>{s.payload.date} {s.payload.time} · {s.case_id}</small></span></button>):<p style={{color:'var(--mc-text-muted)',fontSize:'.85rem',lineHeight:1.6}}>Belum ada jadwal klarifikasi tersimpan. Buat jadwal dari halaman detail kasus.</p>}
    <p style={{color:'var(--mc-text-muted)',fontSize:'.74rem'}}>Catatan jadwal internal. Undangan dan pelacakan lokasi belum terhubung.</p>
  </motion.div>;
}
