import { describe, it, expect } from 'vitest';
import { authOptions } from '../auth';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

describe('authOptions', () => {
  describe('callbacks', () => {
    describe('jwt', () => {
      type JwtParams = Parameters<NonNullable<NonNullable<typeof authOptions.callbacks>['jwt']>>[0];

      it('should add account.access_token to token.accessToken if account is provided', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const account = { access_token: 'token123', provider: 'github', type: 'oauth' as const, providerAccountId: '123' };
        const result = await authOptions.callbacks?.jwt?.({ token, account, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.accessToken).toBe('token123');
      });

      it('should not add accessToken if account is not provided', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks?.jwt?.({ token, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.accessToken).toBeUndefined();
      });

      it('should add profile.login to token.login if profile is provided and login is a string', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 'testuser', id: 1 };
        const result = await authOptions.callbacks?.jwt?.({ token, profile, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBe('testuser');
      });

      it('should not add login if profile is missing', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks?.jwt?.({ token, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('should not add login if profile is not an object', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = "not an object";
        const result = await authOptions.callbacks?.jwt?.({ token, profile, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('should set login to undefined if profile.login is not a string', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 12345, id: 1 };
        const result = await authOptions.callbacks?.jwt?.({ token, profile, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBeUndefined();
      });
    });

    describe('session', () => {
      type SessionParams = Parameters<NonNullable<NonNullable<typeof authOptions.callbacks>['session']>>[0];

      it('should add token.accessToken to session.accessToken', async () => {
        const session = { expires: '123' };
        const token = { accessToken: 'token123' };
        const result = await authOptions.callbacks?.session?.({ session, token, user: { id: '1' } } as unknown as SessionParams);
        expect((result as Session)?.accessToken).toBe('token123');
      });

      it('should add token.login to session.user.login if session.user is present', async () => {
        const session = { expires: '123', user: { name: 'Test' } };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks?.session?.({ session, token, user: { id: '1' } } as unknown as SessionParams);
        expect((result as Session)?.user?.login).toBe('testuser');
      });

      it('should not add login if session.user is missing', async () => {
        const session = { expires: '123' };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks?.session?.({ session, token, user: { id: '1' } } as unknown as SessionParams);
        expect((result as Session)?.user?.login).toBeUndefined();
      });
    });
  });
});
