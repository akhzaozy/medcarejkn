import pool from '../config/db.js';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {analyzeClaim} from '../../../shared/riskEngine.js';
import {itemContract,evidenceContract,eventContract} from '../../../shared/caseContract.js';
import {users} from '../../../shared/users.js';
import {createNotification} from './notificationService.js';

const UPLOADS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../outputs/runtime-auth/uploads');
function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function getAllCases({ status, priority, riskMode, reasonCode, search, assignedTo, page = 1, limit = 12 } = {}) {
  const client = await pool.connect();
  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const isUnfilteredLimit = limit === 'ALL' || parseInt(limit, 10) <= 0;
    const limitNum = isUnfilteredLimit ? null : (parseInt(limit, 10) || 12);
    const offset = isUnfilteredLimit ? 0 : (pageNum - 1) * limitNum;

    let baseWhere = ' WHERE 1=1';
    const params = [];

    if(status==='COMPLETED'){baseWhere+=" AND c.case_status IN ('CONFIRMED','NOT_CONFIRMED','CLOSED')";}
    else if (status && status !== 'ALL') {
      params.push(status);
      baseWhere += ` AND c.case_status = $${params.length}`;
    }

    if (priority && priority !== 'ALL') {
      params.push(priority);
      baseWhere += ` AND c.review_priority = $${params.length}`;
    }

    if (riskMode && riskMode !== 'ALL') {
      params.push(riskMode);
      baseWhere += ` AND c.primary_risk_mode = $${params.length}`;
    }

    if(reasonCode&&reasonCode!=='ALL'){
      params.push(JSON.stringify([{id:reasonCode}]));
      baseWhere+=` AND (c.analysis->'signals') @> $${params.length}::jsonb`;
    }

    if(assignedTo==='UNASSIGNED'){baseWhere+=' AND c.assigned_to IS NULL';}
    else if (assignedTo && assignedTo !== 'ALL') {
      params.push(assignedTo);
      baseWhere += ` AND c.assigned_to = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      baseWhere += ` AND (c.case_id ILIKE $${params.length} OR c.claim_id ILIKE $${params.length} OR pr.provider_name ILIKE $${params.length})`;
    }

    // 1. Fast count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM cases c
      LEFT JOIN claims cl ON c.claim_id = cl.claim_id
      LEFT JOIN providers pr ON cl.provider_id = pr.provider_id
      ${baseWhere}
    `;
    const countRes = await client.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // 2. Paginated data query
    let query = `
      SELECT 
        c.case_type,c.source,c.risk_score,c.engine_version,c.analysis,c.metadata,
        c.case_id,
        c.claim_id,
        c.primary_risk_mode,
        c.review_priority,
        c.case_status,
        c.affected_items,
        c.evidence_gap,
        c.evidence_coverage_pct,
        c.review_focus,
        c.created_at,
        c.assigned_to,
        c.assigned_name,
        cl.total_amount,
        cl.claim_date,
        COALESCE(pr.provider_name,'Pola agregat BPJS') AS provider_name,
        pr.provider_id,
        COALESCE(p.patient_id, e.patient_id, 'Tidak berlaku') as patient_id,
        COALESCE(p.age_group, 'Tidak tersedia') as age_group,
        COALESCE(p.sex, 'U') as sex
      FROM cases c
      LEFT JOIN claims cl ON c.claim_id = cl.claim_id
      LEFT JOIN encounters e ON cl.encounter_id = e.encounter_id
      LEFT JOIN providers pr ON cl.provider_id = pr.provider_id
      LEFT JOIN patients p ON e.patient_id = p.patient_id
      ${baseWhere}
      ORDER BY CASE WHEN c.review_priority='HIGH' THEN 1 WHEN c.review_priority='MEDIUM' THEN 2 WHEN c.review_priority='NO_CONCLUSION' THEN 3 ELSE 4 END, c.risk_score DESC NULLS LAST,c.case_id ASC
    `;

    const dataParams = [...params];
    if (limitNum) {
      dataParams.push(limitNum);
      query += ` LIMIT $${dataParams.length}`;
      dataParams.push(offset);
      query += ` OFFSET $${dataParams.length}`;
    }

    const res = await client.query(query, dataParams);
    return {
      cases: res.rows,
      total,
      page: pageNum,
      limit: limitNum || total,
      totalPages: limitNum ? Math.ceil(total / limitNum) : 1
    };
  } finally {
    client.release();
  }
}

