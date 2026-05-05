import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheGet, cacheSet } from '@/lib/cache';

describe('cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns null for a missing key', () => {
    expect(cacheGet('missing')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    cacheSet('key1', { foo: 'bar' });
    expect(cacheGet('key1')).toEqual({ foo: 'bar' });
  });

  it('returns null after TTL expires', () => {
    cacheSet('key2', 42);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(cacheGet('key2')).toBeNull();
  });

  it('returns value just before TTL expires', () => {
    cacheSet('key3', 'still-alive');
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);
    expect(cacheGet('key3')).toBe('still-alive');
  });

  it('overwrites an existing key', () => {
    cacheSet('key4', 'first');
    cacheSet('key4', 'second');
    expect(cacheGet('key4')).toBe('second');
  });
});
