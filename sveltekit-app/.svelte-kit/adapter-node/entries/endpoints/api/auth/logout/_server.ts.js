import { json } from "@sveltejs/kit";
import { C as COOKIE_NAME } from "../../../../../chunks/auth.js";
const POST = async ({ cookies, url }) => {
  cookies.delete(COOKIE_NAME, {
    path: "/",
    secure: url.protocol === "https:"
  });
  return json({ ok: true });
};
export {
  POST
};
