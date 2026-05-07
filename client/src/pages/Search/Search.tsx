import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Search as SearchIcon, Star } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getThumbnailUrl, type VideoSummary } from '@/api/video';
import { searchContent, type SearchChannel } from '@/api/search';

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '--:--';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatGenre(genre: string): string {
  if (genre === 'scifi') return 'Sci-Fi';
  return genre.charAt(0).toUpperCase() + genre.slice(1);
}

function VideoResult({ video }: { video: VideoSummary }) {
  return (
    <Link
      to={`/video/${video.id}`}
      className="group overflow-hidden rounded-lg border border-white/[0.05] bg-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_0_24px_rgba(201,162,39,0.15)]"
    >
      <div className="relative aspect-video overflow-hidden bg-black/50">
        <img
          src={getThumbnailUrl(video.cloudinaryId, video.thumbnailUrl)}
          alt=""
          className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
        />
        <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white/90">
          {formatDuration(video.duration)}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div>
          <p className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-gold">
            {video.title}
          </p>
          <p className="text-sm text-muted-foreground">{video.creator.name}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatGenre(video.genre)}</span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-gold text-gold" />
            {video.averageRating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ChannelResult({ channel }: { channel: SearchChannel }) {
  return (
    <Link
      to={`/profile/${channel.id}`}
      className="group flex items-center gap-4 rounded-lg border border-white/[0.06] bg-card/40 p-4 transition-all duration-300 hover:border-gold/35 hover:bg-card/60"
    >
      <Avatar className="h-14 w-14 shrink-0 border border-gold/20">
        <AvatarImage src={channel.avatarUrl ?? ''} className="object-cover" />
        <AvatarFallback className="bg-gold/10 text-lg font-semibold text-gold">
          {channel.displayName[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-foreground group-hover:text-gold">
          {channel.displayName}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums text-gold/80">
            {channel.subscriberCount}
          </span>{' '}
          subscribers
        </p>
      </div>
    </Link>
  );
}

function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [channels, setChannels] = useState<SearchChannel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadResults = async () => {
      if (!query) {
        setVideos([]);
        setChannels([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchContent(query);
        if (!isMounted) return;
        setVideos(results.videos);
        setChannels(results.channels);
      } catch (err) {
        console.error('Search failed:', err);
        if (isMounted) {
          setVideos([]);
          setChannels([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadResults();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const hasResults = videos.length > 0 || channels.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="mx-auto max-w-[1600px] px-4 pt-24 md:px-8">
        <div className="mb-8 animate-fade-in opacity-0">
          <p className="text-sm uppercase tracking-widest text-gold/80">
            Search
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {query ? `Results for "${query}"` : 'Search ShortCuts'}
          </h1>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : !query ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-white/[0.06] bg-card/30 text-muted-foreground">
            <SearchIcon className="h-8 w-8 text-gold/70" />
            Enter a search term to find videos and channels.
          </div>
        ) : !hasResults ? (
          <div className="rounded-lg border border-white/[0.06] bg-card/30 p-12 text-center text-muted-foreground">
            No videos or channels matched your search.
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 text-xl font-semibold text-foreground md:text-2xl">
                Channels
              </h2>
              {channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No matching channels.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {channels.map((channel) => (
                    <ChannelResult key={channel.id} channel={channel} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-foreground md:text-2xl">
                Videos
              </h2>
              {videos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No matching videos.
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {videos.map((video) => (
                    <VideoResult key={video.id} video={video} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default SearchPage;
