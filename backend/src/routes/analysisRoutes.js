import express from 'express';
import { runAnalysis } from '../controllers/analysisController.js';

import {requireSession,requireRole} from '../auth/session.js';
const router = express.Router();
router.use(requireSession);

router.post('/run', runAnalysis);

export default router;
