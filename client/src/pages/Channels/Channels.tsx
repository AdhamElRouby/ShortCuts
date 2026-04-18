import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  getChannels,
  subscribeToUser,
  unsubscribeFromUser,
  type ChannelInfo,
} from '@/api/user';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function Channels() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeBusyId, setSubscribeBusyId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchChannels = async () => {
      try {
        const data = await getChannels();
        if (isMounted) setChannels(data);
      } catch (err) {
        console.error('Failed to fetch channels:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChannels();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSubscribe = async (channel: ChannelInfo) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (channel.id === user.id) {
      return;
    }

    setSubscribeBusyId(channel.id);
    try {
      const result = channel.isSubscribed
        ? await unsubscribeFromUser(channel.id)
        : await subscribeToUser(channel.id);

      setChannels((current) =>
        current.map((entry) =>
          entry.id === channel.id
            ? {
                ...entry,
                isSubscribed: result.isSubscribed,
                subscriberCount: result.subscriberCount,
              }
            : entry,
        ),
      );
    } catch {
      toast.error('Could not update subscription');
    } finally {
      setSubscribeBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pt-24 md:px-8">
        <div className="mb-8 animate-fade-in opacity-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Discover <span className="text-gold">Creators</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find and follow the best short cinema creators on the platform.
          </p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : channels.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-card p-12 text-center text-muted-foreground">
            No creators found yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {channels.map((channel, idx) => (
              <div
                key={channel.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/6 bg-card/40 p-4 transition-all duration-300 hover:border-gold/30 hover:bg-card/60 animate-fade-in-up opacity-0"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <Link
                  to={`/profile/${channel.id}`}
                  className="flex flex-1 items-center gap-4 hover:opacity-90"
                >
                  <Avatar className="h-16 w-16 border border-gold/20 shadow-sm transition-colors group-hover:border-gold/50">
                    <AvatarImage
                      src={channel.avatarUrl || ''}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gold/10 text-xl font-medium text-gold">
                      {channel.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-gold">
                      {channel.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-gold/80">
                        {channel.subscriberCount}
                      </span>
                      {channel.subscriberCount === 1
                        ? ' subscriber'
                        : ' subscribers'}
                    </p>
                  </div>
                </Link>

                {channel.id === user?.id ? (
                  <Button
                    variant="outline"
                    className="w-full shrink-0 border-white/10 bg-white/4 text-muted-foreground sm:w-auto"
                    disabled
                  >
                    Your channel
                  </Button>
                ) : (
                  <Button
                    variant={channel.isSubscribed ? 'outline' : 'default'}
                    className={cn(
                      'w-full shrink-0 sm:w-auto',
                      channel.isSubscribed
                        ? 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                        : 'border-white/10 bg-white/4 text-foreground hover:border-gold/40 hover:bg-gold/10 hover:text-gold',
                    )}
                    disabled={subscribeBusyId === channel.id}
                    onClick={() => toggleSubscribe(channel)}
                  >
                    {subscribeBusyId === channel.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : channel.isSubscribed ? (
                      'Unsubscribe'
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Channels;
