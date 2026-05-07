import { c as cacheGet, a as cacheSet } from "../../../chunks/cache.js";
import { b as getUsageData, a as getStudentData, g as getDivisionData } from "../../../chunks/sheets.js";
import { error } from "@sveltejs/kit";
const load = async () => {
  try {
    let usage = cacheGet("usage");
    let students = cacheGet("students");
    let divisions = cacheGet("divisions");
    if (!usage) {
      usage = await getUsageData();
      cacheSet("usage", usage);
    }
    if (!students) {
      students = await getStudentData();
      cacheSet("students", students);
    }
    if (!divisions) {
      divisions = await getDivisionData();
      cacheSet("divisions", divisions);
    }
    return { usage, students, divisions };
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : "Failed to load data");
  }
};
export {
  load
};
