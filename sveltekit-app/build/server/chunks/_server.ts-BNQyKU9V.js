import { json, error } from '@sveltejs/kit';
import { c as cacheGet, a as cacheSet } from './cache-CVyeVZAb.js';
import { b as getDivisionData } from './sheets-CqdHlK4w.js';

async function GET() {
  try {
    let data = cacheGet("divisions");
    if (!data) {
      data = await getDivisionData();
      cacheSet("divisions", data);
    }
    return json(data);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : "Failed to fetch division data");
  }
}

export { GET };
//# sourceMappingURL=_server.ts-BNQyKU9V.js.map
