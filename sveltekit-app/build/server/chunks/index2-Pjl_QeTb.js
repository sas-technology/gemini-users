import './state.svelte-C99Ptr4o.js';
import '@sveltejs/kit/internal';
import './root-HDy16W1B.js';
import { w as writable } from './index-Ds1o2bY0.js';
import '@sveltejs/kit/internal/server';
import { h as getContext } from './renderer-CUWHMQgx.js';

function create_updated_store() {
  const { set, subscribe } = writable(false);
  {
    return {
      subscribe,
      // eslint-disable-next-line @typescript-eslint/require-await
      check: async () => false
    };
  }
}
const stores = {
  updated: /* @__PURE__ */ create_updated_store()
};
({
  check: stores.updated.check
});
function context() {
  return getContext("__request__");
}
const page$1 = {
  get error() {
    return context().page.error;
  },
  get status() {
    return context().page.status;
  },
  get url() {
    return context().page.url;
  }
};
const page = page$1;

export { page as p };
//# sourceMappingURL=index2-Pjl_QeTb.js.map
