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

export interface ChannelInfo {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  subscriberCount: number;
  isSubscribed: boolean;
}

export interface WatchHistoryItem {
  id: string;
  watchedAt: string;
  video: {
    id: string;
    title: string;
    cloudinaryId: string;
    thumbnailUrl: string | null;
    duration: number | null;
    creator: {
      id: string;
      name: string;
    };
  };
}

export const getSubscribedChannels = async (): Promise<ChannelInfo[]> => {
  const { data } = await axiosInstance.get<ChannelInfo[]>('/users/subscriptions');
  return data;
};

export const getChannels = async (): Promise<ChannelInfo[]> => {
  const { data } = await axiosInstance.get<ChannelInfo[]>('/users');
  return data;
};

export const getTopChannels = async (limit = 5): Promise<ChannelInfo[]> => {
  const { data } = await axiosInstance.get<ChannelInfo[]>('/users/top', {
    params: { limit },
  });
  return data;
};
export const getUserProfile = async (
  userId: string,
): Promise<PublicProfile> => {
  const { data } = await axiosInstance.get<PublicProfile>(`/users/${userId}`);
  return data;
};

export const updateProfile = async (formData: FormData) => {
  const { data } = await axiosInstance.patch('/auth/me', formData);
  return data;
};

export const subscribeToUser = async (userId: string) => {
  const { data } = await axiosInstance.post<{
    subscriberCount: number;
    isSubscribed: boolean;
  }>(`/users/${userId}/subscribe`);
  return data;
};

export const unsubscribeFromUser = async (userId: string) => {
  const { data } = await axiosInstance.delete<{
    subscriberCount: number;
    isSubscribed: boolean;
  }>(`/users/${userId}/subscribe`);
  return data;
};

export const getWatchHistory = async (): Promise<WatchHistoryItem[]> => {
  const { data } = await axiosInstance.get<WatchHistoryItem[]>('/users/history');
  return data;
};

export const clearWatchHistory = async (): Promise<{ cleared: boolean }> => {
  const { data } = await axiosInstance.delete<{ cleared: boolean }>('/users/history');
  return data;
};

export const addWatchHistoryEntry = async (
  videoId: string,
): Promise<{ id: string; watchedAt: string }> => {
  const { data } = await axiosInstance.post<{ id: string; watchedAt: string }>(
    `/users/history/${videoId}`,
  );
  return data;
};
