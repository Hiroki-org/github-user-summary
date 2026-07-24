import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  default: vi.fn(() => 'mocked_handler'),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: { mocked: 'authOptions' },
}));

describe('NextAuth Route Handler', () => {
  let GET: unknown;
  let POST: unknown;
  let NextAuth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const route = await import('./route');
    GET = route.GET;
    POST = route.POST;
    NextAuth = (await import('next-auth')).default;
  });

  it('should export GET and POST handlers created by NextAuth', () => {
    expect(NextAuth).toHaveBeenCalledWith({ mocked: 'authOptions' });
    expect(GET).toBe('mocked_handler');
    expect(POST).toBe('mocked_handler');
  });
});
