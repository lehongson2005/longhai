const PREFIX = 'lh_fastcache_v1:';
const memoryCache = new Map();

export function readCache(key) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache(key, data) {
  memoryCache.set(key, data);
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function invalidateCachePrefix(prefix) {
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k);
    }
  }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const storageKey = sessionStorage.key(i);
      if (storageKey && storageKey.startsWith(PREFIX + prefix)) {
        sessionStorage.removeItem(storageKey);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearAllCache() {
  memoryCache.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const storageKey = sessionStorage.key(i);
      if (storageKey && storageKey.startsWith(PREFIX)) {
        sessionStorage.removeItem(storageKey);
      }
    }
  } catch {
    // Ignore storage errors
  }
}
