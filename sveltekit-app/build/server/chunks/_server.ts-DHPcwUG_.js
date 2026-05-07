import { json, error } from '@sveltejs/kit';
import { c as cacheGet, a as cacheSet } from './cache-CVyeVZAb.js';
import { a as getStudentData } from './sheets-CqdHlK4w.js';

async function GET() {
  try {
    let data = cacheGet("students");
    if (!data) {
      data = await getStudentData();
      cacheSet("students", data);
    }
    return json(data);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : "Failed to fetch student data");
  }
}

export { GET };
//# sourceMappingURL=_server.ts-DHPcwUG_.js.map
