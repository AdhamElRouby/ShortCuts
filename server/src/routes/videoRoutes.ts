import { Router } from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/authenticateUser';
import { uploadVideo } from '../controllers/videoController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

router.use(authenticateUser);

router.post(
  '/',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  uploadVideo,
);

export default router;
