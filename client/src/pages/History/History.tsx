import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Loader2, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { clearWatchHistory, getWatchHistory, type WatchHistoryItem } from '@/api/user';
import { getThumbnailUrl } from '@/api/video';

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatWatchedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function History() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWatchHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load watch history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      await clearWatchHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear watch history:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-24 md:px-8">
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
              Library
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Watch History
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Revisit previously watched films in reverse chronological order.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleClearHistory}
            disabled={clearing || history.length === 0}
            className="border-white/15 bg-white/[0.02] hover:border-gold/40 hover:text-gold"
          >
            {clearing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Clear history
          </Button>
        </section>

        {loading ? (
          <div className="flex min-h-[45vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <Clock3 className="mx-auto h-10 w-10 text-gold/80" />
            <h2 className="mt-4 text-xl font-semibold">No watch history yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start watching films and they will appear here.
            </p>
            <Button asChild className="mt-6 bg-gold text-background hover:bg-gold-light">
              <Link to="/">Browse videos</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {history.map((entry) => (
              <li key={entry.id}>
                <Link
                  to={`/video/${entry.video.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-card/40 transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:bg-card/65"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <img
                      src={getThumbnailUrl(
                        entry.video.cloudinaryId,
                        entry.video.thumbnailUrl,
                      )}
                      alt={entry.video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white/95">
                      {formatDuration(entry.video.duration)}
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-gold">
                      {entry.video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{entry.video.creator.name}</p>
                    <p className="text-xs text-gold/85">Watched {formatWatchedAt(entry.watchedAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
