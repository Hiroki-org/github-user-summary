import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleErrorResponse, getAuthenticatedUser, handleRateLimit } from '../apiUtils';
import { RateLimitError } from '@/lib/types';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
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

  describe('handleErrorResponse', () => {
    it('should return Next response with error message from Error object', () => {
      const error = new Error('Test error');

      const result = handleErrorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Test error' },
        { status: 500 }
      );
      expect(result).toEqual({
        body: { error: 'Test error' },
        init: { status: 500 }
      });
    });

    it('should return Next response with "Unknown error" for non-Error object', () => {
      const error = 'Some string error';

      const result = handleErrorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unknown error' },
        { status: 500 }
      );
      expect(result).toEqual({
        body: { error: 'Unknown error' },
        init: { status: 500 }
      });
    });
  });

  describe('handleRateLimit', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1600000000000)); // 1600000000 seconds
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw RateLimitError with timestamp from X-RateLimit-Reset header', () => {
      const mockResponse = {
        headers: new Headers({
          'X-RateLimit-Reset': '1600003600'
        })
      } as unknown as Response;

      expect(() => handleRateLimit(mockResponse)).toThrowError(expect.objectContaining({
        name: 'RateLimitError',
        resetAt: new Date(1600003600000)
      }));
    });

    it('should throw RateLimitError with +1 hour timestamp if header is missing', () => {
      const mockResponse = {
        headers: new Headers()
      } as unknown as Response;

      expect(() => handleRateLimit(mockResponse)).toThrowError(expect.objectContaining({
        name: 'RateLimitError',
        resetAt: new Date(1600000000000 + 3600000)
      }));
    });

    it('should throw RateLimitError with +1 hour timestamp if header is invalid', () => {
      const mockResponse = {
        headers: new Headers({
          'X-RateLimit-Reset': 'invalid'
        })
      } as unknown as Response;

      expect(() => handleRateLimit(mockResponse)).toThrowError(expect.objectContaining({
        name: 'RateLimitError',
        resetAt: new Date(1600000000000 + 3600000)
      }));
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
