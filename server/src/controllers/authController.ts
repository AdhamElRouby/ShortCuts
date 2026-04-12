import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import CustomAPIError from '../errors/CustomAPIError';

export const createProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
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
  const userId = (req as any).user.id;

  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
  });

  if (!profile) {
    throw new CustomAPIError('Profile not found', 404);
  }

  res.status(200).json(profile);
};
