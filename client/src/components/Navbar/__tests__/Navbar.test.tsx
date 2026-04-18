import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarFallback: ({ children }: any) => (
    <span data-testid="avatar-fallback">{children}</span>
  ),
  AvatarImage: ({ src, alt }: any) => (src ? <img src={src} alt={alt} /> : null),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  DropdownMenuLabel: ({ children }: any) => (
    <div data-testid="dropdown-label">{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

// ── Test data ─────────────────────────────────────────────────────────────────

import { useAuth } from '@/hooks/useAuth';
import Navbar from '../Navbar';

const MOCK_USER = { id: 'user-abc-123' };
const MOCK_PROFILE = { displayName: 'John Doe', avatarUrl: null };
const mockSignOut = vi.fn();

function setAuth(overrides?: Partial<{ user: any; profile: any; signOut: any }>) {
  vi.mocked(useAuth).mockReturnValue({
    user: MOCK_USER,
    profile: MOCK_PROFILE,
    signOut: mockSignOut,
    ...overrides,
  } as any);
}

function renderNavbar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth();
});

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Navbar — rendering', () => {
  it('renders the logo image', () => {
    renderNavbar();
    expect(screen.getByAltText('ShortCuts')).toBeInTheDocument();
  });

  it('renders the "Cuts" brand name span', () => {
    renderNavbar();
    expect(screen.getByText('Cuts')).toBeInTheDocument();
  });

  it('renders all four navigation links', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Watchlist' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Subscriptions' })).toBeInTheDocument();
  });

  it('renders the search input with the correct placeholder', () => {
    renderNavbar();
    expect(
      screen.getByPlaceholderText('Search short films, creators…'),
    ).toBeInTheDocument();
  });

  it('renders the notifications bell button', () => {
    renderNavbar();
    expect(
      screen.getByRole('button', { name: /notifications/i }),
    ).toBeInTheDocument();
  });
});

// ── Avatar / user display ─────────────────────────────────────────────────────

describe('Navbar — user display', () => {
  it('shows initials derived from displayName in the avatar fallback', () => {
    renderNavbar();
    expect(screen.getByTestId('avatar-fallback').textContent).toBe('JD');
  });

  it('shows "U" as fallback when profile has no displayName', () => {
    setAuth({ profile: { displayName: null, avatarUrl: null } });
    renderNavbar();
    expect(screen.getByTestId('avatar-fallback').textContent).toBe('U');
  });

  it('shows the user displayName in the dropdown label', () => {
    renderNavbar();
    expect(screen.getByTestId('dropdown-label')).toHaveTextContent('John Doe');
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe('Navbar — search', () => {
  it('navigates to /search with URI-encoded query on form submit', async () => {
    const user = userEvent.setup();
    renderNavbar();
    const input = screen.getByPlaceholderText('Search short films, creators…');
    await user.type(input, 'sci fi');
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=sci%20fi');
  });

  it('does not navigate when the search input is empty', async () => {
    const user = userEvent.setup();
    renderNavbar();
    const input = screen.getByPlaceholderText('Search short films, creators…');
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when the search input is whitespace only', async () => {
    const user = userEvent.setup();
    renderNavbar();
    const input = screen.getByPlaceholderText('Search short films, creators…');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ── Dropdown navigation ───────────────────────────────────────────────────────

describe('Navbar — dropdown menu navigation', () => {
  it('clicking Profile navigates to /profile/:userId', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByText('Profile'));
    expect(mockNavigate).toHaveBeenCalledWith(`/profile/${MOCK_USER.id}`);
  });

  it('clicking My Watchlist navigates to /watchlist', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByText('My Watchlist'));
    expect(mockNavigate).toHaveBeenCalledWith('/watchlist');
  });

  it('clicking Creator Studio navigates to /studio', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByText('Creator Studio'));
    expect(mockNavigate).toHaveBeenCalledWith('/studio');
  });

  it('clicking Settings navigates to /settings', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('clicking Sign out calls the signOut function from useAuth', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByText('Sign out'));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

// ── Scroll behaviour ──────────────────────────────────────────────────────────

describe('Navbar — scroll behaviour', () => {
  it('applies scrolled background styles after window is scrolled down', () => {
    renderNavbar();
    Object.defineProperty(window, 'scrollY', {
      value: 100,
      configurable: true,
    });
    fireEvent.scroll(window);
    const header = document.querySelector('header')!;
    expect(header.className).toContain('bg-background/90');
  });
});
