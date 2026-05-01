import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthenticatedUser, handleErrorResponse } from '../apiUtils';
import { getServerSession } from 'next-auth';
import { fetchViewerLogin } from '../githubViewer';
import { NextResponse } from 'next/server';

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
  describe('getAuthenticatedUser', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return null if session is null', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
      expect(getServerSession).toHaveBeenCalled();
    });

    it('should return null if token is missing in session', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { name: 'test' },
      } as unknown as any); // memory rule: double casting

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('should return username from session if available', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        accessToken: 'test-token',
        user: { login: 'test-user' },
      } as unknown as any);

      const result = await getAuthenticatedUser();

      expect(result).toEqual({ username: 'test-user', token: 'test-token' });
      expect(fetchViewerLogin).not.toHaveBeenCalled();
    });

    it('should fetch username using token if not in session', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        accessToken: 'test-token',
        user: { name: 'test-user' }, // missing login
      } as unknown as any);
      vi.mocked(fetchViewerLogin).mockResolvedValue('fetched-user');

      const result = await getAuthenticatedUser();

      expect(result).toEqual({ username: 'fetched-user', token: 'test-token' });
      expect(fetchViewerLogin).toHaveBeenCalledWith('test-token');
    });
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
});
