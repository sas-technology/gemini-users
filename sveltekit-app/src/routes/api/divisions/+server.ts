import { json, error } from '@sveltejs/kit';
import { cacheGet, cacheSet } from '$lib/cache';
import { getDivisionData } from '$lib/sheets';
import type { DivisionData } from '$lib/types';

export async function GET() {
  try {
    let data = cacheGet<DivisionData>('divisions');
    if (!data) {
      data = await getDivisionData();
      cacheSet('divisions', data);
    }
    return json(data);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Failed to fetch division data');
  }
}
