import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { bpjsDirectory, readBpjsData } from './bpjsService.js';
import { reconcileItem } from '../decision-engine/evidenceReconciliation.js';

let sourceCache, auditCache;
const fail=(message,statusCode=400)=>{const error=new Error(message); error.statusCode=statusCode; throw error;};
const text=(v,max=100)=> typeof v==='string' && v.length<=max ? v : fail('Parameter tidak valid.');
const digits=v=>/^\d{1,20}$/.test(text(v)) ? v : fail('ID peserta harus berupa angka.');
function source() {
  const filename=path.join(bpjsDirectory(),'bpjs-patients.sqlite');
  if(!fs.existsSync(filename)) fail('Indeks pasien BPJS sedang disiapkan. Coba lagi setelah impor selesai.',503);
  const mtime=fs.statSync(filename).mtimeMs;
  if(!sourceCache || sourceCache.filename!==filename || sourceCache.mtime!==mtime) {
    sourceCache?.db.close();
    sourceCache={filename,mtime,db:new DatabaseSync(filename,{readOnly:true})};
  }
  return sourceCache.db;
}
function auditStore() {
  const directory=process.env.BPJS_AUDIT_DIR || fileURLToPath(new URL('../../../outputs/bpjs-simulation/',import.meta.url));
  const filename=path.join(directory,'audit.sqlite');
  if(!auditCache || auditCache.filename!==filename) {
    auditCache?.db.close(); fs.mkdirSync(directory,{recursive:true});
    const db=new DatabaseSync(filename);
    db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY,cohort TEXT,patient_id TEXT,priority TEXT,
        status TEXT,scenario TEXT,snapshot TEXT,review_notes TEXT,created_at TEXT,updated_at TEXT);
      CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,case_id TEXT,actor TEXT,action TEXT,notes TEXT,created_at TEXT);
      CREATE INDEX IF NOT EXISTS event_case ON events(case_id,id);
      CREATE INDEX IF NOT EXISTS cases_recent ON cases(created_at DESC,id DESC);`);
    auditCache={filename,db};
  }
  return auditCache.db;
}
export function patientCatalog() {
  const row=source().prepare("SELECT value FROM metadata WHERE key='manifest'").get();
  return JSON.parse(row.value);
}
function validCohort(cohort) {
  text(cohort);
  if(!Object.hasOwn(patientCatalog().cohorts,cohort)) fail('Kelompok BPJS tidak ditemukan.',404);
  return cohort;
}
function label(tableId,column,value) {
  if(value==null) return null;
  const data=readBpjsData();
  const v=data.variables.find(v=>v.tableId===tableId && v.column===column);
  return data.codeSets[v?.codeSet]?.[String(value)] || String(value);
}
function participant(row) {
  if(!row) return null;
  return {...row,sexLabel:label(row.source_table,'PSTV05',row.sex),statusLabel:label(row.source_table,'PSTV17',row.status),
    segmentLabel:label(row.source_table,'PSTV08',row.segment),provinceLabel:label(row.source_table,'PSTV09_NEW',row.province)};
}
function encounter(row) {
  if(!row) return null;
  const col={fkrtl:['FKL05_NEW','FKL08'],fktpkapitasi:['FKP05_NEW','FKP08'],nonkapitasi:['PNK06_NEW','PNK09']}[row.kind];
  return {...row,provinceLabel:label(row.source_table,col[0],row.province),providerTypeLabel:label(row.source_table,col[1],row.provider_type),
    sourceFile:readBpjsData().tables.find(t=>t.id===row.source_table)?.source,
    billingDifference:row.billed==null || row.verified==null ? null : row.billed-row.verified};
}
export function listBpjsPatients({cohort='Reguler',search='',after='',fkrtlOnly=true}={}) {
  validCohort(cohort); text(search,20); text(after,20);
  if(search) digits(search); if(after) digits(after);
  const db=source();
  const rows=db.prepare(`SELECT p.* FROM participants p WHERE p.cohort=? AND p.patient_id>?
    AND p.patient_id>=? AND p.patient_id<?
    ${fkrtlOnly ? "AND EXISTS(SELECT 1 FROM encounters e WHERE e.cohort=p.cohort AND e.patient_id=p.patient_id AND e.kind='fkrtl')" : ''}
    ORDER BY p.patient_id LIMIT 21`).all(cohort,after,search,search+'\uffff');
  const items=rows.slice(0,20).map(participant);
  return {items,nextCursor:rows.length>20 ? items.at(-1).patient_id : null,cohortParticipants:patientCatalog().cohorts[cohort].participants};
}
export function getBpjsPatient(cohort,id,page=1) {
  validCohort(cohort); digits(id);
  if(!Number.isSafeInteger(page) || page<1 || page>10000) fail('Halaman riwayat tidak valid.');
  const db=source();
  const row=db.prepare('SELECT * FROM participants WHERE cohort=? AND patient_id=?').get(cohort,id);
  if(!row) fail('Peserta tidak ditemukan pada kelompok ini.',404);
  const total=db.prepare('SELECT COUNT(*) AS n FROM encounters WHERE cohort=? AND patient_id=?').get(cohort,id).n;
  const rows=db.prepare('SELECT * FROM encounters WHERE cohort=? AND patient_id=? ORDER BY started DESC,id DESC LIMIT 30 OFFSET ?').all(cohort,id,(page-1)*30);
  return {patient:participant(row),encounters:rows.map(encounter),total,page,totalPages:Math.max(1,Math.ceil(total/30))};
}
export function getBpjsEncounter(id) {
  if(!Number.isSafeInteger(id) || id<1) fail('ID layanan tidak valid.');
  const row=source().prepare('SELECT * FROM encounters WHERE id=?').get(id);
  if(!row) fail('Layanan tidak ditemukan.',404);
  const p=source().prepare('SELECT * FROM participants WHERE cohort=? AND patient_id=?').get(row.cohort,row.patient_id);
  const secondary=row.kind==='fkrtl' && row.visit_id ? source().prepare('SELECT DISTINCT diagnosis_code,description FROM secondary_diagnoses WHERE cohort=? AND visit_id=? LIMIT 101').all(row.cohort,row.visit_id) : [];
  return {patient:participant(p),encounter:encounter(row),secondaryDiagnoses:secondary.slice(0,100),secondaryTruncated:secondary.length>100};
}
export const evidenceScenarios={
  SOURCE_ONLY:{label:'Bukti belum tersedia',available:false,supported:0},
  COMPLETE:{label:'Bukti pelayanan lengkap',available:true,supported:2},
  PARTIAL:{label:'Satu bukti belum cocok',available:true,supported:1},
  UNSUPPORTED:{label:'Tidak ada bukti pelayanan yang cocok',available:true,supported:0},
};
export function evaluateBpjsEvidence(scenario) {
  if(!Object.hasOwn(evidenceScenarios,scenario)) fail('Skenario bukti tidak valid.');
  const s=evidenceScenarios[scenario];
  const result=reconcileItem({claimedQty:2,supportedQty:s.supported,evidenceAvailable:s.available});
  return {...result,scenario,scenarioLabel:s.label,expectedEvidence:2,supportedEvidence:s.available?s.supported:null,
    summary:{UNAVAILABLE:'Bukti pelayanan belum tersedia untuk diperiksa.',SUPPORTED:'Dua bukti simulasi sesuai dengan layanan.',PARTIAL:'Satu dari dua bukti simulasi belum cocok.',UNSUPPORTED:'Bukti simulasi tersedia, tetapi tidak mendukung layanan yang ditagihkan.'}[result.status],
    evidenceBasis:'Presensi dan catatan pelayanan adalah bukti tambahan dalam skenario simulasi lomba.'};
}
export function createBpjsAudit(input={}) {
  if(!input || typeof input!=='object' || Array.isArray(input)) fail('Data audit tidak valid.');
  const {encounterId,scenario='SOURCE_ONLY',actor='Peserta demo'}=input;
  text(actor,100);
  const detail=getBpjsEncounter(encounterId);
  const result=evaluateBpjsEvidence(scenario);
  const id=`BPJS-${randomUUID()}`;
  const now=new Date().toISOString();
  const snapshot={...detail,result};
  const db=auditStore();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,detail.encounter.cohort,detail.encounter.patient_id,result.reviewPriority,'OPEN',scenario,JSON.stringify(snapshot),'',now,now);
    db.prepare('INSERT INTO events(case_id,actor,action,notes,created_at) VALUES (?,?,?,?,?)').run(id,actor,'CREATE_SIMULATION',result.scenarioLabel,now);
    db.exec('COMMIT');
  } catch(e) {db.exec('ROLLBACK');throw e;}
  return getBpjsAudit(id);
}
export function listBpjsAudits() {
  const db=auditStore();
  return {items:db.prepare('SELECT id,cohort,patient_id,priority,status,scenario,created_at,updated_at FROM cases ORDER BY created_at DESC,id DESC LIMIT 100').all(),
    total:db.prepare('SELECT COUNT(*) AS n FROM cases').get().n};
}
export function getBpjsAudit(id) {
  text(id,60);
  const db=auditStore();
  const row=db.prepare('SELECT * FROM cases WHERE id=?').get(id);
  if(!row) fail('Kasus simulasi tidak ditemukan.',404);
  const {snapshot,...rest}=row;
  return {...rest,...JSON.parse(snapshot),events:db.prepare('SELECT actor,action,notes,created_at FROM events WHERE case_id=? ORDER BY id DESC LIMIT 100').all(id)};
}
export function reviewBpjsAudit(id,{status,notes,actor='Reviewer demo'}) {
  if(!['NEEDS_MORE_EVIDENCE','REVIEWED','CLOSED'].includes(status)) fail('Status telaah tidak valid.');
  text(notes,2000); text(actor,100);
  if(!notes.trim()) fail('Catatan telaah wajib diisi.');
  getBpjsAudit(id);
  const now=new Date().toISOString(); const db=auditStore();
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE cases SET status=?,review_notes=?,updated_at=? WHERE id=?').run(status,notes,now,id);
    db.prepare('INSERT INTO events(case_id,actor,action,notes,created_at) VALUES (?,?,?,?,?)').run(id,actor,status,notes,now);
    db.exec('COMMIT');
  } catch(e) {db.exec('ROLLBACK');throw e;}
  return getBpjsAudit(id);
}

export function closeBpjsConnections() {
  sourceCache?.db.close();auditCache?.db.close();sourceCache=null;auditCache=null;
}
