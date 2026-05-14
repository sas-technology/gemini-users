import type { PageServerLoad } from './$types';
import { cacheGet, cacheSet } from '$lib/cache';
import { getDivisionData } from '$lib/sheets';
import type { DivisionData } from '$lib/types';
import { computeDivisionInsights } from '$lib/insights';

export const load: PageServerLoad = async () => {
  const cached = cacheGet<DivisionData>('divisions');
  if (cached) {
    return {
      divisions: cached,
      error: null,
      divisionInsights: computeDivisionInsights(cached),
    };
  }

  const result = await getDivisionData();
  if (result.data) cacheSet('divisions', result.data);
  return {
    divisions: result.data,
    error: result.error,
    divisionInsights: computeDivisionInsights(result.data),
  };
};
