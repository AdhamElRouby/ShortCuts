import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticateUser';
import { optionalAuthenticateUser } from '../middleware/optionalAuthenticateUser';
import {
  getUserProfile,
  getChannels,
  getTopChannels,
  getSubscribedChannels,
  subscribeToUser,
  unsubscribeFromUser,
} from '../controllers/userController';

const router = Router();

router.get('/', optionalAuthenticateUser, getChannels);
router.get('/top', optionalAuthenticateUser, getTopChannels);
router.get('/subscriptions', authenticateUser, getSubscribedChannels);
router.post('/:userId/subscribe', authenticateUser, subscribeToUser);
router.delete('/:userId/subscribe', authenticateUser, unsubscribeFromUser);
router.get('/:userId', optionalAuthenticateUser, getUserProfile);

export default router;
