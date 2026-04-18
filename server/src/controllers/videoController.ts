import { Request, Response } from 'express';
import { uploadBuffer } from '../utils/uploadToCloudinary';
import { prisma } from '../db/prisma';
import CustomAPIError from '../errors/CustomAPIError';
import { Genre } from '../generated/prisma/enums';

const VALID_GENRES = Object.values(Genre) as string[];

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function assertVideoUuid(id: string): void {
  if (!UUID_RE.test(id)) {
    throw new CustomAPIError('Video not found', 404);
  }
}

function canViewVideo(
  video: { isPublic: boolean; creatorId: string },
  viewerId: string | undefined,
): boolean {
  return video.isPublic || viewerId === video.creatorId;
}

export const getVideoById = async (req: Request, res: Response) => {
  const videoId = req.params.videoId as string;
  assertVideoUuid(videoId);
  const viewerId = req.user?.id;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      creator: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  if (!video) {
    throw new CustomAPIError('Video not found', 404);
  }
  if (!canViewVideo(video, viewerId)) {
    throw new CustomAPIError('Video not found', 404);
  }

  const [agg, userRatingRow] = await Promise.all([
    prisma.rating.aggregate({
      where: { videoId },
      _avg: { score: true },
    }),
    viewerId
      ? prisma.rating.findUnique({
          where: { userId_videoId: { userId: viewerId, videoId } },
        })
      : Promise.resolve(null),
  ]);

  const averageRating = Number(agg._avg.score ?? 0);

  res.status(200).json({
    id: video.id,
    title: video.title,
    description: video.description,
    cloudinaryId: video.cloudinaryId,
    thumbnailUrl: video.thumbnailUrl,
    averageRating,
    userRating: userRatingRow?.score,
    creator: {
      id: video.creator.id,
      name: video.creator.displayName,
      avatarUrl: video.creator.avatarUrl,
    },
  });
};

export const getVideoComments = async (req: Request, res: Response) => {
  const videoId = req.params.videoId as string;
  assertVideoUuid(videoId);
  const viewerId = req.user?.id;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, isPublic: true, creatorId: true },
  });
  if (!video) {
    throw new CustomAPIError('Video not found', 404);
  }
  if (!canViewVideo(video, viewerId)) {
    throw new CustomAPIError('Video not found', 404);
  }

  const rows = await prisma.comment.findMany({
    where: { videoId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  res.status(200).json(
    rows.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        id: c.user.id,
        name: c.user.displayName,
        avatarUrl: c.user.avatarUrl,
      },
    })),
  );
};

export const postVideoComment = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const videoId = req.params.videoId as string;
  assertVideoUuid(videoId);

  const { content } = req.body as { content?: string };
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new CustomAPIError('Comment cannot be empty', 400);
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, isPublic: true, creatorId: true },
  });
  if (!video) {
    throw new CustomAPIError('Video not found', 404);
  }
  if (!canViewVideo(video, userId)) {
    throw new CustomAPIError('Video not found', 404);
  }

  const comment = await prisma.comment.create({
    data: {
      userId,
      videoId,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  res.status(201).json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    user: {
      id: comment.user.id,
      name: comment.user.displayName,
      avatarUrl: comment.user.avatarUrl,
    },
  });
};

export const upsertVideoRating = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const videoId = req.params.videoId as string;
  assertVideoUuid(videoId);

  const { rating } = req.body as { rating?: unknown };
  const raw = typeof rating === 'number' ? rating : Number(rating);
  if (!Number.isInteger(raw) || raw < 1 || raw > 5) {
    throw new CustomAPIError('Rating must be an integer between 1 and 5', 400);
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, isPublic: true, creatorId: true },
  });
  if (!video) {
    throw new CustomAPIError('Video not found', 404);
  }
  if (!canViewVideo(video, userId)) {
    throw new CustomAPIError('Video not found', 404);
  }

  await prisma.rating.upsert({
    where: { userId_videoId: { userId, videoId } },
    create: { userId, videoId, score: raw },
    update: { score: raw },
  });

  const agg = await prisma.rating.aggregate({
    where: { videoId },
    _avg: { score: true },
  });

  res.status(200).json({
    averageRating: Number(agg._avg.score ?? 0),
    userRating: raw,
  });
};

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
