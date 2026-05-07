import type { PageServerLoad } from './$types';
import { cacheGet, cacheSet } from '$lib/cache';
import { getUsageData, getStudentData, getDivisionData } from '$lib/sheets';
import type { UsageData, StudentData, DivisionData } from '$lib/types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  try {
    let usage = cacheGet<UsageData>('usage');
    let students = cacheGet<StudentData>('students');
    let divisions = cacheGet<DivisionData>('divisions');

    if (!usage) {
      usage = await getUsageData();
      cacheSet('usage', usage);
    }
    if (!students) {
      students = await getStudentData();
      cacheSet('students', students);
    }
    if (!divisions) {
      divisions = await getDivisionData();
      cacheSet('divisions', divisions);
    }

    return { usage, students, divisions };
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Failed to load data');
  }
};
