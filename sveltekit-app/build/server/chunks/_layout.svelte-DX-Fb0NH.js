import { d as attr_class, f as clsx } from './renderer-CUWHMQgx.js';
import { p as page } from './index2-Pjl_QeTb.js';
import './state.svelte-C99Ptr4o.js';
import './root-HDy16W1B.js';
import '@sveltejs/kit/internal/server';
import '@sveltejs/kit/internal';
import './index-Ds1o2bY0.js';

function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    $$renderer2.push(`<nav class="nav"><div class="nav-brand">SAS Usage Analytics</div> <ul class="nav-links"><li><a href="/"${attr_class(clsx(page.url.pathname === "/" ? "active" : ""))}>Overview</a></li> <li><a href="/divisions"${attr_class(clsx(page.url.pathname === "/divisions" ? "active" : ""))}>Divisions</a></li></ul> <div class="nav-right"><span>Singapore American School</span> <button class="logout-btn">Logout</button></div></nav> <div class="main">`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-DX-Fb0NH.js.map
