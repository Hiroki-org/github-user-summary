import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { NextAuthOptions } from 'next-auth';

describe('authOptions', () => {
  let authOptions: NextAuthOptions;

  beforeEach(async () => {
    vi.resetModules();
    process.env.NEXTAUTH_SECRET = 'my_secret';
    const authModule = await import('../auth');
    authOptions = authModule.authOptions;
  });

  describe('callbacks', () => {
    describe('jwt', () => {
      it('account が提供された場合、token.accessToken に account.access_token を追加する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const account = { access_token: 'token123', provider: 'github', type: 'oauth' as const, providerAccountId: '123' };
        const result = await authOptions.callbacks!.jwt!({ token, account, user: { id: '1' }, profile: undefined, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.accessToken).toBe('token123');
      });

      it('account が提供されない場合は accessToken を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks!.jwt!({ token, account: null, user: { id: '1' }, profile: undefined, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.accessToken).toBeUndefined();
      });

      it('profile が提供され、login が文字列の場合、token.login に profile.login を追加する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 'testuser', id: 1 };
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile, user: { id: '1' }, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBe('testuser');
      });

      it('profile が提供されない場合は login を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const result = await authOptions.callbacks!.jwt!({ token, account: null, user: { id: '1' }, profile: undefined, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile がオブジェクトではない場合は login を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = "not an object";
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile: profile as unknown as { login?: string; [key: string]: unknown }, user: { id: '1' }, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile.login が文字列ではない場合は login を undefined に設定する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 12345, id: 1 };
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile, user: { id: '1' }, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile に login キーがない場合は login を設定しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { id: 1 };
        const result = await authOptions.callbacks!.jwt!({ token, account: null, profile, user: { id: '1' }, trigger: 'signIn', session: undefined, isNewUser: false });
        expect((result as JWT)?.login).toBeUndefined();
      });
    });

    describe('session', () => {
      it('session.accessToken に token.accessToken を追加する', async () => {
        const session = { expires: '123' };
        const token = { accessToken: 'token123' };
        const result = await authOptions.callbacks!.session!({ session, token, user: { id: '1' }, newSession: undefined, trigger: 'update' });
        expect((result as Session)?.accessToken).toBe('token123');
      });

      it('session.user が存在する場合、session.user.login に token.login を追加する', async () => {
        const session = { expires: '123', user: { name: 'Test' } };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks!.session!({ session, token, user: { id: '1' }, newSession: undefined, trigger: 'update' });
        expect((result as Session)?.user?.login).toBe('testuser');
      });

      it('session.user が存在しない場合は login を追加しない', async () => {
        const session = { expires: '123' };
        const token = { login: 'testuser' };
        const result = await authOptions.callbacks!.session!({ session, token, user: { id: '1' }, newSession: undefined, trigger: 'update' });
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
      const authModule = await import('../auth');
      expect(authModule.authOptions.secret).toBe('my_secret');
    });

    it('returns fallback string in non-production environments', async () => {
      delete process.env.NEXTAUTH_SECRET;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      const authModule = await import('../auth');
      expect(authModule.authOptions.secret).toBe('fallback_secret_for_development_only');
    });

    it('throws error in production environment if NEXTAUTH_SECRET is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      await expect(() => import('../auth')).rejects.toThrow('NEXTAUTH_SECRET is not set in production. Please set it to a secure random value.');
    });
  });
});
