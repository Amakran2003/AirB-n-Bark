import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

// ANSI color codes for Docker logs
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const globalForRedis = globalThis as unknown as {
  _redisClient?: ReturnType<typeof createClient>;
  _redisAvailable?: boolean;
};

export const redis =
  globalForRedis._redisClient ?? createClient({ url: redisUrl });

// Track Redis availability for graceful degradation
export let redisAvailable = globalForRedis._redisAvailable ?? false;

if (!globalForRedis._redisClient) {
  redis.on('error', (err: Error) => {
    redisAvailable = false;
    globalForRedis._redisAvailable = false;
    // eslint-disable-next-line no-console
    console.error(`${RED}[REDIS ERROR]${RESET} Redis connection lost:`, err.message);
  });

  redis.on('reconnecting', () => {
    // eslint-disable-next-line no-console
    console.log(`${YELLOW}[REDIS]${RESET} Attempting to reconnect...`);
  });

  redis.on('ready', () => {
    redisAvailable = true;
    globalForRedis._redisAvailable = true;
    // eslint-disable-next-line no-console
    console.log(`${GREEN}[REDIS]${RESET} Connected and ready`);
  });

  // Connect asynchronously with graceful degradation
  redis.connect().then(() => {
    redisAvailable = true;
    globalForRedis._redisAvailable = true;
    // eslint-disable-next-line no-console
    console.log(`${GREEN}[REDIS]${RESET} Successfully connected to ${redisUrl}`);
  }).catch((err: Error) => {
    redisAvailable = false;
    globalForRedis._redisAvailable = false;
    // eslint-disable-next-line no-console
    console.error(`${RED}[REDIS ERROR]${RESET} Failed to connect - caching disabled:`, err.message);
    console.error(`${RED}[REDIS ERROR]${RESET} The application will continue without caching.`);
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis._redisClient = redis;
  }
}

process.on('beforeExit', async () => {
  try {
    if (redisAvailable) {
      await redis.quit();
    }
  } catch (_) {
    // ignore
  }
});

/**
 * Check if Redis is available for caching operations.
 * Use this before cache operations to gracefully skip when unavailable.
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redis.isOpen;
}
