import { Request, Response } from 'express';
import { uploadBuffer } from '../utils/uploadToCloudinary';
import { prisma } from '../db/prisma';
import CustomAPIError from '../errors/CustomAPIError';
import { Genre } from '../generated/prisma/enums';

const VALID_GENRES = Object.values(Genre) as string[];

export const uploadVideo = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new CustomAPIError('Unauthorized', 401);

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const videoFile = files?.['video']?.[0];
  const thumbnailFile = files?.['thumbnail']?.[0];

  if (!videoFile) throw new CustomAPIError('Video file is required', 400);

  const { title, description, genre, isPublic } = req.body as {
    title?: string;
    description?: string;
    genre?: string;
    isPublic?: string;
  };

  if (!title || !title.trim()) throw new CustomAPIError('Title is required', 400);
  if (!genre || !VALID_GENRES.includes(genre)) {
    throw new CustomAPIError(`genre must be one of: ${VALID_GENRES.join(', ')}`, 400);
  }

  // Upload video to Cloudinary; HLS manifest is pre-generated asynchronously
  const videoResult = await uploadBuffer(videoFile.buffer, {
    resource_type: 'video',
    folder: 'videos',
    eager: [{ streaming_profile: 'hd', format: 'm3u8' }],
    eager_async: false, // short videos — wait for HLS manifest before responding
  });

  // Upload optional thumbnail
  let thumbnailUrl: string | null = null;
  if (thumbnailFile) {
    const thumbResult = await uploadBuffer(thumbnailFile.buffer, {
      resource_type: 'image',
      folder: 'thumbnails',
    });
    thumbnailUrl = thumbResult.secure_url;
  }

  const video = await prisma.video.create({
    data: {
      creatorId: userId,
      title: title.trim(),
      description: description?.trim() ?? null,
      cloudinaryId: videoResult.public_id,
      thumbnailUrl,
      duration: videoResult.duration ? Math.round(videoResult.duration) : null,
      genre: genre as Genre,
      isPublic: isPublic !== 'false',
    },
  });

  res.status(201).json(video);
};
