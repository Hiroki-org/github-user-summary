import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthenticatedUser, handleErrorResponse } from '../apiUtils';
import { getServerSession, Session } from 'next-auth';
import { fetchViewerLogin } from '../githubViewer';
import { NextResponse } from 'next/server';
import { RateLimitError, UserNotFoundError, GitHubApiError } from '../types';
import { logger } from '../logger';

vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../githubViewer', () => ({
  fetchViewerLogin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
    },
  };
});

describe('apiUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthenticatedUser', () => {
    it('should return null if session is null', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
      expect(getServerSession).toHaveBeenCalled();
    });

    it('should return null if token is missing in session', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { name: 'test' },
      } as unknown as Session);

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('should return username from session if available', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        accessToken: 'test-token',
        user: { login: 'test-user' },
      } as unknown as Session);

      const result = await getAuthenticatedUser();

      expect(result).toEqual({ username: 'test-user', token: 'test-token' });
      expect(fetchViewerLogin).not.toHaveBeenCalled();
    });

    it('should fetch username using token if not in session', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        accessToken: 'test-token',
        user: { name: 'test-user' }, // missing login
      } as unknown as Session);
      vi.mocked(fetchViewerLogin).mockResolvedValue('fetched-user');

      const result = await getAuthenticatedUser();

      expect(result).toEqual({ username: 'fetched-user', token: 'test-token' });
      expect(fetchViewerLogin).toHaveBeenCalledWith('test-token');
    });
  });

  describe('handleErrorResponse', () => {
    it('should return 429 and Retry-After for RateLimitError', () => {
      const resetTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const error = new RateLimitError(resetTimestamp);

      const result = handleErrorResponse(error);

      expect(logger.error).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: error.message },
        expect.objectContaining({
          status: 429,
          headers: expect.objectContaining({
            'Retry-After': expect.any(String)
          })
        })
      );
      expect(result.init.status).toBe(429);
      expect(Number(result.init.headers['Retry-After'])).toBeGreaterThan(0);
    });

    it('should return 404 for UserNotFoundError', () => {
      const error = new UserNotFoundError('testuser');

      const result = handleErrorResponse(error);

      expect(logger.error).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: error.message },
        { status: 404 }
      );
      expect(result).toEqual({
        body: { error: error.message },
        init: { status: 404 }
      });
    });

    it('should return specific status for GitHubApiError', () => {
      const error = new GitHubApiError('GitHub error', 403);

      const result = handleErrorResponse(error);

      expect(logger.error).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'GitHub error' },
        { status: 403 }
      );
      expect(result).toEqual({
        body: { error: 'GitHub error' },
        init: { status: 403 }
      });
    });

    it('should fallback to 500 for invalid GitHubApiError status', () => {
      const error = new GitHubApiError('GitHub error', 999);

      const result = handleErrorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'GitHub error' },
        { status: 500 }
      );
      expect(result.init.status).toBe(500);
    });

    it('should return 500 and generic message for generic Error', () => {
      const error = new Error('Sensitive data');

      const result = handleErrorResponse(error);

      expect(logger.error).toHaveBeenCalledWith('Internal Server Error:', error);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      expect(result).toEqual({
        body: { error: 'Internal Server Error' },
        init: { status: 500 }
      });
    });

    it('should return 500 and generic message for non-Error object', () => {
      const error = 'Some string error';

      const result = handleErrorResponse(error);

      expect(logger.error).toHaveBeenCalledWith('Internal Server Error:', error);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      expect(result).toEqual({
        body: { error: 'Internal Server Error' },
        init: { status: 500 }
      });
    });
  });
});
