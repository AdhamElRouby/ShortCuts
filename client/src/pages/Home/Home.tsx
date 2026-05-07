import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Play, Plus, Star } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { getThumbnailUrl, getVideos, type VideoSummary } from '@/api/video';
import { getTopChannels, type ChannelInfo } from '@/api/user';

interface HomeVideo {
  id: string;
  title: string;
  creator: string;
  duration: string;
  rating: number;
  thumbnail: string | null;
  genre: string;
  description: string | null;
}

const GRADIENT_BY_GENRE: Record<string, string> = {
  Drama: 'from-rose-900/80 via-amber-900/40 to-zinc-900',
  Thriller: 'from-indigo-900/80 via-purple-900/40 to-zinc-900',
  Animation: 'from-amber-700/80 via-orange-900/40 to-zinc-900',
  Documentary: 'from-emerald-900/80 via-teal-900/40 to-zinc-900',
  Comedy: 'from-yellow-700/80 via-amber-900/40 to-zinc-900',
  Horror: 'from-red-900/80 via-zinc-900/60 to-zinc-900',
  'Sci-Fi': 'from-sky-900/80 via-indigo-900/40 to-zinc-900',
  Romance: 'from-pink-900/80 via-rose-900/40 to-zinc-900',
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatGenre(genre: string): string {
  if (genre === 'scifi') return 'Sci-Fi';
  return genre.charAt(0).toUpperCase() + genre.slice(1);
}

function toHomeVideo(video: VideoSummary): HomeVideo {
  return {
    id: video.id,
    title: video.title,
    creator: video.creator.name,
    duration: formatDuration(video.duration),
    rating: video.averageRating,
    thumbnail: getThumbnailUrl(video.cloudinaryId, video.thumbnailUrl),
    genre: formatGenre(video.genre),
    description: video.description,
  };
}

function VideoCard({ video }: { video: HomeVideo }) {
  const gradient = GRADIENT_BY_GENRE[video.genre] ?? 'from-zinc-800 to-zinc-900';

  return (
    <Link
      to={`/video/${video.id}`}
      className="group relative shrink-0 w-[260px] md:w-[300px] overflow-hidden rounded-lg border border-white/[0.05] bg-card transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_24px_rgba(201,162,39,0.15)] hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className={`relative aspect-video bg-gradient-to-br ${gradient}`}>
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white/90">
          {video.duration}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
          <div className="w-12 h-12 rounded-full bg-gold/90 flex items-center justify-center shadow-[0_0_30px_rgba(201,162,39,0.5)]">
            <Play className="w-5 h-5 text-background fill-background ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-gold transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{video.creator}</span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            <Star className="w-3 h-3 fill-gold text-gold" />
            <span className="tabular-nums">{video.rating.toFixed(1)}</span>
          </span>
        </div>
        <div className="pt-1">
          <span className="inline-block rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/80">
            {video.genre}
          </span>
        </div>
      </div>
    </Link>
  );
}

function VideoRow({ title, videos }: { title: string; videos: HomeVideo[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const node = scrollRef.current;
    if (!node) return;
    const amount = node.clientWidth * 0.8;
    node.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="cursor-pointer text-muted-foreground hover:text-gold hover:bg-white/[0.04]"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="cursor-pointer text-muted-foreground hover:text-gold hover:bg-white/[0.04]"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}

function Hero({ video }: { video: HomeVideo }) {
  const gradient = GRADIENT_BY_GENRE[video.genre] ?? 'from-zinc-800 to-zinc-900';
  return (
    <div className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 pb-16 md:pb-20">
          <div className="max-w-xl space-y-5 animate-fade-in-up opacity-0">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-medium uppercase tracking-widest text-gold">
                Featured
              </span>
              <span className="text-muted-foreground text-sm">{video.genre}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              {video.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{video.creator}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span className="tabular-nums">{video.duration}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-gold text-gold" />
                <span className="tabular-nums">{video.rating.toFixed(1)}</span>
              </span>
            </div>

            <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
              {video.description ??
                'Discover a new short film from the ShortCuts community.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link to={`/video/${video.id}`}>
                <Button className="cursor-pointer bg-gold hover:bg-gold-light text-background font-semibold px-6 transition-all duration-300 hover:shadow-[0_0_24px_rgba(201,162,39,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                  <Play className="w-4 h-4 mr-2 fill-background" />
                  Watch now
                </Button>
              </Link>
              <Button
                variant="outline"
                className="cursor-pointer border-white/20 bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.1] hover:border-gold/40 text-foreground font-medium px-6 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                My list
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopChannels({ channels }: { channels: ChannelInfo[] }) {
  if (channels.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground">
        <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Top channels
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            to={`/profile/${channel.id}`}
            className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-card/40 p-3 transition-all duration-300 hover:border-gold/35 hover:bg-card/60"
          >
            <Avatar className="h-11 w-11 shrink-0 border border-gold/20">
              <AvatarImage src={channel.avatarUrl ?? ''} className="object-cover" />
              <AvatarFallback className="bg-gold/10 text-sm font-semibold text-gold">
                {channel.displayName[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground group-hover:text-gold">
                {channel.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="tabular-nums text-gold/80">
                  {channel.subscriberCount}
                </span>{' '}
                subscribers
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { user, profile } = useAuth();
  const [videos, setVideos] = useState<HomeVideo[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const firstName = profile?.displayName?.split(' ')[0];

  const profileInitials =
    profile?.displayName
      ?.split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  useEffect(() => {
    let isMounted = true;

    const loadHomeContent = async () => {
      try {
        const [videoData, channelData] = await Promise.all([
          getVideos(18),
          getTopChannels(5),
        ]);

        if (!isMounted) return;
        setVideos(videoData.map(toHomeVideo));
        setChannels(channelData);
      } catch (err) {
        console.error('Failed to load home content:', err);
      } finally {
        if (isMounted) setLoadingContent(false);
      }
    };

    loadHomeContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const featured = videos[0];
  const trending = videos.slice(0, 6);
  const newReleases = videos.slice(6, 12);
  const moreToWatch = videos.slice(12, 18);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-20">
        {featured ? (
          <Hero video={featured} />
        ) : (
          <div className="flex h-[70vh] min-h-[480px] items-center justify-center bg-gradient-to-br from-zinc-900 to-background pt-16">
            {loadingContent ? (
              <Loader2 className="h-9 w-9 animate-spin text-gold" />
            ) : (
              <p className="text-muted-foreground">No videos available yet.</p>
            )}
          </div>
        )}

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-8 md:mt-10 space-y-10">
          {firstName && (
            <div className="animate-fade-in opacity-0">
              <p className="text-sm uppercase tracking-widest text-gold/80">
                Welcome back
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold mt-1">
                Ready for tonight, {firstName}?
              </h2>
            </div>
          )}

          {user && profile && (
            <Link
              to={`/profile/${user.id}`}
              className="group flex items-center gap-4 md:gap-5 rounded-xl border border-white/[0.06] bg-card/40 hover:bg-card/60 hover:border-gold/25 p-4 md:p-5 transition-all duration-300 animate-fade-in opacity-0"
            >
              <Avatar className="h-14 w-14 md:h-16 md:w-16 shrink-0 border-2 border-gold/20 shadow-lg">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt="" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gold/15 text-gold text-lg font-semibold">
                  {profileInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-gold/70">
                  Your profile
                </p>
                <p className="text-lg md:text-xl font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                  {profile.displayName}
                </p>
                {profile.bio ? (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/70 italic">
                    Add a bio on your profile
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}

          <TopChannels channels={channels} />
          {trending.length > 0 && (
            <VideoRow title="Trending this week" videos={trending} />
          )}
          {newReleases.length > 0 && (
            <VideoRow title="New releases" videos={newReleases} />
          )}
          {moreToWatch.length > 0 && (
            <VideoRow title="More to watch" videos={moreToWatch} />
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;
