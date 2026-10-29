import express from 'express';
import { getValidationData } from '../controllers/validationController.js';

import {requireSession} from '../auth/session.js';
const router = express.Router();
router.use(requireSession);

router.get('/', getValidationData);

export default router;
