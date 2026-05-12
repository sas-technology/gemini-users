import { json, error } from '@sveltejs/kit';
import { cacheGet, cacheSet } from '$lib/cache';
import { getStudentData } from '$lib/sheets';
import type { StudentData } from '$lib/types';

export async function GET() {
  const cached = cacheGet<StudentData>('students');
  if (cached) return json(cached);

  const result = await getStudentData();
  if (result.error || !result.data) {
    throw error(502, result.error ?? 'Failed to fetch student data');
  }
  cacheSet('students', result.data);
  return json(result.data);
}
