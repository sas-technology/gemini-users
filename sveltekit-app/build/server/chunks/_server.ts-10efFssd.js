import { json, error } from '@sveltejs/kit';
import { c as cacheGet, a as cacheSet } from './cache-CVyeVZAb.js';
import { g as getUsageData } from './sheets-CqdHlK4w.js';

async function GET() {
  try {
    let data = cacheGet("usage");
    if (!data) {
      data = await getUsageData();
      cacheSet("usage", data);
    }
    return json(data);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : "Failed to fetch usage data");
  }
}

export { GET };
//# sourceMappingURL=_server.ts-10efFssd.js.map
