import { Router } from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/authenticateUser';
import { createProfile, getMe, updateMe } from '../controllers/authController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/profile', authenticateUser, createProfile);
router.get('/me', authenticateUser, getMe);
router.patch('/me', authenticateUser, upload.single('avatar'), updateMe);

export default router;
