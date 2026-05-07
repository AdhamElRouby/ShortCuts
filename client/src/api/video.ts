import axiosInstance from './axios';

export interface VideoSummary {
  id: string;
  title: string;
  description: string | null;
  cloudinaryId: string;
  thumbnailUrl: string | null;
  duration: number | null;
  genre: string;
  createdAt: string;
  averageRating: number;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

/**
 * Uploads a video (and its metadata) to the backend, which then stores it on Cloudinary.
 * Hits POST /videos with multipart/form-data.
 *
 * @param formData - FormData containing the video file and fields (e.g. title, description).
 * @param onProgress - Optional callback receiving upload progress as a number 0–100.
 *                     Use this to drive a progress bar in the UI.
 *
 * @example
 * const form = new FormData();
 * form.append('video', videoFile);
 * form.append('title', 'My Short Film');
 * form.append('description', 'A cool film');
 *
 * await uploadVideo(form, (percent) => {
 *   console.log(`Upload progress: ${percent}%`);
 * });
 */
export const uploadVideo = (formData: FormData, onProgress?: (percent: number) => void) =>
  axiosInstance.post('/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

export const getVideos = async (limit = 12): Promise<VideoSummary[]> => {
  const { data } = await axiosInstance.get<VideoSummary[]>('/videos', {
    params: { limit },
  });
  return data;
};

/**
 * Builds the HLS streaming URL (.m3u8 manifest) for a video stored on Cloudinary.
 * Feed this URL to the Video.js player for adaptive bitrate streaming.
 * The `sp_hd` Cloudinary streaming profile triggers transcoding into multiple quality levels.
 *
 * @param cloudinaryId - The `cloudinary_id` value stored in the video table in the DB.
 * @returns The HLS manifest URL.
 *
 * @example
 * const hlsUrl = getHlsUrl('videos/abc123');
 * videoPlayer.src({ type: 'application/x-mpegURL', src: hlsUrl });
 */
export const getHlsUrl = (cloudinaryId: string): string =>
  `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/sp_hd/${cloudinaryId}.m3u8`;

/**
 * Returns the correct thumbnail image URL for a video.
 * Uses the stored custom thumbnail if available; otherwise falls back to an
 * auto-generated .jpg thumbnail derived from the Cloudinary video asset.
 *
 * @param cloudinaryId - The `cloudinary_id` value stored in the video table in the DB.
 * @param thumbnailUrl - The `thumbnail_url` column from the DB (nullable).
 *                       If null or undefined, a fallback thumbnail URL is constructed.
 * @returns The thumbnail image URL to display.
 *
 * @example
 * // With a custom thumbnail stored in the DB:
 * const url = getThumbnailUrl('videos/abc123', video.thumbnail_url);
 *
 * // Without a custom thumbnail (null → Cloudinary auto-generates one):
 * const url = getThumbnailUrl('videos/abc123', null);
 */
export const getThumbnailUrl = (cloudinaryId: string, thumbnailUrl?: string | null): string =>
  thumbnailUrl ??
  `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/${cloudinaryId}.jpg`;


/**
* Fetches full metadata for a single video, including creator info and average rating.
* Required for: Displaying title, description, and creator details.
*/
export const getVideoById = async (videoId: string) => {
  const response = await axiosInstance.get(`/videos/${videoId}`);
  return response.data;
};

/**
 * Fetches all comments for a specific video.
 * Required for: Displaying the comment section in chronological order.
 */
export const getComments = async (videoId: string) => {
  const response = await axiosInstance.get(`/videos/${videoId}/comments`);
  return response.data;
};

/**
 * Posts a new comment to a video.
 * Required for: Logged-in users to share feedback.
 */
export const postComment = async (videoId: string, content: string) => {
  const response = await axiosInstance.post(`/videos/${videoId}/comments`, { content });
  return response.data;
};

/**
 * Submits or updates a user's star rating (1-5).
 * Required for: Interactive rating system and updating the average score.
 */
export const rateVideo = async (
  videoId: string,
  rating: number,
): Promise<{ averageRating: number; userRating: number }> => {
  const { data } = await axiosInstance.post<{ averageRating: number; userRating: number }>(
    `/videos/${videoId}/ratings`,
    { rating },
  );
  return data;
};
