import { json, error } from "@sveltejs/kit";
import { c as cacheGet, a as cacheSet } from "../../../../chunks/cache.js";
import { g as getDivisionData } from "../../../../chunks/sheets.js";
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
export {
  GET
};
