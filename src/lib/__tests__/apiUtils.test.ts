import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleErrorResponse, getAuthenticatedUser, handleRateLimit, getAuthAndYear } from '../apiUtils';

import { NextRequest } from "next/server";
import { RateLimitError } from '../types';
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
    NextRequest: class NextRequest {
      constructor(url) {
        this.nextUrl = new URL(url);
      }
    }
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
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw RateLimitError using timestamp from X-RateLimit-Reset header', () => {
      const resetTimestamp = Math.floor(Date.now() / 1000) + 1000;
      const res = new Response(null, {
        headers: { 'X-RateLimit-Reset': resetTimestamp.toString() }
      });

      try {
        handleRateLimit(res);
        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).resetAt.getTime()).toBe(resetTimestamp * 1000);
      }
    });

    it('should fall back to 1 hour from now if header is missing', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const res = new Response(null);

      try {
        handleRateLimit(res);
        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        const expectedResetTimestamp = Math.floor(now.getTime() / 1000) + 3600;
        expect((error as RateLimitError).resetAt.getTime()).toBe(expectedResetTimestamp * 1000);
      }
    });

    it('should fall back to 1 hour from now if header is invalid', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const res = new Response(null, {
        headers: { 'X-RateLimit-Reset': 'invalid' }
      });

      try {
        handleRateLimit(res);
        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        const expectedResetTimestamp = Math.floor(now.getTime() / 1000) + 3600;
        expect((error as RateLimitError).resetAt.getTime()).toBe(expectedResetTimestamp * 1000);
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

  describe('getAuthAndYear', () => {
    it('returns 401 response if no user', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const req = new NextRequest('http://localhost');
      const result = await getAuthAndYear(req);
      expect(result.errorResponse).toBeDefined();
      expect(result.errorResponse?.init?.status).toBe(401);
    });

    it('returns 400 if year param has invalid characters', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        accessToken: 'fake-token',
        user: { login: 'testuser' }
      });
      const req = new NextRequest('http://localhost?year=2024abc');
      const result = await getAuthAndYear(req);
      expect(result.errorResponse).toBeDefined();
      expect(result.errorResponse?.init?.status).toBe(400);
    });

    it('returns 400 if year is before 2008', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        accessToken: 'fake-token',
        user: { login: 'testuser' }
      });
      const req = new NextRequest('http://localhost?year=2007');
      const result = await getAuthAndYear(req);
      expect(result.errorResponse).toBeDefined();
      expect(result.errorResponse?.init?.status).toBe(400);
    });

    it('returns valid user and year if inputs are correct', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        accessToken: 'fake-token',
        user: { login: 'testuser' }
      });
      const currentYear = new Date().getUTCFullYear();
      const req = new NextRequest(`http://localhost?year=${currentYear}`);
      const result = await getAuthAndYear(req);
      expect(result.errorResponse).toBeUndefined();
      expect(result.user).toEqual({ username: 'testuser', token: 'fake-token' });
      expect(result.year).toBe(currentYear);
    });
  });

});
