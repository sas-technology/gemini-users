const store = /* @__PURE__ */ new Map();
const TTL_MS = 5 * 60 * 1e3;
function cacheGet(key) {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
}
function cacheSet(key, data) {
  store.set(key, { data, expires: Date.now() + TTL_MS });
}
export {
  cacheSet as a,
  cacheGet as c
};
