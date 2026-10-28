import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { bpjsDirectory, catalog, tableDetail } from '../services/bpjsService.js';

const router = express.Router();
router.get('/catalog', (req, res, next) => {
  try { res.json({ data: catalog() }); } catch (error) { next(error); }
});
router.get('/tables/:id', (req, res, next) => {
  try {
    const detail = tableDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Tabel BPJS tidak ditemukan.' });
    res.json({ data: detail });
  } catch (error) { next(error); }
});
router.get('/download/:type', (req, res, next) => {
  const names = { excel: 'BPJS_2025_Analisis.xlsx', full: 'BPJS_2025_Detail_Lengkap.zip' };
  const name = names[req.params.type];
  if (!name) return res.status(404).json({ error: 'Jenis unduhan tidak ditemukan.' });
  const filename = path.join(bpjsDirectory(), name);
  if (!fs.existsSync(filename)) return res.status(404).json({ error: 'File belum tersedia.' });
  res.download(filename, name, error => { if (error && !res.headersSent) next(error); });
});
export default router;
