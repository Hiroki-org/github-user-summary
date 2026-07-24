import { vi, describe, it, expect } from 'vitest';
import UserPage, { generateMetadata } from './page';
import { fetchUserSummary } from '@/lib/github';
import { UserNotFoundError } from '@/lib/types';
import { notFound } from 'next/navigation';

vi.mock('@/lib/github', () => ({
  fetchUserSummary: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// We need to mock these components because they use React internals that might fail
// during a simple server component render test in Vitest.
vi.mock('@/components/ThemeController', () => ({
  default: () => <div data-testid="mock-theme-controller" />
}));
vi.mock('@/components/ShareButtons', () => ({
  default: () => <div data-testid="mock-share-buttons" />
}));
vi.mock('@/components/CardGenerator', () => ({
  default: () => <div data-testid="mock-card-generator" />
}));
vi.mock('@/components/ProfileCard', () => ({
  default: () => <div data-testid="mock-profile-card" />
}));
vi.mock('@/components/SkillsCard', () => ({
  default: () => <div data-testid="mock-skills-card" />
}));
vi.mock('@/components/ContributionsCard', () => ({
  default: () => <div data-testid="mock-contributions-card" />
}));
vi.mock('@/components/ReposCard', () => ({
  default: () => <div data-testid="mock-repos-card" />
}));
vi.mock('@/components/ActivityCard', () => ({
  default: () => <div data-testid="mock-activity-card" />
}));
vi.mock('@/components/InterestsCard', () => ({
  default: () => <div data-testid="mock-interests-card" />
}));
vi.mock('@/components/AnimatedWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-animated-wrapper">{children}</div>
}));
vi.mock('@/components/MyPageBanner', () => ({
  default: () => <div data-testid="mock-mypage-banner" />
}));
vi.mock('@/lib/auth', () => ({
  authOptions: {}
}));

describe('UserPage Error Boundary', () => {
  it('calls notFound when UserNotFoundError is thrown', async () => {
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new UserNotFoundError('testuser'));

    await expect(UserPage({ params: Promise.resolve({ username: 'testuser' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('throws original error for other errors', async () => {
    const error = new Error('Some API error');
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(error);

    await expect(UserPage({ params: Promise.resolve({ username: 'testuser' }) })).rejects.toThrow('Some API error');
  });
});


describe('generateMetadata', () => {
  it('generates correct metadata for a given username', async () => {
    const params = Promise.resolve({ username: 'testuser' });
    const metadata = await generateMetadata({ params });

    expect(metadata).toEqual({
      title: 'testuser - GitHub User Summary',
      description: 'GitHub profile summary for testuser.',
      openGraph: {
        title: 'testuser - GitHub User Summary',
        description: 'GitHub profile summary for testuser.',
        images: ['/api/og/testuser'],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'testuser - GitHub User Summary',
        images: ['/api/og/testuser'],
      },
    });
  });

  it('correctly encodes special characters in username for image URLs', async () => {
    const params = Promise.resolve({ username: 'test user!@#' });
    const metadata = await generateMetadata({ params });

    expect(metadata.openGraph?.images).toEqual(['/api/og/test%20user!%40%23']);
    expect(metadata.twitter?.images).toEqual(['/api/og/test%20user!%40%23']);
  });
});
