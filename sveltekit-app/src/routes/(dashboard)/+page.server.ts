import type { PageServerLoad } from './$types';
import { cacheGet, cacheSet } from '$lib/cache';
import { getUsageData, getStudentData, getDivisionData } from '$lib/sheets';
import type { UsageData, StudentData, DivisionData } from '$lib/types';
import type { FetchResult } from '$lib/sheets';

// We always return a result for every upstream call. Pages render a
// banner on partial failure rather than 502'ing the whole route.
async function loadCached<T>(
  key: string,
  fetcher: () => Promise<FetchResult<T>>
): Promise<FetchResult<T>> {
  const cached = cacheGet<T>(key);
  if (cached) return { data: cached, error: null };
  const result = await fetcher();
  if (result.data) cacheSet(key, result.data);
  return result;
}

export const load: PageServerLoad = async () => {
  const [usage, students, divisions] = await Promise.all([
    loadCached<UsageData>('usage', getUsageData),
    loadCached<StudentData>('students', getStudentData),
    loadCached<DivisionData>('divisions', getDivisionData),
  ]);

  return {
    usage: usage.data,
    students: students.data,
    divisions: divisions.data,
    errors: {
      usage: usage.error,
      students: students.error,
      divisions: divisions.error,
    },
  };
};
