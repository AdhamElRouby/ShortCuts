import axiosInstance from './axios';

export interface CreateCheckoutSessionParams {
  creatorId: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

export interface ReceivedDonation {
  id: string;
  amountCents: number;
  createdAt: string;
  donor: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export const createDonationCheckoutSession = async (
  params: CreateCheckoutSessionParams,
): Promise<{ url: string }> => {
  const { data } = await axiosInstance.post<{ url: string }>(
    '/donations/checkout-session',
    params,
  );
  return data;
};

export const confirmDonation = async (
  sessionId: string,
): Promise<{ recorded: boolean }> => {
  const { data } = await axiosInstance.post<{ recorded: boolean }>(
    '/donations/confirm',
    { sessionId },
  );
  return data;
};

export const getReceivedDonations = async (): Promise<ReceivedDonation[]> => {
  const { data } = await axiosInstance.get<ReceivedDonation[]>(
    '/donations/received',
  );
  return data;
};
