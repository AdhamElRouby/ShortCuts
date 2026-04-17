import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Send } from 'lucide-react';
import {
    getVideoById,
    getComments,
    postComment,
    rateVideo,
    getThumbnailUrl,
    getHlsUrl
} from '@/api/video';


interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

interface VideoData {
    id: string;
    title: string;
    description: string;
    cloudinaryId: string;
    thumbnailUrl: string | null;
    averageRating: number;
    userRating?: number;
    creator: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

export default function WatchPage() {
    const { videoId } = useParams<{ videoId: string }>();
    const { user } = useAuth();

    const [video, setVideo] = useState<VideoData | null>(null);
    

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [userRating, setUserRating] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        if (videoId) {
            loadData();
        }
    }, [videoId]);


    const loadData = async () => {
        try {
            setLoading(true);
            const [videoData, commentsData] = await Promise.all([
                getVideoById(videoId!),
                getComments(videoId!)
            ]);
            setVideo(videoData);
            setComments(commentsData);
            if (videoData.userRating) setUserRating(videoData.userRating);
        } catch (err) {
            console.error("Failed to load video:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRate = async (rating: number) => {
        if (!user || !video) return;
        try {
            await rateVideo(video.id, rating);
            setUserRating(rating);
            // Refresh video data to get updated average
            const updatedVideo = await getVideoById(video.id);
            setVideo(updatedVideo);
        } catch (err) {
            console.error("Rating failed:", err);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !video) return;

        setCommentLoading(true);
        try {
            const addedComment = await postComment(video.id, newComment);
            setComments((prev) => [addedComment, ...prev]);
            setNewComment('');
        } catch (err) {
            console.error("Comment failed:", err);
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-gold">Loading cinema...</div>;
    if (!video) return <div className="min-h-screen bg-background flex items-center justify-center text-white"> Video not found.</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-foreground pb-20">
            {/* Video Section */}
            <div className="w-full bg-black aspect-video max-h-[70vh]">
                <VideoPlayer
                    hlsUrl={getHlsUrl(video.cloudinaryId)}
                    thumbnailUrl={getThumbnailUrl(video.cloudinaryId, video.thumbnailUrl)}
                    autoplay={true}
                />
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Video Details */}
                <div className="lg:col-span-2 space-y-6 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{video.title}</h1>
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-white/10">

                            {/* Creator Info */}
                            <Link to={`/profile/${video.creator.id}`} className="flex items-center gap-3 group">
                                <Avatar className="h-12 w-12 border border-gold/20 group-hover:border-gold transition-colors">
                                    <AvatarImage src={video.creator.avatarUrl || ''} />
                                    <AvatarFallback className="bg-gold/10 text-gold">{video.creator.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-white group-hover:text-gold transition-colors">{video.creator.name}</p>
                                    <p className="text-xs text-muted-foreground">Content Creator</p>
                                </div>
                            </Link>

                            {/* Rating Display/Interaction */}
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRate(star)}
                                            disabled={!user}
                                            className={`cursor-pointer transition-all duration-200 ${star <= (userRating || video.averageRating)
                                                    ? 'text-gold fill-gold'
                                                    : 'text-white/20 hover:text-gold/50'
                                                } ${!user && 'cursor-default'}`}
                                        >
                                            <Star className="w-6 h-6" />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Average: <span className="text-gold font-medium">{video.averageRating.toFixed(1)}</span> / 5
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {video.description}
                        </p>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-2 text-xl font-semibold text-white">
                            <MessageSquare className="w-5 h-5 text-gold" />
                            Comments ({comments.length})
                        </div>

                        {/* Post Comment */}
                        {user ? (
                            <form onSubmit={handleCommentSubmit} className="relative group">
                                <Textarea
                                    placeholder="Share your thoughts..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="bg-white/[0.04] border-white/[0.1] focus:border-gold/50 focus:ring-gold/20 min-h-[100px] pr-12 transition-all"
                                />
                                <Button
                                    type="submit"
                                    disabled={commentLoading || !newComment.trim()}
                                    size="icon"
                                    className="absolute bottom-3 right-3 bg-gold hover:bg-gold-light text-background rounded-full transition-transform active:scale-90"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        ) : (
                            <p className="text-sm text-muted-foreground bg-white/[0.02] p-4 rounded-lg border border-dashed border-white/10">
                                Please <Link to="/login" className="text-gold hover:underline">sign in</Link> to join the conversation.
                            </p>
                        )}

                        {/* Comment List */}
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="flex gap-4 p-4 rounded-lg bg-white/[0.02] border border-transparent hover:border-white/[0.05] transition-all animate-fade-in-up"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={comment.user.avatarUrl || ''} />
                                        <AvatarFallback className="bg-white/10">{comment.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-white">{comment.user.name}</p>
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/70">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar (Placeholder for "Up Next") */}
                <div className="hidden lg:block space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-white/10 pb-2">
                        Recommended
                    </h3>
                    <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                        <p className="text-sm text-muted-foreground/40 italic">More cinema coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}