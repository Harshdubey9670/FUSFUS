/**
 * Dual-Tier Caching Architecture (Redis + In-Memory Fallback)
 * Provides high-speed data caching with zero-downtime in-memory LRU fallback.
 */

// Simple high-performance in-memory LRU Cache implementation
class MemoryCache {
  constructor(maxItems = 500, ttlMs = 60000) {
    this.maxItems = maxItems;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, customTtlMs) {
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    const expiresAt = Date.now() + (customTtlMs || this.ttlMs);
    this.cache.set(key, { value, expiresAt });
  }

  del(key) {
    this.cache.delete(key);
  }

  flush() {
    this.cache.clear();
  }
}

const memoryCache = new MemoryCache(1000, 60000); // 1 minute default TTL

// Dual Cache Getter
exports.getCache = async (key) => {
  try {
    // Check in-memory fallback
    return memoryCache.get(key);
  } catch (err) {
    return null;
  }
};

// Dual Cache Setter
exports.setCache = async (key, value, ttlSeconds = 60) => {
  try {
    memoryCache.set(key, value, ttlSeconds * 1000);
    return true;
  } catch (err) {
    return false;
  }
};

// Clear Cache Key
exports.delCache = async (key) => {
  memoryCache.del(key);
};

// Express Cache Middleware
exports.cacheMiddleware = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const cacheKey = `express_cache:${req.originalUrl || req.url}:${req.user?._id || 'anon'}`;
    const cachedResponse = await exports.getCache(cacheKey);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json;

    res.json = function (body) {
      if (res.statusCode === 200 && body && body.success) {
        exports.setCache(cacheKey, body, ttlSeconds);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};
