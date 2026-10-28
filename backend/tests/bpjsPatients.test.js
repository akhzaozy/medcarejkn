import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import express from 'express';
import bpjsPatientRoutes from '../src/routes/bpjsPatientRoutes.js';
import {closeBpjsConnections,evaluateBpjsEvidence} from '../src/services/bpjsPatientService.js';

test('BPJS evidence scenarios preserve unavailable, zero amounts and explicit simulated support',()=>{
  assert.equal(evaluateBpjsEvidence('SOURCE_ONLY').reviewPriority,'NO_CONCLUSION');
  assert.equal(evaluateBpjsEvidence('COMPLETE').coveragePct,100);
  assert.equal(evaluateBpjsEvidence('PARTIAL').coveragePct,50);
  assert.equal(evaluateBpjsEvidence('UNSUPPORTED').primarySignal,'PHANTOM_BILLING');
  assert.throws(()=>evaluateBpjsEvidence('__proto__'),e=>e.statusCode===400);
});

test('BPJS patient to encounter to persistent case and reviewer trace, with cohort isolation',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bpjs-patients-'));
  const oldSource=process.env.BPJS_DATA_DIR,oldAudit=process.env.BPJS_AUDIT_DIR;
  let server;
  try {
    process.env.BPJS_DATA_DIR=dir;process.env.BPJS_AUDIT_DIR=path.join(dir,'audit');
    fs.writeFileSync(path.join(dir,'analysis.json'),JSON.stringify({variables:[],codeSets:{},tables:[{id:'T1',source:'reguler.dta'}]}));
    const db=new DatabaseSync(path.join(dir,'bpjs-patients.sqlite'));
    db.exec(`CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT);
      CREATE TABLE participants(cohort TEXT,patient_id TEXT,dob TEXT,sex INTEGER,status INTEGER,segment INTEGER,province INTEGER,county INTEGER,sample_year INTEGER,mother_id TEXT,source_table TEXT,PRIMARY KEY(cohort,patient_id));
      CREATE TABLE encounters(id INTEGER PRIMARY KEY,cohort TEXT,patient_id TEXT,kind TEXT,visit_id TEXT,started TEXT,ended TEXT,diagnosis_code TEXT,diagnosis_name TEXT,billed REAL,verified REAL,province INTEGER,county INTEGER,provider_type INTEGER,source_table TEXT,source_row INTEGER);
      CREATE TABLE secondary_diagnoses(cohort TEXT,visit_id TEXT,diagnosis_code TEXT,description TEXT);`);
    db.prepare('INSERT INTO metadata VALUES (?,?)').run('manifest',JSON.stringify({cohorts:{Reguler:{participants:23},COVID:{participants:1}}}));
    for(let i=100;i<123;i++)db.prepare('INSERT INTO participants VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('Reguler',String(i),'2000-01-01',1,1,5,64,6471,2024,null,'T1');
    db.prepare('INSERT INTO participants VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('COVID','100','1990-01-01',2,1,2,11,1173,2024,null,'T1');
    db.prepare('INSERT INTO encounters VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(1,'Reguler','100','fkrtl','VISIT1','2024-01-01','2024-01-02','Z09','Follow-up',1000000,900000,64,6471,1,'T1',1);
    db.prepare('INSERT INTO encounters VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(2,'COVID','100','fkrtl','VISIT1','2024-02-01','2024-02-01','U07','COVID',0,0,11,1173,1,'T1',2);
    db.prepare('INSERT INTO secondary_diagnoses VALUES (?,?,?,?)').run('Reguler','VISIT1','E11','Diabetes');
    db.prepare('INSERT INTO secondary_diagnoses VALUES (?,?,?,?)').run('COVID','VISIT1','U07','COVID');
    db.close();
    const app=express();app.use(express.json());app.use('/api/bpjs',bpjsPatientRoutes);
    app.use((e,req,res,next)=>res.status(e.statusCode || 500).json({message:e.message}));
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base=`http://127.0.0.1:${server.address().port}/api/bpjs`;
    async function call(url,body,method='POST') {
      const r=await fetch(base+url,body ? {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
      const data=await r.json();return {status:r.status,data:data.data};
    }
    const first=await call('/patients?cohort=Reguler&fkrtlOnly=false');
    assert.equal(first.data.items.length,20);assert.equal(first.data.nextCursor,'119');
    assert.equal((await call('/patients?cohort=Reguler&fkrtlOnly=false&after=119')).data.items.length,3);
    assert.equal((await call('/patients?cohort=Reguler&search=10')).data.items.length,1);
    const patient=(await call('/patients/Reguler/100')).data;
    assert.equal(patient.encounters.length,1);assert.equal(patient.patient.sex,1);
    const detail=(await call('/encounters/1')).data;
    assert.equal(detail.secondaryDiagnoses.length,1);assert.equal(detail.secondaryDiagnoses[0].diagnosis_code,'E11');
    assert.equal(detail.encounter.billed,1000000);
    const created=(await call('/audits',{encounterId:1,scenario:'SOURCE_ONLY',actor:'Reviewer A'})).data;
    assert.equal(created.result.reviewPriority,'NO_CONCLUSION');
    assert.equal((await call('/audits',{encounterId:2,scenario:'COMPLETE'})).data.result.reviewPriority,'LOW');
    assert.equal((await call('/audits',{encounterId:1,scenario:'UNSUPPORTED'})).data.result.reviewPriority,'HIGH');
    assert.equal((await call('/audits',{encounterId:1,scenario:'PARTIAL'})).data.result.coveragePct,50);
    assert.equal((await call('/audits',{encounterId:1,scenario:'bogus'})).status,400);
    assert.equal((await call('/audits',{encounterId:999,scenario:'COMPLETE'})).status,404);
    assert.equal((await call(`/audits/${created.id}`,{status:'REVIEWED',notes:''},'PATCH')).status,400);
    const reviewed=(await call(`/audits/${created.id}`,{status:'NEEDS_MORE_EVIDENCE',notes:'Minta catatan pelayanan',actor:'Reviewer B'},'PATCH')).data;
    assert.equal(reviewed.status,'NEEDS_MORE_EVIDENCE');assert.equal(reviewed.events.length,2);
    closeBpjsConnections();
    assert.equal((await call(`/audits/${created.id}`)).data.review_notes,'Minta catatan pelayanan');
    assert.equal((await call('/audits')).data.total,4);
    assert.equal((await call('/encounters/1')).data.encounter.billed,1000000);
    assert.equal((await call('/patients?cohort=Reguler&search=hello')).status,400);
    assert.equal((await call('/patients/unknown/100')).status,404);
  } finally {
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    closeBpjsConnections();
    if(oldSource===undefined)delete process.env.BPJS_DATA_DIR;else process.env.BPJS_DATA_DIR=oldSource;
    if(oldAudit===undefined)delete process.env.BPJS_AUDIT_DIR;else process.env.BPJS_AUDIT_DIR=oldAudit;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
