import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleErrorResponse, getAuthenticatedUser, getClientIp } from '../apiUtils';
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

  describe('getClientIp', () => {
    it('should return x-real-ip if present', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-real-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8, 9.10.11.12'
        }
      });
      expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('should return first ip from x-forwarded-for if x-real-ip is absent', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '5.6.7.8, 9.10.11.12'
        }
      });
      expect(getClientIp(req)).toBe('5.6.7.8');
    });

    it('should trim whitespace from extracted ip', () => {
      const reqReal = new Request('http://localhost', {
        headers: {
          'x-real-ip': '  1.2.3.4  '
        }
      });
      expect(getClientIp(reqReal)).toBe('1.2.3.4');

      const reqForwarded = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  5.6.7.8  , 9.10.11.12'
        }
      });
      expect(getClientIp(reqForwarded)).toBe('5.6.7.8');
    });

    it('should return "unknown" if neither header is present', () => {
      const req = new Request('http://localhost');
      expect(getClientIp(req)).toBe('unknown');
    });
  });
});
