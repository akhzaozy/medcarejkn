import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectNhisFraud } from '../decision-engine/nhisFraudDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_DIR = path.join(__dirname, '../../../dataset');

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

const CLASSES = ['No Fraud', 'Phantom Billing', 'Ghost Enrollee', 'Wrong Diagnosis'];

function evaluateDataset(rows, datasetName) {
  let correct = 0;
  let totalBilled = 0;
  let detectedFraudAmount = 0;
  
  const trueCounts = {};
  const predCounts = {};
  CLASSES.forEach(c => {
    trueCounts[c] = 0;
    predCounts[c] = 0;
  });

  const matrix = {};
  CLASSES.forEach(c1 => {
    matrix[c1] = {};
    CLASSES.forEach(c2 => {
      matrix[c1][c2] = 0;
    });
  });

  const flaggedCases = [];

  for (const row of rows) {
    const amount = parseFloat(row['Amount Billed'] || 0);
    totalBilled += amount;

    const actual = row.FRAUD_TYPE || 'No Fraud';
    const detection = detectNhisFraud(row);
    const predicted = detection.fraudType;

    if (trueCounts[actual] !== undefined) trueCounts[actual]++;
    if (predCounts[predicted] !== undefined) predCounts[predicted]++;

    if (matrix[actual] && matrix[actual][predicted] !== undefined) {
      matrix[actual][predicted]++;
    }

    if (actual === predicted) {
      correct++;
    }

    if (predicted !== 'No Fraud') {
      detectedFraudAmount += amount;
      if (flaggedCases.length < 50) {
        flaggedCases.push({
          patientId: row['Patient ID'],
          age: row.AGE,
          gender: row.GENDER,
          diagnosis: row.DIAGNOSIS,
          amountBilled: amount,
          actualFraudType: actual,
          predictedFraudType: predicted,
          riskScore: detection.riskScore,
          priority: detection.reviewPriority,
          reasons: detection.reasons
        });
      }
    }
  }

  const accuracy = rows.length > 0 ? (correct / rows.length) : 0;

  // Compute per-class metrics
  const perClass = {};
  let macroPrecision = 0;
  let macroRecall = 0;
  let macroF1 = 0;
  let evaluatedClasses = 0;

  CLASSES.forEach(c => {
    const tp = matrix[c][c];
    let fp = 0;
    let fn = 0;
    CLASSES.forEach(other => {
      if (other !== c) {
        fp += matrix[other][c];
        fn += matrix[c][other];
      }
    });

    const precision = (tp + fp) > 0 ? tp / (tp + fp) : (tp === 0 && fp === 0 ? 1 : 0);
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : (tp === 0 && fn === 0 ? 1 : 0);
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    perClass[c] = {
      tp,
      fp,
      fn,
      precision: parseFloat((precision * 100).toFixed(2)),
      recall: parseFloat((recall * 100).toFixed(2)),
      f1: parseFloat((f1 * 100).toFixed(2)),
      support: trueCounts[c]
    };

    if (trueCounts[c] > 0) {
      macroPrecision += precision;
      macroRecall += recall;
      macroF1 += f1;
      evaluatedClasses++;
    }
  });

  return {
    datasetName,
    totalRecords: rows.length,
    accuracy: parseFloat((accuracy * 100).toFixed(2)),
    macroPrecision: parseFloat(((macroPrecision / (evaluatedClasses || 1)) * 100).toFixed(2)),
    macroRecall: parseFloat(((macroRecall / (evaluatedClasses || 1)) * 100).toFixed(2)),
    macroF1: parseFloat(((macroF1 / (evaluatedClasses || 1)) * 100).toFixed(2)),
    totalBilled,
    detectedFraudAmount,
    trueCounts,
    predCounts,
    confusionMatrix: matrix,
    perClass,
    sampleFlaggedCases: flaggedCases.slice(0, 10)
  };
}

let cachedValidation = null;

export function getValidationBenchmark(forceRefresh = false) {
  if (cachedValidation && !forceRefresh) {
    return cachedValidation;
  }

  const cleanedFile = path.join(DATASET_DIR, 'cleaned_nhis_with_fraud_types.csv');
  const combinedFile = path.join(DATASET_DIR, 'combined_nhis_dataset_with_fraud_types.csv');

  let cleanedRows = [];
  let combinedRows = [];

  if (fs.existsSync(cleanedFile)) {
    cleanedRows = parseCSV(fs.readFileSync(cleanedFile, 'utf-8'));
  }
  if (fs.existsSync(combinedFile)) {
    combinedRows = parseCSV(fs.readFileSync(combinedFile, 'utf-8'));
  }

  const cleanedBenchmark = evaluateDataset(cleanedRows, 'Cleaned Dataset (Training Baseline)');
  const combinedBenchmark = evaluateDataset(combinedRows, 'Combined Dataset (Validation Set)');

  cachedValidation = {
    evaluatedAt: new Date().toISOString(),
    classes: CLASSES,
    baseline: cleanedBenchmark,
    validation: combinedBenchmark,
    summary: {
      totalCleaned: cleanedRows.length,
      totalCombined: combinedRows.length,
      validationAccuracy: combinedBenchmark.accuracy,
      validationRecall: combinedBenchmark.macroRecall,
      validationPrecision: combinedBenchmark.macroPrecision,
      potentialSavings: combinedBenchmark.detectedFraudAmount
    }
  };

  return cachedValidation;
}
