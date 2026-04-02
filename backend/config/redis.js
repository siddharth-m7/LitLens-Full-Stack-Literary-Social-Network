const Redis = require('ioredis');
const logger = require('./logger');

const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

client.on('connect', () => logger.info('Redis connected'));
client.on('error', (err) => logger.error({ err }, 'Redis error'));

client.connect().catch(() => {}); // non-fatal if Redis is down

module.exports = client;
