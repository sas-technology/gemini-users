import { fail, redirect } from '@sveltejs/kit';
import { v as verifyPassword, C as COOKIE_NAME, c as cookieOptions } from './auth-DqAiqVhr.js';

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

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 6;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-5A7BxqgX.js')).default;
const server_id = "src/routes/login/+page.server.ts";
const imports = ["_app/immutable/nodes/6.bJTRft5D.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BW341vsq.js","_app/immutable/chunks/CgvtmLl6.js","_app/immutable/chunks/COtxWNbX.js","_app/immutable/chunks/CN8CwkyU.js","_app/immutable/chunks/CjaFJi0T.js","_app/immutable/chunks/B_40f77_.js","_app/immutable/chunks/p6MXoyEn.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=6-DX_g3FhX.js.map
