import { redirect } from "@sveltejs/kit";
import { C as COOKIE_NAME } from "../chunks/auth.js";
const PUBLIC = ["/login", "/api/auth/login", "/api/auth/logout", "/api/health"];
const handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p + "/"));
  if (!isPublic) {
    const secret = process.env.DASHBOARD_SECRET ?? "";
    const cookie = event.cookies.get(COOKIE_NAME);
    if (!secret || cookie !== secret) {
      throw redirect(302, `/login?from=${encodeURIComponent(path)}`);
    }
  }
  return resolve(event);
};
export {
  handle
};
