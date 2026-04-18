import request from 'supertest';
import express from 'express';

jest.mock('../../db/prisma', () => ({
  prisma: {
    video: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    rating: {
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    comment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../db/supabase', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
  },
}));

jest.mock('../../utils/uploadToCloudinary', () => ({
  uploadBuffer: jest.fn(),
}));

import videoRouter from '../../routes/videoRoutes';
import { errorHandler } from '../../middleware/errorHandler';
import { prisma } from '../../db/prisma';
import { supabaseAdmin } from '../../db/supabase';
import { uploadBuffer } from '../../utils/uploadToCloudinary';

const app = express();
app.use(express.json());
app.use('/api/videos', videoRouter);
app.use(errorHandler);

const CREATOR_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const VIEWER_ID  = 'aaaaaaaa-0000-0000-0000-000000000002';
const VIDEO_ID   = 'bbbbbbbb-0000-0000-0000-000000000001';

function setAuth(userId = VIEWER_ID) {
  (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

const mockVideo = {
  id: VIDEO_ID,
  title: 'Test Video',
  description: 'A test video',
  cloudinaryId: 'videos/test123',
  thumbnailUrl: null,
  isPublic: true,
  creatorId: CREATOR_ID,
  creator: { id: CREATOR_ID, displayName: 'Creator', avatarUrl: null },
};

beforeEach(() => jest.clearAllMocks());

// ── getVideoById ──────────────────────────────────────────────────────────────

describe('GET /api/videos/:videoId', () => {
  it('returns public video with average rating (unauthenticated)', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: 4.5 } });

    const res = await request(app).get(`/api/videos/${VIDEO_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(VIDEO_ID);
    expect(res.body.averageRating).toBe(4.5);
    expect(res.body.userRating).toBeUndefined();
  });

  it('returns 404 for invalid UUID format', async () => {
    const res = await request(app).get('/api/videos/not-a-valid-uuid');
    expect(res.status).toBe(404);
  });

  it('returns 404 when video does not exist', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get(`/api/videos/${VIDEO_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for private video when unauthenticated', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue({ ...mockVideo, isPublic: false });
    const res = await request(app).get(`/api/videos/${VIDEO_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 for private video when viewer is the creator', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue({ ...mockVideo, isPublic: false });
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: null } });
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(null);
    setAuth(CREATOR_ID);

    const res = await request(app)
      .get(`/api/videos/${VIDEO_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
  });

  it('includes userRating when the authenticated viewer has rated', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: 4 } });
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue({ score: 5 });
    setAuth();

    const res = await request(app)
      .get(`/api/videos/${VIDEO_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.userRating).toBe(5);
  });
});

// ── getVideoComments ──────────────────────────────────────────────────────────

describe('GET /api/videos/:videoId/comments', () => {
  it('returns list of comments ordered by creation', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'c1',
        content: 'Nice!',
        createdAt: new Date('2024-01-01'),
        user: { id: VIEWER_ID, displayName: 'Viewer', avatarUrl: null },
      },
    ]);

    const res = await request(app).get(`/api/videos/${VIDEO_ID}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toBe('Nice!');
    expect(res.body[0].user.name).toBe('Viewer');
  });

  it('returns empty array when there are no comments', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get(`/api/videos/${VIDEO_ID}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 404 when video does not exist', async () => {
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get(`/api/videos/${VIDEO_ID}/comments`);
    expect(res.status).toBe(404);
  });
});

// ── postVideoComment ──────────────────────────────────────────────────────────

describe('POST /api/videos/:videoId/comments', () => {
  it('creates a comment and returns 201', async () => {
    setAuth();
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
    (prisma.comment.create as jest.Mock).mockResolvedValue({
      id: 'c1',
      content: 'Great video!',
      createdAt: new Date(),
      user: { id: VIEWER_ID, displayName: 'Viewer', avatarUrl: null },
    });

    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/comments`)
      .set('Authorization', 'Bearer token')
      .send({ content: 'Great video!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Great video!');
  });

  it('returns 400 when content is empty', async () => {
    setAuth();
    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/comments`)
      .set('Authorization', 'Bearer token')
      .send({ content: '   ' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when content field is missing', async () => {
    setAuth();
    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/comments`)
      .set('Authorization', 'Bearer token')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/comments`)
      .send({ content: 'Hello' });

    expect(res.status).toBe(401);
  });
});

// ── upsertVideoRating ─────────────────────────────────────────────────────────

describe('POST /api/videos/:videoId/ratings', () => {
  it('upserts rating and returns new average', async () => {
    setAuth();
    (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
    (prisma.rating.upsert as jest.Mock).mockResolvedValue({});
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: 4 } });

    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/ratings`)
      .set('Authorization', 'Bearer token')
      .send({ rating: 4 });

    expect(res.status).toBe(200);
    expect(res.body.averageRating).toBe(4);
    expect(res.body.userRating).toBe(4);
  });

  it('returns 400 for rating of 0 (below minimum)', async () => {
    setAuth();
    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/ratings`)
      .set('Authorization', 'Bearer token')
      .send({ rating: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for rating of 6 (above maximum)', async () => {
    setAuth();
    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/ratings`)
      .set('Authorization', 'Bearer token')
      .send({ rating: 6 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for non-integer rating', async () => {
    setAuth();
    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/ratings`)
      .set('Authorization', 'Bearer token')
      .send({ rating: 3.5 });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post(`/api/videos/${VIDEO_ID}/ratings`)
      .send({ rating: 3 });

    expect(res.status).toBe(401);
  });
});

// ── uploadVideo ───────────────────────────────────────────────────────────────

describe('POST /api/videos', () => {
  it('returns 400 when no video file is provided', async () => {
    setAuth();
    const res = await request(app)
      .post('/api/videos')
      .set('Authorization', 'Bearer token')
      .field('title', 'My Video')
      .field('genre', 'action');

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/Video file is required/i);
  });

  it('returns 400 when title is missing', async () => {
    setAuth();
    const res = await request(app)
      .post('/api/videos')
      .set('Authorization', 'Bearer token')
      .attach('video', Buffer.from('fake video'), 'test.mp4')
      .field('genre', 'action');

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/Title is required/i);
  });

  it('returns 400 for invalid genre value', async () => {
    setAuth();
    const res = await request(app)
      .post('/api/videos')
      .set('Authorization', 'Bearer token')
      .attach('video', Buffer.from('fake video'), 'test.mp4')
      .field('title', 'My Video')
      .field('genre', 'invalid_genre');

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/genre must be one of/i);
  });

  it('uploads video and returns 201', async () => {
    setAuth(CREATOR_ID);
    (uploadBuffer as jest.Mock).mockResolvedValueOnce({
      public_id: 'videos/abc',
      secure_url: 'https://res.cloudinary.com/test/video.mp4',
      duration: 60,
    });
    (prisma.video.create as jest.Mock).mockResolvedValue({
      id: VIDEO_ID,
      title: 'My Video',
      genre: 'action',
      isPublic: true,
      cloudinaryId: 'videos/abc',
      thumbnailUrl: null,
      duration: 60,
      description: null,
      creatorId: CREATOR_ID,
    });

    const res = await request(app)
      .post('/api/videos')
      .set('Authorization', 'Bearer token')
      .attach('video', Buffer.from('fake video'), 'test.mp4')
      .field('title', 'My Video')
      .field('genre', 'action');

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My Video');
    expect(res.body.genre).toBe('action');
  });

  it('uploads thumbnail when provided alongside video', async () => {
    setAuth(CREATOR_ID);
    (uploadBuffer as jest.Mock)
      .mockResolvedValueOnce({ public_id: 'videos/abc', secure_url: 'https://cdn/video.mp4', duration: 30 })
      .mockResolvedValueOnce({ secure_url: 'https://cdn/thumb.jpg' });
    (prisma.video.create as jest.Mock).mockResolvedValue({
      id: VIDEO_ID,
      title: 'My Video',
      genre: 'drama',
      isPublic: true,
      cloudinaryId: 'videos/abc',
      thumbnailUrl: 'https://cdn/thumb.jpg',
      duration: 30,
      description: null,
      creatorId: CREATOR_ID,
    });

    const res = await request(app)
      .post('/api/videos')
      .set('Authorization', 'Bearer token')
      .attach('video', Buffer.from('fake video'), 'test.mp4')
      .attach('thumbnail', Buffer.from('fake image'), 'thumb.jpg')
      .field('title', 'My Video')
      .field('genre', 'drama');

    expect(res.status).toBe(201);
    expect(uploadBuffer).toHaveBeenCalledTimes(2);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/videos')
      .attach('video', Buffer.from('fake video'), 'test.mp4')
      .field('title', 'My Video')
      .field('genre', 'action');

    expect(res.status).toBe(401);
  });
});
