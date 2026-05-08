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
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  res.status(200).json({ url: session.url });
};
