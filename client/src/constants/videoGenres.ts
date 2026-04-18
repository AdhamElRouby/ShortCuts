/** Must match server `Genre` enum and POST /videos validation. */
export const VIDEO_GENRES = [
  'action',
  'comedy',
  'drama',
  'horror',
  'romance',
  'thriller',
  'scifi',
  'fantasy',
  'animation',
  'documentary',
  'adventure',
  'crime',
  'musical',
  'war',
  'western',
  'historical',
  'sports',
  'superhero',
] as const;

export type VideoGenre = (typeof VIDEO_GENRES)[number];
