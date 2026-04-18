import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import CustomAPIError from '../errors/CustomAPIError';
import { uploadBuffer } from '../utils/uploadToCloudinary';

export const createProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { displayName } = req.body;

  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    throw new CustomAPIError('Display name is required', 400);
  }

  const existing = await prisma.userProfile.findUnique({
    where: { id: userId },
  });

  if (existing) {
    res.status(409).json(existing);
    return;
  }

  const profile = await prisma.userProfile.create({
    data: {
      id: userId,
      displayName: displayName.trim(),
    },
  });

  res.status(201).json(profile);
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
  });

  if (!profile) {
    throw new CustomAPIError('Profile not found', 404);
  }

  res.status(200).json(profile);
};

export const updateMe = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const avatarFile = req.file;

  const { displayName, bio } = req.body as { displayName?: string; bio?: string };

  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    throw new CustomAPIError('Display name is required', 400);
  }

  let avatarUrl: string | undefined;
  if (avatarFile) {
    const result = await uploadBuffer(avatarFile.buffer, {
      resource_type: 'image',
      folder: 'avatars',
    });
    avatarUrl = result.secure_url;
  }

  const bioValue =
    bio === undefined || bio === null || String(bio).trim() === ''
      ? null
      : String(bio).trim();

  const profile = await prisma.userProfile.update({
    where: { id: userId },
    data: {
      displayName: displayName.trim(),
      bio: bioValue,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });

  res.status(200).json(profile);
};
