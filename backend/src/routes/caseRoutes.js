import express from 'express';
import { getCases, getCaseDetails, getCaseEvidenceChain, postCaseOutcome, assignCase } from '../controllers/caseController.js';

const router = express.Router();

router.get('/', getCases);
router.get('/:caseId', getCaseDetails);
router.get('/:caseId/evidence', getCaseEvidenceChain);
router.post('/:caseId/outcome', postCaseOutcome);
router.post('/:caseId/assign', assignCase);

export default router;
