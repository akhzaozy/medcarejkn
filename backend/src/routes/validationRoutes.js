import express from 'express';
import { getValidationData } from '../controllers/validationController.js';

const router = express.Router();

router.get('/', getValidationData);

export default router;
