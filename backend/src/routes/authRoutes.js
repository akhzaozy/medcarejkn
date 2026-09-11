import express from 'express';
import { login, getRolesInfo } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.get('/roles', getRolesInfo);

export default router;
