import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticateUser';
import { createCheckoutSession } from '../controllers/donationController';

const router = Router();

router.post('/checkout-session', authenticateUser, createCheckoutSession);

export default router;
