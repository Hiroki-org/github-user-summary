import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session, Profile } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { NextAuthOptions } from 'next-auth';

describe('authOptions', () => {
  let authOptions: NextAuthOptions;
  const mockUser = { id: '1', email: 'test@example.com', emailVerified: null };

  beforeEach(async () => {
    vi.resetModules();
    process.env.NEXTAUTH_SECRET = 'my_secret';
    const authModule = await import('@/lib/auth');
    authOptions = authModule.authOptions;
  });

  describe('callbacks', () => {
    describe('jwt', () => {
      it('account が提供された場合、token.accessToken に account.access_token を追加する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const account = { access_token: 'token123', provider: 'github', type: 'oauth' as const, providerAccountId: '123' };
        const result = await authOptions.callbacks!.jwt!({ token, account, user: mockUser, profile: undefined, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.accessToken).toBe('token123');
      });

      it('account が提供されない場合は accessToken を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks!.jwt!({ token, account: null, user: mockUser, profile: undefined, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.accessToken).toBeUndefined();
      });

      it('profile が提供され、login が文字列の場合、token.login に profile.login を追加する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 'testuser', id: 1 } as unknown as Profile;
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile, user: mockUser, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBe('testuser');
      });

      it('profile が提供されない場合は login を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks!.jwt!({ token, account: null, user: mockUser, profile: undefined, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile がオブジェクトではない場合は login を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = "not an object";
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile: profile as unknown as Profile, user: mockUser, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile.login が文字列ではない場合は login を undefined に設定する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 12345, id: 1 } as unknown as Profile;
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile, user: mockUser, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile に login キーがない場合は login を設定しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { id: 1 } as unknown as Profile;
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile, user: mockUser, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });
    });

    describe('session', () => {
      it('session.accessToken に token.accessToken を追加する', async () => {
        const session = { expires: '123' };
        const token = { accessToken: 'token123' };
        const result = await authOptions.callbacks!.session!({ session, token, user: mockUser, newSession: undefined, trigger: 'update' });
        expect((result as Session)?.accessToken).toBe('token123');
      });

      it('session.user が存在する場合、session.user.login に token.login を追加する', async () => {
        const session = { expires: '123', user: { name: 'Test' } };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks!.session!({ session, token, user: mockUser, newSession: undefined, trigger: 'update' });
        expect((result as Session)?.user?.login).toBe('testuser');
      });

      it('session.user が存在しない場合は login を追加しない', async () => {
        const session = { expires: '123' };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks!.session!({ session, token, user: mockUser, newSession: undefined, trigger: 'update' });
        expect((result as Session)?.user?.login).toBeUndefined();
      });
    });
  });

  describe('getSecret', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns NEXTAUTH_SECRET if set', async () => {
      process.env.NEXTAUTH_SECRET = 'my_secret';
      const authModule = await import('@/lib/auth');
      expect(authModule.authOptions.secret).toBe('my_secret');
    });

    it('returns fallback string in development environments', async () => {
      delete process.env.NEXTAUTH_SECRET;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      const authModule = await import('@/lib/auth');
      expect(authModule.authOptions.secret).toBe('fallback_secret_for_development_only');
    });

    it('throws error outside development and test environments if NEXTAUTH_SECRET is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      await expect(() => import('@/lib/auth')).rejects.toThrow('NEXTAUTH_SECRET is not set. Please set it to a secure random value.');
    });

    it('throws error in staging-like environments if NEXTAUTH_SECRET is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'staging', configurable: true });
      await expect(() => import('@/lib/auth')).rejects.toThrow('NEXTAUTH_SECRET is not set. Please set it to a secure random value.');
    });

    it('throws error in test environment if NEXTAUTH_SECRET is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', configurable: true });
      await expect(() => import('@/lib/auth')).rejects.toThrow('NEXTAUTH_SECRET is not set. Please set it to a secure random value.');
    });
  });
});
