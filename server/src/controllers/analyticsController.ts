import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import CustomAPIError from '../errors/CustomAPIError';

export const getMyChannelAnalytics = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new CustomAPIError('Unauthorized', 401);

  const [videos, subscriberCount, ratingAggregate] = await Promise.all([
    prisma.video.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        cloudinaryId: true,
        thumbnailUrl: true,
        duration: true,
        genre: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: { watchHistory: true, ratings: true, comments: true },
        },
        ratings: { select: { score: true } },
      },
    }),
    prisma.subscription.count({ where: { channelId: userId } }),
    prisma.rating.aggregate({
      where: { video: { creatorId: userId } },
      _avg: { score: true },
      _count: { score: true },
    }),
  ]);

  const perVideo = videos.map((v) => {
    const ratingCount = v.ratings.length;
    const ratingSum = v.ratings.reduce((acc, r) => acc + r.score, 0);
    const avg = ratingCount > 0 ? ratingSum / ratingCount : null;
    return {
      id: v.id,
      title: v.title,
      cloudinaryId: v.cloudinaryId,
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      genre: v.genre,
      isPublic: v.isPublic,
      createdAt: v.createdAt,
      viewCount: v._count.watchHistory,
      commentCount: v._count.comments,
      ratingCount,
      averageRating: avg,
    };
  });

  const totalViews = perVideo.reduce((acc, v) => acc + v.viewCount, 0);

  res.status(200).json({
    totals: {
      videoCount: videos.length,
      subscriberCount,
      totalViews,
      ratingCount: ratingAggregate._count.score,
      averageRating: ratingAggregate._avg.score ?? null,
    },
    videos: perVideo,
  });
};
