import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleErrorResponse, getAuthenticatedUser } from '../apiUtils';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
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

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => ({ ...body, init })),
    },
  };
});

describe('apiUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleErrorResponse', () => {
    it('should return 429 and Retry-After for RateLimitError', () => {
      const resetTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const error = new RateLimitError(resetTimestamp);

      const result = handleErrorResponse(error) as any;

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
        error: error.message,
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
        error: 'GitHub error',
        init: { status: 403 }
      });
    });

    it('should fallback to 500 for invalid GitHubApiError status', () => {
      const error = new GitHubApiError('GitHub error', 999);

      const result = handleErrorResponse(error) as any;

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
        error: 'Internal Server Error',
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
        error: 'Internal Server Error',
        init: { status: 500 }
      });
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should return user object if session is valid', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        accessToken: 'fake-token',
        user: { login: 'testuser' }
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({ username: 'testuser', token: 'fake-token' });
    });

    it('should return null if no session', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('should return null if no accessToken', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { login: 'testuser' }
      });

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('should return null if no user login', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        accessToken: 'fake-token',
        user: {}
      });

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });
  });
});
