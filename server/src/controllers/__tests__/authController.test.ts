import request from 'supertest';
import express from 'express';

jest.mock('../../db/prisma', () => ({
  prisma: {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

import authRouter from '../../routes/authRoutes';
import { errorHandler } from '../../middleware/errorHandler';
import { prisma } from '../../db/prisma';
import { supabaseAdmin } from '../../db/supabase';
import { uploadBuffer } from '../../utils/uploadToCloudinary';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);

const USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function setAuth(userId = USER_ID) {
  (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

const mockProfile = {
  id: USER_ID,
  displayName: 'Alice',
  bio: null,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ── createProfile ─────────────────────────────────────────────────────────────

describe('POST /api/auth/profile', () => {
  it('creates profile and returns 201', async () => {
    setAuth();
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.userProfile.create as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app)
      .post('/api/auth/profile')
      .set('Authorization', 'Bearer token')
      .send({ displayName: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body.displayName).toBe('Alice');
  });

  it('returns 400 when displayName is absent', async () => {
    setAuth();
    const res = await request(app)
      .post('/api/auth/profile')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when displayName is whitespace only', async () => {
    setAuth();
    const res = await request(app)
      .post('/api/auth/profile')
      .set('Authorization', 'Bearer token')
      .send({ displayName: '   ' });

    expect(res.status).toBe(400);
  });

  it('returns 409 when profile already exists', async () => {
    setAuth();
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app)
      .post('/api/auth/profile')
      .set('Authorization', 'Bearer token')
      .send({ displayName: 'Alice' });

    expect(res.status).toBe(409);
  });

  it('returns 401 with no Authorization header', async () => {
    const res = await request(app)
      .post('/api/auth/profile')
      .send({ displayName: 'Alice' });

    expect(res.status).toBe(401);
  });
});

// ── getMe ─────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns own profile with 200', async () => {
    setAuth();
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(USER_ID);
    expect(res.body.displayName).toBe('Alice');
  });

  it('returns 404 when profile does not exist', async () => {
    setAuth();
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── updateMe ──────────────────────────────────────────────────────────────────

describe('PATCH /api/auth/me', () => {
  it('updates profile and returns 200', async () => {
    setAuth();
    const updated = { ...mockProfile, displayName: 'Alice Updated', bio: 'My bio' };
    (prisma.userProfile.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ displayName: 'Alice Updated', bio: 'My bio' });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Alice Updated');
    expect(res.body.bio).toBe('My bio');
  });

  it('returns 400 when displayName is missing', async () => {
    setAuth();
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ bio: 'some bio' });

    expect(res.status).toBe(400);
  });

  it('sets bio to null when bio is empty string', async () => {
    setAuth();
    (prisma.userProfile.update as jest.Mock).mockResolvedValue({ ...mockProfile, bio: null });

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ displayName: 'Alice', bio: '' });

    expect(res.status).toBe(200);
    const updateCall = (prisma.userProfile.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.bio).toBeNull();
  });

  it('uploads avatar and stores url when file is attached', async () => {
    setAuth();
    (uploadBuffer as jest.Mock).mockResolvedValue({ secure_url: 'https://cdn.example.com/avatar.jpg' });
    const updated = { ...mockProfile, avatarUrl: 'https://cdn.example.com/avatar.jpg' };
    (prisma.userProfile.update as jest.Mock).mockResolvedValue(updated);

    const fakeImg = Buffer.from('fake-image');
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', 'Bearer token')
      .attach('avatar', fakeImg, 'avatar.jpg')
      .field('displayName', 'Alice');

    expect(res.status).toBe(200);
    expect(uploadBuffer).toHaveBeenCalledWith(fakeImg, expect.objectContaining({ folder: 'avatars' }));
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .send({ displayName: 'Alice' });

    expect(res.status).toBe(401);
  });
});
