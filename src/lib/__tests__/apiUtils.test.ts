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
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z')); // 1704110400
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw RateLimitError with exact timestamp if X-RateLimit-Reset is present and valid', () => {
      expect.assertions(2);
      const resetTimestamp = 1704114000;
      const res = {
        headers: new Headers({
          'X-RateLimit-Reset': resetTimestamp.toString(),
        })
      } as unknown as Response;

      try {
        handleRateLimit(res);
        expect.fail('Expected handleRateLimit to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).resetAt.getTime()).toBe(resetTimestamp * 1000);
      }
    });

    it('should throw RateLimitError with timestamp 1 hour in the future if header is missing', () => {
      expect.assertions(2);
      const res = {
        headers: new Headers()
      } as unknown as Response;

      try {
        handleRateLimit(res);
        expect.fail('Expected handleRateLimit to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).resetAt.getTime()).toBe((1704110400 + 3600) * 1000);
      }
    });

    it('should throw RateLimitError with timestamp 1 hour in the future if header is invalid (NaN)', () => {
      expect.assertions(2);
      const res = {
        headers: new Headers({
          'X-RateLimit-Reset': 'invalid-data',
        })
      } as unknown as Response;

      try {
        handleRateLimit(res);
        expect.fail('Expected handleRateLimit to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).resetAt.getTime()).toBe((1704110400 + 3600) * 1000);
      }
    });
  });
});
