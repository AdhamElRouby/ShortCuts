import axiosInstance from './axios';

export interface CreateCheckoutSessionParams {
  creatorId: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
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
