import { c as cacheGet, a as cacheSet } from "../../../../chunks/cache.js";
import { g as getDivisionData } from "../../../../chunks/sheets.js";
import { error } from "@sveltejs/kit";
const load = async () => {
  try {
    let divisions = cacheGet("divisions");
    if (!divisions) {
      divisions = await getDivisionData();
      cacheSet("divisions", divisions);
    }
    return { divisions };
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : "Failed to load division data");
  }
};
export {
  load
};
