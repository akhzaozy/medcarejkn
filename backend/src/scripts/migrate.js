import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import pool from '../config/db.js';
import {seedAuth} from '../auth/session.js';
import {catalog,analyzeClaim} from '../../../shared/riskEngine.js';
import {itemContract} from '../../../shared/caseContract.js';
const root=fileURLToPath(new URL('../../../',import.meta.url));
async function logRules(client){const hash=createHash('sha256').update(JSON.stringify(catalog)).digest('hex');const previous=(await client.query('SELECT config_hash,current_config FROM rule_config_log ORDER BY id DESC LIMIT 1')).rows[0];if(previous?.config_hash!==hash)await client.query('INSERT INTO rule_config_log(version,config_hash,actor,previous_config,current_config) VALUES($1,$2,$3,$4,$5)',[catalog.version,hash,process.env.JKN_CONFIG_ACTOR||'system.deployment',previous?.current_config||null,JSON.stringify(catalog)]);}
export async function migrate({backup=true}={}) {
  let backupFile=null;
  const client=await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(29102026)');
    const version='20261029_003';
    const exists=(await client.query("SELECT to_regclass('public.schema_migrations') AS name")).rows[0].name;
    if(exists&&(await client.query('SELECT 1 FROM schema_migrations WHERE version=$1',[version])).rows.length){await seedAuth(client);await logRules(client);return {status:'current',version};}
    if(backup){
      const directory=process.env.JKN_BACKUP_DIR||path.join(root,'outputs/backups');fs.mkdirSync(directory,{recursive:true,mode:0o700});
      const filename=path.join(directory,`before-${version}-${Date.now()}.dump`);
      const result=spawnSync('pg_dump',['--format=custom','--file',filename],{env:{...process.env,PGHOST:process.env.DB_HOST||'localhost',PGPORT:process.env.DB_PORT||'5432',PGDATABASE:process.env.DB_NAME||'jkn_integrity',PGUSER:process.env.DB_USER||'postgres',PGPASSWORD:process.env.DB_PASSWORD||''},stdio:'pipe'});
      if(result.status!==0)throw new Error('Backup PostgreSQL gagal. Migrasi dibatalkan; periksa pg_dump dan koneksi database.');
      if(!fs.statSync(filename).size)throw new Error('Backup PostgreSQL kosong. Migrasi dibatalkan.');
      fs.chmodSync(filename,0o600);backupFile=path.basename(filename);
    }
    await client.query('BEGIN');
    await client.query(fs.readFileSync(path.join(root,'database/migrations/20261029_001_stability.sql'),'utf8'));
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    await client.query(fs.readFileSync(path.join(root,'database/migrations/20261029_002_patterns.sql'),'utf8'));
    const seeds=JSON.parse(fs.readFileSync(path.join(root,'data/demo/cases.json'),'utf8'));
    for(const detail of seeds){
      const c=detail.case;
      if((await client.query('SELECT 1 FROM cases WHERE case_id=$1',[c.case_id])).rows.length)continue;
      const suffix=c.case_id.slice(-3),provider=`DEMO-PROV-${suffix}`,encounter=`DEMO-ENC-${suffix}`;
      await client.query("INSERT INTO providers(provider_id,provider_name,provider_type) VALUES($1,$2,'SYNTHETIC_HOSPITAL') ON CONFLICT DO NOTHING",[provider,c.provider_name]);
      await client.query('INSERT INTO patients(patient_id,age_group,sex) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[c.patient_id,c.age_group,c.sex==='L'?'M':'F']);
      await client.query("INSERT INTO encounters(encounter_id,patient_id,provider_id,service_date,encounter_type) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",[encounter,c.patient_id,provider,c.service_date||'2026-02-24',c.encounter_type]);
      await client.query("INSERT INTO claims(claim_id,encounter_id,provider_id,claim_date,claim_status,total_amount) VALUES($1,$2,$3,$4,'SUBMITTED',$5) ON CONFLICT DO NOTHING",[c.claim_id,encounter,provider,c.service_date||'2026-02-24',c.total_amount]);
      const features={evidenceAvailable:detail.claimItems.every(i=>i.evidence_status==='VERIFIED'),claimedQty:detail.claimItems.reduce((n,i)=>n+Number(i.quantity),0),supportedQty:detail.claimItems.filter(i=>i.evidence_status==='VERIFIED').reduce((n,i)=>n+Number(i.quantity),0)};
      const analysis=analyzeClaim(features);
      await client.query('INSERT INTO cases(case_id,claim_id,primary_risk_mode,review_priority,case_status,affected_items,evidence_gap,evidence_coverage_pct,review_focus,assigned_to,assigned_name,source,risk_score,engine_type,engine_version,initial_analysis,analysis,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,\'seed\',$12,$13,$14,$15,$15,$16)',[c.case_id,c.claim_id,c.primary_risk_mode,analysis.reviewPriority,c.case_status,String(c.affected_items),analysis.evidenceGap,analysis.evidenceCoveragePct,analysis.reviewFocus,c.assigned_to,c.assigned_name,analysis.riskScore,analysis.engine.type,analysis.engine.version,JSON.stringify(analysis),JSON.stringify({summary:c.summary,features,synthetic:true,primary_diagnosis:c.primary_diagnosis,primary_procedure:c.primary_procedure})]);
      for(let i=0;i<detail.claimItems.length;i++){
        const item=detail.claimItems[i],itemId=`DEMO-${suffix}-ITEM-${i+1}`;
        await client.query('INSERT INTO claim_items(claim_item_id,claim_id,sequence_no,service_code,service_type,quantity,unit_price,net_amount,encounter_id,ground_truth_item_status,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING',[itemId,c.claim_id,i+1,item.item_code,item.item_type,item.quantity,item.unit_price,item.total_price,encounter,item.evidence_status==='VERIFIED'?'SUPPORTED':'UNAVAILABLE',item.item_description]);
        const ev=detail.evidenceLinks[i]||{evidence_type:'MEDICAL_RECORD',status:'UNAVAILABLE',note:'Bukti belum tersedia'};
        await client.query('INSERT INTO evidence_links(evidence_link_id,claim_item_id,evidence_type,source_id,match_status,match_quantity,availability,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,\'system.seed\') ON CONFLICT DO NOTHING',[`DEMO-${suffix}-EV-${i+1}`,itemId,ev.evidence_type,ev.title?.slice(0,50)||'Sumber skenario sintetis',ev.status==='AVAILABLE'?'MATCHED':'UNAVAILABLE',ev.status==='AVAILABLE'?item.quantity:0,ev.status==='AVAILABLE'?'YES':'UNAVAILABLE',ev.note]);
      }
      await client.query("INSERT INTO audit_logs(case_id,actor_id,action,detail) VALUES($1,'system.seed','CASE_CREATED','Kasus skenario sintetis; bukan klaim BPJS individual.')",[c.case_id]);
    }
    // Existing imported cases receive a dated migration baseline; prior decisions are not relabelled as prospective validation.
    const legacy=(await client.query(`SELECT c.case_id,c.metadata,COALESCE((SELECT json_agg(i) FROM claim_items i WHERE i.claim_id=c.claim_id),'[]'::json) AS items,COALESCE((SELECT json_agg(e) FROM evidence_links e JOIN claim_items i USING(claim_item_id) WHERE i.claim_id=c.claim_id),'[]'::json) AS links FROM cases c WHERE c.initial_analysis IS NULL AND c.case_type='claim'`)).rows;
    const snapshots=legacy.map(row=>{const items=row.items.map(i=>itemContract(i,row.links));return {case_id:row.case_id,analysis:{...analyzeClaim({...row.metadata?.features,evidenceAvailable:items.length>0&&items.every(i=>i.calculatedStatus!=='UNAVAILABLE'),claimedQty:items.reduce((n,i)=>n+i.claimedQuantity,0),supportedQty:items.reduce((n,i)=>n+i.supportedQuantity,0)}),baselineSource:'migration_snapshot',capturedAt:new Date().toISOString()}};});
    if(snapshots.length)await client.query(`UPDATE cases c SET initial_analysis=s.analysis,analysis=COALESCE(c.analysis,s.analysis),risk_score=(s.analysis->>'riskScore')::numeric,engine_type=s.analysis->'engine'->>'type',engine_version=s.analysis->'engine'->>'version',review_priority=s.analysis->>'reviewPriority',evidence_gap=(s.analysis->>'evidenceGap')::numeric,evidence_coverage_pct=(s.analysis->>'evidenceCoveragePct')::numeric FROM jsonb_to_recordset($1::jsonb) AS s(case_id text,analysis jsonb) WHERE c.case_id=s.case_id AND c.initial_analysis IS NULL`,[JSON.stringify(snapshots)]);
    await seedAuth(client);await logRules(client);
    await client.query('INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING',[version]);
    await client.query('COMMIT');return {status:'migrated',version,backupFile};
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{await client.query('SELECT pg_advisory_unlock(29102026)').catch(()=>{});client.release();}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(await migrate()));}catch(e){console.error(e.message);process.exitCode=1;}finally{await pool.end();}}
