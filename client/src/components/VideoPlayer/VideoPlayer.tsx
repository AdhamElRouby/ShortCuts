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

  constructor(
    player: Player,
    options: { label: string; height: number; selected?: boolean },
  ) {
    super(player, { ...options, selectable: true, multiSelectable: false });
    this._height = options.height;
    if (options.selected) this.selected(true);
  }

  handleClick() {
    const levels = (this.player() as any).qualityLevels();
    for (let i = 0; i < levels.length; i++) {
      levels[i].enabled =
        this._height === -1 || levels[i].height === this._height;
    }

    // Update selection state across siblings
    const menu = this.parentComponent();
    if (menu?.children()) {
      for (const item of menu.children()) {
        if (typeof item.selected === 'function') item.selected(item === this);
      }
    }
  }
}

class QualitySelector extends VjsMenuButton {
  constructor(player: Player, options: Record<string, unknown>) {
    super(player, options);
    this.controlText('Quality');

    // Listen for new quality levels being added (secondary trigger)
    const levels = (player as any).qualityLevels();
    levels.on('addqualitylevel', () => this.update());
  }

  buildCSSClass() {
    return `vjs-quality-selector vjs-icon-cog ${super.buildCSSClass()}`;
  }

  createItems() {
    const levels = (this.player() as any).qualityLevels();
    const heights = new Set<number>();

    for (let i = 0; i < levels.length; i++) {
      if (levels[i].height) heights.add(levels[i].height);
    }

    const items: InstanceType<typeof QualityMenuItem>[] = [];

    items.push(
      new QualityMenuItem(this.player(), {
        label: 'Auto',
        height: -1,
        selected: true,
      }),
    );

    Array.from(heights)
      .sort((a, b) => b - a)
      .forEach((h) => {
        items.push(
          new QualityMenuItem(this.player(), { label: `${h}p`, height: h }),
        );
      });

    return items;
  }
}

videojs.registerComponent('QualitySelector', QualitySelector as any);

/* ------------------------------------------------------------------ */
/*  Styles for the player & quality button                             */
/* ------------------------------------------------------------------ */

const playerThemeCSS = `
/* Quality Menu Width */
.vjs-quality-selector .vjs-menu {
  width: 8em;
  left: -2em;
}

/* Control Bar Buttons (Quality, Fullscreen, PiP, Play, Volume) */
.video-js .vjs-control-bar .vjs-button > .vjs-icon-placeholder::before,
.video-js .vjs-control-bar .vjs-button::before,
.vjs-quality-selector::before {
   color: #f1f5f9;
   transition: all 0.2s ease-in-out;
   font-size: 1.5em; 
   line-height: 1.67;
   display: flex;
   align-items: center;
   justify-content: center;
}

.vjs-remaining-time  {
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-js .vjs-control-bar .vjs-button:hover > .vjs-icon-placeholder::before,
.video-js .vjs-control-bar .vjs-button:hover::before,
.vjs-quality-selector:hover::before {
   color: #d4a843;
}

/* Cinematic Theme */
.video-js {
  font-family: inherit;
  color: #f1f5f9; /* light gray/white text */
}

/* Big Play Button */
.video-js .vjs-big-play-button {
  background-color: rgba(10, 10, 10, 0.7);
  border: 2px solid #d4a843; 
  color: #d4a843;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  line-height: 76px;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}
.video-js:hover .vjs-big-play-button,
.video-js .vjs-big-play-button:focus,
.video-js .vjs-big-play-button:active {
  background-color: #d4a843;
  color: #0a0a0a;
  border-color: #d4a843;
  transform: scale(1.1);
}

/* Control Bar */
.video-js .vjs-control-bar {
  background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0));
  height: 4em;
  display: flex;
  align-items: center;
}

/* Progress and Volume Bars */
.video-js .vjs-play-progress,
.video-js .vjs-volume-level {
  background-color: #d4a843;
}
.video-js .vjs-load-progress {
  background: rgba(255,255,255,0.2);
}
.video-js .vjs-load-progress div {
  background: rgba(255,255,255,0.1);
}
.video-js .vjs-slider {
  background-color: rgba(255,255,255,0.1);
  border-radius: 4px;
}
.video-js .vjs-play-progress::before {
  color: #d4a843; /* Knob color */
  text-shadow: 0 0 4px rgba(212, 168, 67, 0.8);
}

/* Menus (Quality, etc) */
.video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
  background-color: rgba(14, 14, 14, 0.95);
  border: 1px solid rgba(212, 168, 67, 0.2);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  padding: 4px 0;
}
.video-js .vjs-menu li.vjs-menu-item {
  text-transform: capitalize;
  transition: all 0.2s;
  padding: 0.25rem;
  margin: 2px 4px;
  border-radius: 4px;
}
.video-js .vjs-menu li.vjs-menu-item:hover,
.video-js .vjs-menu li.vjs-menu-item:focus {
  background-color: rgba(212, 168, 67, 0.15);
  color: #d4a843;
}
.video-js .vjs-menu li.vjs-selected,
.video-js .vjs-menu li.vjs-selected:focus,
.video-js .vjs-menu li.vjs-selected:hover {
  background-color: #d4a843;
  color: #0a0a0a;
  font-weight: 600;
}

/* Watch shell constraints */
[data-watch-video] .video-js.vjs-fluid:not(.vjs-audio-only) {
  max-height: min(70vh, 85vw);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.05);
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
      style.textContent = playerThemeCSS;
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
