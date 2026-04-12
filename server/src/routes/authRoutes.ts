import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticateUser';
import { createProfile, getMe } from '../controllers/authController';

const router = Router();

router.use(authenticateUser);

router.post('/profile', createProfile);
router.get('/me', getMe);

export default router;
