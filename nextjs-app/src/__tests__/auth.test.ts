import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cookies } from 'next/headers';

const mockCookies = vi.mocked(cookies);

describe('verifyPassword', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns false when DASHBOARD_SECRET is not set', async () => {
    delete process.env.DASHBOARD_SECRET;
    const { verifyPassword } = await import('@/lib/auth');
    expect(verifyPassword('anything')).toBe(false);
  });

  it('returns true for the correct password', async () => {
    process.env.DASHBOARD_SECRET = 'test-secret';
    const { verifyPassword } = await import('@/lib/auth');
    expect(verifyPassword('test-secret')).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    process.env.DASHBOARD_SECRET = 'test-secret';
    const { verifyPassword } = await import('@/lib/auth');
    expect(verifyPassword('wrong')).toBe(false);
  });
});

describe('isAuthenticated', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DASHBOARD_SECRET = 'test-secret';
  });

  it('returns true when cookie matches secret', async () => {
    mockCookies.mockResolvedValue({
      get: () => ({ value: 'test-secret', name: 'sas-auth' }),
    } as never);
    const { isAuthenticated } = await import('@/lib/auth');
    expect(await isAuthenticated()).toBe(true);
  });

  it('returns false when cookie is absent', async () => {
    mockCookies.mockResolvedValue({
      get: () => undefined,
    } as never);
    const { isAuthenticated } = await import('@/lib/auth');
    expect(await isAuthenticated()).toBe(false);
  });

  it('returns false when cookie value is wrong', async () => {
    mockCookies.mockResolvedValue({
      get: () => ({ value: 'bad-value', name: 'sas-auth' }),
    } as never);
    const { isAuthenticated } = await import('@/lib/auth');
    expect(await isAuthenticated()).toBe(false);
  });
});

describe('authCookieOptions', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns correct cookie shape', async () => {
    process.env.DASHBOARD_SECRET = 'my-secret';
    const { authCookieOptions } = await import('@/lib/auth');
    const opts = authCookieOptions();
    expect(opts.name).toBe('sas-auth');
    expect(opts.value).toBe('my-secret');
    expect(opts.httpOnly).toBe(true);
    expect(opts.maxAge).toBe(60 * 60 * 8);
  });
});
