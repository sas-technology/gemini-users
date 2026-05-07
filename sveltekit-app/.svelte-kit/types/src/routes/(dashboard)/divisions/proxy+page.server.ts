// @ts-nocheck
import type { PageServerLoad } from './$types';
import { cacheGet, cacheSet } from '$lib/cache';
import { getDivisionData } from '$lib/sheets';
import type { DivisionData } from '$lib/types';
import { error } from '@sveltejs/kit';

export const load = async () => {
  try {
    let divisions = cacheGet<DivisionData>('divisions');
    if (!divisions) {
      divisions = await getDivisionData();
      cacheSet('divisions', divisions);
    }
    return { divisions };
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Failed to load division data');
  }
};
;null as any as PageServerLoad;