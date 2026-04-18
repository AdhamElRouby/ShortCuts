import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserProfile,
  updateProfile,
  subscribeToUser,
  unsubscribeFromUser,
  type PublicProfile,
} from '@/api/user';
import { uploadVideo, getThumbnailUrl } from '@/api/video';
import { VIDEO_GENRES } from '@/constants/videoGenres';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Pencil, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadGenre, setUploadGenre] = useState<string>(VIDEO_GENRES[0]);
  const [uploadVideoFile, setUploadVideoFile] = useState<File | null>(null);
  const [uploadThumbFile, setUploadThumbFile] = useState<File | null>(null);
  const [uploadPublic, setUploadPublic] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [subscribeBusy, setSubscribeBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const profile = await getUserProfile(userId);
      setData(profile);
    } catch {
      setLoadError('Profile could not be loaded.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!editOpen || !data) return;
    setEditDisplayName(data.displayName);
    setEditBio(data.bio ?? '');
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
  }, [editOpen, data]);

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditAvatarFile(file);
    setEditAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('displayName', editDisplayName.trim());
      fd.append('bio', editBio);
      if (editAvatarFile) fd.append('avatar', editAvatarFile);
      await updateProfile(fd);
      await refreshProfile();
      await load();
      toast.success('Profile updated');
      setEditOpen(false);
    } catch {
      toast.error('Could not save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadVideoFile || !uploadTitle.trim()) {
      toast.error('Video file and title are required');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('video', uploadVideoFile);
      fd.append('title', uploadTitle.trim());
      if (uploadDescription.trim()) fd.append('description', uploadDescription.trim());
      fd.append('genre', uploadGenre);
      fd.append('isPublic', uploadPublic ? 'true' : 'false');
      if (uploadThumbFile) fd.append('thumbnail', uploadThumbFile);

      await uploadVideo(fd, (p) => setUploadProgress(p));
      toast.success('Video uploaded');
      setUploadOpen(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadGenre(VIDEO_GENRES[0]);
      setUploadVideoFile(null);
      setUploadThumbFile(null);
      setUploadPublic(true);
      setUploadProgress(0);
      await load();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleSubscribe = async () => {
    if (!userId || !data) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setSubscribeBusy(true);
    try {
      const result = data.isSubscribed
        ? await unsubscribeFromUser(userId)
        : await subscribeToUser(userId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              isSubscribed: result.isSubscribed,
              subscriberCount: result.subscriberCount,
            }
          : prev,
      );
    } catch {
      toast.error('Could not update subscription');
    } finally {
      setSubscribeBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">{loadError ?? 'Not found'}</p>
        <Button asChild variant="outline" className="border-white/10">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  const avatarSrc = data.avatarUrl ?? undefined;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground pb-16 animate-fade-in">
      <div className="border-b border-white/10 bg-black/40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-gold shrink-0"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Link to="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">
            Home
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-10 md:pt-14">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-2 border-gold/25 shadow-lg shrink-0">
            <AvatarImage src={avatarSrc} alt="" className="object-cover" />
            <AvatarFallback className="bg-gold/10 text-gold text-3xl font-semibold">
              {data.displayName[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {data.displayName}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground">
                <span>
                  <span className="text-gold font-medium tabular-nums">{data.subscriberCount}</span>{' '}
                  subscribers
                </span>
                <span>
                  <span className="text-gold font-medium tabular-nums">{data.subscriptionCount}</span>{' '}
                  subscriptions
                </span>
              </div>
            </div>

            {data.bio ? (
              <p className="text-foreground/80 whitespace-pre-wrap max-w-2xl leading-relaxed">
                {data.bio}
              </p>
            ) : (
              <p className="text-muted-foreground/60 italic text-sm">No bio yet.</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {data.isOwnProfile ? (
                <>
                  <Button
                    type="button"
                    className="bg-gold hover:bg-gold-light text-background"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gold/40 text-gold hover:bg-gold/10"
                    onClick={() => setUploadOpen(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  disabled={subscribeBusy}
                  className={cn(
                    data.isSubscribed
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/15'
                      : 'bg-gold hover:bg-gold-light text-background',
                  )}
                  onClick={toggleSubscribe}
                >
                  {subscribeBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : data.isSubscribed ? (
                    'Subscribed'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <section className="mt-14 md:mt-20">
          <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/10 pb-3">
            Videos
          </h2>
          {data.videos.length === 0 ? (
            <p className="text-muted-foreground text-sm">No videos yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.videos.map((v) => (
                <Link
                  key={v.id}
                  to={`/video/${v.id}`}
                  className="group rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-gold/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="aspect-video bg-black/50 overflow-hidden">
                    <img
                      src={getThumbnailUrl(v.cloudinaryId, v.thumbnailUrl)}
                      alt=""
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-medium text-white line-clamp-2 group-hover:text-gold transition-colors">
                      {v.title}
                    </p>
                    {v.duration != null && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {Math.floor(v.duration / 60)}:
                        {String(v.duration % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-white/10">
          <form onSubmit={handleSaveProfile}>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Update how you appear to others on ShortCuts.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-white/10">
                  <AvatarImage src={editAvatarPreview ?? avatarSrc} />
                  <AvatarFallback className="bg-gold/10 text-gold">
                    {editDisplayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Label htmlFor="avatar" className="text-xs text-muted-foreground">
                    Profile photo
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="cursor-pointer text-xs"
                    onChange={onAvatarChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  required
                  className="bg-white/[0.04] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="bg-white/[0.04] border-white/10 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingProfile} className="bg-gold text-background hover:bg-gold-light">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={(o) => !uploading && setUploadOpen(o)}>
        <DialogContent className="sm:max-w-lg bg-popover border-white/10 max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUploadVideo}>
            <DialogHeader>
              <DialogTitle>Upload video</DialogTitle>
              <DialogDescription>
                Add a short film to your channel. Large files may take a few minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vfile">Video file</Label>
                <Input
                  id="vfile"
                  type="file"
                  accept="video/*"
                  required
                  className="cursor-pointer"
                  onChange={(e) => setUploadVideoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vtitle">Title</Label>
                <Input
                  id="vtitle"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="bg-white/[0.04] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vdesc">Description</Label>
                <Textarea
                  id="vdesc"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  className="bg-white/[0.04] border-white/10 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select value={uploadGenre} onValueChange={setUploadGenre}>
                  <SelectTrigger className="w-full bg-white/[0.04] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {VIDEO_GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumb">Thumbnail (optional)</Label>
                <Input
                  id="thumb"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(e) => setUploadThumbFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 px-3 py-2">
                <Label htmlFor="pub" className="cursor-pointer">
                  Public listing
                </Label>
                <Switch id="pub" checked={uploadPublic} onCheckedChange={setUploadPublic} />
              </div>
              {uploading && (
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">{uploadProgress}%</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={uploading} onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="bg-gold text-background hover:bg-gold-light">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Profile;
