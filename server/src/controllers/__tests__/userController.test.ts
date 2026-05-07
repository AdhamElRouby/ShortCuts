import request from 'supertest';
import express from 'express';

jest.mock('../../db/prisma', () => ({
  prisma: {
    userProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    video: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    watchHistory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../db/supabase', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
  },
}));

import userRouter from '../../routes/userRoutes';
import { errorHandler } from '../../middleware/errorHandler';
import { prisma } from '../../db/prisma';
import { supabaseAdmin } from '../../db/supabase';

const app = express();
app.use(express.json());
app.use('/api/users', userRouter);
app.use(errorHandler);

const USER_ID    = 'aaaaaaaa-0000-0000-0000-000000000001';
const CHANNEL_ID = 'aaaaaaaa-0000-0000-0000-000000000002';

function setAuth(userId = USER_ID) {
  (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

const mockProfile = {
  id: CHANNEL_ID,
  displayName: 'Channel Owner',
  bio: 'Bio text',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVideos = [
  {
    id: 'v1',
    title: 'Video 1',
    description: null,
    cloudinaryId: 'v/1',
    thumbnailUrl: null,
    duration: 60,
    genre: 'action',
    createdAt: new Date(),
  },
];

beforeEach(() => jest.clearAllMocks());

// ── getChannels ───────────────────────────────────────────────────────────────

describe('GET /api/users', () => {
  it('returns all channels with subscriber counts (unauthenticated)', async () => {
    (prisma.userProfile.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', displayName: 'User 1', avatarUrl: null },
      { id: 'u2', displayName: 'User 2', avatarUrl: null },
    ]);
    (prisma.subscription.count as jest.Mock).mockResolvedValue(10);
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].subscriberCount).toBe(10);
    expect(res.body[0].isSubscribed).toBe(false);
  });

  it('marks isSubscribed true for channels the viewer follows', async () => {
    setAuth();
    (prisma.userProfile.findMany as jest.Mock).mockResolvedValue([
      { id: CHANNEL_ID, displayName: 'Channel', avatarUrl: null },
    ]);
    (prisma.subscription.count as jest.Mock).mockResolvedValue(5);
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      subscriberId: USER_ID,
      channelId: CHANNEL_ID,
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body[0].isSubscribed).toBe(true);
  });

  it('returns empty array when no channels exist', async () => {
    (prisma.userProfile.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ── getUserProfile ────────────────────────────────────────────────────────────

describe('GET /api/users/:userId', () => {
  it('returns 404 for invalid UUID format', async () => {
    const res = await request(app).get('/api/users/not-a-valid-uuid');
    expect(res.status).toBe(404);
  });

  it('returns 404 when user does not exist', async () => {
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get(`/api/users/${CHANNEL_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns public profile with counts and public videos', async () => {
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
    (prisma.subscription.count as jest.Mock).mockResolvedValue(100);
    (prisma.video.findMany as jest.Mock).mockResolvedValue(mockVideos);
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/users/${CHANNEL_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(CHANNEL_ID);
    expect(res.body.isOwnProfile).toBe(false);
    expect(res.body.isSubscribed).toBe(false);
    expect(res.body.videos).toHaveLength(1);
  });

  it('sets isOwnProfile true when authenticated user views their own profile', async () => {
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({ ...mockProfile, id: USER_ID });
    (prisma.subscription.count as jest.Mock).mockResolvedValue(0);
    (prisma.video.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
    setAuth(USER_ID);

    const res = await request(app)
      .get(`/api/users/${USER_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.isOwnProfile).toBe(true);
  });

  it('sets isSubscribed true when viewer is subscribed to the channel', async () => {
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
    (prisma.subscription.count as jest.Mock).mockResolvedValue(5);
    (prisma.video.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      subscriberId: USER_ID,
      channelId: CHANNEL_ID,
    });
    setAuth();

    const res = await request(app)
      .get(`/api/users/${CHANNEL_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.isSubscribed).toBe(true);
  });
});

// ── subscribeToUser ───────────────────────────────────────────────────────────

describe('POST /api/users/:userId/subscribe', () => {
  it('subscribes to a user and returns updated count', async () => {
    setAuth();
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.subscription.create as jest.Mock).mockResolvedValue({});
    (prisma.subscription.count as jest.Mock).mockResolvedValue(11);

    const res = await request(app)
      .post(`/api/users/${CHANNEL_ID}/subscribe`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.isSubscribed).toBe(true);
    expect(res.body.subscriberCount).toBe(11);
    expect(prisma.subscription.create).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — skips create when already subscribed', async () => {
    setAuth();
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
      subscriberId: USER_ID,
      channelId: CHANNEL_ID,
    });
    (prisma.subscription.count as jest.Mock).mockResolvedValue(11);

    const res = await request(app)
      .post(`/api/users/${CHANNEL_ID}/subscribe`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.isSubscribed).toBe(true);
    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  it('returns 400 when subscribing to yourself', async () => {
    setAuth(CHANNEL_ID);

    const res = await request(app)
      .post(`/api/users/${CHANNEL_ID}/subscribe`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/Cannot subscribe to yourself/i);
  });

  it('returns 404 when channel does not exist', async () => {
    setAuth();
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/users/${CHANNEL_ID}/subscribe`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post(`/api/users/${CHANNEL_ID}/subscribe`);
    expect(res.status).toBe(401);
  });
});

// ── unsubscribeFromUser ───────────────────────────────────────────────────────

describe('DELETE /api/users/:userId/subscribe', () => {
  it('removes subscription and returns updated count', async () => {
    setAuth();
    (prisma.subscription.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.subscription.count as jest.Mock).mockResolvedValue(9);

    const res = await request(app)
      .delete(`/api/users/${CHANNEL_ID}/subscribe`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.isSubscribed).toBe(false);
    expect(res.body.subscriberCount).toBe(9);
  });

  it('succeeds even when no subscription existed (deleteMany is a no-op)', async () => {
    setAuth();
    (prisma.subscription.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.subscription.count as jest.Mock).mockResolvedValue(9);

    const res = await request(app)
      .delete(`/api/users/${CHANNEL_ID}/subscribe`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.isSubscribed).toBe(false);
  });

  it('returns 404 for invalid UUID format', async () => {
    setAuth();
    const res = await request(app)
      .delete('/api/users/bad-uuid/subscribe')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete(`/api/users/${CHANNEL_ID}/subscribe`);
    expect(res.status).toBe(401);
  });
});

// ── watchHistory ───────────────────────────────────────────────────────────────

const VIDEO_ID = 'bbbbbbbb-0000-0000-0000-000000000001';

describe('GET /api/users/history', () => {
  it('returns watch history in reverse chronological order and deduped by video', async () => {
    setAuth();

    (prisma.watchHistory.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'h3',
        userId: USER_ID,
        videoId: 'video-2',
        watchedAt: new Date('2026-05-07T20:00:00.000Z'),
        video: {
          id: 'video-2',
          title: 'Video 2',
          cloudinaryId: 'videos/2',
          thumbnailUrl: null,
          duration: 45,
          creator: { id: CHANNEL_ID, displayName: 'Creator 2' },
        },
      },
      {
        id: 'h2-latest',
        userId: USER_ID,
        videoId: 'video-1',
        watchedAt: new Date('2026-05-07T19:00:00.000Z'),
        video: {
          id: 'video-1',
          title: 'Video 1 latest',
          cloudinaryId: 'videos/1',
          thumbnailUrl: null,
          duration: 60,
          creator: { id: CHANNEL_ID, displayName: 'Creator 1' },
        },
      },
      {
        id: 'h1-old',
        userId: USER_ID,
        videoId: 'video-1',
        watchedAt: new Date('2026-05-07T18:00:00.000Z'),
        video: {
          id: 'video-1',
          title: 'Video 1 old',
          cloudinaryId: 'videos/1',
          thumbnailUrl: null,
          duration: 60,
          creator: { id: CHANNEL_ID, displayName: 'Creator 1' },
        },
      },
    ]);

    const res = await request(app)
      .get('/api/users/history')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].video.id).toBe('video-2');
    expect(res.body[1].video.id).toBe('video-1');
    expect(res.body[1].id).toBe('h2-latest');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/history');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users/history/:videoId', () => {
  it('creates a new history row when none exists', async () => {
    setAuth();
    (prisma.video.findUnique as jest.Mock).mockResolvedValue({
      id: VIDEO_ID,
      isPublic: true,
      creatorId: CHANNEL_ID,
    });
    (prisma.watchHistory.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.watchHistory.create as jest.Mock).mockResolvedValue({
      id: 'history-created',
      watchedAt: new Date('2026-05-07T21:00:00.000Z'),
    });
    (prisma.watchHistory.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post(`/api/users/history/${VIDEO_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('history-created');
    expect(prisma.watchHistory.create).toHaveBeenCalledTimes(1);
  });

  it('updates existing row and removes duplicate rows when already tracked', async () => {
    setAuth();
    (prisma.video.findUnique as jest.Mock).mockResolvedValue({
      id: VIDEO_ID,
      isPublic: true,
      creatorId: CHANNEL_ID,
    });
    (prisma.watchHistory.findFirst as jest.Mock).mockResolvedValue({
      id: 'history-existing',
      userId: USER_ID,
      videoId: VIDEO_ID,
      watchedAt: new Date('2026-05-07T20:00:00.000Z'),
    });
    (prisma.watchHistory.update as jest.Mock).mockResolvedValue({
      id: 'history-existing',
      watchedAt: new Date('2026-05-07T21:00:00.000Z'),
    });
    (prisma.watchHistory.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post(`/api/users/history/${VIDEO_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(201);
    expect(prisma.watchHistory.update).toHaveBeenCalledTimes(1);
    expect(prisma.watchHistory.create).not.toHaveBeenCalled();
    expect(prisma.watchHistory.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for invalid UUID format', async () => {
    setAuth();
    const res = await request(app)
      .post('/api/users/history/not-a-uuid')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
  });

  it('returns 404 when private video is not owned by viewer', async () => {
    setAuth();
    (prisma.video.findUnique as jest.Mock).mockResolvedValue({
      id: VIDEO_ID,
      isPublic: false,
      creatorId: CHANNEL_ID,
    });

    const res = await request(app)
      .post(`/api/users/history/${VIDEO_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/history', () => {
  it('clears all watch history entries for the user', async () => {
    setAuth();
    (prisma.watchHistory.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

    const res = await request(app)
      .delete('/api/users/history')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.cleared).toBe(true);
    expect(prisma.watchHistory.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/users/history');
    expect(res.status).toBe(401);
  });
});
