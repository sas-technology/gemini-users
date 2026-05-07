import { json, error } from '@sveltejs/kit';
import { cacheGet, cacheSet } from '$lib/cache';
import { getStudentData } from '$lib/sheets';
import type { StudentData } from '$lib/types';

export async function GET() {
  try {
    let data = cacheGet<StudentData>('students');
    if (!data) {
      data = await getStudentData();
      cacheSet('students', data);
    }
    return json(data);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Failed to fetch student data');
  }
}
