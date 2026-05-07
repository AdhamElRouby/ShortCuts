import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import Navbar from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Send, Plus, Check } from 'lucide-react';
import {
  getVideoById,
  getComments,
  postComment,
  rateVideo,
  getThumbnailUrl,
  getHlsUrl,
} from '@/api/video';
import { addToWatchlist, addWatchHistoryEntry, getWatchlist } from '@/api/user';
import Loading from '../Loading/Loading';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  cloudinaryId: string;
  thumbnailUrl: string | null;
  averageRating: number;
  userRating?: number;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

function formatCommentTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { user } = useAuth();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [isSavedToWatchlist, setIsSavedToWatchlist] = useState(false);

  const loadData = useCallback(async () => {
    if (!videoId) return;
    try {
      setLoading(true);
      const [videoData, commentsData] = await Promise.all([
        getVideoById(videoId),
        getComments(videoId),
      ]);
      setVideo(videoData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setUserRating(
        typeof videoData.userRating === 'number' ? videoData.userRating : undefined,
      );
    } catch (err) {
      console.error('Failed to load video:', err);
      setVideo(null);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!videoId || !user) return;

    // Non-blocking tracking for personalized watch history.
    void addWatchHistoryEntry(videoId).catch((err) => {
      console.error('Failed to add watch history entry:', err);
    });
  }, [videoId, user]);

  useEffect(() => {
    if (!videoId || !user) {
      setIsSavedToWatchlist(false);
      return;
    }

    let isMounted = true;
    void getWatchlist()
      .then((items) => {
        if (!isMounted) return;
        setIsSavedToWatchlist(items.some((item) => item.videoId === videoId));
      })
      .catch((err) => {
        console.error('Failed to load watchlist status:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [videoId, user]);

  const handleSaveToWatchlist = async () => {
    if (!video || !user || isSavedToWatchlist) return;
    setWatchlistLoading(true);
    try {
      await addToWatchlist(video.id);
      setIsSavedToWatchlist(true);
    } catch (err) {
      console.error('Failed to save to watchlist:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user || !video) return;
    setRatingLoading(true);
    try {
      const data = await rateVideo(video.id, rating);
      setUserRating(data.userRating);
      setVideo((prev) =>
        prev ? { ...prev, averageRating: data.averageRating, userRating: data.userRating } : null,
      );
    } catch (err) {
      console.error('Rating failed:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || !video) return;

    setCommentLoading(true);
    try {
      const addedComment = await postComment(video.id, trimmed);
      setComments((prev) => [...prev, addedComment]);
      setNewComment('');
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 pt-16 text-center">
          <p className="text-muted-foreground">Video not found.</p>
          <Button asChild variant="outline" className="border-white/10 hover:border-gold/30 hover:text-gold">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Player only — metadata lives below, never over the video */}
      <div className="pt-16">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8">
          {/* No overflow-hidden — it clips Video.js control bar (seek, volume, fullscreen) */}
          <div className="rounded-2xl border border-white/[0.08] bg-black shadow-[0_12px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05]">
            <VideoPlayer
              className="rounded-2xl"
              hlsUrl={getHlsUrl(video.cloudinaryId)}
              thumbnailUrl={getThumbnailUrl(video.cloudinaryId, video.thumbnailUrl)}
              autoplay={false}
            />
          </div>
        </div>
      </div>

      {/* Metadata + engagement — separate surface from the player */}
      <div className="border-t border-white/[0.06] bg-gradient-to-b from-[#0c0c0c] to-background">
        <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:px-6 md:py-12 lg:max-w-[1600px] lg:px-8">
          {/* Title + creator + ratings — single card, tighter max width on text-heavy viewports */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 via-card/50 to-card/25 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <div className="border-b border-white/[0.06] px-5 py-5 md:px-7 md:py-6">
              <h1 className="text-balance break-words text-2xl font-bold capitalize leading-tight tracking-tight text-foreground md:text-3xl lg:text-[2rem]">
                {video.title}
              </h1>
            </div>

            <div className="grid gap-6 p-5 md:gap-8 md:p-7 lg:grid-cols-[1fr_380px] lg:items-stretch xl:grid-cols-[1fr_420px]">
              <Link
                to={`/profile/${video.creator.id}`}
                className="group flex min-h-0 min-w-0 items-center gap-4 rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.07] hover:ring-gold/25"
              >
                <Avatar className="h-14 w-14 shrink-0 border-2 border-gold/30 shadow-sm transition-colors group-hover:border-gold/50 md:h-16 md:w-16">
                  {video.creator.avatarUrl ? (
                    <AvatarImage src={video.creator.avatarUrl} alt="" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-base font-semibold text-gold md:text-lg">
                    {initials(video.creator.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Creator
                  </p>
                  <p className="mt-0.5 truncate text-lg font-semibold text-foreground transition-colors group-hover:text-gold md:text-xl">
                    {video.creator.name}
                  </p>
                </div>
              </Link>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex min-h-[112px] min-w-0 flex-col justify-between rounded-xl bg-black/45 p-4 ring-1 ring-white/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Average rating
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          strokeWidth={1.5}
                          className={`h-5 w-5 shrink-0 ${
                            star <= Math.round(video.averageRating)
                              ? 'fill-gold text-gold'
                              : 'fill-transparent text-zinc-600'
                          }`}
                          aria-hidden
                        />
                      ))}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums text-gold">
                        {video.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-zinc-500">/ 5</span>
                    </div>
                  </div>
                </div>

                {user ? (
                  <div className="flex min-h-[112px] min-w-0 flex-col justify-between rounded-xl bg-black/45 p-4 ring-1 ring-white/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Your rating
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={ratingLoading}
                          onClick={() => handleRate(star)}
                          className="-m-0.5 rounded-md p-1 transition-transform hover:scale-110 disabled:opacity-50"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            strokeWidth={1.5}
                            className={`h-7 w-7 sm:h-8 sm:w-8 ${
                              userRating !== undefined && star <= userRating
                                ? 'fill-gold text-gold'
                                : 'fill-transparent text-zinc-500 hover:text-gold/80'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-center rounded-xl bg-black/35 p-4 text-center ring-1 ring-dashed ring-white/15">
                    <p className="text-sm text-zinc-400">
                      <Link to="/login" className="font-semibold text-gold hover:underline">
                        Sign in
                      </Link>{' '}
                      to rate
                    </p>
                  </div>
                )}

                <div className="flex min-h-[112px] min-w-0 flex-col justify-between rounded-xl bg-black/45 p-4 ring-1 ring-white/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Watch list
                  </p>
                  {user ? (
                    <Button
                      type="button"
                      onClick={handleSaveToWatchlist}
                      disabled={watchlistLoading || isSavedToWatchlist}
                      className="mt-3 bg-gold text-background hover:bg-gold-light disabled:opacity-70"
                    >
                      {isSavedToWatchlist ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {isSavedToWatchlist ? 'Saved to Watch List' : 'Save to Watch List'}
                    </Button>
                  ) : (
                    <p className="mt-3 text-sm text-zinc-400">
                      <Link to="/login" className="font-semibold text-gold hover:underline">
                        Sign in
                      </Link>{' '}
                      to save this movie.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              About this film
            </h2>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 md:p-7">
              <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {video.description?.trim()
                  ? video.description
                  : 'No description has been added for this title yet.'}
              </p>
            </div>
          </section>

          <section className="border-t border-white/[0.06] pt-10">
            <div className="mb-6 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-gold" />
              <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                Comments{' '}
                <span className="font-normal text-muted-foreground">({comments.length})</span>
              </h2>
            </div>

            <div className="space-y-6">
              {user ? (
                <form onSubmit={handleCommentSubmit} className="relative">
                  <Textarea
                    placeholder="Share your thoughts…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[120px] resize-y border-white/[0.08] bg-white/[0.04] pr-14 text-base focus-visible:border-gold/40 focus-visible:ring-gold/20"
                  />
                  <Button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    size="icon"
                    className="absolute bottom-3 right-3 h-11 w-11 rounded-full bg-gold text-background shadow-lg hover:bg-gold-light"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-sm text-muted-foreground">
                  Please{' '}
                  <Link to="/login" className="font-medium text-gold hover:underline">
                    sign in
                  </Link>{' '}
                  to comment.
                </p>
              )}

              <ul className="space-y-4">
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    className="flex gap-4 rounded-xl border border-white/[0.05] bg-card/30 p-4 transition-colors hover:border-white/[0.1]"
                  >
                    <Link to={`/profile/${comment.user.id}`} className="shrink-0">
                      <Avatar className="h-11 w-11 border border-white/[0.08]">
                        {comment.user.avatarUrl ? (
                          <AvatarImage src={comment.user.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-gold/10 text-sm font-medium text-gold">
                          {initials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          to={`/profile/${comment.user.id}`}
                          className="font-semibold text-foreground hover:text-gold"
                        >
                          {comment.user.name}
                        </Link>
                        <time
                          dateTime={comment.createdAt}
                          className="text-xs tabular-nums text-muted-foreground"
                        >
                          {formatCommentTime(comment.createdAt)}
                        </time>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/85">{comment.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="lg:hidden">
            <h3 className="mb-3 border-b border-white/[0.08] pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Recommended
            </h3>
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground/60">
              More coming soon…
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
