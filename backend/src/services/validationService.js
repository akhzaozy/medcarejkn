import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {catalog} from '../../../shared/riskEngine.js';
import pool from '../config/db.js';
export async function reviewerFeedback(){
  const rows=(await pool.query("SELECT DISTINCT ON(case_id) case_id,outcome,reviewed_at FROM review_outcomes WHERE outcome IN ('CONFIRMED','NOT_CONFIRMED','FALSE_POSITIVE') ORDER BY case_id,reviewed_at DESC")).rows;
  const scores=(await pool.query('SELECT case_id,initial_analysis,engine_version FROM cases')).rows;
  const withScore=rows.map(row=>({...row,score:(()=>{const snapshot=scores.find(c=>c.case_id===row.case_id)?.initial_analysis;return snapshot?.baselineSource==='migration_snapshot'&&new Date(row.reviewed_at)<new Date(snapshot.capturedAt)?null:snapshot?.riskScore??null;})()}));
  const data=withScore.filter(r=>r.score!==null).sort((a,b)=>b.score-a.score||a.case_id.localeCompare(b.case_id));
  return {label:'Dihitung dari keputusan reviewer di lingkungan demo. Bukan validasi eksternal.',reviewedCases:rows.length,excludedWithoutSnapshot:withScore.filter(r=>r.score===null).length,precisionAtK:data.length?data.slice(0,20).filter(r=>r.outcome==='CONFIRMED').length/Math.min(20,data.length):null,bands:[0,20,40,60,80].map(min=>{const group=data.filter(r=>r.score>=min&&(min===80?r.score<=100:r.score<min+20));return {min,max:min+20,total:group.length,confirmedRate:group.length?group.filter(r=>r.outcome==='CONFIRMED').length/group.length:null};}),reportedSuggestions:Number((await pool.query('SELECT COUNT(*) n FROM ai_feedback')).rows[0].n)};
}
export async function getValidationBenchmark(){const file=fileURLToPath(new URL('../../../data/benchmark/validation_report.json',import.meta.url));let report;try{report=JSON.parse(fs.readFileSync(file,'utf8'));}catch{const e=new Error('Benchmark belum tersedia. Jalankan skrip evaluasi.');e.statusCode=503;throw e;}
  const activeHash=createHash('sha256').update(JSON.stringify(catalog)).digest('hex');
  if(report.ruleConfigHash!==activeHash){const e=new Error('Konfigurasi aturan berubah. Jalankan ulang evaluasi sebelum menampilkan metrik.');e.statusCode=503;throw e;}
  const feedback=await reviewerFeedback();return {...report,rules:catalog,feedback,configurationLogCount:Number((await pool.query('SELECT COUNT(*) n FROM rule_config_log')).rows[0].n),limitations:['Belum ada model ML terlatih atau validasi eksternal.','Tidak digunakan untuk menolak klaim otomatis atau menilai individu dokter/faskes.','Belum ada analitik jaringan: data relasi penyedia–rujukan–billing belum tervalidasi.']};
}
