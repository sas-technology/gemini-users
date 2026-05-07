import { json, error } from '@sveltejs/kit';
import { cacheGet, cacheSet } from '$lib/cache';
import { getUsageData } from '$lib/sheets';
import type { UsageData } from '$lib/types';

export async function GET() {
  try {
    let data = cacheGet<UsageData>('usage');
    if (!data) {
      data = await getUsageData();
      cacheSet('usage', data);
    }
    return json(data);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Failed to fetch usage data');
  }
}
