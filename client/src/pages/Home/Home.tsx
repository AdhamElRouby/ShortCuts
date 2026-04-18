// PLACEHOLDER: Replace when Home page is implemented
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

function Home() {
  const { user, signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <span className="text-muted-foreground text-lg tracking-wide">
        {profile ? `Welcome, ${profile.displayName}` : 'Home'}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {user && (
          <Button
            asChild
            className="bg-gold hover:bg-gold-light text-background"
          >
            <Link to={`/profile/${user.id}`}>
              <User className="w-4 h-4 mr-2" />
              My profile
            </Link>
          </Button>
        )}
        <Button
          onClick={signOut}
          variant="outline"
          className="cursor-pointer border-white/[0.08] text-muted-foreground hover:text-gold hover:border-gold/30 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default Home;
