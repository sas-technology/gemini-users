import { error, json } from '@sveltejs/kit';
import { v as verifyPassword, C as COOKIE_NAME, c as cookieOptions } from './auth-DqAiqVhr.js';

const POST = async ({ request, cookies, url }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    throw error(400, "Invalid JSON body");
  }
  if (!verifyPassword(body.password ?? "")) {
    throw error(401, "Invalid password");
  }
  cookies.set(COOKIE_NAME, process.env.DASHBOARD_SECRET, {
    ...cookieOptions(url.protocol === "https:")
  });
  return json({ ok: true });
};

export { POST };
//# sourceMappingURL=_server.ts-NnCnqXqk.js.map
