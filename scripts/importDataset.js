import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'jkn_integrity',
  user: process.env.DB_USER || 'akhzafachrozy',
  password: process.env.DB_PASSWORD || undefined
});

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function runImport() {
  const client = await pool.connect();
  try {
    console.log('[Dataset Import] Starting clean import from dataset/ ...');
    
    // Read and run schema
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf-8');
    // Drop existing tables in reverse dependency order
    await client.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS review_outcomes CASCADE;
      DROP TABLE IF EXISTS cases CASCADE;
      DROP TABLE IF EXISTS risk_signals CASCADE;
      DROP TABLE IF EXISTS evidence_links CASCADE;
      DROP TABLE IF EXISTS billing_items CASCADE;
      DROP TABLE IF EXISTS claim_items CASCADE;
      DROP TABLE IF EXISTS claims CASCADE;
      DROP TABLE IF EXISTS procedures CASCADE;
      DROP TABLE IF EXISTS diagnoses CASCADE;
      DROP TABLE IF EXISTS encounters CASCADE;
      DROP TABLE IF EXISTS providers CASCADE;
      DROP TABLE IF EXISTS patients CASCADE;
    `);
    await client.query(schemaSql);
    console.log('[Dataset Import] Schema applied successfully.');

    const datasetDir = path.join(__dirname, '../dataset');

    // 1. Patients
    const patients = parseCSV(fs.readFileSync(path.join(datasetDir, 'patients.csv'), 'utf-8'));
    for (const p of patients) {
      await client.query(
        'INSERT INTO patients (patient_id, age_group, sex, data_status) VALUES ($1, $2, $3, $4)',
        [p.patient_id, p.age_group, p.sex, p.data_status || 'SYNTHETIC']
      );
    }
    console.log(`[Imported] ${patients.length} patients`);

    // 2. Providers
    const providers = parseCSV(fs.readFileSync(path.join(datasetDir, 'providers.csv'), 'utf-8'));
    for (const pr of providers) {
      await client.query(
        'INSERT INTO providers (provider_id, provider_name, provider_type, data_status) VALUES ($1, $2, $3, $4)',
        [pr.provider_id, pr.provider_name, pr.provider_type, pr.data_status || 'SYNTHETIC']
      );
    }
    console.log(`[Imported] ${providers.length} providers`);

    // 3. Encounters
    const encounters = parseCSV(fs.readFileSync(path.join(datasetDir, 'encounters.csv'), 'utf-8'));
    for (const e of encounters) {
      await client.query(
        'INSERT INTO encounters (encounter_id, patient_id, provider_id, service_date, encounter_type, data_status) VALUES ($1, $2, $3, $4, $5, $6)',
        [e.encounter_id, e.patient_id, e.provider_id, e.service_date, e.encounter_type, e.data_status || 'SYNTHETIC']
      );
    }
    console.log(`[Imported] ${encounters.length} encounters`);

    // 4. Diagnoses
    const diagnoses = parseCSV(fs.readFileSync(path.join(datasetDir, 'diagnoses.csv'), 'utf-8'));
    for (const d of diagnoses) {
      await client.query(
        'INSERT INTO diagnoses (diagnosis_id, encounter_id, diagnosis_code, diagnosis_role, data_status) VALUES ($1, $2, $3, $4, $5)',
        [d.diagnosis_id, d.encounter_id, d.diagnosis_code, d.diagnosis_role, d.data_status || 'SYNTHETIC']
      );
    }
    console.log(`[Imported] ${diagnoses.length} diagnoses`);

    // 5. Procedures
    const procedures = parseCSV(fs.readFileSync(path.join(datasetDir, 'procedures.csv'), 'utf-8'));
    let unavailProcCount = 1;
    for (const pr of procedures) {
      let procId = pr.procedure_id;
      if (!procId) {
        procId = `PROC-UNAVAIL-${pr.encounter_id}-${unavailProcCount++}`;
      }
      await client.query(
        'INSERT INTO procedures (procedure_id, encounter_id, procedure_code, procedure_date, quantity_supported, record_status, claim_item_id, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          procId,
          pr.encounter_id,
          pr.procedure_code,
          pr.procedure_date || null,
          parseFloat(pr.quantity_supported || 0),
          pr.record_status,
          pr.claim_item_id || null,
          pr.data_status || 'SYNTHETIC'
        ]
      );
    }
    console.log(`[Imported] ${procedures.length} procedures`);

    // 6. Claims
    const claims = parseCSV(fs.readFileSync(path.join(datasetDir, 'claims.csv'), 'utf-8'));
    for (const c of claims) {
      await client.query(
        'INSERT INTO claims (claim_id, encounter_id, provider_id, claim_date, claim_status, total_amount, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [c.claim_id, c.encounter_id, c.provider_id, c.claim_date, c.claim_status, parseFloat(c.total_amount || 0), c.data_status || 'SYNTHETIC']
      );
    }
    console.log(`[Imported] ${claims.length} claims`);

    // 7. Claim Items
    const claimItems = parseCSV(fs.readFileSync(path.join(datasetDir, 'claim_items.csv'), 'utf-8'));
    for (const ci of claimItems) {
      await client.query(
        'INSERT INTO claim_items (claim_item_id, claim_id, sequence_no, service_code, service_type, quantity, unit_price, net_amount, encounter_id, ground_truth_item_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          ci.claim_item_id,
          ci.claim_id,
          parseInt(ci.sequence_no || 1),
          ci.service_code,
          ci.service_type,
          parseFloat(ci.quantity || 0),
          parseFloat(ci.unit_price || 0),
          parseFloat(ci.net_amount || 0),
          ci.encounter_id,
          ci.ground_truth_item_status || null
        ]
      );
    }
    console.log(`[Imported] ${claimItems.length} claim items`);

    // 8. Billing Items
    const billingItems = parseCSV(fs.readFileSync(path.join(datasetDir, 'billing_items.csv'), 'utf-8'));
    for (const b of billingItems) {
      await client.query(
        'INSERT INTO billing_items (billing_id, claim_id, claim_item_id, item_code, quantity, amount, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          b.billing_id,
          b.claim_id,
          b.claim_item_id,
          b.item_code,
          parseFloat(b.quantity || 0),
          parseFloat(b.amount || 0),
          b.data_status || 'SYNTHETIC'
        ]
      );
    }
    console.log(`[Imported] ${billingItems.length} billing items`);

    // 9. Evidence Links
    const evidenceLinks = parseCSV(fs.readFileSync(path.join(datasetDir, 'evidence_links.csv'), 'utf-8'));
    for (const el of evidenceLinks) {
      await client.query(
        'INSERT INTO evidence_links (evidence_link_id, claim_item_id, evidence_type, source_id, match_status, match_quantity, availability, reason, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          el.evidence_link_id,
          el.claim_item_id,
          el.evidence_type,
          el.source_id || null,
          el.match_status,
          parseFloat(el.match_quantity || 0),
          el.availability,
          el.reason || null,
          el.data_status || 'SYNTHETIC'
        ]
      );
    }
    console.log(`[Imported] ${evidenceLinks.length} evidence links`);

    // 10. Risk Signals
    const riskSignals = parseCSV(fs.readFileSync(path.join(datasetDir, 'risk_signals.csv'), 'utf-8'));
    for (const rs of riskSignals) {
      await client.query(
        'INSERT INTO risk_signals (signal_id, claim_id, claim_item_id, signal_type, severity, reason_code, reason_detail, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          rs.signal_id,
          rs.claim_id,
          rs.claim_item_id && rs.claim_item_id.trim().length > 0 ? rs.claim_item_id.trim() : null,
          rs.signal_type,
          rs.severity,
          rs.reason_code || null,
          rs.reason_detail || null,
          rs.data_status || 'SYNTHETIC'
        ]
      );
    }
    console.log(`[Imported] ${riskSignals.length} risk signals`);

    // 11. Cases
    const cases = parseCSV(fs.readFileSync(path.join(datasetDir, 'cases.csv'), 'utf-8'));
    for (const c of cases) {
      await client.query(
        'INSERT INTO cases (case_id, claim_id, primary_risk_mode, review_priority, case_status, affected_items, evidence_gap, evidence_coverage_pct, review_focus, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          c.case_id,
          c.claim_id,
          c.primary_risk_mode,
          c.review_priority,
          c.case_status || 'OPEN',
          c.affected_items || null,
          c.evidence_gap !== '' ? parseFloat(c.evidence_gap) : null,
          c.evidence_coverage_pct !== '' ? parseFloat(c.evidence_coverage_pct) : null,
          c.review_focus || null,
          c.data_status || 'SYNTHETIC'
        ]
      );
    }
    console.log(`[Imported] ${cases.length} cases`);

    // 12. Review Outcomes
    const reviewOutcomesPath = path.join(datasetDir, 'review_outcomes.csv');
    if (fs.existsSync(reviewOutcomesPath)) {
      const reviewOutcomes = parseCSV(fs.readFileSync(reviewOutcomesPath, 'utf-8'));
      for (const ro of reviewOutcomes) {
        await client.query(
          'INSERT INTO review_outcomes (review_id, case_id, reviewer_id, outcome, notes, data_status) VALUES ($1, $2, $3, $4, $5, $6)',
          [ro.review_id, ro.case_id, ro.reviewer_id, ro.outcome, ro.notes || null, ro.data_status || 'SYNTHETIC']
        );
      }
      console.log(`[Imported] ${reviewOutcomes.length} review outcomes`);
    }

    // 13. Audit Logs
    const auditLogsPath = path.join(datasetDir, 'audit_logs.csv');
    if (fs.existsSync(auditLogsPath)) {
      const auditLogs = parseCSV(fs.readFileSync(auditLogsPath, 'utf-8'));
      for (const al of auditLogs) {
        await client.query(
          'INSERT INTO audit_logs (case_id, actor_id, action, detail) VALUES ($1, $2, $3, $4)',
          [al.case_id || null, al.actor_id, al.action, al.detail || null]
        );
      }
      console.log(`[Imported] ${auditLogs.length} audit logs`);
    }

    // Add initial seed audit log entry for traceability demonstration
    await client.query(
      "INSERT INTO audit_logs (case_id, actor_id, action, detail) VALUES ('CASE-0025', 'SYSTEM_INITIALIZER', 'SYSTEM_INIT', 'Initial dataset V4 loaded into PostgreSQL')"
    );

    console.log('--- ALL DATASET V4 TABLES IMPORTED SUCCESSFULLY ---');
  } catch (err) {
    console.error('[Dataset Import Error]:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runImport();
