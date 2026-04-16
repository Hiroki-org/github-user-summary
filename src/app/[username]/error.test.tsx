// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ErrorPage from './error';
import { logger } from '@/lib/logger';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('ErrorPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders generic error message and UI correctly', () => {
    const mockError = new Error('A generic random error');
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    // Check generic text
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('A generic random error')).toBeInTheDocument();
    expect(screen.getByText('😵')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();

    // Check logger
    expect(logger.error).toHaveBeenCalledWith('User page error:', mockError);
  });

  it('renders generic fallback if error has no message', () => {
    const mockError = new Error();
    mockError.message = '';
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    // Check generic text fallback
    expect(screen.getByText('An unexpected error occurred while fetching user data.')).toBeInTheDocument();
  });

  it('renders rate limit error message and specific UI correctly', () => {
    const mockError = new Error('API rate limit exceeded');
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    // Check rate limit text
    expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
    expect(screen.getByText("You've hit the GitHub API rate limit. Sign in with GitHub for a higher limit, or try again later.")).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();

    // Check logger
    expect(logger.error).toHaveBeenCalledWith('User page error:', mockError);
  });

  it('calls reset function when Try again button is clicked', () => {
    const mockError = new Error('A generic error');
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
