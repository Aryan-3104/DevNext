/**
 * Hot-ranking score for posts (Week 4 PRD §2.1).
 *
 * Formula:
 *   hotScore = sign(score) * log10(max(|score|, 1))
 *            + (createdAtEpochSeconds - REFERENCE_EPOCH) / 45000
 *
 * - log10 compresses score so 1→10 matters more than 1000→1010
 * - sign preserves downvoted posts ranking below neutral
 * - time term adds ~1 point every 12.5 hours, ensuring freshness
 * - REFERENCE_EPOCH is arbitrary (only relative differences matter)
 */

// Fixed reference point — DevNest "launch" date (2025-01-01T00:00:00Z).
// The exact value doesn't affect ranking since only differences matter.
const REFERENCE_EPOCH = Math.floor(new Date('2025-01-01T00:00:00Z').getTime() / 1000);

/**
 * @param {number} score    – net vote score (upvotes - downvotes)
 * @param {Date|string|number} createdAt – post creation timestamp
 * @returns {number} hotScore value for Redis ZADD
 */
export function computeHotScore(score, createdAt) {
	const s = Number(score) || 0;
	const createdAtEpochSeconds = Math.floor(new Date(createdAt).getTime() / 1000);

	const order = Math.log10(Math.max(Math.abs(s), 1));
	const sign = s > 0 ? 1 : s < 0 ? -1 : 0;
	const timeTerm = (createdAtEpochSeconds - REFERENCE_EPOCH) / 45000;

	return sign * order + timeTerm;
}
