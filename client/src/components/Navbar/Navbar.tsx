import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, Clock, LogOut, Search, User, Home, Users, Heart, Plus } from 'lucide-react';
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

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Channels', path: '/channels', icon: Users },
  { label: 'Subscriptions', path: '/subscriptions', icon: Heart },
];

const Logo = () => (
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
);

export default function Navbar() {
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
      .map((part: string) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <>
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
            <Logo />

            <nav className="hidden items-center md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'relative px-4 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2">
                        <item.icon className={cn("h-4 w-4", isActive ? "text-gold" : "text-muted-foreground")} />
                        {item.label}
                      </div>
                      {isActive && (
                        <span className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-gold" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Search — centered in remaining space */}
          <form
            onSubmit={handleSearch}
            className="group relative min-w-0 flex-1 md:mx-auto md:max-w-xl lg:max-w-2xl"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-gold/70" />
            <Input
              type="search"
              placeholder="Search short films, creators…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-full border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-20 text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:border-gold/40 focus-visible:ring-gold/20 md:h-10"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 h-7 -translate-y-1/2 rounded-full bg-gold px-3 text-xs font-semibold text-background hover:bg-gold-light"
            >
              Search
            </Button>
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
                    {profile?.displayName ?? user?.email ?? 'User'}
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
                  onClick={() => navigate('/history')}
                  className="cursor-pointer"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Watch History
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden pb-safe">
        <ul className="flex h-16 items-center justify-around px-2 pb-2">
          {navItems.map((item) => (
            <li key={item.label} className="w-full">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex h-full w-full flex-col items-center justify-center gap-1 transition-colors',
                    isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('h-5 w-5', isActive && 'text-gold')} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="w-full">
            <button
              onClick={() => navigate('/create')}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Create</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
