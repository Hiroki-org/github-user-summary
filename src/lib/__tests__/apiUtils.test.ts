import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimitError } from '../types';
import { handleErrorResponse, getAuthenticatedUser, handleRateLimit } from '../apiUtils';
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

  describe('handleRateLimit', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1700000000000)); // Nov 14 2023 22:13:20 GMT
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw RateLimitError with exact timestamp if header is present and valid', () => {
      const res = new Response(null, {
        headers: {
          'X-RateLimit-Reset': '1700003600'
        }
      });

      expect(() => handleRateLimit(res)).toThrow(RateLimitError);
      try {
        handleRateLimit(res);
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.resetAt.getTime()).toBe(1700003600000);
      }
    });

    it('should throw RateLimitError with default timestamp (+1 hour) if header is missing', () => {
      const res = new Response(null);

      expect(() => handleRateLimit(res)).toThrow(RateLimitError);
      try {
        handleRateLimit(res);
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        // Current time is 1700000000, so +1 hour (3600 seconds) is 1700003600
        expect(error.resetAt.getTime()).toBe(1700003600000);
      }
    });

    it('should throw RateLimitError with default timestamp if header is invalid (NaN)', () => {
      const res = new Response(null, {
        headers: {
          'X-RateLimit-Reset': 'invalid-date'
        }
      });

      expect(() => handleRateLimit(res)).toThrow(RateLimitError);
      try {
        handleRateLimit(res);
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.resetAt.getTime()).toBe(1700003600000);
      }
    });
  });

});
