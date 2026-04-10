import { vi, describe, it, expect } from 'vitest';
import UserPage from './page';
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

vi.mock('@/components/UserSummaryView', () => ({
  default: () => <div data-testid="mock-user-summary-view" />
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
