import axiosInstance from './axios';

export interface ChannelAnalyticsTotals {
  videoCount: number;
  subscriberCount: number;
  totalViews: number;
  ratingCount: number;
  averageRating: number | null;
}

export interface ChannelAnalyticsVideo {
  id: string;
  title: string;
  cloudinaryId: string;
  thumbnailUrl: string | null;
  duration: number | null;
  genre: string;
  isPublic: boolean;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  ratingCount: number;
  averageRating: number | null;
}

export interface ChannelAnalytics {
  totals: ChannelAnalyticsTotals;
  videos: ChannelAnalyticsVideo[];
}

export const getMyChannelAnalytics = async (): Promise<ChannelAnalytics> => {
  const { data } = await axiosInstance.get<ChannelAnalytics>('/analytics/me');
  return data;
};
