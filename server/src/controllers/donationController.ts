import { Request, Response } from 'express';
import Stripe from 'stripe';
import CustomAPIError from '../errors/CustomAPIError';
import { prisma } from '../db/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export const createCheckoutSession = async (req: Request, res: Response) => {
  const donorId = req.user?.id;
  if (!donorId) throw new CustomAPIError('Unauthorized', 401);

  const { creatorId, amount, successUrl, cancelUrl } = req.body as {
    creatorId: string;
    amount: number;
    successUrl: string;
    cancelUrl: string;
  };

  if (!creatorId || !UUID_RE.test(creatorId)) {
    throw new CustomAPIError('Invalid creator', 400);
  }

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1) {
    throw new CustomAPIError('Amount must be at least $1', 400);
  }

  if (!successUrl || !cancelUrl) {
    throw new CustomAPIError('Missing redirect URLs', 400);
  }

  if (creatorId === donorId) {
    throw new CustomAPIError('Cannot donate to yourself', 400);
  }

  const creator = await prisma.userProfile.findUnique({
    where: { id: creatorId },
    select: { displayName: true },
  });

  if (!creator) throw new CustomAPIError('Creator not found', 404);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Donation to ${creator.displayName}`,
            description: `Support ${creator.displayName} on ShortCuts`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { donorId, creatorId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  res.status(200).json({ url: session.url });
};

export const confirmDonation = async (req: Request, res: Response) => {
  const donorId = req.user?.id;
  if (!donorId) throw new CustomAPIError('Unauthorized', 401);

  const { sessionId } = req.body as { sessionId: string };
  if (!sessionId || typeof sessionId !== 'string') {
    throw new CustomAPIError('Missing sessionId', 400);
  }

  // Idempotent — if already recorded return it
  const existing = await prisma.donation.findUnique({
    where: { stripeSessionId: sessionId },
  });
  if (existing) {
    res.status(200).json({ recorded: true, donation: existing });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new CustomAPIError('Payment not completed', 402);
  }

  const creatorId = session.metadata?.creatorId;
  if (!creatorId || !UUID_RE.test(creatorId)) {
    throw new CustomAPIError('Invalid session metadata', 400);
  }

  const amountCents = session.amount_total ?? 0;

  const donation = await prisma.donation.create({
    data: {
      donorId,
      creatorId,
      amountCents,
      stripeSessionId: sessionId,
    },
  });

  res.status(201).json({ recorded: true, donation });
};

export const getReceivedDonations = async (req: Request, res: Response) => {
  const creatorId = req.user?.id;
  if (!creatorId) throw new CustomAPIError('Unauthorized', 401);

  const donations = await prisma.donation.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    include: {
      donor: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  res.status(200).json(
    donations.map((d) => ({
      id: d.id,
      amountCents: d.amountCents,
      createdAt: d.createdAt,
      donor: {
        id: d.donor.id,
        displayName: d.donor.displayName,
        avatarUrl: d.donor.avatarUrl,
      },
    })),
  );
};
