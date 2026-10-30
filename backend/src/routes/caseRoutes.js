import express from 'express';
import { getCases, getCaseDetails, getCaseEvidenceChain, postCaseOutcome, assignCase, uploadCaseFile, downloadCaseFile } from '../controllers/caseController.js';

import {requireSession,requireRole} from '../auth/session.js';
import {recordCaseAction} from '../services/caseService.js';
const router = express.Router();
router.use(requireSession);

router.get('/', getCases);
router.get('/:caseId', getCaseDetails);
router.get('/:caseId/evidence', getCaseEvidenceChain);
router.post('/:caseId/files', express.raw({ type: '*/*', limit: '15mb' }), uploadCaseFile);
router.get('/:caseId/files/:fileId', downloadCaseFile);
router.post('/:caseId/outcome', requireRole('clinical_reviewer'), postCaseOutcome);
router.post('/:caseId/assign', requireRole('staff_jkn'), assignCase);

for(const action of ['ownership','clarification','dispute','evidence','copilot','schedule','feedback']) {
  const guard=['ownership','clarification','schedule','dispute'].includes(action)?requireRole('staff_jkn'):action==='feedback'?requireRole('clinical_reviewer'):(req,res,next)=>next();
  router.post('/:caseId/'+action,guard,async(req,res,next)=>{try{res.json({data:await recordCaseAction(req.params.caseId,action,req.body,req.user)});}catch(e){next(e);}});
}
export default router;
