import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import {
  getWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
} from '@/api/user';
import { getThumbnailUrl } from '@/api/video';

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingVideoId, setRemovingVideoId] = useState<string | null>(null);

  const loadWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const handleRemove = async (videoId: string) => {
    try {
      setRemovingVideoId(videoId);
      await removeFromWatchlist(videoId);
      setWatchlist((prev) => prev.filter((item) => item.videoId !== videoId));
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    } finally {
      setRemovingVideoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-24 md:px-8">
        <section className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
            Library
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            My Watch List
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Movies you saved to watch later.
          </p>
        </section>

        {loading ? (
          <div className="flex min-h-[45vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : watchlist.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <Bookmark className="mx-auto h-10 w-10 text-gold/80" />
            <h2 className="mt-4 text-xl font-semibold">Your watch list is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save movies from the video page and they will appear here.
            </p>
            <Button asChild className="mt-6 bg-gold text-background hover:bg-gold-light">
              <Link to="/">Browse videos</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {watchlist.map((item) => (
              <li key={item.videoId} className="overflow-hidden rounded-xl border border-white/[0.08] bg-card/40">
                <Link
                  to={`/video/${item.video.id}`}
                  className="group block transition-all duration-300 hover:bg-card/65"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <img
                      src={getThumbnailUrl(item.video.cloudinaryId, item.video.thumbnailUrl)}
                      alt={item.video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white/95">
                      {formatDuration(item.video.duration)}
                    </span>
                  </div>
                </Link>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                    {item.video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.video.creator.name}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemove(item.videoId)}
                    disabled={removingVideoId === item.videoId}
                    className="mt-2 w-full border-white/15 bg-white/[0.02] hover:border-gold/40 hover:text-gold"
                  >
                    {removingVideoId === item.videoId ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
