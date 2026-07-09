import redis from '../config/redis.js';
import { computeHotScore } from './hotScore.js';

/**
 * Fire-and-forget: update Redis hot-feed sorted sets for a post.
 * Never throws — Redis failures are logged but don't break callers.
 *
 * @param {string} postId         – the post's _id as a string
 * @param {number} score          – the post's current net score
 * @param {Date|string} createdAt – the post's creation timestamp
 * @param {string} communitySlug  – the community's slug
 */
export function updateHotFeed(postId, score, createdAt, communitySlug) {
	try {
		const hot = computeHotScore(score, createdAt);
		const id = postId.toString();

		// Fire both ZADDs concurrently — don't await, don't block the caller
		Promise.all([
			redis.zadd('feed:hot:global', hot, id),
			redis.zadd(`feed:hot:community:${communitySlug}`, hot, id),
		]).catch((err) => {
			console.error('Redis ZADD failed (non-fatal):', err.message);
		});
	} catch (err) {
		// Guard against synchronous errors (e.g. computeHotScore with bad input)
		console.error('updateHotFeed error (non-fatal):', err.message);
	}
}
