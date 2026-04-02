const redis = require('../config/redis');
const logger = require('../config/logger');

// TTLs in seconds
const TTL = {
  BOOK_LIST:   60,
  BOOK_DETAIL: 120,
  LEADERBOARD: 60,
  ANALYTICS:   300,
};

/**
 * Return cached value or call fetchFn, cache the result, and return it.
 */
async function getOrSet(key, fetchFn, ttl) {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      logger.debug({ key }, 'Cache HIT');
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn({ err, key }, 'Redis GET failed — falling through to DB');
  }

  const data = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
    logger.debug({ key, ttl }, 'Cache SET');
  } catch (err) {
    logger.warn({ err, key }, 'Redis SET failed');
  }

  return data;
}

/**
 * Delete one or more exact keys.
 */
async function del(...keys) {
  try {
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.warn({ err, keys }, 'Redis DEL failed');
  }
}

/**
 * Delete all keys matching a glob pattern using SCAN (safe for production).
 */
async function delPattern(pattern) {
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    logger.warn({ err, pattern }, 'Redis SCAN/DEL failed');
  }
}

// ── Key builders ──────────────────────────────────────────────────────────────

function bookListKey({ search = '', genre = '', minRating = '', sort = 'newest', page = 1, limit = 12 } = {}) {
  return `books:list:${page}:${limit}:${sort}:${genre}:${minRating}:${search}`;
}

function bookDetailKey(id) {
  return `books:detail:${id}`;
}

const LEADERBOARD_KEY = 'leaderboard';
const ANALYTICS_KEY   = 'admin:analytics';

module.exports = {
  TTL,
  getOrSet,
  del,
  delPattern,
  bookListKey,
  bookDetailKey,
  LEADERBOARD_KEY,
  ANALYTICS_KEY,
};
