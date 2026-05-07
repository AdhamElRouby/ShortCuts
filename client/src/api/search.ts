import axiosInstance from './axios';
import type { VideoSummary } from './video';

export interface SearchChannel {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  subscriberCount: number;
}

export interface SearchResults {
  videos: VideoSummary[];
  channels: SearchChannel[];
}

export const searchContent = async (
  query: string,
  limit = 8,
): Promise<SearchResults> => {
  const { data } = await axiosInstance.get<SearchResults>('/search', {
    params: { q: query, limit },
  });
  return data;
};
