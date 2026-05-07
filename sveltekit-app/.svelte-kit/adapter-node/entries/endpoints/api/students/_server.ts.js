import { json, error } from "@sveltejs/kit";
import { c as cacheGet, a as cacheSet } from "../../../../chunks/cache.js";
import { a as getStudentData } from "../../../../chunks/sheets.js";
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
export {
  GET
};
