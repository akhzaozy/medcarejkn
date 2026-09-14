import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { detectNhisFraud } from '../backend/src/decision-engine/nhisFraudDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'jkn_integrity',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined
});

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

const PROVIDERS = [
  { id: 'PROV-001', name: 'RSUP Dr. Sardjito', type: 'RUMAH_SAKIT_PUSAT' },
  { id: 'PROV-002', name: 'RSUD Kota Yogyakarta', type: 'RUMAH_SAKIT_DAERAH' },
  { id: 'PROV-003', name: 'RS PKU Muhammadiyah', type: 'RUMAH_SAKIT_SWASTA' },
  { id: 'PROV-004', name: 'Klinik Pratama Sehat Utama', type: 'KLINIK_PRATAMA' },
  { id: 'PROV-005', name: 'Puskesmas Gondomanan', type: 'PUSKESMAS' }
];

async function runImport() {
  const client = await pool.connect();
  try {
    console.log('[NHIS Import] Menyiapkan database PostgreSQL...');
    
    // 1. Reset Schema
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf-8');
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
    console.log('[NHIS Import] Skema database berhasil di-reset.');

    // 2. Insert Providers
    for (const pr of PROVIDERS) {
      await client.query(
        'INSERT INTO providers (provider_id, provider_name, provider_type, data_status) VALUES ($1, $2, $3, $4)',
        [pr.id, pr.name, pr.type, 'ACTIVE']
      );
    }
    console.log(`[NHIS Import] ${PROVIDERS.length} Faskes/Provider berhasil didaftarkan.`);

    // 3. Load Datasets
    const cleanedFile = path.join(__dirname, '../dataset/cleaned_nhis_with_fraud_types.csv');
    const combinedFile = path.join(__dirname, '../dataset/combined_nhis_dataset_with_fraud_types.csv');

    console.log('[NHIS Import] Membaca dataset cleaned_nhis_with_fraud_types.csv...');
    const cleanedRows = parseCSV(fs.readFileSync(cleanedFile, 'utf-8'));
    console.log(`[NHIS Import] Ditemukan ${cleanedRows.length} baris data cleaned.`);

    // Also include sample of Ghost Enrollee from combined so it is fully represented in cases queue
    let combinedGhostRows = [];
    if (fs.existsSync(combinedFile)) {
      console.log('[NHIS Import] Membaca sampel representatif Ghost Enrollee dari combined dataset...');
      const combinedAll = parseCSV(fs.readFileSync(combinedFile, 'utf-8'));
      combinedGhostRows = combinedAll.filter(r => r.FRAUD_TYPE === 'Ghost Enrollee').slice(0, 150);
      console.log(`[NHIS Import] Menambahkan ${combinedGhostRows.length} sampel Ghost Enrollee.`);
    }

    const allIngestRows = [...cleanedRows, ...combinedGhostRows];

    // Track unique patients to avoid FK violations
    const insertedPatients = new Set();
    let claimSeq = 1;
    let caseCount = 0;
    let signalCount = 0;

    await client.query('BEGIN');

    for (let i = 0; i < allIngestRows.length; i++) {
      const row = allIngestRows[i];
      const rawPid = row['Patient ID'] || `${i + 1}`;
      const patientId = `PAT-${String(rawPid).padStart(6, '0')}`;
      const encounterId = `ENC-${String(claimSeq).padStart(6, '0')}`;
      const claimId = `CLM-${String(claimSeq).padStart(6, '0')}`;
      const claimItemId = `CITM-${String(claimSeq).padStart(6, '0')}-01`;
      
      const prov = PROVIDERS[claimSeq % PROVIDERS.length];

      // Age and Age Group
      let ageVal = parseFloat(row.AGE || 45);
      if (isNaN(ageVal)) ageVal = 45;
      let ageGroup = 'DEWASA (18-59)';
      if (ageVal < 18) ageGroup = 'ANAK (<18)';
      else if (ageVal >= 60) ageGroup = 'LANSIA (60+)';

      const gender = (row.GENDER || 'F').toUpperCase().startsWith('M') ? 'M' : 'F';
      const amount = Math.max(0, parseFloat(row['Amount Billed'] || 0));
      const diagnosisText = (row.DIAGNOSIS || 'DIAGNOSIS UMUM').trim().toUpperCase() || 'GENERAL MEDICAL ENCOUNTER';
      
      const encounterDate = row['DATE OF ENCOUNTER'] && row['DATE OF ENCOUNTER'].trim() !== '' 
        ? row['DATE OF ENCOUNTER'].trim() 
        : '2025-01-15';

      // Insert Patient if not exists
      if (!insertedPatients.has(patientId)) {
        await client.query(
          'INSERT INTO patients (patient_id, age_group, sex, data_status) VALUES ($1, $2, $3, $4) ON CONFLICT (patient_id) DO NOTHING',
          [patientId, ageGroup, gender, 'VERIFIED']
        );
        insertedPatients.add(patientId);
      }

      // Insert Encounter
      await client.query(
        'INSERT INTO encounters (encounter_id, patient_id, provider_id, service_date, encounter_type, data_status) VALUES ($1, $2, $3, $4, $5, $6)',
        [encounterId, patientId, prov.id, encounterDate, amount > 15000 ? 'RAWAT_INAP' : 'RAWAT_JALAN', 'VERIFIED']
      );

      // Insert Diagnosis
      await client.query(
        'INSERT INTO diagnoses (diagnosis_id, encounter_id, diagnosis_code, diagnosis_role, data_status) VALUES ($1, $2, $3, $4, $5)',
        [`DIAG-${claimSeq}`, encounterId, diagnosisText.slice(0, 30), 'PRIMARY', 'VERIFIED']
      );

      // Insert Claim
      await client.query(
        'INSERT INTO claims (claim_id, encounter_id, provider_id, claim_date, claim_status, total_amount, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [claimId, encounterId, prov.id, encounterDate, 'SUBMITTED', amount, 'VERIFIED']
      );

      // Insert Claim Item
      const groundTruth = row.FRAUD_TYPE === 'No Fraud' ? 'SUPPORTED' : 'UNSUPPORTED';
      await client.query(
        'INSERT INTO claim_items (claim_item_id, claim_id, sequence_no, service_code, service_type, quantity, unit_price, net_amount, encounter_id, ground_truth_item_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [claimItemId, claimId, 1, diagnosisText.slice(0, 20), 'PAKET_INA_CBG', 1, amount, amount, encounterId, groundTruth]
      );

      // Run Fraud Engine Detection
      const detection = detectNhisFraud({
        gender,
        age: ageVal,
        diagnosis: diagnosisText,
        amountBilled: amount
      });

      const actualFraud = row.FRAUD_TYPE || 'No Fraud';
      const isSuspect = actualFraud !== 'No Fraud' || detection.fraudType !== 'No Fraud';

      if (isSuspect) {
        caseCount++;
        const caseId = `CASE-${String(caseCount).padStart(5, '0')}`;
        const primaryRiskMode = detection.primaryRiskMode === 'NO_FRAUD' 
          ? (actualFraud === 'Phantom Billing' ? 'PHANTOM_BILLING' : actualFraud === 'Ghost Enrollee' ? 'GHOST_ENROLLEE' : 'WRONG_DIAGNOSIS')
          : detection.primaryRiskMode;
        
        const priority = detection.reviewPriority === 'LOW' ? 'MEDIUM' : detection.reviewPriority;

        await client.query(
          'INSERT INTO cases (case_id, claim_id, primary_risk_mode, review_priority, case_status, affected_items, evidence_gap, evidence_coverage_pct, review_focus, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            caseId,
            claimId,
            primaryRiskMode,
            priority,
            'OPEN',
            `Item #1: ${diagnosisText.slice(0, 40)}`,
            amount > 0 ? amount : 5000.0,
            detection.evidenceCoveragePct,
            detection.reviewFocus,
            'VERIFIED'
          ]
        );

        // Insert Risk Signals
        for (const reason of detection.reasons) {
          signalCount++;
          await client.query(
            'INSERT INTO risk_signals (signal_id, claim_id, claim_item_id, signal_type, severity, reason_code, reason_detail, data_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [
              `SIG-${String(signalCount).padStart(6, '0')}`,
              claimId,
              claimItemId,
              primaryRiskMode,
              priority,
              primaryRiskMode,
              reason,
              'VERIFIED'
            ]
          );
        }
      }

      claimSeq++;
      if (claimSeq % 1000 === 0) {
        console.log(`[NHIS Import] Diproses ${claimSeq} baris data...`);
      }
    }

    // Insert traceable audit log
    await client.query(
      "INSERT INTO audit_logs (case_id, actor_id, action, detail) VALUES ('CASE-00001', 'SYSTEM_INGESTION', 'DATASET_INTEGRATION', 'Integrasi komprehensif dataset NHIS Cleaned (4.388) dan Validasi ke PostgreSQL berhasil.')"
    );

    await client.query('COMMIT');

    console.log('====================================================');
    console.log(`[NHIS Import Sukses!]`);
    console.log(`- Total Pasien: ${insertedPatients.size}`);
    console.log(`- Total Klaim & Encounter: ${claimSeq - 1}`);
    console.log(`- Total Kasus Fraud Dibuat: ${caseCount}`);
    console.log(`- Total Risk Signals Dibuat: ${signalCount}`);
    console.log('====================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[NHIS Import Error]:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runImport();
