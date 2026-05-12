import { json, error } from '@sveltejs/kit';
import { cacheGet, cacheSet } from '$lib/cache';
import { getUsageData } from '$lib/sheets';
import type { UsageData } from '$lib/types';

export async function GET() {
  const cached = cacheGet<UsageData>('usage');
  if (cached) return json(cached);

  const result = await getUsageData();
  if (result.error || !result.data) {
    throw error(502, result.error ?? 'Failed to fetch usage data');
  }
  cacheSet('usage', result.data);
  return json(result.data);
}
