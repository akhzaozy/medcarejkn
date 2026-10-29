import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { bpjsDirectory, catalog, tableDetail } from '../services/bpjsService.js';

import {bpjsPatterns} from '../services/bpjsAnomalyService.js';
import {requireSession,requireRole} from '../auth/session.js';
import pool from '../config/db.js';
import {randomUUID} from 'node:crypto';
const router = express.Router();
router.get('/anomalies',(req,res,next)=>{try{res.json({data:bpjsPatterns(req.query)});}catch(e){next(e);}});
router.post('/anomalies/cases',requireSession,requireRole('staff_jkn'),async(req,res,next)=>{let client;try{const report=bpjsPatterns({cohort:req.body.cohort,kind:req.body.kind});const signal=report.anomalies.find(s=>s.id===req.body.signalId);if(!signal)return res.status(404).json({message:'Pola sumber tidak ditemukan.'});client=await pool.connect();await client.query('BEGIN');const caseId='CASE-PAT-'+randomUUID().slice(0,20);const snapshot={engine:{type:'rule',version:'monthly-patterns-1.0.0'},scope:'aggregate',riskScore:null,signals:[signal]};await client.query("INSERT INTO cases(case_id,claim_id,primary_risk_mode,review_priority,case_status,source,risk_score,engine_type,engine_version,initial_analysis,analysis,metadata,case_type) VALUES($1,NULL,'PATTERN_REVIEW','MEDIUM','NEW','anomaly_explorer',NULL,'rule','monthly-patterns-1.0.0',$2,$2,$3,'pattern')",[caseId,JSON.stringify(snapshot),JSON.stringify({pattern:signal,scope:report.scope})]);await client.query("INSERT INTO audit_logs(case_id,actor_id,action,detail) VALUES($1,$2,'PATTERN_CASE_CREATED',$3)",[caseId,req.user.username,JSON.stringify(signal)]);await client.query('COMMIT');res.json({data:{caseId,source:'anomaly_explorer',caseType:'pattern'}});}catch(e){if(client)await client.query('ROLLBACK');next(e);}finally{client?.release();}});
router.get('/catalog', (req, res, next) => {
  try { res.json({ data: catalog() }); } catch (error) { next(error); }
});
router.get('/tables/:id', (req, res, next) => {
  try {
    const detail = tableDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Tabel BPJS tidak ditemukan.' });
    res.json({ data: detail });
  } catch (error) { next(error); }
});
router.get('/download/:type', (req, res, next) => {
  const names = { excel: 'BPJS_2025_Analisis.xlsx', full: 'BPJS_2025_Detail_Lengkap.zip' };
  const name = names[req.params.type];
  if (!name) return res.status(404).json({ error: 'Jenis unduhan tidak ditemukan.' });
  const filename = path.join(bpjsDirectory(), name);
  if (!fs.existsSync(filename)) return res.status(404).json({ error: 'File belum tersedia.' });
  res.download(filename, name, error => { if (error && !res.headersSent) next(error); });
});
export default router;
