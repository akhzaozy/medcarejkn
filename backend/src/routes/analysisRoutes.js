import express from 'express';
import { runAnalysis } from '../controllers/analysisController.js';

const router = express.Router();

router.post('/run', runAnalysis);

export default router;
