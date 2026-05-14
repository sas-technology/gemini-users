import { json, error } from '@sveltejs/kit';
import { cacheGet, cacheSet } from '$lib/cache';
import { getDivisionData } from '$lib/sheets';
import type { DivisionData } from '$lib/types';

export async function GET() {
  const cached = cacheGet<DivisionData>('divisions');
  if (cached) return json(cached);

  const result = await getDivisionData();
  if (result.error || !result.data) {
    throw error(502, result.error ?? 'Failed to fetch division data');
  }
  cacheSet('divisions', result.data);
  return json(result.data);
}
