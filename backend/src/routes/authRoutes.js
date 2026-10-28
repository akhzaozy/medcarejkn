import express from 'express';
import { login, getRolesInfo } from '../controllers/authController.js';

import {requireSession,logoutSession} from '../auth/session.js';
const router = express.Router();

router.post('/login', login);
router.get('/roles', getRolesInfo);
router.post('/logout',requireSession,logoutSession);
router.get('/me',requireSession,(req,res)=>res.json({data:req.user}));

export default router;
