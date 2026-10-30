import pool from '../config/db.js';
import { analyzeClaim } from '../../../shared/riskEngine.js';
import { reconcileItem } from '../decision-engine/evidenceReconciliation.js';
import { randomUUID } from 'node:crypto';

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

export async function auditCheckClaim(req, res, next) {
  const input = req.body || {};
  const selectedMode = input.riskMode || 'ALL';
  if (!['ALL', 'PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW'].includes(selectedMode)) {
    return res.status(400).json({ message: 'Mode risiko dinonaktifkan sementara. Fitur aktif: PHANTOM_BILLING, UPCODING, EVIDENCE_REVIEW.' });
  }

  const amount = Number(input.amountBilled ?? 0), qty = Number(input.claimedQty ?? 1), supported = Number(input.supportedQty ?? 0);
  if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999) return res.status(400).json({ message: 'Nilai tagihan tidak valid.' });
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(supported) || supported < 0 || supported > qty) return res.status(400).json({ message: 'Kuantitas layanan dan bukti tidak valid.' });
  if (input.dateEncounter && (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateEncounter) || !Number.isFinite(Date.parse(input.dateEncounter)) || new Date(input.dateEncounter).toISOString().slice(0, 10) !== input.dateEncounter)) return res.status(400).json({ message: 'Tanggal layanan tidak valid.' });

  // Target-scoped payload: allow only Phantom Billing, Upcoding, and Evidence Review inputs
  const scopedInput = {
    amountBilled: amount,
    claimedQty: qty,
    supportedQty: supported,
    evidenceAvailable: input.evidenceAvailable,
    dateEncounter: input.dateEncounter,
    diagnosis: input.diagnosis,
    patientId: input.patientId,
    age: input.age,
    gender: input.gender,
    providerId: input.providerId,
    saveCase: Boolean(input.saveCase)
  };

  // Evaluate tariffGap only when UPCODING or ALL mode is requested
  if (selectedMode === 'UPCODING' || selectedMode === 'ALL') {
    if (input.referenceTariff !== undefined && input.referenceTariff !== null && input.referenceTariff !== '') {
      const ref = Number(input.referenceTariff);
      if (Number.isFinite(ref) && ref >= 0) {
        scopedInput.tariffGap = Math.max(0, amount - ref);
        scopedInput.referenceTariff = ref;
      }
    } else if (Number.isFinite(Number(input.tariffGap))) {
      scopedInput.tariffGap = Math.max(0, Number(input.tariffGap));
    }
  }

  // Deterministic evidence reconciliation using existing engine
  const recon = reconcileItem({
    claimedQty: qty,
    supportedQty: supported,
    evidenceAvailable: input.evidenceAvailable
  });

  const analysis = analyzeClaim(scopedInput);

  // Isolate evaluation strictly per selected riskMode
  if (selectedMode === 'PHANTOM_BILLING') {
    // Phantom Billing: evaluate PB-01; UC-01 must never influence score
    analysis.signals = analysis.signals.filter(s => ['PB-01', 'EVIDENCE-COMPLETE', 'EVIDENCE-MISSING'].includes(s.id) && s.id !== 'UC-01');
  } else if (selectedMode === 'UPCODING') {
    // Upcoding: evaluate UC-01; PB-01 must never influence score
    analysis.signals = analysis.signals.filter(s => ['UC-01', 'EVIDENCE-COMPLETE', 'EVIDENCE-MISSING'].includes(s.id) && s.id !== 'PB-01');
  } else if (selectedMode === 'EVIDENCE_REVIEW') {
    // Evidence Review: not a fraud rule; no ER-01, no artificial fraud score, pure evidence reconciliation
    analysis.signals = [{
      id: recon.status === 'UNAVAILABLE' ? 'EVIDENCE-MISSING' : 'EVIDENCE-RECONCILIATION',
      label: recon.reason,
      compared: ['claimedQty', 'supportedQty', 'evidenceAvailable'],
      observedValue: recon.status === 'UNAVAILABLE' ? null : supported,
      expected: recon.status === 'UNAVAILABLE' ? 'Bukti layanan' : qty,
      rawWeight: 0,
      contribution: 0,
      contributionType: 'evidence_reconciliation',
      dataStatus: recon.availability === 'AVAILABLE' ? 'available' : 'missing',
      nextAction: recon.status === 'UNAVAILABLE'
        ? 'Minta bukti layanan, tanpa menyimpulkan fraud.'
        : recon.status === 'SUPPORTED'
        ? 'Tinjau kesesuaian sumber bukti.'
        : 'Periksa kelengkapan dokumen pendukung dan konfirmasi selisih kuantitas.',
      status: recon.status
    }];
  } else {
    // ALL: combined evaluation of PB-01 and UC-01 only; never activates legacy rules (UP-01, DC-01, WD-01, GE-01)
    analysis.signals = analysis.signals.filter(s => ['PB-01', 'UC-01', 'EVIDENCE-COMPLETE', 'EVIDENCE-MISSING'].includes(s.id));
  }

  // Ensure fallback signal if empty
  if (analysis.signals.length === 0) {
    const isKnown = scopedInput.evidenceAvailable === true && Number.isFinite(qty) && Number.isFinite(supported);
    analysis.signals.push({
      id: isKnown ? 'EVIDENCE-COMPLETE' : 'EVIDENCE-MISSING',
      label: isKnown ? 'Bukti tercatat mendukung kuantitas layanan' : 'Bukti belum tersedia untuk disimpulkan',
      compared: ['evidenceAvailable', 'claimedQty', 'supportedQty'],
      observedValue: isKnown ? supported : null,
      expected: isKnown ? qty : 'Bukti layanan',
      contribution: 0,
      rawWeight: 0,
      contributionType: 'rule_weight',
      dataStatus: isKnown ? 'available' : 'missing',
      nextAction: isKnown ? 'Tinjau kesesuaian sumber bukti.' : 'Minta bukti layanan, tanpa menyimpulkan fraud.'
    });
  }

  // Recalculate riskScore strictly from allowed signals for this mode
  const rawSum = analysis.signals.reduce((acc, s) => acc + (s.rawWeight || 0), 0);
  analysis.riskScore = Math.min(100, rawSum);
  for (const signal of analysis.signals) {
    signal.contribution = rawSum > 100 ? (signal.rawWeight * 100) / rawSum : signal.rawWeight;
  }

  const evidenceKnown = scopedInput.evidenceAvailable === true && Number.isFinite(qty) && Number.isFinite(supported);
  analysis.reconciliation = recon;
  analysis.evidenceCoveragePct = evidenceKnown ? recon.coveragePct : null;
  analysis.evidenceGap = evidenceKnown ? recon.gap : null;

  // Outcome determination with safety guardrails
  if (scopedInput.evidenceAvailable === false || recon.status === 'UNAVAILABLE') {
    if (selectedMode === 'PHANTOM_BILLING' || selectedMode === 'EVIDENCE_REVIEW' || (selectedMode === 'ALL' && (!scopedInput.tariffGap || scopedInput.tariffGap <= 0))) {
      analysis.riskScore = 0;
    }
    analysis.riskLevel = 'UNAVAILABLE';
    analysis.reviewPriority = 'NO_CONCLUSION';
    analysis.primaryRiskMode = 'UNAVAILABLE';
    analysis.fraudType = 'Bukti belum tersedia';
    analysis.evidenceGap = null;
    analysis.evidenceCoveragePct = null;
  } else if (selectedMode === 'EVIDENCE_REVIEW') {
    analysis.riskScore = 0;
    analysis.riskLevel = recon.reviewPriority === 'HIGH' ? 'HIGH' : recon.reviewPriority === 'MEDIUM' ? 'MEDIUM' : 'LOW';
    analysis.reviewPriority = recon.reviewPriority;
    analysis.primaryRiskMode = 'EVIDENCE_REVIEW';
    analysis.fraudType = 'Kesenjangan Bukti Layanan';
  } else if (selectedMode === 'PHANTOM_BILLING') {
    const pbSignal = analysis.signals.find(s => s.id === 'PB-01');
    analysis.riskLevel = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : (!evidenceKnown ? 'UNAVAILABLE' : 'LOW');
    analysis.reviewPriority = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : (!evidenceKnown ? 'NO_CONCLUSION' : 'LOW');
    analysis.primaryRiskMode = pbSignal ? 'PHANTOM_BILLING' : (analysis.evidenceGap > 0 ? 'EVIDENCE_REVIEW' : (!evidenceKnown ? 'UNAVAILABLE' : 'NO_FRAUD'));
    analysis.fraudType = pbSignal ? 'PHANTOM_BILLING' : (analysis.evidenceGap > 0 ? 'Kesenjangan Bukti Layanan' : (!evidenceKnown ? 'Bukti belum tersedia' : 'No Fraud'));
  } else if (selectedMode === 'UPCODING') {
    const ucSignal = analysis.signals.find(s => s.id === 'UC-01');
    analysis.riskLevel = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : (!evidenceKnown ? 'UNAVAILABLE' : 'LOW');
    analysis.reviewPriority = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : (!evidenceKnown ? 'NO_CONCLUSION' : 'LOW');
    analysis.primaryRiskMode = ucSignal ? 'UPCODING' : (!evidenceKnown ? 'UNAVAILABLE' : 'NO_FRAUD');
    analysis.fraudType = ucSignal ? 'UPCODING' : (!evidenceKnown ? 'Bukti belum tersedia' : 'No Fraud');
  } else {
    // ALL mode
    analysis.riskLevel = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : (!evidenceKnown ? 'UNAVAILABLE' : 'LOW');
    analysis.reviewPriority = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : (!evidenceKnown ? 'NO_CONCLUSION' : 'LOW');
    const mainSignal = analysis.signals.find(s => s.fraudType);
    analysis.primaryRiskMode = mainSignal?.fraudType || (analysis.evidenceGap > 0 ? 'EVIDENCE_REVIEW' : (!evidenceKnown ? 'UNAVAILABLE' : 'NO_FRAUD'));
    analysis.fraudType = mainSignal?.fraudType || (analysis.evidenceGap > 0 ? 'Kesenjangan Bukti Layanan' : (!evidenceKnown ? 'Bukti belum tersedia' : 'No Fraud'));
  }

  analysis.isPhantom = analysis.primaryRiskMode === 'PHANTOM_BILLING';
  analysis.reasons = analysis.signals.map(s => s.label);
  analysis.reviewFocus = analysis.signals.map(s => s.nextAction).join(' ');

  let save = { status: 'not_requested', caseId: null, message: 'Tidak disimpan (opsi simpan dimatikan).' };
  if (input.saveCase) {
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const id = randomUUID().replaceAll('-', '').slice(0, 20),
        patientId = `PAT-${id}`,
        encounterId = `ENC-${id}`,
        claimId = `CLM-${id}`,
        caseId = `CASE-${id}`,
        providerId = 'PROV-MANUAL';
      await client.query("INSERT INTO providers(provider_id,provider_name,provider_type) VALUES($1,'Faskes input manual','MANUAL') ON CONFLICT DO NOTHING", [providerId]);
      await client.query('INSERT INTO patients(patient_id,age_group,sex) VALUES($1,$2,$3)', [patientId, String(input.age ?? 'Tidak tersedia').slice(0, 30), String(input.gender || 'U').slice(0, 1)]);
      await client.query("INSERT INTO encounters(encounter_id,patient_id,provider_id,service_date,encounter_type) VALUES($1,$2,$3,$4,'MANUAL')", [encounterId, patientId, providerId, input.dateEncounter || new Date().toISOString().slice(0, 10)]);
      await client.query("INSERT INTO claims(claim_id,encounter_id,provider_id,claim_date,claim_status,total_amount) VALUES($1,$2,$3,$4,'SUBMITTED',$5)", [claimId, encounterId, providerId, input.dateEncounter || new Date().toISOString().slice(0, 10), Number(input.amountBilled || 0)]);
      await client.query("INSERT INTO claim_items(claim_item_id,claim_id,sequence_no,service_code,service_type,quantity,unit_price,net_amount,encounter_id,description) VALUES($1,$2,1,'MANUAL','DEFAULT',$3,$4,$7,$5,$6)", [`ITEM-${id}`, claimId, qty, amount / qty, encounterId, String(input.diagnosis || 'Layanan manual').slice(0, 300), amount]);
      if (typeof input.evidenceAvailable === 'boolean') {
        await client.query("INSERT INTO evidence_links(evidence_link_id,claim_item_id,evidence_type,source_id,match_status,match_quantity,availability,reason,created_by) VALUES($1,$2,'INPUT_SCENARIO','Skenario input manual',$3,$4,$5,'Nilai terstruktur dari formulir; bukan pembacaan dokumen',$6)", [`EVD-${id}`, `ITEM-${id}`, input.evidenceAvailable ? (Number(input.supportedQty) > 0 ? 'MATCHED' : 'UNSUPPORTED') : 'UNAVAILABLE', input.evidenceAvailable ? Number(input.supportedQty || 0) : 0, input.evidenceAvailable ? 'YES' : 'UNAVAILABLE', req.user?.username || 'unknown']);
      }
      await client.query("INSERT INTO cases(case_id,claim_id,primary_risk_mode,review_priority,case_status,evidence_gap,evidence_coverage_pct,review_focus,source,risk_score,engine_type,engine_version,initial_analysis,analysis,metadata,assigned_to,assigned_name) VALUES($1,$2,$3,$4,'OPEN',$5,$6,$7,'phantom_checker',$8,$9,$10,$11,$11,$12,$13,$14)", [caseId, claimId, analysis.primaryRiskMode, analysis.reviewPriority, analysis.evidenceGap, analysis.evidenceCoveragePct, analysis.reviewFocus, analysis.riskScore, analysis.engine.type, analysis.engine.version, JSON.stringify(analysis), JSON.stringify({ features: scopedInput, primary_diagnosis: input.diagnosis, riskMode: selectedMode }), req.user?.role === 'clinical_reviewer' ? req.user.username : null, req.user?.role === 'clinical_reviewer' ? req.user.name : null]);
      await client.query("INSERT INTO audit_logs(case_id,actor_id,action,detail) VALUES($1,$2,'CASE_CREATED',$3)", [caseId, req.user?.username || 'unknown', JSON.stringify({ source: 'phantom_checker', engine: analysis.engine })]);
      await client.query('COMMIT');
      save = { status: 'saved', caseId, claimId, message: `Tersimpan sebagai kasus ${caseId}` };
    } catch (e) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      save = { status: 'failed', caseId: null, message: 'Analisis berhasil, tetapi kasus gagal disimpan. Periksa layanan database dan coba simpan kembali.' };
    } finally {
      client?.release();
    }
  }
  res.json({ success: true, analysis, save });
}
