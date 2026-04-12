// PLACEHOLDER: Replace when Home page is implemented
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

function Home() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <span className="text-muted-foreground text-lg tracking-wide">
        {profile ? `Welcome, ${profile.displayName}` : 'Home'}
      </span>
      <Button
        onClick={signOut}
        variant="outline"
        className="cursor-pointer border-white/[0.08] text-muted-foreground hover:text-gold hover:border-gold/30 transition-all duration-200"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}

export default Home;
