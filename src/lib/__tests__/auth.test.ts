import { describe, it, expect } from 'vitest';
import { authOptions } from '../auth';

describe('authOptions', () => {
  describe('callbacks', () => {
    describe('jwt', () => {
      it('should add account.access_token to token.accessToken if account is provided', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const account = { access_token: 'token123', provider: 'github', type: 'oauth' as const, providerAccountId: '123' };
        const result = await authOptions.callbacks?.jwt?.({ token, account, user: { id: '1' } } as any);
        expect(result?.accessToken).toBe('token123');
      });

      it('should not add accessToken if account is not provided', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks?.jwt?.({ token, user: { id: '1' } } as any);
        expect(result?.accessToken).toBeUndefined();
      });

      it('should add profile.login to token.login if profile is provided and login is a string', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 'testuser', id: 1 };
        const result = await authOptions.callbacks?.jwt?.({ token, profile, user: { id: '1' } } as any);
        expect(result?.login).toBe('testuser');
      });

      it('should not add login if profile is missing', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks?.jwt?.({ token, user: { id: '1' } } as any);
        expect(result?.login).toBeUndefined();
      });

      it('should not add login if profile is not an object', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = "not an object";
        const result = await authOptions.callbacks?.jwt?.({ token, profile, user: { id: '1' } } as any);
        expect(result?.login).toBeUndefined();
      });

      it('should set login to undefined if profile.login is not a string', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 12345, id: 1 };
        const result = await authOptions.callbacks?.jwt?.({ token, profile, user: { id: '1' } } as any);
        expect(result?.login).toBeUndefined();
      });
    });

    describe('session', () => {
      it('should add token.accessToken to session.accessToken', async () => {
        const session = { expires: '123' };
        const token = { accessToken: 'token123' };
        const result = await authOptions.callbacks?.session?.({ session, token, user: { id: '1' } } as any);
        expect(result?.accessToken).toBe('token123');
      });

      it('should add token.login to session.user.login if session.user is present', async () => {
        const session = { expires: '123', user: { name: 'Test' } };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks?.session?.({ session, token, user: { id: '1' } } as any);
        expect(result?.user?.login).toBe('testuser');
      });

      it('should not add login if session.user is missing', async () => {
        const session = { expires: '123' };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks?.session?.({ session, token, user: { id: '1' } } as any);
        expect(result?.user?.login).toBeUndefined();
      });
    });
  });
});
