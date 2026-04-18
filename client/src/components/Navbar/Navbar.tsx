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
  { to: '/browse', label: 'Browse' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/subscriptions', label: 'Subscriptions' },
];

function Navbar() {
  const { profile, signOut } = useAuth();
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
          ? 'bg-background/85 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-gradient-to-b from-background/80 to-transparent',
      )}
    >
      <div className="max-w-[1600px] mx-auto flex items-center gap-4 md:gap-8 px-4 md:px-8 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img
            src="/logo/short-cuts-logo-no-bg.png"
            alt="ShortCuts"
            className="w-8 h-8 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden sm:inline text-lg font-bold tracking-tight">
            Short<span className="text-gold">Cuts</span>
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200',
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
                    <span className="absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-md ml-auto md:ml-0 relative group"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-gold/70 transition-colors" />
          <Input
            type="search"
            placeholder="Search short films, creators…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 placeholder:text-muted-foreground/50 transition-colors"
          />
        </form>

        {/* Right side: notifications + avatar menu */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
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
                className="cursor-pointer rounded-full ring-1 ring-white/[0.08] hover:ring-gold/40 transition-all duration-200"
                aria-label="Account menu"
              >
                <Avatar size="default">
                  {profile?.avatarUrl && (
                    <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                  )}
                  <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1">
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
                onClick={() => navigate('/profile')}
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
