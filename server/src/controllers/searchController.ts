import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 25;

function parseLimit(value: unknown): number {
  const limit = Number(value ?? DEFAULT_SEARCH_LIMIT);
  if (!Number.isInteger(limit) || limit < 1) return DEFAULT_SEARCH_LIMIT;
  return Math.min(limit, MAX_SEARCH_LIMIT);
}

function averageScore(ratings: { score: number }[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);
  return total / ratings.length;
}

export const search = async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim();
  const limit = parseLimit(req.query.limit);

  if (!query) {
    res.status(200).json({ videos: [], channels: [] });
    return;
  }

  const [videos, channels] = await Promise.all([
    prisma.video.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { creator: { displayName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        ratings: { select: { score: true } },
      },
    }),
    prisma.userProfile.findMany({
      where: {
        displayName: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      include: {
        _count: { select: { subscribers: true } },
      },
      orderBy: { displayName: 'asc' },
    }),
  ]);

  res.status(200).json({
    videos: videos.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      cloudinaryId: video.cloudinaryId,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      genre: video.genre,
      createdAt: video.createdAt,
      averageRating: averageScore(video.ratings),
      creator: {
        id: video.creator.id,
        name: video.creator.displayName,
        avatarUrl: video.creator.avatarUrl,
      },
    })),
    channels: channels.map((channel) => ({
      id: channel.id,
      displayName: channel.displayName,
      avatarUrl: channel.avatarUrl,
      subscriberCount: channel._count.subscribers,
    })),
  });
};
