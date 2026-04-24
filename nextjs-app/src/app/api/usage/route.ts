import { NextResponse } from 'next/server';
import { getUsageData } from '@/lib/sheets';
import { cacheGet, cacheSet } from '@/lib/cache';
import type { UsageData } from '@/types';

export async function GET() {
  try {
    const cached = cacheGet<UsageData>('usage');
    const data = cached ?? await getUsageData();
    if (!cached) cacheSet('usage', data);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch usage data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
