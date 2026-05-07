import { a as attr_class, c as clsx } from "../../../chunks/renderer.js";
import { p as page } from "../../../chunks/index2.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    $$renderer2.push(`<nav class="nav"><div class="nav-brand">SAS Usage Analytics</div> <ul class="nav-links"><li><a href="/"${attr_class(clsx(page.url.pathname === "/" ? "active" : ""))}>Overview</a></li> <li><a href="/divisions"${attr_class(clsx(page.url.pathname === "/divisions" ? "active" : ""))}>Divisions</a></li></ul> <div class="nav-right"><span>Singapore American School</span> <button class="logout-btn">Logout</button></div></nav> <div class="main">`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _layout as default
};
