import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
dotenv.config({path:new URL('../../.env',import.meta.url)});

test('PRD: persistent core, idempotent migration, auth guards and resilient audit contract',async()=>{
  const database=`jkn_prd_test_${Date.now()}`;
  const admin=new pg.Client({host:process.env.DB_HOST||'localhost',port:process.env.DB_PORT||5432,user:process.env.DB_USER,database:'postgres',password:process.env.DB_PASSWORD||undefined});
  await admin.connect();await admin.query(`CREATE DATABASE "${database}"`);await admin.end();
  process.env.DB_NAME=database;
  const password=randomUUID();
  process.env.JKN_STAFF_PASSWORD_HASH=await bcrypt.hash(password,4);process.env.JKN_CLINICIAN_PASSWORD_HASH=await bcrypt.hash(password,4);
  const {default:pool}=await import('../src/config/db.js');
  const {migrate}=await import('../src/scripts/migrate.js');
  const {default:app}=await import('../src/app.js');
  const {auditCheckClaim}=await import('../src/controllers/claimController.js');
  const source=new URL('../../outputs/bpjs-2025/patient-index.json',import.meta.url);
  const before=fs.existsSync(source)?createHash('sha256').update(fs.readFileSync(source)).digest('hex'):null;
  const auditFile=new URL('../../outputs/bpjs-simulation/audit.sqlite',import.meta.url);
  function bpjsSnapshot(){if(!fs.existsSync(auditFile))return null;const db=new DatabaseSync(auditFile,{readOnly:true});try{return createHash('sha256').update(JSON.stringify({cases:db.prepare('SELECT * FROM cases ORDER BY id').all(),events:db.prepare('SELECT * FROM events ORDER BY id').all()})).digest('hex');}finally{db.close();}}
  const beforeAudits=bpjsSnapshot();
  let server;
  try{
    assert.equal((await migrate()).status,'migrated');assert.equal((await migrate()).status,'current');
    assert.equal(Number((await pool.query('SELECT COUNT(*) n FROM cases')).rows[0].n),8);
    assert.equal(bpjsSnapshot(),beforeAudits);
    if(before)assert.equal(createHash('sha256').update(fs.readFileSync(source)).digest('hex'),before);
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base=`http://127.0.0.1:${server.address().port}/api`;
    const tokens={};
    async function call(route,{user='staff.ahmad',body,method=body?'POST':'GET',token=tokens[user]}={}){const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
    for(const username of ['staff.ahmad','staff.adit','dr.anindya','dr.budi','dr.ratna']){const r=await call('/auth/login',{body:{username,password}});assert.equal(r.status,200);assert.equal(Object.hasOwn(r.body.data.user,'password'),false);assert.equal(Object.hasOwn(r.body.data.user,'password_hash'),false);tokens[username]=r.body.data.token;}
    assert.equal((await call('/auth/login',{body:{role:'staff_jkn'}})).status,401);
    assert.equal((await call('/cases',{token:''})).status,401);
    assert.equal((await call('/cases/CASE-PB-001/outcome',{body:{outcome:'CONFIRMED',notes:'Test'}})).status,403);
    const presets=[{evidenceAvailable:true,claimedQty:1,supportedQty:0},{diagnosisProcedureMatch:false,evidenceAvailable:true,claimedQty:1,supportedQty:1},{enrollmentValid:false,evidenceAvailable:false},{evidenceAvailable:true,claimedQty:1,supportedQty:1}];
    for(const preset of presets)for(const saveCase of [true,false]){const r=await call('/claims/audit-check',{body:{...preset,saveCase,amountBilled:0}});assert.equal(r.status,200);assert.ok(Array.isArray(r.body.analysis.reasons));assert.equal(typeof r.body.analysis.fraudType,'string');assert.equal(r.body.analysis.engine.type,'rule');assert.equal(r.body.save.status,saveCase?'saved':'not_requested');if(saveCase)assert.equal((await call('/cases/'+r.body.save.caseId)).status,200);}
    const original=pool.connect;
    pool.connect=async()=>{throw new Error('simulated database outage');};let fallback;
    try{await auditCheckClaim({body:{...presets[0],saveCase:true},user:{username:'staff.ahmad'}},{json:data=>{fallback=data;}},()=>{});}finally{pool.connect=original;}
    assert.equal(fallback.save.status,'failed');assert.equal(fallback.analysis.fraudType,'PHANTOM_BILLING');
    for(const user of Object.keys(tokens)){const dashboard=await call('/dashboard',{user}),queue=await call('/cases?limit=ALL',{user});assert.equal(dashboard.status,200);assert.equal(dashboard.body.data.caseCount,queue.body.total);assert.equal(dashboard.body.data.claimsAnalyzed,queue.body.data.filter(c=>c.claim_id).length);assert.ok(dashboard.body.data.monthly.length===6);}
    for(let i=1;i<=8;i++){const d=(await call(`/cases/CASE-PB-${String(i).padStart(3,'0')}`)).body.data;assert.ok(d.claimItems.length>0);assert.ok(d.initialAnalysis.engine.version);}
    const unassigned=await call('/cases?assignedTo=UNASSIGNED&limit=ALL');assert.ok(unassigned.body.data.every(c=>!c.assigned_to));
    for(const [user,ids]of [['dr.budi',['CASE-PB-003','CASE-PB-006']],['dr.ratna',['CASE-PB-004','CASE-PB-008']]]){const queue=await call('/cases?limit=ALL',{user});assert.ok(ids.every(id=>queue.body.data.some(c=>c.case_id===id)));}
    assert.equal((await call('/cases/CASE-PB-001/outcome',{user:'dr.budi',body:{outcome:'CONFIRMED',notes:'Wrong reviewer'}})).status,403);
    for(const body of [{claimedQty:0},{claimedQty:1,supportedQty:2},{amountBilled:-1},{dateEncounter:'2026-02-30'}])assert.equal((await call('/claims/audit-check',{body})).status,400);
    const manual=await call('/claims/audit-check',{user:'dr.anindya',body:{saveCase:true,evidenceAvailable:true,claimedQty:1,supportedQty:0}});assert.equal(manual.body.save.status,'saved');const manualId=manual.body.save.caseId;
    const start=(await call('/cases/'+manualId)).body.data;assert.equal(start.riskAnalysis.riskScore,65);
    await call(`/cases/${manualId}/evidence`,{body:{title:'Dukungan terstruktur',claimItemId:start.claimItems[0].claimItemId,evidenceType:'MEDICAL_RECORD',verified:true,supportedQuantity:1}});
    const completed=(await call('/cases/'+manualId)).body.data;assert.equal(completed.riskAnalysis.riskScore,0);assert.equal(completed.claimItems[0].coveragePct,100);assert.equal(completed.initialAnalysis.riskScore,65);assert.equal(completed.scoreHistory[0].before.riskScore,65);
    assert.equal((await call('/cases?reasonCode=PB-01&limit=ALL')).body.data.every(c=>c.analysis.signals.some(s=>s.id==='PB-01')),true);
    assert.equal((await call(`/cases/${manualId}/outcome`,{user:'dr.anindya',body:{outcome:'NOT_CONFIRMED',notes:'Bukti telah ditelaah.'}})).status,200);
    assert.equal((await call(`/cases/${manualId}/assign`,{body:{assignedTo:'dr.budi'}})).status,409);
    assert.equal((await call(`/cases/${manualId}/outcome`,{user:'dr.anindya',body:{outcome:'CONFIRMED',notes:'Repeat'}})).status,409);
    assert.equal((await call('/cases/CASE-PB-005/assign',{body:{assignedTo:'dr.budi',assignedBy:'spoof'}})).status,200);
    const queue=await call('/cases',{user:'dr.budi'});assert.ok(queue.body.data.some(c=>c.case_id==='CASE-PB-005'));assert.ok(queue.body.data.some(c=>c.primary_risk_mode==='UPCODING'));
    const outcome=await call('/cases/CASE-PB-005/outcome',{user:'dr.budi',body:{outcome:'NEEDS_MORE_EVIDENCE',notes:'Minta bukti layanan.',reviewerId:'spoof'}});assert.equal(outcome.status,200);
    const detail=(await call('/cases/CASE-PB-005')).body.data;
    assert.equal(detail.reviewOutcomes[0].reviewer_id,'dr.budi');assert.ok(detail.auditLogs.every(e=>e.timestamp&&e.actor.username));assert.ok(detail.claimItems.length>0);
    assert.equal((await call('/cases/does-not-exist')).status,404);
    fs.mkdirSync(new URL('../../outputs/runtime-auth/',import.meta.url),{recursive:true,mode:0o700});
    fs.writeFileSync(new URL('../../outputs/runtime-auth/qa.json',import.meta.url),JSON.stringify({database,password}),{mode:0o600});
    const originalDetail=(await call('/cases/CASE-PB-003')).body.data;
    const item=originalDetail.claimItems[0];
    assert.equal((await call('/cases/CASE-PB-003/evidence',{body:{title:'Test reference',evidenceType:'MEDICAL_RECORD',claimItemId:item.claimItemId,verified:false}})).status,200);
    assert.equal((await call('/cases/CASE-PB-003')).body.data.claimItems[0].calculatedStatus,'UNAVAILABLE');
    assert.equal((await call('/cases/CASE-PB-003/dispute',{body:{title:'Klarifikasi sumber',content:'Bukti masih perlu ditelaah.'}})).status,200);
    assert.equal((await call('/cases/CASE-PB-003/copilot',{body:{title:'Draf permintaan',draft:'Mohon referensi bukti.'}})).status,200);
    assert.equal((await call('/cases/CASE-PB-003/schedule',{body:{title:'Jadwal klarifikasi',date:'2026-10-30',time:'09:00 WIB'}})).status,200);
    assert.equal((await call('/cases/CASE-PB-003/feedback',{body:{title:'Laporan',reason:'Data salah/tidak lengkap'}})).status,403);
    assert.equal((await call('/cases/CASE-PB-003/feedback',{user:'dr.budi',body:{title:'Laporan',reason:'Data salah/tidak lengkap',note:'Periksa sumber bukti.'}})).status,200);
    const validation=await call('/validation');assert.equal(validation.status,200);assert.equal(validation.body.data.engine.type,'rule');assert.equal(validation.body.data.feedback.reportedSuggestions,1);assert.ok(validation.body.data.configurationLogCount>=1);
    const evidence=(await call('/cases/CASE-PB-003/evidence')).body.data;assert.ok(evidence.claimItems.length);assert.equal(Object.hasOwn(evidence,'items'),false);
    const patterns=await call('/bpjs/anomalies?cohort=Reguler&kind=fkrtl');assert.equal(patterns.status,200);assert.ok(patterns.body.data.series.length);
    if(patterns.body.data.anomalies.length){const pattern=patterns.body.data.anomalies[0];assert.equal((await call('/bpjs/anomalies/cases',{user:'dr.anindya',body:{cohort:'Reguler',kind:'fkrtl',signalId:pattern.id}})).status,403);const result=await call('/bpjs/anomalies/cases',{body:{cohort:'Reguler',kind:'fkrtl',signalId:pattern.id}});assert.equal(result.status,200);const detail=(await call('/cases/'+result.body.data.caseId)).body.data;assert.equal(detail.case.case_type,'pattern');assert.equal(detail.case.risk_score,null);assert.equal(detail.claimItems.length,0);}
    assert.equal((await call('/auth/logout',{user:'dr.budi',method:'POST'})).status,200);assert.equal((await call('/cases',{user:'dr.budi'})).status,401);
  }finally{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await pool.end();}
});
