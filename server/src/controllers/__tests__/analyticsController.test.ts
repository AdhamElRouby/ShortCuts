import { Request, Response } from 'express';
import { getMyChannelAnalytics } from '../analyticsController';
import { prisma } from '../../db/prisma';
import CustomAPIError from '../../errors/CustomAPIError';

jest.mock('../../db/prisma', () => ({
  prisma: {
    video: { findMany: jest.fn() },
    subscription: { count: jest.fn() },
    rating: { aggregate: jest.fn() },
  },
}));

describe('analyticsController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { user: { id: 'u1' } } as unknown as Partial<Request>;
    res = { status: statusMock } as unknown as Response;
    jest.clearAllMocks();
  });

  it('throws 401 if user is not authenticated', async () => {
    req.user = undefined;
    await expect(getMyChannelAnalytics(req as Request, res as Response)).rejects.toThrow(CustomAPIError);
    await expect(getMyChannelAnalytics(req as Request, res as Response)).rejects.toHaveProperty('statusCode', 401);
  });

  it('returns valid analytics for user', async () => {
    const mockVideos = [
      {
        id: 'v1',
        title: 'Video 1',
        cloudinaryId: 'c1',
        thumbnailUrl: null,
        duration: 100,
        genre: 'Action',
        isPublic: true,
        createdAt: new Date('2026-01-01'),
        _count: { watchHistory: 5, comments: 2, ratings: 2 },
        ratings: [{ score: 4 }, { score: 5 }],
      },
    ];

    (prisma.video.findMany as jest.Mock).mockResolvedValue(mockVideos);
    (prisma.subscription.count as jest.Mock).mockResolvedValue(10);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _count: { score: 2 },
      _avg: { score: 4.5 },
    });

    await getMyChannelAnalytics(req as Request, res as Response);

    expect(prisma.video.findMany).toHaveBeenCalledWith({
      where: { creatorId: 'u1' },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object),
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      totals: {
        videoCount: 1,
        subscriberCount: 10,
        totalViews: 5,
        ratingCount: 2,
        averageRating: 4.5,
      },
      videos: [{
        id: 'v1',
        title: 'Video 1',
        cloudinaryId: 'c1',
        thumbnailUrl: null,
        duration: 100,
        genre: 'Action',
        isPublic: true,
        createdAt: mockVideos[0].createdAt,
        viewCount: 5,
        commentCount: 2,
        ratingCount: 2,
        averageRating: 4.5,
      }],
    });
  });
});