export async function getCaseById(caseId) {
  const client = await pool.connect();
  try {
    // 1. Case info
    const caseRes = await client.query(`
      SELECT 
        c.*,
        cl.encounter_id,
        cl.claim_date,
        cl.claim_status,
        cl.total_amount,
        COALESCE(p.patient_id, e.patient_id, 'Tidak berlaku') as patient_id,
        COALESCE(e.service_date, cl.claim_date, CURRENT_DATE) as service_date,
        COALESCE(e.encounter_type, 'RAWAT_INAP') as encounter_type,
        pr.provider_id,
        COALESCE(pr.provider_name,'Pola agregat BPJS') AS provider_name,
        pr.provider_type,
        COALESCE(p.age_group, 'Tidak tersedia') as age_group,
        COALESCE(p.sex, 'U') as sex
      FROM cases c
      LEFT JOIN claims cl ON c.claim_id = cl.claim_id
      LEFT JOIN encounters e ON cl.encounter_id = e.encounter_id
      LEFT JOIN providers pr ON cl.provider_id = pr.provider_id
      LEFT JOIN patients p ON e.patient_id = p.patient_id
      WHERE c.case_id = $1
    `, [caseId]);

    if (caseRes.rows.length === 0) {
      return null;
    }
    const caseData = caseRes.rows[0];
    if(caseData.case_type==='pattern'){
      const events=await client.query('SELECT * FROM audit_logs WHERE case_id=$1 ORDER BY created_at DESC',[caseId]);
      return {case:{...caseData,...caseData.metadata},claimItems:[],evidenceLinks:[],riskSignals:[],reviewOutcomes:[],disputes:[],auditLogs:events.rows.map(eventContract),riskAnalysis:caseData.analysis,initialAnalysis:caseData.initial_analysis};
    }

    // 2. Diagnoses
    const dxRes = await client.query(
      'SELECT * FROM diagnoses WHERE encounter_id = $1 ORDER BY diagnosis_role ASC',
      [caseData.encounter_id]
    );

    // 3. Claim Items & Billing Items
    const itemsRes = await client.query(`
      SELECT 
        ci.*,
        COALESCE(
          (SELECT json_agg(b.*) FROM billing_items b WHERE b.claim_item_id = ci.claim_item_id),
          '[]'::json
        ) as billing_items
      FROM claim_items ci
      WHERE ci.claim_id = $1
      ORDER BY ci.sequence_no ASC
    `, [caseData.claim_id]);

    // 4. Evidence Links for these items
    const evidenceRes = await client.query(`
      SELECT el.*, ci.claim_id
      FROM evidence_links el
      JOIN claim_items ci ON el.claim_item_id = ci.claim_item_id
      WHERE ci.claim_id = $1
    `, [caseData.claim_id]);

    // 5. Risk Signals
    const signalsRes = await client.query(`
      SELECT * FROM risk_signals 
      WHERE claim_id = $1
      ORDER BY created_at ASC, signal_id ASC
    `, [caseData.claim_id]);

    // 6. Review Outcomes
    const outcomesRes = await client.query(`
      SELECT * FROM review_outcomes 
      WHERE case_id = $1 
      ORDER BY reviewed_at DESC
    `, [caseId]);

    // 7. Audit Logs
    const auditRes = await client.query(`
      SELECT * FROM audit_logs 
      WHERE case_id = $1 
      ORDER BY created_at DESC
    `, [caseId]);

    const docs=(await client.query('SELECT * FROM case_documents WHERE case_id=$1 ORDER BY created_at DESC',[caseId])).rows;
    const docFileByEv=new Map(docs.filter(d=>d.kind==='evidence'&&d.payload?.file).map(d=>[d.id,d.payload.file]));
    const evidenceLinks=evidenceRes.rows.map(r=>({...evidenceContract(r),file:docFileByEv.get(r.evidence_link_id)||null}));
    const claimItems=itemsRes.rows.map(item=>({...itemContract(item,evidenceLinks),evidenceLinks:evidenceLinks.filter(e=>e.claimItemId===item.claim_item_id)}));
    const features={...(caseData.metadata?.features||{}),evidenceAvailable:claimItems.length>0&&claimItems.every(i=>i.calculatedStatus!=='UNAVAILABLE'),claimedQty:claimItems.reduce((n,i)=>n+i.claimedQuantity,0),supportedQty:claimItems.reduce((n,i)=>n+i.supportedQuantity,0)};
    const riskAnalysis=caseData.analysis||analyzeClaim(features);
    return {case:{...caseData,...(caseData.metadata||{})},diagnoses:dxRes.rows,claimItems,evidenceLinks,
      riskSignals:riskAnalysis.signals,reviewOutcomes:outcomesRes.rows,auditLogs:auditRes.rows.map(eventContract),
      disputes:docs.filter(d=>['dispute','clarification'].includes(d.kind)).map(d=>({...d.payload,id:d.id,actor:d.actor,date:d.created_at,status:'MENUNGGU_VERIFIKASI',attachments:d.payload.attachments||[]})),
      triageNotes:docs.filter(d=>d.kind==='copilot').map(d=>({...d.payload,createdAt:d.created_at,createdBy:d.actor})),
      uploadedEvidences:docs.filter(d=>d.kind==='evidence').map(d=>({...d.payload,id:d.id,createdAt:d.created_at,actor:d.actor})),riskAnalysis,initialAnalysis:caseData.initial_analysis||null,
      scoreHistory:docs.filter(d=>d.kind==='score_history').map(d=>({...d.payload,timestamp:d.created_at})),
      mlRecommendation:{modelName:riskAnalysis.engine.version,confidenceScore:riskAnalysis.riskScore,predictedRiskLevel:riskAnalysis.reviewPriority,suggestedOutcome:'NEEDS_MORE_EVIDENCE',suggestedNotes:'Draf — wajib ditinjau dokter. '+riskAnalysis.reasons.join('; '),drivers:riskAnalysis.reasons}};

  } finally {
    client.release();
  }
}

