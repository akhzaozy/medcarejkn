import pool from '../config/db.js';
import { detectNhisFraud } from '../decision-engine/nhisFraudDetector.js';

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
  try {
    const {
      patientId = `PAT-SIM-${Date.now().toString().slice(-4)}`,
      gender = 'F',
      age = 35,
      dateEncounter = new Date().toISOString().split('T')[0],
      dateDischarge = new Date().toISOString().split('T')[0],
      diagnosis = 'GENERAL ENCOUNTER',
      amountBilled = 0,
      providerId = 'PROV-001',
      saveCase = false
    } = req.body;

    const claimData = {
      patientId,
      gender,
      age: parseFloat(age || 0),
      dateEncounter,
      dateDischarge,
      diagnosis,
      amountBilled: parseFloat(amountBilled || 0)
    };

    const detection = detectNhisFraud(claimData);
    const isPhantom = detection.fraudType === 'Phantom Billing';

    let savedRecord = null;

    if (saveCase) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Ensure patient
        const formattedPid = patientId.startsWith('PAT-') ? patientId : `PAT-${patientId}`;
        const ageVal = parseFloat(age || 35);
        let ageGroup = 'DEWASA (18-59)';
        if (ageVal < 18) ageGroup = 'ANAK (<18)';
        else if (ageVal >= 60) ageGroup = 'LANSIA (60+)';

        await client.query(
          'INSERT INTO patients (patient_id, age_group, sex, data_status) VALUES ($1, $2, $3, $4) ON CONFLICT (patient_id) DO UPDATE SET age_group = $2, sex = $3',
          [formattedPid, ageGroup, gender.toUpperCase().startsWith('M') ? 'M' : 'F', 'VERIFIED']
        );

        // Sequence IDs
        const timestampSuffix = Date.now().toString().slice(-6);
        const encounterId = `ENC-SIM-${timestampSuffix}`;
        const claimId = `CLM-SIM-${timestampSuffix}`;
        const claimItemId = `CITM-SIM-${timestampSuffix}-01`;
        const caseId = `CASE-SIM-${timestampSuffix}`;

        // Insert Encounter
        await client.query(
          'INSERT INTO encounters (encounter_id, patient_id, provider_id, service_date, encounter_type, data_status) VALUES ($1, $2, $3, $4, $5, $6)',
          [encounterId, formattedPid, providerId, dateEncounter, parseFloat(amountBilled) > 15000 ? 'RAWAT_INAP' : 'RAWAT_JALAN', 'SIMULASI_MOBILE_JKN']
        );

        // Insert Diagnosis
        await client.query(
          'INSERT INTO diagnoses (diagnosis_id, encounter_id, diagnosis_code, diagnosis_role, data_status) VALUES ($1, $2, $3, $4, $5)',
          [`DIAG-SIM-${timestampSuffix}`, encounterId, diagnosis.slice(0, 30), 'PRIMARY', 'SIMULASI_MOBILE_JKN']
        );

        // Insert Claim
        await client.query(
          'INSERT INTO claims (claim_id, encounter_id, provider_id, claim_date, claim_status, total_amount, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [claimId, encounterId, providerId, dateEncounter, 'SUBMITTED', parseFloat(amountBilled || 0), 'SIMULASI_MOBILE_JKN']
        );

        // Insert Claim Item
        await client.query(
          'INSERT INTO claim_items (claim_item_id, claim_id, sequence_no, service_code, service_type, quantity, unit_price, net_amount, encounter_id, ground_truth_item_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [claimItemId, claimId, 1, diagnosis.slice(0, 20), 'PAKET_INA_CBG', 1, parseFloat(amountBilled || 0), parseFloat(amountBilled || 0), encounterId, isPhantom ? 'UNSUPPORTED' : 'SUPPORTED']
        );

        // Insert Case
        await client.query(
          'INSERT INTO cases (case_id, claim_id, primary_risk_mode, review_priority, case_status, affected_items, evidence_gap, evidence_coverage_pct, review_focus, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            caseId,
            claimId,
            detection.primaryRiskMode,
            detection.reviewPriority,
            'OPEN',
            `Item #1: ${diagnosis.slice(0, 40)}`,
            detection.evidenceGap,
            detection.evidenceCoveragePct,
            detection.reviewFocus,
            'SIMULASI_MOBILE_JKN'
          ]
        );

        // Insert Risk Signals
        for (let idx = 0; idx < detection.reasons.length; idx++) {
          await client.query(
            'INSERT INTO risk_signals (signal_id, claim_id, claim_item_id, signal_type, severity, reason_code, reason_detail, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [
              `SIG-SIM-${timestampSuffix}-${idx + 1}`,
              claimId,
              claimItemId,
              detection.primaryRiskMode,
              detection.reviewPriority,
              detection.primaryRiskMode,
              detection.reasons[idx],
              'SIMULASI_MOBILE_JKN'
            ]
          );
        }

        // Insert Audit Log
        await client.query(
          'INSERT INTO audit_logs (case_id, actor_id, action, detail) VALUES ($1, $2, $3, $4)',
          [caseId, 'MOBILE_JKN_PROXY', 'CLAIM_INPUT_AUDIT', `Klaim diinput via simulasi pelaporan Mobile JKN. Terdeteksi: ${detection.fraudType} (${detection.primaryRiskMode})`]
        );

        await client.query('COMMIT');

        savedRecord = {
          caseId,
          claimId,
          encounterId,
          patientId: formattedPid
        };
      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        isPhantom,
        fraudType: detection.fraudType,
        primaryRiskMode: detection.primaryRiskMode,
        riskScore: detection.riskScore,
        reviewPriority: detection.reviewPriority,
        reasons: detection.reasons,
        evidenceGap: detection.evidenceGap,
        evidenceCoveragePct: detection.evidenceCoveragePct,
        reviewFocus: detection.reviewFocus,
        inputData: claimData,
        savedRecord
      }
    });
  } catch (err) {
    next(err);
  }
}
