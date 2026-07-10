import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleErrorResponse, handleRateLimit, getAuthenticatedUser } from '../apiUtils';
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
    let originalDateNow: () => number;
    const mockNow = 1700000000000; // 2023-11-14T22:13:20.000Z

    beforeEach(() => {
      originalDateNow = Date.now;
      Date.now = vi.fn(() => mockNow);
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it('should throw RateLimitError with X-RateLimit-Reset header timestamp', () => {
      const resetTimestamp = 1700003600;
      const res = new Response(null, {
        headers: {
          'X-RateLimit-Reset': resetTimestamp.toString(),
        },
      });

      expect(() => handleRateLimit(res)).toThrow(RateLimitError);

      try {
        handleRateLimit(res);
      } // eslint-disable-next-line @typescript-eslint/no-explicit-any
      catch (error: any) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.resetAt.getTime()).toBe(resetTimestamp * 1000);
      }
    });

    it('should throw RateLimitError with default timestamp (1 hour from now) if header is missing', () => {
      const res = new Response(null);

      expect(() => handleRateLimit(res)).toThrow(RateLimitError);

      try {
        handleRateLimit(res);
      } // eslint-disable-next-line @typescript-eslint/no-explicit-any
      catch (error: any) {
        expect(error).toBeInstanceOf(RateLimitError);
        const expectedResetTimestamp = Math.floor(mockNow / 1000) + 3600;
        expect(error.resetAt.getTime()).toBe(expectedResetTimestamp * 1000);
      }
    });

    it('should throw RateLimitError with default timestamp if header is invalid', () => {
      const res = new Response(null, {
        headers: {
          'X-RateLimit-Reset': 'invalid-timestamp',
        },
      });

      expect(() => handleRateLimit(res)).toThrow(RateLimitError);

      try {
        handleRateLimit(res);
      } // eslint-disable-next-line @typescript-eslint/no-explicit-any
      catch (error: any) {
        expect(error).toBeInstanceOf(RateLimitError);
        const expectedResetTimestamp = Math.floor(mockNow / 1000) + 3600;
        expect(error.resetAt.getTime()).toBe(expectedResetTimestamp * 1000);
      }
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
