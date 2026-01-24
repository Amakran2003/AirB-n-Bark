import { redis, isRedisAvailable } from './redis.js';

// ANSI color codes for Docker logs
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

export const cacheGet = async <T = unknown>(key: string): Promise<T | null> => {
  if (!isRedisAvailable()) {
    // eslint-disable-next-line no-console
    console.log(`${YELLOW}[CACHE]${RESET} Redis unavailable - skipping cache get for key: ${key}`);
    return null;
  }
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`${RED}[CACHE ERROR]${RESET} cacheGet failed for key "${key}":`, err);
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSec = 60): Promise<void> => {
  if (!isRedisAvailable()) {
    // eslint-disable-next-line no-console
    console.log(`${YELLOW}[CACHE]${RESET} Redis unavailable - skipping cache set for key: ${key}`);
    return;
  }
  try {
    const raw = JSON.stringify(value);
    if (ttlSec > 0) {
      await redis.set(key, raw, { EX: ttlSec });
    } else {
      await redis.set(key, raw);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`${RED}[CACHE ERROR]${RESET} cacheSet failed for key "${key}":`, err);
  }
};

export const cacheDel = async (pattern: string): Promise<void> => {
  if (!isRedisAvailable()) {
    // eslint-disable-next-line no-console
    console.log(`${YELLOW}[CACHE]${RESET} Redis unavailable - skipping cache delete for pattern: ${pattern}`);
    return;
  }
  try {
    // For small projects using KEYS is acceptable; for production use SCAN
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(keys);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`${RED}[CACHE ERROR]${RESET} cacheDel failed for pattern "${pattern}":`, err);
  }
};
