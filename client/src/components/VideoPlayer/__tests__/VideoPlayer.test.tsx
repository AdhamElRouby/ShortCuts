import { render } from '@testing-library/react';

// ── Hoisted mock objects (available in vi.mock factories) ─────────────────────

const { mockPlayer, mockVideojs } = vi.hoisted(() => {
  const mockControlBar = {
    addChild: vi.fn(),
    getChild: vi.fn().mockReturnValue({ update: vi.fn() }),
  };

  const mockPlayer: any = {
    on: vi.fn(),
    src: vi.fn(),
    poster: vi.fn(),
    dispose: vi.fn(),
    isDisposed: vi.fn().mockReturnValue(false),
    qualityLevels: vi.fn().mockReturnValue({ on: vi.fn(), length: 0 }),
    getChild: vi.fn().mockReturnValue(mockControlBar),
  };

  // Base class returned by videojs.getComponent so QualityMenuItem /
  // QualitySelector can extend it without errors at module-load time.
  class BaseMockClass {
    constructor(_player: any, _options?: any) {}
    player() { return mockPlayer; }
    controlText() {}
    update() {}
    selected() {}
    parentComponent() { return null; }
    children() { return []; }
    on() {}
    buildCSSClass() { return ''; }
    addChild() {}
    getChild() { return null; }
  }

  const mockVideojs: any = vi.fn().mockReturnValue(mockPlayer);
  mockVideojs.getComponent = vi.fn().mockReturnValue(BaseMockClass);
  mockVideojs.registerComponent = vi.fn();

  return { mockPlayer, mockVideojs };
});

vi.mock('video.js', () => ({ default: mockVideojs }));
vi.mock('videojs-contrib-quality-levels', () => ({}));

// ── Component under test ──────────────────────────────────────────────────────

import VideoPlayer from '../VideoPlayer';

const HLS_URL = 'https://cdn.example.com/video/manifest.m3u8';
const THUMB_URL = 'https://cdn.example.com/thumb.jpg';
const UPDATED_URL = 'https://cdn.example.com/video/updated.m3u8';

beforeEach(() => {
  vi.clearAllMocks();
  document.getElementById('vjs-quality-selector-css')?.remove();

  // Restore return values after clearAllMocks wipes them
  mockPlayer.isDisposed.mockReturnValue(false);
  mockPlayer.qualityLevels.mockReturnValue({ on: vi.fn(), length: 0 });
  const mockControlBar = {
    addChild: vi.fn(),
    getChild: vi.fn().mockReturnValue({ update: vi.fn() }),
  };
  mockPlayer.getChild.mockReturnValue(mockControlBar);
  mockVideojs.mockReturnValue(mockPlayer);
});

// ── DOM structure ─────────────────────────────────────────────────────────────

describe('VideoPlayer — DOM structure', () => {
  it('renders a wrapper div with data-vjs-player attribute', () => {
    const { container } = render(<VideoPlayer hlsUrl={HLS_URL} />);
    expect(container.querySelector('[data-vjs-player]')).toBeInTheDocument();
  });

  it('renders a wrapper div with data-watch-video attribute', () => {
    const { container } = render(<VideoPlayer hlsUrl={HLS_URL} />);
    expect(container.querySelector('[data-watch-video]')).toBeInTheDocument();
  });

  it('applies a custom className to the outer wrapper', () => {
    const { container } = render(
      <VideoPlayer hlsUrl={HLS_URL} className="my-custom-class" />,
    );
    const wrapper = container.querySelector('[data-vjs-player]')!;
    expect(wrapper.className).toContain('my-custom-class');
  });
});

// ── Video.js initialisation ───────────────────────────────────────────────────

describe('VideoPlayer — Video.js initialisation', () => {
  it('calls videojs on mount', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} />);
    expect(mockVideojs).toHaveBeenCalledTimes(1);
  });

  it('passes the hlsUrl as an HLS source', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} />);
    expect(mockVideojs).toHaveBeenCalledWith(
      expect.any(Element),
      expect.objectContaining({
        sources: [{ src: HLS_URL, type: 'application/x-mpegURL' }],
      }),
    );
  });

  it('passes autoplay: true when the autoplay prop is true', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} autoplay />);
    expect(mockVideojs).toHaveBeenCalledWith(
      expect.any(Element),
      expect.objectContaining({ autoplay: true }),
    );
  });

  it('passes autoplay: false by default', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} />);
    expect(mockVideojs).toHaveBeenCalledWith(
      expect.any(Element),
      expect.objectContaining({ autoplay: false }),
    );
  });

  it('passes thumbnailUrl as the poster option', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} thumbnailUrl={THUMB_URL} />);
    expect(mockVideojs).toHaveBeenCalledWith(
      expect.any(Element),
      expect.objectContaining({ poster: THUMB_URL }),
    );
  });

  it('adds the QualitySelector child to the control bar', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} />);
    const controlBar = mockPlayer.getChild('controlBar');
    expect(controlBar.addChild).toHaveBeenCalledWith('QualitySelector', {});
  });
});

// ── CSS injection ─────────────────────────────────────────────────────────────

describe('VideoPlayer — CSS injection', () => {
  it('injects a theme <style> tag into document.head on first mount', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} />);
    expect(document.getElementById('vjs-quality-selector-css')).not.toBeNull();
  });

  it('does not inject a duplicate <style> tag if already present', () => {
    render(<VideoPlayer hlsUrl={HLS_URL} />);
    render(<VideoPlayer hlsUrl={HLS_URL} />);
    const tags = document.querySelectorAll('#vjs-quality-selector-css');
    expect(tags.length).toBe(1);
  });
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

describe('VideoPlayer — lifecycle', () => {
  it('disposes the player when the component unmounts', () => {
    const { unmount } = render(<VideoPlayer hlsUrl={HLS_URL} />);
    unmount();
    expect(mockPlayer.dispose).toHaveBeenCalledTimes(1);
  });
});

// ── Prop updates ──────────────────────────────────────────────────────────────

describe('VideoPlayer — prop updates', () => {
  it('calls player.src with new url when hlsUrl prop changes', () => {
    const { rerender } = render(<VideoPlayer hlsUrl={HLS_URL} />);
    mockPlayer.src.mockClear();
    rerender(<VideoPlayer hlsUrl={UPDATED_URL} />);
    expect(mockPlayer.src).toHaveBeenCalledWith([
      { src: UPDATED_URL, type: 'application/x-mpegURL' },
    ]);
  });

  it('calls player.poster with new url when thumbnailUrl prop changes', () => {
    const { rerender } = render(
      <VideoPlayer hlsUrl={HLS_URL} thumbnailUrl={THUMB_URL} />,
    );
    mockPlayer.poster.mockClear();
    const newThumb = 'https://cdn.example.com/new-thumb.jpg';
    rerender(<VideoPlayer hlsUrl={HLS_URL} thumbnailUrl={newThumb} />);
    expect(mockPlayer.poster).toHaveBeenCalledWith(newThumb);
  });
});
