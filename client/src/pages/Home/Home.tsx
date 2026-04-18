import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Star } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// PLACEHOLDER: Replace with real data from videos API when video listing is implemented
interface HomeVideo {
  id: string;
  title: string;
  creator: string;
  duration: string;
  rating: number;
  thumbnail: string;
  genre: string;
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

const FEATURED: HomeVideo = {
  id: 'featured-1',
  title: 'The Last Light',
  creator: 'Ava Moreno',
  duration: '12:34',
  rating: 4.8,
  thumbnail: '',
  genre: 'Drama',
};

const TRENDING: HomeVideo[] = [
  { id: 't1', title: 'Static Hour', creator: 'Kai Chen', duration: '08:22', rating: 4.6, thumbnail: '', genre: 'Thriller' },
  { id: 't2', title: 'Paper Moons', creator: 'Ines Duval', duration: '14:02', rating: 4.9, thumbnail: '', genre: 'Animation' },
  { id: 't3', title: 'Copper Sky', creator: 'Rami Azad', duration: '09:47', rating: 4.4, thumbnail: '', genre: 'Drama' },
  { id: 't4', title: 'Under Glass', creator: 'Nora Kim', duration: '11:18', rating: 4.7, thumbnail: '', genre: 'Documentary' },
  { id: 't5', title: 'Neon Rooms', creator: 'Leo Park', duration: '07:55', rating: 4.3, thumbnail: '', genre: 'Sci-Fi' },
  { id: 't6', title: 'Quiet Mouths', creator: 'Sana El-Hadi', duration: '10:09', rating: 4.5, thumbnail: '', genre: 'Drama' },
];

const NEW_RELEASES: HomeVideo[] = [
  { id: 'n1', title: 'Small Wildfires', creator: 'Jude Okafor', duration: '13:40', rating: 4.2, thumbnail: '', genre: 'Drama' },
  { id: 'n2', title: 'Tideline', creator: 'Mira Haj', duration: '06:28', rating: 4.1, thumbnail: '', genre: 'Romance' },
  { id: 'n3', title: 'The Night Shift', creator: 'Owen Reyes', duration: '09:01', rating: 4.0, thumbnail: '', genre: 'Horror' },
  { id: 'n4', title: 'Bright Lines', creator: 'Ada Petrov', duration: '12:12', rating: 4.6, thumbnail: '', genre: 'Comedy' },
  { id: 'n5', title: 'Salt & Iron', creator: 'Hana Soto', duration: '15:33', rating: 4.8, thumbnail: '', genre: 'Thriller' },
  { id: 'n6', title: 'Slow Dawn', creator: 'Tom Abel', duration: '08:44', rating: 4.3, thumbnail: '', genre: 'Animation' },
];

const STAFF_PICKS: HomeVideo[] = [
  { id: 's1', title: 'Hollow Hours', creator: 'Yui Tanaka', duration: '11:55', rating: 4.9, thumbnail: '', genre: 'Drama' },
  { id: 's2', title: 'Rough Cuts', creator: 'Elio Marques', duration: '07:10', rating: 4.7, thumbnail: '', genre: 'Documentary' },
  { id: 's3', title: 'Polaroids', creator: 'Priya Rao', duration: '09:29', rating: 4.8, thumbnail: '', genre: 'Romance' },
  { id: 's4', title: 'Blue Corridor', creator: 'Dex Alvarez', duration: '10:47', rating: 4.6, thumbnail: '', genre: 'Sci-Fi' },
  { id: 's5', title: 'Dust Parade', creator: 'Mina Oren', duration: '13:02', rating: 4.5, thumbnail: '', genre: 'Drama' },
  { id: 's6', title: 'Close Quarters', creator: 'Ben Holt', duration: '08:33', rating: 4.4, thumbnail: '', genre: 'Thriller' },
];

function VideoCard({ video }: { video: HomeVideo }) {
  const gradient = GRADIENT_BY_GENRE[video.genre] ?? 'from-zinc-800 to-zinc-900';

  return (
    <Link
      to={`/video/${video.id}`}
      className="group relative shrink-0 w-[260px] md:w-[300px] overflow-hidden rounded-lg border border-white/[0.05] bg-card transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_24px_rgba(201,162,39,0.15)] hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className={`relative aspect-video bg-gradient-to-br ${gradient}`}>
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
              A quiet dinner becomes a reckoning. One evening, one table, and the
              things finally said out loud.
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

function Home() {
  const { profile } = useAuth();
  const firstName = profile?.displayName?.split(' ')[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-20">
        <Hero video={FEATURED} />

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

          <VideoRow title="Trending this week" videos={TRENDING} />
          <VideoRow title="New releases" videos={NEW_RELEASES} />
          <VideoRow title="Staff picks" videos={STAFF_PICKS} />
        </div>
      </main>
    </div>
  );
}

export default Home;
