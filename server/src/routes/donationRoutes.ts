import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticateUser';
import {
  createCheckoutSession,
  confirmDonation,
  getReceivedDonations,
} from '../controllers/donationController';

const router = Router();

router.post('/checkout-session', authenticateUser, createCheckoutSession);
router.post('/confirm', authenticateUser, confirmDonation);
router.get('/received', authenticateUser, getReceivedDonations);

export default router;
