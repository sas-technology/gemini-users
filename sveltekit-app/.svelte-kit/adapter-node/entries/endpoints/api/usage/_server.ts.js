import { json, error } from "@sveltejs/kit";
import { c as cacheGet, a as cacheSet } from "../../../../chunks/cache.js";
import { b as getUsageData } from "../../../../chunks/sheets.js";
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
export {
  GET
};
