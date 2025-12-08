const appCacheConfig = {
  enabled: process.env.CACHE_ENABLED === 'true',
  config: {
    debug: false, // Enable debug logs
    ttl: 60 * 60 * 72, // Time to live for cache items in seconds (72 hours)
    apiVersion: 'v1', // API version to use in path matching
    cacheableRoutes: ['/categories', '/contents', '/global-settings', '/menus', '/pages'], // Caches routes which start with these paths after /api/{apiVersion}
    cacheableHeaders: ['accept-language'], // Vary cache by these request headers
    redisConfig: {
      host: process.env.CACHE_REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.CACHE_REDIS_PORT || '6379', 10),
      password: process.env.CACHE_REDIS_PASSWORD || undefined,
      db: 0,
      keyPrefix: process.env.CACHE_REDIS_KEY_PREFIX
    } // Redis config takes either a string or an object see https://github.com/redis/ioredis for references to what object is available, the object or string is passed directly to ioredis client (if using Redis)
  }
};

export default appCacheConfig;
