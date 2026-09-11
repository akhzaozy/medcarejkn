import express from 'express';
import { getClaims, getClaimById, auditCheckClaim } from '../controllers/claimController.js';

const router = express.Router();

router.get('/', getClaims);
router.post('/audit-check', auditCheckClaim);
router.get('/:claimId', getClaimById);

export default router;
