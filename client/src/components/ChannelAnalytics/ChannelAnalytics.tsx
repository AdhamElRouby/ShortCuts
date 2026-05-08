import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyChannelAnalytics,
  type ChannelAnalytics as ChannelAnalyticsData,
  type ChannelAnalyticsVideo,
} from '@/api/analytics';
import { getReceivedDonations, type ReceivedDonation } from '@/api/donation';
import { getThumbnailUrl } from '@/api/video';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowDown, ArrowUp, ArrowUpDown, Heart, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey =
  | 'title'
  | 'createdAt'
  | 'viewCount'
  | 'averageRating'
  | 'ratingCount'
  | 'commentCount';

type SortDir = 'asc' | 'desc';

const COMPACT = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const USD = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

function formatCount(n: number): string {
  return COMPACT.format(n);
}

function formatRating(value: number | null): string {
  return value == null ? '—' : value.toFixed(2);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatUSD(cents: number): string {
  return USD.format(cents / 100);
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-card/40 p-5 transition-colors hover:border-gold/25">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: 'left' | 'right';
}) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-gold',
        active ? 'text-gold' : 'text-muted-foreground',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ChannelAnalytics() {
  const [data, setData] = useState<ChannelAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [donations, setDonations] = useState<ReceivedDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyChannelAnalytics()
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load analytics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDonationsLoading(true);
    getReceivedDonations()
      .then((res) => {
        if (cancelled) return;
        setDonations(res);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setDonationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedVideos = useMemo<ChannelAnalyticsVideo[]>(() => {
    if (!data) return [];
    const copy = [...data.videos];
    copy.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      switch (sortKey) {
        case 'title':
          av = a.title.toLowerCase();
          bv = b.title.toLowerCase();
          break;
        case 'createdAt':
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
          break;
        case 'averageRating':
          av = a.averageRating ?? -1;
          bv = b.averageRating ?? -1;
          break;
        default:
          av = a[sortKey];
          bv = b[sortKey];
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  const totalDonatedCents = useMemo(
    () => donations.reduce((sum, d) => sum + d.amountCents, 0),
    [donations],
  );

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'title' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold/70" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 hover:border-gold/30 hover:text-gold"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { totals, videos } = data;
  const hasVideos = videos.length > 0;
  const hasDonations = donations.length > 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          label="Total videos"
          value={formatCount(totals.videoCount)}
        />
        <StatCard
          label="Subscribers"
          value={formatCount(totals.subscriberCount)}
        />
        <StatCard
          label="Total views"
          value={formatCount(totals.totalViews)}
          sublabel="Across all videos"
        />
        <StatCard
          label="Average rating"
          value={formatRating(totals.averageRating)}
          sublabel={`${formatCount(totals.ratingCount)} ratings`}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between border-b border-white/6 pb-3">
          <h3 className="text-lg font-semibold text-foreground md:text-xl">
            Per-video performance
          </h3>
          {hasVideos && (
            <p className="text-xs text-muted-foreground">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </p>
          )}
        </div>

        {!hasVideos ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-card/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              You haven't uploaded any videos yet. Once you do, their analytics
              will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/6 bg-card/30">
            <Table>
              <TableHeader>
                <TableRow className="border-white/6 hover:bg-transparent">
                  <TableHead className="w-[44%] min-w-65 py-3">
                    <SortHeader
                      label="Video"
                      active={sortKey === 'title'}
                      dir={sortDir}
                      onClick={() => toggleSort('title')}
                    />
                  </TableHead>
                  <TableHead className="py-3 text-right">
                    <SortHeader
                      label="Published"
                      active={sortKey === 'createdAt'}
                      dir={sortDir}
                      onClick={() => toggleSort('createdAt')}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="py-3 text-right">
                    <SortHeader
                      label="Views"
                      active={sortKey === 'viewCount'}
                      dir={sortDir}
                      onClick={() => toggleSort('viewCount')}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="py-3 text-right">
                    <SortHeader
                      label="Avg rating"
                      active={sortKey === 'averageRating'}
                      dir={sortDir}
                      onClick={() => toggleSort('averageRating')}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="py-3 text-right">
                    <SortHeader
                      label="Ratings"
                      active={sortKey === 'ratingCount'}
                      dir={sortDir}
                      onClick={() => toggleSort('ratingCount')}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="py-3 text-right">
                    <SortHeader
                      label="Comments"
                      active={sortKey === 'commentCount'}
                      dir={sortDir}
                      onClick={() => toggleSort('commentCount')}
                      align="right"
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVideos.map((v) => (
                  <TableRow
                    key={v.id}
                    className="border-white/4 hover:bg-white/3"
                  >
                    <TableCell className="py-3">
                      <Link
                        to={`/video/${v.id}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-black/50">
                          <img
                            src={getThumbnailUrl(v.cloudinaryId, v.thumbnailUrl)}
                            alt=""
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 whitespace-normal font-medium text-foreground transition-colors group-hover:text-gold">
                            {v.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {v.genre}
                            {!v.isPublic && (
                              <span className="ml-2 rounded border border-white/10 bg-white/4 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                                Private
                              </span>
                            )}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm text-muted-foreground">
                      {formatDate(v.createdAt)}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-foreground">
                      {formatCount(v.viewCount)}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums">
                      {v.averageRating == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-1 text-foreground">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          {v.averageRating.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-foreground">
                      {formatCount(v.ratingCount)}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-foreground">
                      {formatCount(v.commentCount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Donations received */}
      <section>
        <div className="mb-4 flex items-center justify-between border-b border-white/6 pb-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground md:text-xl">
            <Heart className="h-5 w-5 text-gold" />
            Donations received
          </h3>
          {hasDonations && (
            <p className="text-xs text-muted-foreground">
              {donations.length} {donations.length === 1 ? 'donation' : 'donations'}{' '}
              &middot;{' '}
              <span className="font-semibold text-gold tabular-nums">
                {formatUSD(totalDonatedCents)}
              </span>{' '}
              total
            </p>
          )}
        </div>

        {donationsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold/70" />
          </div>
        ) : !hasDonations ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/10 bg-card/30 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/20">
              <Heart className="h-6 w-6 text-gold/60" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No donations yet</p>
              <p className="text-sm text-muted-foreground">
                When viewers support your channel, their donations will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/6 bg-card/30">
            <Table>
              <TableHeader>
                <TableRow className="border-white/6 hover:bg-transparent">
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Supporter
                  </TableHead>
                  <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d) => (
                  <TableRow
                    key={d.id}
                    className="border-white/4 hover:bg-white/3"
                  >
                    <TableCell className="py-3">
                      <Link
                        to={`/profile/${d.donor.id}`}
                        className="group flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8 shrink-0 border border-white/10">
                          {d.donor.avatarUrl && (
                            <AvatarImage src={d.donor.avatarUrl} alt="" className="object-cover" />
                          )}
                          <AvatarFallback className="bg-gold/10 text-xs font-semibold text-gold">
                            {initials(d.donor.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground transition-colors group-hover:text-gold">
                          {d.donor.displayName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-right font-semibold tabular-nums text-gold">
                      {formatUSD(d.amountCents)}
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm text-muted-foreground">
                      {formatDate(d.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ChannelAnalytics;
