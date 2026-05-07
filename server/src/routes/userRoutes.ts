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
  getWatchHistory,
  addWatchHistoryEntry,
  clearWatchHistory,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../controllers/userController';

const router = Router();

router.get('/', optionalAuthenticateUser, getChannels);
router.get('/top', optionalAuthenticateUser, getTopChannels);
router.get('/subscriptions', authenticateUser, getSubscribedChannels);
router.get('/history', authenticateUser, getWatchHistory);
router.post('/history/:videoId', authenticateUser, addWatchHistoryEntry);
router.delete('/history', authenticateUser, clearWatchHistory);
router.get('/watchlist', authenticateUser, getWatchlist);
router.post('/watchlist/:videoId', authenticateUser, addToWatchlist);
router.delete('/watchlist/:videoId', authenticateUser, removeFromWatchlist);
router.post('/:userId/subscribe', authenticateUser, subscribeToUser);
router.delete('/:userId/subscribe', authenticateUser, unsubscribeFromUser);
router.get('/:userId', optionalAuthenticateUser, getUserProfile);

export default router;
