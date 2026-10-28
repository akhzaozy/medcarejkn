import pool from '../config/db.js';
import {analyzeClaim} from '../../../shared/riskEngine.js';
import {randomUUID} from 'node:crypto';

export async function getClaims(req, res, next) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          c.claim_id,
          c.encounter_id,
          c.claim_date,
          c.claim_status,
          c.total_amount,
          p.provider_name,
          p.provider_id,
          e.encounter_type
        FROM claims c
        JOIN providers p ON c.provider_id = p.provider_id
        JOIN encounters e ON c.encounter_id = e.encounter_id
        ORDER BY c.claim_id ASC
      `);
      res.status(200).json({
        success: true,
        total: result.rows.length,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

export async function getClaimById(req, res, next) {
  try {
    const { claimId } = req.params;
    const client = await pool.connect();
    try {
      const claimRes = await client.query(`
        SELECT 
          c.*,
          p.provider_name,
          p.provider_type,
          e.patient_id,
          e.encounter_type,
          e.service_date
        FROM claims c
        JOIN providers p ON c.provider_id = p.provider_id
        JOIN encounters e ON c.encounter_id = e.encounter_id
        WHERE c.claim_id = $1
      `, [claimId]);

      if (claimRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Claim not found: ${claimId}`
        });
      }

      const itemsRes = await client.query(`
        SELECT ci.*, 
          COALESCE(
            (SELECT json_agg(el.*) FROM evidence_links el WHERE el.claim_item_id = ci.claim_item_id),
            '[]'::json
          ) as evidence_links
        FROM claim_items ci
        WHERE ci.claim_id = $1
        ORDER BY ci.sequence_no ASC
      `, [claimId]);

      res.status(200).json({
        success: true,
        data: {
          claim: claimRes.rows[0],
          items: itemsRes.rows
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

export async function auditCheckClaim(req,res,next) {
  const input=req.body||{};
  if(!Number.isFinite(Number(input.amountBilled??0))||Number(input.amountBilled??0)<0)return res.status(400).json({message:'Nilai tagihan tidak valid.'});
  const analysis=analyzeClaim(input);
  let save={status:'not_requested',caseId:null,message:'Tidak disimpan (opsi simpan dimatikan).'};
  if(input.saveCase){
    let client;
    try {
      client=await pool.connect();await client.query('BEGIN');
      const id=randomUUID().replaceAll('-','').slice(0,20),patientId=`PAT-${id}`,encounterId=`ENC-${id}`,claimId=`CLM-${id}`,caseId=`CASE-${id}`,providerId='PROV-MANUAL';
      await client.query("INSERT INTO providers(provider_id,provider_name,provider_type) VALUES($1,'Faskes input manual','MANUAL') ON CONFLICT DO NOTHING",[providerId]);
      await client.query('INSERT INTO patients(patient_id,age_group,sex) VALUES($1,$2,$3)',[patientId,String(input.age??'Tidak tersedia').slice(0,30),String(input.gender||'U').slice(0,1)]);
      await client.query("INSERT INTO encounters(encounter_id,patient_id,provider_id,service_date,encounter_type) VALUES($1,$2,$3,$4,'MANUAL')",[encounterId,patientId,providerId,input.dateEncounter||new Date().toISOString().slice(0,10)]);
      await client.query("INSERT INTO claims(claim_id,encounter_id,provider_id,claim_date,claim_status,total_amount) VALUES($1,$2,$3,$4,'SUBMITTED',$5)",[claimId,encounterId,providerId,input.dateEncounter||new Date().toISOString().slice(0,10),Number(input.amountBilled||0)]);
      await client.query("INSERT INTO claim_items(claim_item_id,claim_id,sequence_no,service_code,service_type,quantity,unit_price,net_amount,encounter_id,description) VALUES($1,$2,1,'MANUAL','DEFAULT',$3,$4,$4,$5,$6)",[`ITEM-${id}`,claimId,Number(input.claimedQty||1),Number(input.amountBilled||0),encounterId,String(input.diagnosis||'Layanan manual').slice(0,300)]);
      if(typeof input.evidenceAvailable==='boolean')await client.query("INSERT INTO evidence_links(evidence_link_id,claim_item_id,evidence_type,source_id,match_status,match_quantity,availability,reason,created_by) VALUES($1,$2,'INPUT_SCENARIO','Skenario input manual',$3,$4,$5,'Nilai terstruktur dari formulir; bukan pembacaan dokumen',$6)",[`EVD-${id}`,`ITEM-${id}`,input.evidenceAvailable?(Number(input.supportedQty)>0?'MATCHED':'UNSUPPORTED'):'UNAVAILABLE',input.evidenceAvailable?Number(input.supportedQty||0):0,input.evidenceAvailable?'YES':'UNAVAILABLE',req.user?.username||'unknown']);
      await client.query("INSERT INTO cases(case_id,claim_id,primary_risk_mode,review_priority,case_status,evidence_gap,evidence_coverage_pct,review_focus,source,risk_score,engine_type,engine_version,initial_analysis,analysis,metadata,assigned_to,assigned_name) VALUES($1,$2,$3,$4,'OPEN',$5,$6,$7,'phantom_checker',$8,$9,$10,$11,$11,$12,$13,$14)",[caseId,claimId,analysis.primaryRiskMode,analysis.reviewPriority,analysis.evidenceGap,analysis.evidenceCoveragePct,analysis.reviewFocus,analysis.riskScore,analysis.engine.type,analysis.engine.version,JSON.stringify(analysis),JSON.stringify({features:input,primary_diagnosis:input.diagnosis}),req.user?.role==='clinical_reviewer'?req.user.username:null,req.user?.role==='clinical_reviewer'?req.user.name:null]);
      await client.query("INSERT INTO audit_logs(case_id,actor_id,action,detail) VALUES($1,$2,'CASE_CREATED',$3)",[caseId,req.user?.username||'unknown',JSON.stringify({source:'phantom_checker',engine:analysis.engine})]);
      await client.query('COMMIT');save={status:'saved',caseId,claimId,message:`Tersimpan sebagai kasus ${caseId}`};
    }catch(e){if(client)await client.query('ROLLBACK');save={status:'failed',caseId:null,message:'Analisis berhasil, tetapi kasus gagal disimpan. Periksa layanan database dan coba simpan kembali.'};}
    finally{client?.release();}
  }
  res.json({success:true,analysis,save});
}
