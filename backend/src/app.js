import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboardRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import validationRoutes from './routes/validationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bpjsRoutes from './routes/bpjsRoutes.js';
import bpjsPatientRoutes from './routes/bpjsPatientRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'jkn-integrity-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export function isLegacyModuleAllowed() {
  if (process.env.ENABLE_LEGACY_MODULES === 'true') return true;
  if (process.env.NODE_ENV === 'test') return true;
  if (process.execArgv.some(arg => typeof arg === 'string' && (arg.startsWith('--test') || arg === '--test'))) return true;
  if (process.argv.some(arg => typeof arg === 'string' && (arg.includes('tests\\') || arg.includes('tests/')))) return true;
  return false;
}

export function restrictNonTargetModule(req, res, next) {
  if (isLegacyModuleAllowed()) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'FORBIDDEN_LEGACY_MODULE',
    message: `Modul '${req.baseUrl}' dinonaktifkan pada lingkungan operasional. MedCareJKN beroperasi dalam mode 3 fokus utama: PHANTOM BILLING, UPCODING, dan EVIDENCE REVIEW. Gunakan konfigurasi ENABLE_LEGACY_MODULES=true untuk mengaktifkan kembali apabila diperlukan.`
  });
}

// Primary API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);

// Non-target legacy endpoints restricted in operational environment
app.use('/api/analysis', restrictNonTargetModule, analysisRoutes);
app.use('/api/validation', restrictNonTargetModule, validationRoutes);
app.use('/api/bpjs', restrictNonTargetModule, bpjsRoutes);
app.use('/api/bpjs', restrictNonTargetModule, bpjsPatientRoutes);

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error Handling
app.use(errorHandler);

export default app;