export async function getCaseEvidence(caseId) {const d=await getCaseById(caseId);return d?{caseId,claimItems:d.claimItems,evidenceLinks:d.evidenceLinks}:null;}

export async function submitCaseOutcome(caseId, { outcome, notes, reviewerId, reviewerName, allowRevision = false }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get current case
    const caseRes = await client.query('SELECT * FROM cases WHERE case_id = $1 FOR UPDATE', [caseId]);
    if (caseRes.rows.length === 0) {
      const error=new Error('Kasus tidak ditemukan.');error.statusCode=404;throw error;
    }
    const currentCase = caseRes.rows[0];
    if(currentCase.case_type==='pattern'){const error=new Error('Kasus pola memerlukan penelusuran agregat, bukan putusan klaim individual.');error.statusCode=400;throw error;}
    if(['CONFIRMED','NOT_CONFIRMED','CLOSED'].includes(currentCase.case_status)){const error=new Error('Kasus sudah diputuskan; gunakan alur peninjauan ulang terpisah.');error.statusCode=409;throw error;}
    if(currentCase.assigned_to!==reviewerId){const error=new Error('Kasus belum ditugaskan kepada Anda.');error.statusCode=403;throw error;}
    if(!['CONFIRMED','NOT_CONFIRMED','NEEDS_MORE_EVIDENCE','FALSE_POSITIVE','ESCALATED'].includes(outcome)||!notes?.trim()){const error=new Error('Keputusan dan catatan telaah wajib diisi.');error.statusCode=400;throw error;}
    const prevStatus = currentCase.case_status;

    // 2. Generate review_id
    const reviewId = `REV-${randomUUID().replaceAll('-','').slice(0,24)}`;
    
    // 3. Insert review outcome
    await client.query(`
      INSERT INTO review_outcomes (review_id, case_id, reviewer_id, outcome, notes, reviewed_at, data_status)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'SYNTHETIC')
    `, [reviewId, caseId, reviewerId, outcome, notes]);

    // 4. Update case status based on outcome
    let newStatus = 'REVIEWED';
    if (outcome === 'NEEDS_MORE_EVIDENCE') {
      newStatus = 'NEEDS_MORE_EVIDENCE';
    } else if (outcome === 'CONFIRMED') {
      newStatus = 'CONFIRMED';
    } else if (outcome === 'FALSE_POSITIVE' || outcome === 'NOT_CONFIRMED') {
      newStatus = 'NOT_CONFIRMED';
    }

    await client.query(`
      UPDATE cases 
      SET case_status = $1 
      WHERE case_id = $2
    `, [newStatus, caseId]);

    if(outcome==='ESCALATED')newStatus='ESCALATED';
    await client.query('UPDATE cases SET case_status=$1 WHERE case_id=$2',[newStatus,caseId]);
    await client.query("INSERT INTO case_documents(id,case_id,kind,payload,actor) VALUES($1,$2,'decision_snapshot',$3,$4)",[randomUUID(),caseId,JSON.stringify({initialAnalysis:currentCase.initial_analysis,engineVersion:currentCase.engine_version,riskScore:currentCase.risk_score,outcome}),reviewerId]);
    // 5. Insert audit log
    const auditDetail = `Reviewer ${reviewerId} submitted outcome [${outcome}] with note: "${notes || '-'}" (Status transitioned from ${prevStatus} to ${newStatus})`;
    await client.query(`
      INSERT INTO audit_logs (case_id, actor_id, action, detail, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [caseId, reviewerId, 'OUTCOME_SAVED', auditDetail]);

    await createNotification(client, {
      caseId,
      recipientRole: 'staff_jkn',
      senderUsername: reviewerId,
      senderName: reviewerName || reviewerId,
      title: `Hasil Telaah Klinis: ${caseId}`,
      message: `${reviewerName || reviewerId} telah menetapkan hasil telaah [${outcome}] pada kasus ${caseId}. Catatan: "${notes || '-'}"`,
      type: 'outcome'
    });

    await client.query('COMMIT');

    return {
      reviewId,
      caseId,
      reviewerId,
      outcome,
      notes,
      previousStatus: prevStatus,
      newStatus,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function assignCaseReviewer(caseId, { assignedTo, assignedName, note, assignedBy = 'Staff JKN' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const doctor=users.find(u=>u.username===assignedTo&&u.role==='clinical_reviewer');
    if(!doctor){const e=new Error('Dokter penelaah tidak valid.');e.statusCode=400;throw e;}
    assignedName=doctor.name;
    const existing=await client.query('SELECT case_id,case_status FROM cases WHERE case_id=$1 FOR UPDATE',[caseId]);
    if(!existing.rows.length){const e=new Error('Kasus tidak ditemukan.');e.statusCode=404;throw e;}
    if(['CONFIRMED','NOT_CONFIRMED','CLOSED'].includes(existing.rows[0].case_status)){const e=new Error('Kasus sudah diputuskan.');e.statusCode=409;throw e;}
    await client.query(`
      UPDATE cases
      SET assigned_to = $1, assigned_name = $2, case_status = 'IN_REVIEW'
      WHERE case_id = $3
    `, [assignedTo, assignedName, caseId]);

    const auditDetail = `Staff [${assignedBy}] menugaskan kasus ${caseId} kepada Tenaga Kesehatan [${assignedName} (${assignedTo})]. Catatan pengantar: "${note || 'Harap lakukan verifikasi klinis dan telaah rekam medis'}"`;
    await client.query(`
      INSERT INTO audit_logs (case_id, actor_id, action, detail, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [caseId, assignedBy, 'ASSIGNED_TO_CLINICIAN', auditDetail]);

    await createNotification(client, {
      caseId,
      recipientUsername: assignedTo,
      recipientRole: 'clinical_reviewer',
      senderUsername: assignedBy,
      senderName: assignedBy,
      title: `Penugasan Berkas Kasus ${caseId}`,
      message: `Staff [${assignedBy}] menugaskan kasus ${caseId} kepada Anda. Catatan: "${note || 'Harap lakukan verifikasi klinis dan telaah rekam medis'}"`,
      type: 'assignment'
    });

    await client.query('COMMIT');
    return {
      caseId,
      assignedTo,
      assignedName,
      status: 'IN_REVIEW',
      auditDetail
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function recordCaseAction(caseId,kind,payload,actor) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const row=(await client.query('SELECT * FROM cases WHERE case_id=$1 FOR UPDATE',[caseId])).rows[0];
    if(!row){const e=new Error('Kasus tidak ditemukan');e.statusCode=404;throw e;}
    if(kind==='dispute'&&actor?.role!=='staff_jkn'){const e=new Error('Peran Anda tidak berwenang melakukan tindakan ini.');e.statusCode=403;throw e;}
    const isAllowedDisputeRevision = kind === 'dispute' && actor?.role === 'staff_jkn' && payload?.allowRevision === true;
    if(['CONFIRMED','NOT_CONFIRMED','CLOSED'].includes(row.case_status)&&!['feedback','copilot'].includes(kind)&&!isAllowedDisputeRevision){const e=new Error('Kasus sudah diputuskan; bukti baru memerlukan peninjauan ulang terpisah.');e.statusCode=409;throw e;}
    const id=randomUUID();
    if(kind==='ownership')await client.query("UPDATE cases SET staff_handler=$1,case_status=CASE WHEN case_status IN ('OPEN','NEW') THEN 'TRIAGED' ELSE case_status END WHERE case_id=$2",[actor.username,caseId]);
    if(['dispute','clarification','evidence','copilot','schedule','feedback'].includes(kind)){
      if(typeof payload!=='object'||!payload||(kind!=='copilot'&&!String(payload.title||payload.reason||'').trim())){const e=new Error('Judul atau alasan wajib diisi.');e.statusCode=400;throw e;}
      if(JSON.stringify(payload).length>16000){const e=new Error('Catatan terlalu panjang.');e.statusCode=400;throw e;}
      if(kind==='schedule'&&(!/^\d{4}-\d{2}-\d{2}$/.test(payload.date||'')||!payload.time)){const e=new Error('Tanggal dan waktu jadwal wajib diisi.');e.statusCode=400;throw e;}
      if(kind==='evidence'){
        let itemId=payload.claimItemId;
        if(!itemId){
          const firstItem=(await client.query('SELECT claim_item_id FROM claim_items WHERE claim_id=$1 ORDER BY sequence_no ASC LIMIT 1',[row.claim_id])).rows[0];
          if(firstItem)itemId=firstItem.claim_item_id;
        }
        if(itemId){const item=(await client.query('SELECT * FROM claim_items WHERE claim_item_id=$1 AND claim_id=$2',[itemId,row.claim_id])).rows[0];if(!item){const e=new Error('Item bukti tidak sesuai kasus.');e.statusCode=400;throw e;}
          const verified=payload.verified===true,supported=verified?Number(payload.supportedQuantity||0):0;
          if(!Number.isFinite(supported)||supported<0||supported>Number(item.quantity)){const e=new Error('Kuantitas bukti tidak valid.');e.statusCode=400;throw e;}
          await client.query('INSERT INTO evidence_links(evidence_link_id,claim_item_id,evidence_type,source_id,match_status,match_quantity,availability,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,\'YES\',$7,$8)',[id,itemId,String(payload.evidenceType||'MEDICAL_RECORD').slice(0,50),String(payload.title).slice(0,50),verified?'MATCHED':'PENDING',supported,String(payload.note||''),actor.username]);
        }
        payload={...payload,claimItemId:itemId||null,status:payload.file?.fileId?'FILE_ATTACHED':'METADATA_RECORDED',availability:'YES',matchStatus:payload.verified?'MATCHED':'PENDING',evidenceId:id,reference:payload.title,scope:payload.file?.fileId?'file_and_metadata':'metadata_only'};
      }
      if(kind==='feedback')await client.query('INSERT INTO ai_feedback(id,case_id,engine_version,risk_score,reason,note,actor) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,caseId,row.engine_version,row.risk_score,payload.reason,payload.note||'',actor.username]);
      await client.query('INSERT INTO case_documents(id,case_id,kind,payload,actor) VALUES($1,$2,$3,$4,$5)',[id,caseId,kind,JSON.stringify(payload),actor.username]);
      if(kind==='dispute')await client.query("UPDATE cases SET case_status='RECONCILIATION' WHERE case_id=$1",[caseId]);
    }
    await client.query('INSERT INTO audit_logs(case_id,actor_id,action,detail) VALUES($1,$2,$3,$4)',[caseId,actor.username,{ownership:'CASE_CLAIMED',dispute:'DISPUTE_SUBMITTED',clarification:'CLARIFICATION_REQUESTED',evidence:'EVIDENCE_ATTACHED',copilot:'EVIDENCE_GAP_DRAFT_SAVED',schedule:'CLARIFICATION_SCHEDULED',feedback:'AI_FEEDBACK_RECORDED'}[kind],JSON.stringify({actorName:actor.name,...payload})]);
    if(['evidence','dispute'].includes(kind)) {
      const items=(await client.query('SELECT * FROM claim_items WHERE claim_id=$1',[row.claim_id])).rows;
      const links=(await client.query('SELECT e.* FROM evidence_links e JOIN claim_items i USING(claim_item_id) WHERE i.claim_id=$1',[row.claim_id])).rows;
      const canonical=items.map(i=>itemContract(i,links));
      const analysis=analyzeClaim({...row.metadata?.features,evidenceAvailable:canonical.every(i=>i.calculatedStatus!=='UNAVAILABLE'),claimedQty:canonical.reduce((n,i)=>n+i.claimedQuantity,0),supportedQty:canonical.reduce((n,i)=>n+i.supportedQuantity,0)});
      await client.query('INSERT INTO case_documents(id,case_id,kind,payload,actor) VALUES($1,$2,\'score_history\',$3,$4)',[randomUUID(),caseId,JSON.stringify({before:row.analysis,after:analysis}),actor.username]);
      await client.query('UPDATE cases SET analysis=$1,risk_score=$2,review_priority=$3,evidence_coverage_pct=$4,evidence_gap=$5,review_focus=$7 WHERE case_id=$6',[JSON.stringify(analysis),analysis.riskScore,analysis.reviewPriority,analysis.evidenceCoveragePct,analysis.evidenceGap,caseId,analysis.reviewFocus]);
    }
    if(kind==='dispute'){
      await createNotification(client,{caseId,recipientRole:'staff_jkn',senderUsername:actor.username,senderName:actor.name||actor.username,title:`Sanggahan Faskes Masuk: ${caseId}`,message:`${payload.actor||actor.name||'Faskes'} menyampaikan sanggahan pada kasus ${caseId}: "${payload.title}"`,type:'dispute'});
      if(row.assigned_to){await createNotification(client,{caseId,recipientUsername:row.assigned_to,recipientRole:'clinical_reviewer',senderUsername:actor.username,senderName:actor.name||actor.username,title:`Sanggahan Faskes Masuk: ${caseId}`,message:`${payload.actor||actor.name||'Faskes'} menyampaikan sanggahan pada kasus ${caseId}: "${payload.title}"`,type:'dispute'});}
    }
    if(kind==='evidence'){
      const targetRole=actor.role==='staff_jkn'?'clinical_reviewer':'staff_jkn';
      const targetUser=actor.role==='staff_jkn'?row.assigned_to:null;
      await createNotification(client,{caseId,recipientUsername:targetUser,recipientRole:targetRole,senderUsername:actor.username,senderName:actor.name||actor.username,title:`Bukti Pendukung Ditambahkan: ${caseId}`,message:`Dokumen bukti "${payload.title}" telah ditambahkan pada berkas kasus ${caseId}.`,type:'evidence'});
    }
    if(kind==='clarification'){
      await createNotification(client,{caseId,recipientUsername:payload.targetDoctorId||row.assigned_to,recipientRole:'clinical_reviewer',senderUsername:actor.username,senderName:actor.name||actor.username,title:`Permintaan Klarifikasi Medis: ${caseId}`,message:`Staff [${actor.name||actor.username}] meminta klarifikasi medis: "${payload.title}"`,type:'clarification'});
    }
    await client.query('COMMIT');return {id,caseId,persisted:true,kind};
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}

const ALLOWED_FILE_EXTENSIONS = {
  evidence: new Set(['.pdf', '.jpg', '.jpeg', '.png', '.dcm', '.dicom']),
  dispute: new Set(['.pdf', '.jpg', '.jpeg', '.png'])
};

export async function saveCaseFile(caseId, { buffer, originalName, mimeType, kind = 'evidence', actor = {} }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const e = new Error('File bukti wajib dipilih dan tidak boleh kosong.');
    e.statusCode = 400;
    throw e;
  }
  if (buffer.length > 10 * 1024 * 1024) {
    const e = new Error('Ukuran file melebihi batas maksimum 10 MB.');
    e.statusCode = 400;
    throw e;
  }
  const cleanOriginal = path.basename(String(originalName || 'dokumen.pdf')).trim() || 'dokumen.pdf';
  const ext = path.extname(cleanOriginal).toLowerCase();
  const allowedSet = ALLOWED_FILE_EXTENSIONS[kind] || ALLOWED_FILE_EXTENSIONS.evidence;
  if (!allowedSet.has(ext)) {
    const e = new Error(
      kind === 'dispute'
        ? 'Format file lampiran tidak didukung. Gunakan file PDF, JPG, atau PNG.'
        : 'Format file bukti tidak didukung. Gunakan file PDF, JPG/PNG, atau DICOM (.dcm).'
    );
    e.statusCode = 400;
    throw e;
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT case_id FROM cases WHERE case_id = $1', [caseId]);
    if (existing.rows.length === 0) {
      const e = new Error('Kasus tidak ditemukan.');
      e.statusCode = 404;
      throw e;
    }

    const fileId = `FILE-${randomUUID().replaceAll('-', '').slice(0, 16)}`;
    const safeCaseDir = String(caseId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = cleanOriginal.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const storedFileName = `${fileId}-${safeFileName}`;
    const targetDir = path.join(UPLOADS_ROOT, safeCaseDir);
    fs.mkdirSync(targetDir, { recursive: true });
    const fullPath = path.join(targetDir, storedFileName);
    fs.writeFileSync(fullPath, buffer);

    const resolvedMime =
      ext === '.pdf' ? 'application/pdf'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.png' ? 'image/png'
      : ext === '.dcm' || ext === '.dicom' ? 'application/dicom'
      : (mimeType || 'application/octet-stream');

    const sizeLabel = formatFileSize(buffer.length);
    const metaPayload = {
      fileId,
      name: cleanOriginal,
      fileName: cleanOriginal,
      storedFileName,
      mimeType: resolvedMime,
      fileSize: buffer.length,
      size: sizeLabel,
      kind,
      downloadUrl: `/cases/${encodeURIComponent(caseId)}/files/${encodeURIComponent(fileId)}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actor?.username || 'system',
      uploaderName: actor?.name || actor?.username || 'Pengguna'
    };

    await client.query(
      "INSERT INTO case_documents(id, case_id, kind, payload, actor) VALUES ($1, $2, 'uploaded_file', $3, $4)",
      [randomUUID(), caseId, JSON.stringify(metaPayload), actor?.username || 'system']
    );

    return {
      fileId: metaPayload.fileId,
      name: metaPayload.fileName,
      fileName: metaPayload.fileName,
      mimeType: metaPayload.mimeType,
      fileSize: metaPayload.fileSize,
      size: metaPayload.size,
      downloadUrl: metaPayload.downloadUrl,
      uploadedAt: metaPayload.uploadedAt
    };
  } finally {
    client.release();
  }
}

export async function getCaseFile(caseId, fileId) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT payload FROM case_documents WHERE case_id = $1 AND kind = 'uploaded_file' AND payload->>'fileId' = $2 LIMIT 1",
      [caseId, fileId]
    );
    if (res.rows.length === 0) {
      const e = new Error('Berkas dokumen tidak ditemukan.');
      e.statusCode = 404;
      throw e;
    }
    const meta = res.rows[0].payload;
    const safeCaseDir = String(caseId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(UPLOADS_ROOT, safeCaseDir, path.basename(String(meta.storedFileName || '')));
    if (!fs.existsSync(filePath)) {
      const e = new Error('File fisik tidak ditemukan pada penyimpanan lokal.');
      e.statusCode = 404;
      throw e;
    }
    return {
      filePath,
      fileName: meta.fileName || 'dokumen.pdf',
      mimeType: meta.mimeType || 'application/octet-stream',
      fileSize: meta.fileSize || 0
    };
  } finally {
    client.release();
  }
}
