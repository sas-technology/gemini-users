import { c as getUserProfile } from "../../../../chunks/sheets.js";
import { error } from "@sveltejs/kit";
const load = async ({ url }) => {
  const email = url.searchParams.get("email") ?? "";
  if (!email) return { profile: null, email: "" };
  try {
    const profile = await getUserProfile(email);
    return { profile, email };
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : "Failed to load user profile");
  }
};
export {
  load
};
