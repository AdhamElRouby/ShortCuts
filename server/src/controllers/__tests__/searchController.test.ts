import { Request, Response } from 'express';
import { search } from '../searchController';
import { prisma } from '../../db/prisma';

jest.mock('../../db/prisma', () => ({
  prisma: {
    video: { findMany: jest.fn() },
    userProfile: { findMany: jest.fn() },
  },
}));

describe('searchController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { query: {} };
    res = { status: statusMock } as unknown as Response;
    jest.clearAllMocks();
  });

  it('returns empty results when query is missing', async () => {
    await search(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ videos: [], channels: [] });
    expect(prisma.video.findMany).not.toHaveBeenCalled();
    expect(prisma.userProfile.findMany).not.toHaveBeenCalled();
  });

  it('returns mapped videos and channels when query is provided', async () => {
    req.query = { q: 'test' };

    const mockVideos = [
      {
        id: '1',
        title: 'test video',
        description: 'test desc',
        cloudinaryId: 'cloud_1',
        thumbnailUrl: null,
        duration: 100,
        genre: 'Action',
        createdAt: new Date('2026-01-01'),
        ratings: [{ score: 4 }, { score: 5 }],
        creator: { id: 'c1', displayName: 'creator1', avatarUrl: null },
      },
    ];

    const mockChannels = [
      {
        id: 'c2',
        displayName: 'test channel',
        avatarUrl: null,
        _count: { subscribers: 10 },
      },
    ];

    (prisma.video.findMany as jest.Mock).mockResolvedValue(mockVideos);
    (prisma.userProfile.findMany as jest.Mock).mockResolvedValue(mockChannels);

    await search(req as Request, res as Response);

    expect(prisma.video.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 8,
      where: expect.objectContaining({
        isPublic: true,
        OR: expect.any(Array),
      }),
    }));

    expect(prisma.userProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 8,
      where: { displayName: { contains: 'test', mode: 'insensitive' } },
    }));

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      videos: [{
        id: '1',
        title: 'test video',
        description: 'test desc',
        cloudinaryId: 'cloud_1',
        thumbnailUrl: null,
        duration: 100,
        genre: 'Action',
        createdAt: mockVideos[0].createdAt,
        averageRating: 4.5,
        creator: { id: 'c1', name: 'creator1', avatarUrl: null },
      }],
      channels: [{
        id: 'c2',
        displayName: 'test channel',
        avatarUrl: null,
        subscriberCount: 10,
      }],
    });
  });

  it('applies correct limit from query parameters', async () => {
    req.query = { q: 'test', limit: '5' };

    (prisma.video.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userProfile.findMany as jest.Mock).mockResolvedValue([]);

    await search(req as Request, res as Response);

    expect(prisma.video.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 5,
    }));
  });
});
