import axiosInstance from './axios';

export interface PublicProfileVideo {
  id: string;
  title: string;
  description: string | null;
  cloudinaryId: string;
  thumbnailUrl: string | null;
  duration: number | null;
  genre: string;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  subscriberCount: number;
  subscriptionCount: number;
  isOwnProfile: boolean;
  isSubscribed: boolean;
  videos: PublicProfileVideo[];
}

export const getUserProfile = async (userId: string): Promise<PublicProfile> => {
  const { data } = await axiosInstance.get<PublicProfile>(`/users/${userId}`);
  return data;
};

export const updateProfile = async (formData: FormData) => {
  const { data } = await axiosInstance.patch('/auth/me', formData);
  return data;
};

export const subscribeToUser = async (userId: string) => {
  const { data } = await axiosInstance.post<{ subscriberCount: number; isSubscribed: boolean }>(
    `/users/${userId}/subscribe`,
  );
  return data;
};

export const unsubscribeFromUser = async (userId: string) => {
  const { data } = await axiosInstance.delete<{ subscriberCount: number; isSubscribed: boolean }>(
    `/users/${userId}/subscribe`,
  );
  return data;
};
