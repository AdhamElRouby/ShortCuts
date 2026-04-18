/**
 * VideoPlayer — reusable HLS adaptive streaming player built on Video.js.
 *
 * Includes a quality selector (Auto / 720p / 360p) in the control bar.
 *
 * Usage:
 *   import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
 *   import { getHlsUrl, getThumbnailUrl } from '@/api/video';
 *
 *   <VideoPlayer
 *     hlsUrl={getHlsUrl(video.cloudinaryId)}
 *     thumbnailUrl={getThumbnailUrl(video.cloudinaryId, video.thumbnailUrl)}
 *   />
 *
 * Props:
 *   hlsUrl        — required. Full HLS .m3u8 manifest URL.
 *   thumbnailUrl  — optional. Poster image shown before playback.
 *   autoplay      — optional (default false). Start playing on mount.
 *   className     — optional. Extra class names on the wrapper div.
 */
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';

/* ------------------------------------------------------------------ */
/*  Quality-selector components (registered once at module level)      */
/* ------------------------------------------------------------------ */

const VjsMenuItem = videojs.getComponent('MenuItem') as any;
const VjsMenuButton = videojs.getComponent('MenuButton') as any;

class QualityMenuItem extends VjsMenuItem {
  _height: number;

  constructor(player: Player, options: { label: string; height: number; selected?: boolean }) {
    super(player, { ...options, selectable: true, multiSelectable: false });
    this._height = options.height;
    if (options.selected) this.selected(true);
  }

  handleClick() {
    const levels = (this.player() as any).qualityLevels();
    for (let i = 0; i < levels.length; i++) {
      levels[i].enabled = this._height === -1 || levels[i].height === this._height;
    }

    // Update selection state across siblings
    const menu = this.parentComponent();
    if (menu?.children()) {
      for (const item of menu.children()) {
        if (typeof item.selected === 'function') item.selected(item === this);
      }
    }

    // Update button label to show the selected quality
    const button = menu?.parentComponent() as any;
    if (typeof button?.setLabel === 'function') {
      button.setLabel(this._height === -1 ? 'Auto' : `${this._height}p`);
    }
  }
}

class QualitySelector extends VjsMenuButton {
  _labelEl: HTMLElement | null = null;

  constructor(player: Player, options: Record<string, unknown>) {
    super(player, options);
    this.controlText('Quality');
    this.addClass('vjs-quality-selector');

    // Listen for new quality levels being added (secondary trigger)
    const levels = (player as any).qualityLevels();
    levels.on('addqualitylevel', () => this.update());
  }

  createEl() {
    const el = super.createEl() as HTMLElement;
    this._labelEl = document.createElement('span');
    this._labelEl.className = 'vjs-quality-label';
    this._labelEl.textContent = 'Auto';
    el.querySelector('.vjs-icon-placeholder')?.appendChild(this._labelEl);
    return el;
  }

  setLabel(text: string) {
    if (this._labelEl) this._labelEl.textContent = text;
  }

  resetLabel() {
    this.setLabel('Auto');
  }

  createItems() {
    const levels = (this.player() as any).qualityLevels();
    const heights = new Set<number>();

    for (let i = 0; i < levels.length; i++) {
      if (levels[i].height) heights.add(levels[i].height);
    }

    const items: InstanceType<typeof QualityMenuItem>[] = [];

    items.push(new QualityMenuItem(this.player(), { label: 'Auto', height: -1, selected: true }));

    Array.from(heights)
      .sort((a, b) => b - a)
      .forEach((h) => {
        items.push(new QualityMenuItem(this.player(), { label: `${h}p`, height: h }));
      });

    return items;
  }
}

videojs.registerComponent('QualitySelector', QualitySelector as any);

/* ------------------------------------------------------------------ */
/*  Styles for the quality button                                      */
/* ------------------------------------------------------------------ */

const qualityButtonCSS = `
.vjs-quality-selector .vjs-icon-placeholder::before {
  content: '' !important;
}
.vjs-quality-label {
  font-family: inherit;
  font-size: 0.8em;
  font-weight: 700;
  line-height: 3;
  pointer-events: none;
}
.vjs-quality-selector .vjs-menu {
  width: 6em;
}
/* Watch shell: cap height; keep video letterboxed; round player chrome (avoid overflow on outer wrappers — clips control bar) */
[data-watch-video] .video-js.vjs-fluid:not(.vjs-audio-only) {
  max-height: min(70vh, 85vw);
  border-radius: 1rem;
}
[data-watch-video] .video-js .vjs-tech {
  object-fit: contain;
  background: #000;
}
[data-watch-video] .video-js .vjs-control-bar {
  z-index: 3;
}
`;

/* ------------------------------------------------------------------ */
/*  React component                                                    */
/* ------------------------------------------------------------------ */

interface VideoPlayerProps {
  hlsUrl: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  className?: string;
}

export default function VideoPlayer({
  hlsUrl,
  thumbnailUrl,
  autoplay = false,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  // Inject quality-button CSS once
  useEffect(() => {
    const id = 'vjs-quality-selector-css';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = qualityButtonCSS;
      document.head.appendChild(style);
    }
  }, []);

  // Initialise player once on mount
  useEffect(() => {
    if (!containerRef.current || playerRef.current) return;

    const videoEl = document.createElement('video-js');
    videoEl.classList.add('vjs-big-play-centered');
    containerRef.current.appendChild(videoEl);

    const player = videojs(videoEl, {
      autoplay,
      controls: true,
      responsive: true,
      fluid: true,
      // 0 = never auto-hide control bar (seek/play/pause stay available)
      inactivityTimeout: 0,
      poster: thumbnailUrl,
      sources: [{ src: hlsUrl, type: 'application/x-mpegURL' }],
    });

    // Initialise quality-levels plugin
    (player as any).qualityLevels();

    // Add quality selector to control bar
    const controlBar = player.getChild('controlBar');
    controlBar?.addChild('QualitySelector', {});

    // Primary trigger: loadedmetadata fires once the manifest is fully parsed
    // and all quality levels are guaranteed to be in the list.
    player.on('loadedmetadata', () => {
      const qs = (controlBar as any)?.getChild('QualitySelector') as any;
      qs?.update?.();
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update source when hlsUrl changes after initial mount
  useEffect(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;

    player.src([{ src: hlsUrl, type: 'application/x-mpegURL' }]);
    if (thumbnailUrl) player.poster(thumbnailUrl);

    // Reset label back to Auto while new source loads
    const qs = (player.getChild('controlBar') as any)?.getChild('QualitySelector') as any;
    qs?.resetLabel?.();
  }, [hlsUrl, thumbnailUrl]);

  return (
    <div
      data-vjs-player
      data-watch-video
      className={cn('relative w-full bg-black', className)}
    >
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
