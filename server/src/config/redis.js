import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
	maxRetriesPerRequest: 2,
	retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
	lazyConnect: false,
});

redis.on('error', (err) => {
	console.error('Redis connection error (falling back to Mongo for hot feed):', err.message);
});

export default redis;
