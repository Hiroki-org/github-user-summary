import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UsernameLayout from './layout';
import { notFound } from 'next/navigation';
import { isValidGitHubUsername } from '@/lib/validators';

vi.mock('next/navigation', () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/validators', () => ({
  isValidGitHubUsername: vi.fn(),
}));

describe('UsernameLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when the username is valid', async () => {
    vi.mocked(isValidGitHubUsername).mockReturnValue(true);

    const children = <div data-testid="test-child">Test Content</div>;
    const params = Promise.resolve({ username: 'validUser123' });

    const LayoutComponent = await UsernameLayout({ children, params });
    render(LayoutComponent);

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(isValidGitHubUsername).toHaveBeenCalledWith('validUser123');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('calls notFound when the username is invalid', async () => {
    vi.mocked(isValidGitHubUsername).mockReturnValue(false);

    const children = <div data-testid="test-child">Test Content</div>;
    const params = Promise.resolve({ username: '-invalid-user' });

    await expect(UsernameLayout({ children, params })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(isValidGitHubUsername).toHaveBeenCalledWith('-invalid-user');
    expect(notFound).toHaveBeenCalled();
  });
});
