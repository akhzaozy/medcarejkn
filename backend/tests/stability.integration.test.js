import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
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
  let server;
  try{
    assert.equal((await migrate()).status,'migrated');assert.equal((await migrate()).status,'current');
    assert.equal(Number((await pool.query('SELECT COUNT(*) n FROM cases')).rows[0].n),8);
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
    assert.equal((await call('/dashboard')).status,200);
    assert.equal((await call('/cases/CASE-PB-005/assign',{body:{assignedTo:'dr.budi',assignedBy:'spoof'}})).status,200);
    const queue=await call('/cases',{user:'dr.budi'});assert.ok(queue.body.data.some(c=>c.case_id==='CASE-PB-005'));assert.ok(queue.body.data.some(c=>c.primary_risk_mode==='UPCODING'));
    const outcome=await call('/cases/CASE-PB-005/outcome',{user:'dr.budi',body:{outcome:'NEEDS_MORE_EVIDENCE',notes:'Minta bukti layanan.',reviewerId:'spoof'}});assert.equal(outcome.status,200);
    const detail=(await call('/cases/CASE-PB-005')).body.data;
    assert.equal(detail.reviewOutcomes[0].reviewer_id,'dr.budi');assert.ok(detail.auditLogs.every(e=>e.timestamp&&e.actor.username));assert.ok(detail.claimItems.length>0);
    assert.equal((await call('/cases/does-not-exist')).status,404);
    fs.mkdirSync(new URL('../../outputs/runtime-auth/',import.meta.url),{recursive:true,mode:0o700});
    fs.writeFileSync(new URL('../../outputs/runtime-auth/qa.json',import.meta.url),JSON.stringify({database,password}),{mode:0o600});
    assert.equal((await call('/auth/logout',{user:'dr.budi',method:'POST'})).status,200);assert.equal((await call('/cases',{user:'dr.budi'})).status,401);
  }finally{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await pool.end();}
});
