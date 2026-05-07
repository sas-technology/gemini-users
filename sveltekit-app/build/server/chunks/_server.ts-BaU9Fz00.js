import { json } from '@sveltejs/kit';
import { C as COOKIE_NAME } from './auth-DqAiqVhr.js';

const POST = async ({ cookies, url }) => {
  cookies.delete(COOKIE_NAME, {
    path: "/",
    secure: url.protocol === "https:"
  });
  return json({ ok: true });
};

export { POST };
//# sourceMappingURL=_server.ts-BaU9Fz00.js.map
