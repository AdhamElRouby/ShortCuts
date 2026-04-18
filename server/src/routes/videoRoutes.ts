import { Router } from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/authenticateUser';
import { optionalAuthenticateUser } from '../middleware/optionalAuthenticateUser';
import {
  uploadVideo,
  getVideoById,
  getVideoComments,
  postVideoComment,
  upsertVideoRating,
} from '../controllers/videoController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

// Specific routes before `/:videoId` (same path prefix)
router.get('/:videoId/comments', optionalAuthenticateUser, getVideoComments);
router.post('/:videoId/comments', authenticateUser, postVideoComment);
router.post('/:videoId/ratings', authenticateUser, upsertVideoRating);
router.get('/:videoId', optionalAuthenticateUser, getVideoById);

router.post(
  '/',
  authenticateUser,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  uploadVideo,
);

export default router;
