import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, Film, LogOut, Search, Settings, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/channels', label: 'Browse' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/subscriptions', label: 'Subscriptions' },
];

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const initials =
    profile?.displayName
      ?.split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // PLACEHOLDER: Replace when Search page is implemented
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-gradient-to-b from-background/90 via-background/40 to-transparent',
      )}
    >
      <div className="mx-auto flex h-16 min-w-0 max-w-[1600px] items-center gap-2 px-4 sm:gap-4 md:px-8">
        {/* Logo + primary nav */}
        <div className="flex min-w-0 shrink-0 items-center gap-4 md:gap-8">
          <Link to="/" className="group flex shrink-0 items-center gap-2">
            <img
              src="/logo/short-cuts-logo-no-bg.png"
              alt="ShortCuts"
              className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="hidden text-lg font-bold tracking-tight sm:inline">
              Short<span className="text-gold">Cuts</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-gold'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Search — centered in remaining space */}
        <form onSubmit={handleSearch} className="group relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-gold/70" />
          <Input
            type="search"
            placeholder="Search short films, creators…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-full border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-4 text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:border-gold/40 focus-visible:ring-gold/20 md:h-10 md:max-w-xl md:mx-auto lg:max-w-2xl"
          />
        </form>

        {/* Notifications + avatar */}
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer text-muted-foreground hover:text-gold hover:bg-white/[0.04]"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer rounded-full ring-2 ring-white/[0.08] transition-all duration-200 hover:ring-gold/35"
                aria-label="Account menu"
              >
                <Avatar size="default" className="size-9">
                  {profile?.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.displayName ?? ''} />
                  ) : null}
                  <AvatarFallback className="bg-gold/15 text-xs font-semibold text-gold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="mt-1 w-56 border-white/[0.08] bg-popover/95 backdrop-blur-md"
            >
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {profile?.displayName ?? 'User'}
                </span>
                <span className="text-xs font-normal text-muted-foreground truncate">
                  Welcome back
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => user && navigate(`/profile/${user.id}`)}
                disabled={!user}
                className="cursor-pointer"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/watchlist')}
                className="cursor-pointer"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                My Watchlist
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/studio')}
                className="cursor-pointer"
              >
                <Film className="w-4 h-4 mr-2" />
                Creator Studio
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
