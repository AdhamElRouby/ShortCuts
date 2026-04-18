import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import CustomAPIError from '../errors/CustomAPIError';

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function assertUuid(id: string): void {
  if (!UUID_RE.test(id)) {
    throw new CustomAPIError('User not found', 404);
  }
}

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  assertUuid(userId);

  const viewerId = req.user?.id;

  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
  });

  if (!profile) {
    throw new CustomAPIError('User not found', 404);
  }

  const [subscriberCount, subscriptionCount, videos, subscriptionRow] = await Promise.all([
    prisma.subscription.count({ where: { channelId: userId } }),
    prisma.subscription.count({ where: { subscriberId: userId } }),
    prisma.video.findMany({
      where: {
        creatorId: userId,
        ...(viewerId === userId ? {} : { isPublic: true }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        cloudinaryId: true,
        thumbnailUrl: true,
        duration: true,
        genre: true,
        createdAt: true,
      },
    }),
    viewerId
      ? prisma.subscription.findUnique({
          where: {
            subscriberId_channelId: { subscriberId: viewerId, channelId: userId },
          },
        })
      : Promise.resolve(null),
  ]);

  const isOwnProfile = viewerId === userId;
  const isSubscribed = Boolean(subscriptionRow);

  res.status(200).json({
    id: profile.id,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    subscriberCount,
    subscriptionCount,
    isOwnProfile,
    isSubscribed,
    videos,
  });
};

export const subscribeToUser = async (req: Request, res: Response) => {
  const viewerId = req.user?.id;
  if (!viewerId) throw new CustomAPIError('Unauthorized', 401);

  const channelId = req.params.userId as string;
  assertUuid(channelId);

  if (channelId === viewerId) {
    throw new CustomAPIError('Cannot subscribe to yourself', 400);
  }

  const channel = await prisma.userProfile.findUnique({ where: { id: channelId } });
  if (!channel) {
    throw new CustomAPIError('User not found', 404);
  }

  const already = await prisma.subscription.findFirst({
    where: { subscriberId: viewerId, channelId },
  });
  if (!already) {
    await prisma.subscription.create({
      data: { subscriberId: viewerId, channelId },
    });
  }

  const subscriberCount = await prisma.subscription.count({ where: { channelId } });

  res.status(200).json({ subscriberCount, isSubscribed: true });
};

export const unsubscribeFromUser = async (req: Request, res: Response) => {
  const viewerId = req.user?.id;
  if (!viewerId) throw new CustomAPIError('Unauthorized', 401);

  const channelId = req.params.userId as string;
  assertUuid(channelId);

  await prisma.subscription.deleteMany({
    where: { subscriberId: viewerId, channelId },
  });

  const subscriberCount = await prisma.subscription.count({ where: { channelId } });

  res.status(200).json({ subscriberCount, isSubscribed: false });
};
