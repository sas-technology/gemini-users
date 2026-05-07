import * as server from '../entries/pages/(dashboard)/_page.server.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/(dashboard)/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/(dashboard)/+page.server.ts";
export const imports = ["_app/immutable/nodes/3.CyIrhP6X.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CgvtmLl6.js","_app/immutable/chunks/BW341vsq.js","_app/immutable/chunks/COtxWNbX.js","_app/immutable/chunks/CN8CwkyU.js","_app/immutable/chunks/rzpSGfTS.js","_app/immutable/chunks/CjaFJi0T.js","_app/immutable/chunks/Dnl8Z8Ue.js","_app/immutable/chunks/CytXg8Kl.js","_app/immutable/chunks/B_40f77_.js","_app/immutable/chunks/CYOP0bH8.js","_app/immutable/chunks/DoosYNNV.js"];
export const stylesheets = [];
export const fonts = [];
