// A simple in-memory cache for API responses

const cache = new Map();

/**
 * Get data from cache or fetch it if missing/stale.
 * Implements Stale-While-Revalidate (SWR) pattern optionally.
 * 
 * @param {string} key - Unique cache key (e.g., URL endpoint)
 * @param {Function} fetcher - Function returning a promise that fetches the data
 * @param {number} ttl - Time to live in milliseconds (default 5 minutes)
 * @param {boolean} swr - Whether to return stale data immediately while fetching fresh data in background
 * @returns {Promise<any>}
 */
export const fetchWithCache = async (key, fetcher, ttl = 300000, swr = true) => {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached) {
    const isStale = now - cached.timestamp > ttl;
    
    if (!isStale) {
      return cached.data;
    }
    
    if (swr) {
      // Background fetch to update cache, but return stale data immediately
      fetcher().then(data => {
        cache.set(key, { data, timestamp: Date.now() });
      }).catch(() => {
        // Silent fail on background refresh
      });
      return cached.data;
    }
  }

  // Not in cache or stale without SWR, fetch and wait
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

export const prefetch = (key, fetcher, ttl = 300000) => {
  const now = Date.now();
  const cached = cache.get(key);
  
  if (!cached || now - cached.timestamp > ttl) {
    fetcher().then(data => {
      cache.set(key, { data, timestamp: Date.now() });
    }).catch(() => {});
  }
};

export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};
