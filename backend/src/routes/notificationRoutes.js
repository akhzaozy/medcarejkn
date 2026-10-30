import express from 'express';
import { getNotifications, markAllRead, markSingleRead } from '../controllers/notificationController.js';
import { requireSession } from '../auth/session.js';

const router = express.Router();
router.use(requireSession);

router.get('/', getNotifications);
router.post('/read-all', markAllRead);
router.post('/:id/read', markSingleRead);

export default router;

