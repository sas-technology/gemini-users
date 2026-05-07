import { c as cacheGet, a as cacheSet } from './cache-CVyeVZAb.js';
import { b as getDivisionData } from './sheets-CqdHlK4w.js';
import { error } from '@sveltejs/kit';

const load = async () => {
  try {
    let divisions = cacheGet("divisions");
    if (!divisions) {
      divisions = await getDivisionData();
      cacheSet("divisions", divisions);
    }
    return { divisions };
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : "Failed to load division data");
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-C6MfDnob.js')).default;
const server_id = "src/routes/(dashboard)/divisions/+page.server.ts";
const imports = ["_app/immutable/nodes/4.BiMuDkMA.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CgvtmLl6.js","_app/immutable/chunks/BW341vsq.js","_app/immutable/chunks/COtxWNbX.js","_app/immutable/chunks/CN8CwkyU.js","_app/immutable/chunks/rzpSGfTS.js","_app/immutable/chunks/CjaFJi0T.js","_app/immutable/chunks/Dnl8Z8Ue.js","_app/immutable/chunks/CytXg8Kl.js","_app/immutable/chunks/B_40f77_.js","_app/immutable/chunks/CYOP0bH8.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=4-BkIZeiEq.js.map
