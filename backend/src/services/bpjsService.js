import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultDirectory = fileURLToPath(new URL('../../../outputs/bpjs-2025/', import.meta.url));
export const bpjsDirectory = () => process.env.BPJS_DATA_DIR || defaultDirectory;
let cached;

export function readBpjsData() {
  const filename = path.join(bpjsDirectory(), 'analysis.json');
  if (!fs.existsSync(filename)) {
    const error = new Error('Data BPJS belum diekstrak. Jalankan proses impor BPJS terlebih dahulu.');
    error.statusCode = 503;
    throw error;
  }
  const stat = fs.statSync(filename);
  if (!cached || cached.filename !== filename || cached.mtime !== stat.mtimeMs) {
    cached = { filename, mtime: stat.mtimeMs, data: JSON.parse(fs.readFileSync(filename, 'utf8')) };
  }
  return cached.data;
}

export function catalog(data = readBpjsData()) {
  const main = data.tables.filter(t => t.kind !== 'referensi_icd');
  return {
    edition: data.edition, extractedOn: data.extractedOn, notes: data.notes,
    cohorts: [...new Set(main.map(t => t.cohort))],
    totalRows: main.reduce((n, t) => n + t.rows, 0),
    tableCount: main.length, tables: data.tables,
    downloads: {
      excel: fs.existsSync(path.join(bpjsDirectory(), 'BPJS_2025_Analisis.xlsx')),
      full: fs.existsSync(path.join(bpjsDirectory(), 'BPJS_2025_Detail_Lengkap.zip')),
    },
  };
}

export function tableDetail(id, data = readBpjsData()) {
  const table = data.tables.find(t => t.id === id);
  if (!table) return null;
  return {
    table,
    variables: data.variables.filter(v => v.tableId === id),
    distributions: data.distributions.filter(d => d.tableId === id),
    monthly: data.monthly.filter(m => m.tableId === id),
    samples: data.samples[id] || [],
    sampleNote: `Pratinjau ${table.sampleRows} baris pertama, bukan sampel acak. Ringkasan menggunakan seluruh ${table.rows} baris.`,
    codeSets: Object.fromEntries(data.variables.filter(v => v.tableId === id && v.codeSet).map(v => [v.codeSet, data.codeSets[v.codeSet]])),
  };
}
