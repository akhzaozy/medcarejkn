import express from 'express';
import { getClaims, getClaimById, auditCheckClaim } from '../controllers/claimController.js';

import {requireSession,requireRole} from '../auth/session.js';
const router = express.Router();
router.use(requireSession);

router.get('/', getClaims);
router.post('/audit-check', auditCheckClaim);
router.get('/:claimId', getClaimById);

export default router;
