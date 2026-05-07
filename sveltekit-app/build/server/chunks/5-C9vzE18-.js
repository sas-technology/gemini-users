import { c as getUserProfile } from './sheets-CqdHlK4w.js';
import { error } from '@sveltejs/kit';

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

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 5;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-COeZbffT.js')).default;
const server_id = "src/routes/(dashboard)/user/+page.server.ts";
const imports = ["_app/immutable/nodes/5.y31yQL1H.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CgvtmLl6.js","_app/immutable/chunks/BW341vsq.js","_app/immutable/chunks/COtxWNbX.js","_app/immutable/chunks/CN8CwkyU.js","_app/immutable/chunks/rzpSGfTS.js","_app/immutable/chunks/CjaFJi0T.js","_app/immutable/chunks/B_40f77_.js","_app/immutable/chunks/CytXg8Kl.js","_app/immutable/chunks/CYOP0bH8.js","_app/immutable/chunks/DoosYNNV.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=5-C9vzE18-.js.map
