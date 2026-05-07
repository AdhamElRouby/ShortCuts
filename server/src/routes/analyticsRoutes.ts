import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticateUser';
import { getMyChannelAnalytics } from '../controllers/analyticsController';

const router = Router();

router.get('/me', authenticateUser, getMyChannelAnalytics);

export default router;
