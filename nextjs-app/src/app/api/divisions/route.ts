import { NextResponse } from 'next/server';
import { getDivisionData } from '@/lib/sheets';
import { cacheGet, cacheSet } from '@/lib/cache';
import type { DivisionData } from '@/types';

export async function GET() {
  try {
    const cached = cacheGet<DivisionData>('divisions');
    const data = cached ?? (await getDivisionData());
    if (!cached) cacheSet('divisions', data);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch division data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
