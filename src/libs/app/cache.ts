import { NextRequest } from 'next/server';
import Redis from 'ioredis';

import appCacheConfig from '@/configs/appCacheConfig';
import { createDigest } from '../crypto';

// api prefix (routes and cache keys)
const apiPrefix = 'api';

// redis instance
let redis = null;
if (appCacheConfig.enabled) {
  redis = new Redis(appCacheConfig.config.redisConfig);
  if (redis && appCacheConfig.config.debug) {
    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    redis.on('ready', () => {
      console.log('Redis client is ready to send commands');
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redis.on('close', () => {
      console.log('Redis connection closed');
    });

    redis.on('reconnecting', (delay: number) => {
      console.log(`Redis reconnecting in ${delay}ms`);
    });

    redis.on('end', () => {
      console.log('Redis connection ended');
    });
  }
}

// path creation for cacheable routes
const pathFromRoute = (route: string) => encodeURI(`/${apiPrefix}/${appCacheConfig.config.apiVersion}${route}`);

const getKeyMatch = (route?: string) => {
  let match = `${apiPrefix}:`;

  if (route) {
    match += `${pathFromRoute(route)}:*`;
  } else {
    match += '*';
  }

  return match;
};

const isCacheableRoute = (pathname: string) => {
  return appCacheConfig.config.cacheableRoutes.some((route) => pathname.startsWith(pathFromRoute(route)));
};

const buildCacheKey = ({
  method,
  url,
  varyHeaders
}: {
  method: string;
  url: URL;
  varyHeaders: Record<string, string | undefined>;
}) => {
  // Normalize & sort query
  const qp: Record<string, string[]> = {};
  for (const [k, v] of url.searchParams) (qp[k] ??= []).push(v);
  const sortedQuery = Object.fromEntries(
    Object.keys(qp)
      .sort()
      .map((k) => [k, qp[k].sort()])
  );

  // Normalize & sort vary headers
  const sortedVary = Object.fromEntries(
    Object.keys(varyHeaders)
      .sort()
      .map((k) => [k, varyHeaders[k] ?? ''])
  );

  // Hash only the “non-path” parts so we can GROUP by path in Redis
  const raw = JSON.stringify({ q: sortedQuery, vary: sortedVary });
  const digest = createDigest(raw);

  const pathPart = encodeURI(url.pathname);
  const methodPart = method.toUpperCase();
  const hashPart = digest;

  return `${apiPrefix}:${pathPart}:${methodPart}:${hashPart}`;
};

export const getCacheKeyFromRequest = async (request: NextRequest) => {
  // redis loaded if it is enabled
  if (!redis) return;

  // Only cache GET requests
  if (request.method !== 'GET') return null;

  // check if route is cacheable
  const urlPathname = new URL(request.url).pathname;
  if (!isCacheableRoute(urlPathname)) return null;

  // build cache key
  const url = new URL(request.url);

  const varyHeaders: Record<string, string | undefined> = {};
  for (const header of appCacheConfig.config.cacheableHeaders) {
    varyHeaders[header] = request.headers.get(header) || undefined;
  }

  const cacheKey = buildCacheKey({
    method: request.method,
    url,
    varyHeaders
  });

  return cacheKey;
};

export const getCachedResponse = async (cacheKey: string) => {
  if (!redis) return null;

  try {
    const cachedData = await redis.get(cacheKey);

    const formattedData = cachedData ? JSON.parse(cachedData) : null;

    return formattedData;
  } catch (error) {
    console.error('Cache: Error fetching cached data:', error);

    return null;
  }
};

export const setCachedResponse = async (cacheKey: string, data: string) => {
  if (!redis) return;

  try {
    const formattedData = JSON.stringify(data);
    await redis.set(cacheKey, formattedData, 'EX', appCacheConfig.config.ttl);
  } catch (error) {
    console.error('Cache: Error stringifying data for cache logging:', error);
  }
};

const cleanCacheMatch = async (match: string) => {
  if (!redis) return 0;

  const prefix = redis.options.keyPrefix ?? '';

  let cursor = '0';
  let total = 0;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}${match}`, 'COUNT', 500);
    cursor = next;
    if (keys.length) {
      const cleaned = keys.map((k) => (k.startsWith(prefix) ? k.slice(prefix.length) : k));
      await redis.unlink(...cleaned);
      total += keys.length;
    }
  } while (cursor !== '0');

  return total;
};

export const cleanCache = async (route?: string | string[]) => {
  if (!redis) return 0;

  if (Array.isArray(route)) {
    let total = 0;
    for (const r of route) {
      const match = getKeyMatch(r);
      const cleaned = await cleanCacheMatch(match);
      total += cleaned;
    }

    return total;
  } else {
    const match = getKeyMatch(route);
    const total = await cleanCacheMatch(match);

    return total;
  }
};
