import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    getSubscribedChannels,
    unsubscribeFromUser,
    type ChannelInfo,
} from '@/api/user';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, HeartCrack } from 'lucide-react';
import { toast } from 'sonner';

function Subscriptions() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [channels, setChannels] = useState<ChannelInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [unsubscribeBusyId, setUnsubscribeBusyId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchChannels = async () => {
            try {
                const data = await getSubscribedChannels();
                if (isMounted) setChannels(data);
            } catch (err) {
                console.error('Failed to fetch subscriptions:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchChannels();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleUnsubscribe = async (channelId: string) => {
        if (!user) return navigate('/login');
        setUnsubscribeBusyId(channelId);
        try {
            await unsubscribeFromUser(channelId);
            setChannels((current) => current.filter((c) => c.id !== channelId));
            toast.success('Unsubscribed successfully');
        } catch {
            toast.error('Could not update subscription');
        } finally {
            setUnsubscribeBusyId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="mx-auto max-w-4xl px-4 pt-24 md:px-8">
                <div className="mb-8 animate-fade-in opacity-0">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        My <span className="text-gold">Subscriptions</span>
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Keep up with the creators you follow.
                    </p>
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gold" />
                    </div>
                ) : channels.length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-card p-12 text-center text-muted-foreground">
                        You aren't subscribed to anyone yet. Discover creators on the{' '}
                        <Link to="/channels" className="text-gold hover:underline">
                            Channels
                        </Link>{' '}
                        page.
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

                                <Button
                                    variant="outline"
                                    className="w-full shrink-0 sm:w-auto border-white/10 bg-white/4 text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                    disabled={unsubscribeBusyId === channel.id}
                                    onClick={() => handleUnsubscribe(channel.id)}
                                >
                                    {unsubscribeBusyId === channel.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <HeartCrack className="h-4 w-4 mr-2" />
                                            Unsubscribe
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Subscriptions;
