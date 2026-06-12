import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
      vi.setSystemTime(new Date(1600000000000)); // Timestamp: 1600000000
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw RateLimitError using the reset timestamp from the X-RateLimit-Reset header', () => {
      const resetTimestamp = 1600003600;
      const headers = new Headers();
      headers.set('X-RateLimit-Reset', resetTimestamp.toString());
      const res = new Response(null, { headers });

      expect(() => handleRateLimit(res)).toThrowError(
        `GitHub API rate limit exceeded. Resets at ${new Date(resetTimestamp * 1000).toISOString()}`
      );
    });

    it('should throw RateLimitError using default time + 3600s if X-RateLimit-Reset header is missing', () => {
      const headers = new Headers();
      const res = new Response(null, { headers });
      const expectedResetTimestamp = Math.floor(Date.now() / 1000) + 3600;

      expect(() => handleRateLimit(res)).toThrowError(
        `GitHub API rate limit exceeded. Resets at ${new Date(expectedResetTimestamp * 1000).toISOString()}`
      );
    });

    it('should throw RateLimitError using default time + 3600s if X-RateLimit-Reset header is invalid', () => {
      const headers = new Headers();
      headers.set('X-RateLimit-Reset', 'invalid');
      const res = new Response(null, { headers });
      const expectedResetTimestamp = Math.floor(Date.now() / 1000) + 3600;

      expect(() => handleRateLimit(res)).toThrowError(
        `GitHub API rate limit exceeded. Resets at ${new Date(expectedResetTimestamp * 1000).toISOString()}`
      );
    });
  });
});
