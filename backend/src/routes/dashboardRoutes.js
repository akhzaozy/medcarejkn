import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';

import {requireSession,requireRole} from '../auth/session.js';
const router = express.Router();
router.use(requireSession);

router.get('/', getDashboard);

export default router;
