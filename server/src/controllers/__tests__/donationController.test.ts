import { Request, Response } from 'express';
import Stripe from 'stripe';

const mockCreateSession = jest.fn();
const mockRetrieveSession = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: (...args: any[]) => mockCreateSession(...args),
        retrieve: (...args: any[]) => mockRetrieveSession(...args),
      },
    },
  }));
});

import { createCheckoutSession, confirmDonation } from '../donationController';
import { prisma } from '../../db/prisma';
import CustomAPIError from '../../errors/CustomAPIError';

jest.mock('../../db/prisma', () => ({
  prisma: {
    userProfile: { findUnique: jest.fn() },
    donation: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

describe('donationController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { user: { id: '00000000-0000-0000-0000-000000000001' }, body: {} } as unknown as Partial<Request>;
    res = { status: statusMock } as unknown as Response;
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('throws 401 if user not authenticated', async () => {
      req.user = undefined;
      await expect(createCheckoutSession(req as Request, res as Response)).rejects.toThrow(CustomAPIError);
    });

    it('throws 400 for invalid creatorId', async () => {
      req.body = { creatorId: 'invalid', amount: 10, successUrl: 'url', cancelUrl: 'url' };
      await expect(createCheckoutSession(req as Request, res as Response)).rejects.toThrow('Invalid creator');
    });

    it('throws 400 for invalid amount', async () => {
      req.body = { creatorId: '10000000-0000-0000-0000-000000000001', amount: 0, successUrl: 'url', cancelUrl: 'url' };
      await expect(createCheckoutSession(req as Request, res as Response)).rejects.toThrow('Amount must be at least $1');
    });

    it('throws 400 if user tries to donate to themselves', async () => {
      req.body = { creatorId: '00000000-0000-0000-0000-000000000001', amount: 10, successUrl: 'url', cancelUrl: 'url' };
      await expect(createCheckoutSession(req as Request, res as Response)).rejects.toThrow('Cannot donate to yourself');
    });

    it('throws 404 if creator not found', async () => {
      req.body = { creatorId: '20000000-0000-0000-0000-000000000002', amount: 10, successUrl: 'url', cancelUrl: 'url' };
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(createCheckoutSession(req as Request, res as Response)).rejects.toThrow('Creator not found');
    });

    it('returns session URL on success', async () => {
      req.body = { creatorId: '20000000-0000-0000-0000-000000000002', amount: 10, successUrl: 'success', cancelUrl: 'cancel' };
      const creator = { displayName: 'Creator' };
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(creator);
      mockCreateSession.mockResolvedValue({ url: 'http://stripe.url' });

      await createCheckoutSession(req as Request, res as Response);

      expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
        metadata: { donorId: '00000000-0000-0000-0000-000000000001', creatorId: '20000000-0000-0000-0000-000000000002' },
        success_url: 'success',
        cancel_url: 'cancel',
      }));

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ url: 'http://stripe.url' });
    });
  });

  describe('confirmDonation', () => {
    it('throws 401 if user not authenticated', async () => {
      req.user = undefined;
      await expect(confirmDonation(req as Request, res as Response)).rejects.toThrow(CustomAPIError);
    });

    it('returns early if donation already exists', async () => {
      req.body = { sessionId: 'sess_1' };
      (prisma.donation.findUnique as jest.Mock).mockResolvedValue({ id: 'don_1' });

      await confirmDonation(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ recorded: true, donation: { id: 'don_1' } });
      expect(mockRetrieveSession).not.toHaveBeenCalled();
    });

    it('throws 402 if payment is not paid', async () => {
      req.body = { sessionId: 'sess_1' };
      (prisma.donation.findUnique as jest.Mock).mockResolvedValue(null);
      mockRetrieveSession.mockResolvedValue({ payment_status: 'unpaid' });

      await expect(confirmDonation(req as Request, res as Response)).rejects.toThrow('Payment not completed');
    });

    it('throws 400 if metadata is invalid', async () => {
      req.body = { sessionId: 'sess_1' };
      (prisma.donation.findUnique as jest.Mock).mockResolvedValue(null);
      mockRetrieveSession.mockResolvedValue({ payment_status: 'paid', metadata: {} });

      await expect(confirmDonation(req as Request, res as Response)).rejects.toThrow('Invalid session metadata');
    });

    it('creates donation and returns 201', async () => {
      req.body = { sessionId: 'sess_1' };
      (prisma.donation.findUnique as jest.Mock).mockResolvedValue(null);
      mockRetrieveSession.mockResolvedValue({
        payment_status: 'paid',
        metadata: { creatorId: '20000000-0000-0000-0000-000000000002' },
        amount_total: 1000,
      });

      const mockDonation = { id: 'don_1' };
      (prisma.donation.create as jest.Mock).mockResolvedValue(mockDonation);

      await confirmDonation(req as Request, res as Response);

      expect(prisma.donation.create).toHaveBeenCalledWith({
        data: {
          donorId: '00000000-0000-0000-0000-000000000001',
          creatorId: '20000000-0000-0000-0000-000000000002',
          amountCents: 1000,
          stripeSessionId: 'sess_1',
        },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ recorded: true, donation: mockDonation });
    });
  });
});
