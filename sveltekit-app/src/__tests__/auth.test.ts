import { describe, it, expect, beforeEach } from 'vitest';
import { verifyPassword, cookieOptions } from '../lib/auth';

describe('verifyPassword', () => {
  beforeEach(() => {
    process.env.DASHBOARD_SECRET = 'test-secret-123';
  });

  it('returns true for the correct password', () => {
    expect(verifyPassword('test-secret-123')).toBe(true);
  });

  it('returns false for the wrong password', () => {
    expect(verifyPassword('wrong')).toBe(false);
  });

  it('returns false when DASHBOARD_SECRET is empty', () => {
    process.env.DASHBOARD_SECRET = '';
    expect(verifyPassword('')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(verifyPassword('Test-Secret-123')).toBe(false);
  });
});

describe('cookieOptions', () => {
  it('sets secure=false for HTTP', () => {
    const opts = cookieOptions(false);
    expect(opts.secure).toBe(false);
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.maxAge).toBe(60 * 60 * 8);
    expect(opts.path).toBe('/');
  });

  it('sets secure=true for HTTPS', () => {
    expect(cookieOptions(true).secure).toBe(true);
  });
});
