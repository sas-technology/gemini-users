import { NextResponse } from 'next/server';
import { getStudentData } from '@/lib/sheets';
import { cacheGet, cacheSet } from '@/lib/cache';
import type { StudentData } from '@/types';

export async function GET() {
  try {
    const cached = cacheGet<StudentData>('students');
    const data = cached ?? await getStudentData();
    if (!cached) cacheSet('students', data);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch student data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
