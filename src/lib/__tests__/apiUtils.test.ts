import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthenticatedUser, handleErrorResponse } from '../apiUtils';
import { getServerSession } from 'next-auth';
import { fetchViewerLogin } from '../githubViewer';

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, ...options })),
    },
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('../githubViewer', () => ({
    fetchViewerLogin: vi.fn(),
}));

describe('apiUtils', () => {
    describe('getAuthenticatedUser', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('returns null when session is missing', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);
            const result = await getAuthenticatedUser();
            expect(result).toBeNull();
        });

        it('returns null when token is missing from the session', async () => {
            const mockSession = { user: { name: 'test' } };
            vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
            const result = await getAuthenticatedUser();
            expect(result).toBeNull();
        });

        it('returns null when token is an empty string', async () => {
            const mockSession = {
                accessToken: '',
                user: { login: 'testuser' },
            };
            vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
            const result = await getAuthenticatedUser();
            expect(result).toBeNull();
        });

        it('returns username and token when token is present and username is found in the session', async () => {
            const mockSession = {
                accessToken: 'valid-token',
                user: { login: 'testuser' },
            };
            vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

            const result = await getAuthenticatedUser();
            expect(result).toEqual({ username: 'testuser', token: 'valid-token' });
            expect(fetchViewerLogin).not.toHaveBeenCalled();
        });

        it('fetches username from Github API when token is present but username must be fetched', async () => {
            const mockSession = {
                accessToken: 'valid-token',
                user: { name: 'Test User' }, // missing login
            };
            vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
            vi.mocked(fetchViewerLogin).mockResolvedValue('fetcheduser');

            const result = await getAuthenticatedUser();
            expect(result).toEqual({ username: 'fetcheduser', token: 'valid-token' });
            expect(fetchViewerLogin).toHaveBeenCalledWith('valid-token');
        });
    });

    describe('handleErrorResponse', () => {
        it('handles Error instances', () => {
            const error = new Error('Test error message');
            const result = handleErrorResponse(error);
            expect(result).toEqual({
                data: { error: 'Test error message' },
                status: 500,
            });
        });

        it('handles unknown error types', () => {
            const result = handleErrorResponse('String error');
            expect(result).toEqual({
                data: { error: 'Unknown error' },
                status: 500,
            });
        });
    });
});
