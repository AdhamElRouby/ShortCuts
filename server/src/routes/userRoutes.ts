import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticateUser';
import { optionalAuthenticateUser } from '../middleware/optionalAuthenticateUser';
import {
  getUserProfile,
  getChannels,
  getTopChannels,
  subscribeToUser,
  unsubscribeFromUser,
} from '../controllers/userController';

const router = Router();

router.get('/', optionalAuthenticateUser, getChannels);
router.get('/top', optionalAuthenticateUser, getTopChannels);
router.post('/:userId/subscribe', authenticateUser, subscribeToUser);
router.delete('/:userId/subscribe', authenticateUser, unsubscribeFromUser);
router.get('/:userId', optionalAuthenticateUser, getUserProfile);

export default router;
