import { fail, redirect } from "@sveltejs/kit";
import { v as verifyPassword, C as COOKIE_NAME, c as cookieOptions } from "../../../chunks/auth.js";
const load = async ({ url, cookies }) => {
  const secret = process.env.DASHBOARD_SECRET ?? "";
  if (secret && cookies.get(COOKIE_NAME) === secret) {
    throw redirect(302, url.searchParams.get("from") ?? "/");
  }
  return {};
};
const actions = {
  default: async ({ request, cookies, url }) => {
    const data = await request.formData();
    const password = String(data.get("password") ?? "");
    if (!verifyPassword(password)) {
      return fail(401, { error: "Invalid password. Please try again." });
    }
    cookies.set(COOKIE_NAME, process.env.DASHBOARD_SECRET, {
      ...cookieOptions(url.protocol === "https:")
    });
    throw redirect(302, url.searchParams.get("from") ?? "/");
  }
};
export {
  actions,
  load
};
