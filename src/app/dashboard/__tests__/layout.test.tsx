import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '../layout';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('next/image', () => ({
  // Avoid rendering src="" on the actual img tag because the browser and JSDOM will remove it/complain
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => <img src={src || undefined} alt={alt} data-src-mock={src} {...props} />
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => <a href={href} className={className}>{children}</a>
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {}
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to / when there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    await expect(DashboardLayout({ children: <div data-testid="child" /> })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenLastCalledWith('/');
  });

  it('redirects to / when session has no accessToken', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: 'Test' } } as any);

    await expect(DashboardLayout({ children: <div data-testid="child" /> })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenLastCalledWith('/');
  });

  it('renders correctly when session and accessToken are present', async () => {
    const mockSession = {
      accessToken: 'token123',
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/image.png'
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any);

    const jsx = await DashboardLayout({ children: <div data-testid="child">Child Content</div> });
    render(jsx);

    expect(screen.getByText('Signed in as')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();

    // Check if image is rendered with correct props
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.png');
    expect(image).toHaveAttribute('alt', 'Test User');

    // Check if links are present
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Year' })).toHaveAttribute('href', '/dashboard/year');
    expect(screen.getByRole('link', { name: 'Stats' })).toHaveAttribute('href', '/dashboard/stats');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/dashboard/settings');
  });

  it('falls back to email and default image/alt when name/image are missing', async () => {
    const mockSession = {
      accessToken: 'token123',
      user: {
        email: 'test@example.com'
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any);

    const jsx = await DashboardLayout({ children: <div data-testid="child" /> });
    render(jsx);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('data-src-mock', '');
    expect(image).toHaveAttribute('alt', 'Signed in user');
  });
});
