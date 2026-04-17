import { describe, it, expect } from 'vitest';
import { authOptions } from '../auth';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

describe('authOptions', () => {
  describe('callbacks', () => {
    describe('jwt', () => {
      type JwtParams = Parameters<NonNullable<NonNullable<typeof authOptions.callbacks>['jwt']>>[0];

      it('account が提供された場合、token.accessToken に account.access_token を追加する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const account = { access_token: 'token123', provider: 'github', type: 'oauth' as const, providerAccountId: '123' };
        expect(authOptions.callbacks?.jwt).toBeDefined();
        const result = await authOptions.callbacks!.jwt!({ token, account, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.accessToken).toBe('token123');
      });

      it('account が提供されない場合は accessToken を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        expect(authOptions.callbacks?.jwt).toBeDefined();
        const result = await authOptions.callbacks!.jwt!({ token, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.accessToken).toBeUndefined();
      });

      it('profile が提供され、login が文字列の場合、token.login に profile.login を追加する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 'testuser', id: 1 };
        expect(authOptions.callbacks?.jwt).toBeDefined();
        const result = await authOptions.callbacks!.jwt!({ token, profile, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBe('testuser');
      });

      it('profile が提供されない場合は login を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        expect(authOptions.callbacks?.jwt).toBeDefined();
        const result = await authOptions.callbacks!.jwt!({ token, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile がオブジェクトではない場合は login を追加しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = "not an object";
        expect(authOptions.callbacks?.jwt).toBeDefined();
        const result = await authOptions.callbacks!.jwt!({ token, profile, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile.login が文字列ではない場合は login を undefined に設定する', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { login: 12345, id: 1 };
        expect(authOptions.callbacks?.jwt).toBeDefined();
        const result = await authOptions.callbacks!.jwt!({ token, profile, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBeUndefined();
      });

      it('profile に login キーがない場合は login を設定しない', async () => {
        const token = { name: 'Test', email: 'test@example.com' };
        const profile = { id: 1 };
        expect(authOptions.callbacks?.jwt).toBeDefined();
        const result = await authOptions.callbacks!.jwt!({ token, profile, user: { id: '1' } } as unknown as JwtParams);
        expect((result as JWT)?.login).toBeUndefined();
      });
    });

    describe('session', () => {
      type SessionParams = Parameters<NonNullable<NonNullable<typeof authOptions.callbacks>['session']>>[0];

      it('session.accessToken に token.accessToken を追加する', async () => {
        const session = { expires: '123' };
        const token = { accessToken: 'token123' };
        expect(authOptions.callbacks?.session).toBeDefined();
        const result = await authOptions.callbacks!.session!({ session, token, user: { id: '1' } } as unknown as SessionParams);
        expect((result as Session)?.accessToken).toBe('token123');
      });

      it('session.user が存在する場合、session.user.login に token.login を追加する', async () => {
        const session = { expires: '123', user: { name: 'Test' } };
        const token = { login: 'testuser' };
        expect(authOptions.callbacks?.session).toBeDefined();
        const result = await authOptions.callbacks!.session!({ session, token, user: { id: '1' } } as unknown as SessionParams);
        expect((result as Session)?.user?.login).toBe('testuser');
      });

      it('session.user が存在しない場合は login を追加しない', async () => {
        const session = { expires: '123' };
        const token = { login: 'testuser' };
        expect(authOptions.callbacks?.session).toBeDefined();
        const result = await authOptions.callbacks!.session!({ session, token, user: { id: '1' } } as unknown as SessionParams);
        expect((result as Session)?.user?.login).toBeUndefined();
      });
    });
  });
});
