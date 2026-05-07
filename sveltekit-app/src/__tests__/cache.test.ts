import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheGet, cacheSet } from '../lib/cache';

describe('cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns null for a missing key', () => {
    expect(cacheGet('missing-key')).toBeNull();
  });

  it('returns stored data within TTL', () => {
    cacheSet('key1', { value: 42 });
    expect(cacheGet('key1')).toEqual({ value: 42 });
  });

  it('returns null after TTL expires', () => {
    cacheSet('key2', 'hello');
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(cacheGet('key2')).toBeNull();
  });

  it('overwrites existing entries', () => {
    cacheSet('key3', 'first');
    cacheSet('key3', 'second');
    expect(cacheGet('key3')).toBe('second');
  });

  it('handles multiple keys independently', () => {
    cacheSet('a', 1);
    cacheSet('b', 2);
    expect(cacheGet('a')).toBe(1);
    expect(cacheGet('b')).toBe(2);
  });
});
