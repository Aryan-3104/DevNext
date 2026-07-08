import User from '../models/User.js';

/**
 * Atomic vote helper shared by Post and Comment controllers.
 *
 * @param {Model}    Model      – Mongoose model (Post or Comment)
 * @param {ObjectId} docId      – document to vote on
 * @param {ObjectId} voterId    – user casting the vote
 * @param {'up'|'down'} dir     – desired vote direction
 * @returns {Promise<document>} – the updated document (no population)
 *
 * Four transitions handled atomically:
 *   none  → up    : +1 up, +1 score,  add to upvoters
 *   up    → none  : -1 up, -1 score,  remove from upvoters
 *   up    → down  : -1 up, +1 down, -2 score, move between arrays
 *   none  → down  : +1 down, -1 score, add to downvoters
 *   down  → none  : -1 down, +1 score, remove from downvoters
 *   down  → up    : +1 up, -1 down, +2 score, move between arrays
 */
export async function applyVote(Model, docId, voterId, dir) {
	// Fast membership check — projection only
	const doc = await Model.findById(docId).select('upvoters downvoters author');
	if (!doc) return null;

	const alreadyUp   = doc.upvoters.some((id) => id.toString() === voterId.toString());
	const alreadyDown = doc.downvoters.some((id) => id.toString() === voterId.toString());

	let update;
	let karmaChange = 0; // delta to apply to the content author's karma

	if (dir === 'up') {
		if (alreadyUp) {
			// Toggle off: remove upvote
			update = {
				$pull: { upvoters: voterId },
				$inc: { upvotes: -1, score: -1 },
			};
			karmaChange = -1;
		} else if (alreadyDown) {
			// Switch from down to up
			update = {
				$pull:    { downvoters: voterId },
				$addToSet: { upvoters: voterId },
				$inc: { upvotes: 1, downvotes: -1, score: 2 },
			};
			karmaChange = 2;
		} else {
			// Fresh upvote
			update = {
				$addToSet: { upvoters: voterId },
				$inc: { upvotes: 1, score: 1 },
			};
			karmaChange = 1;
		}
	} else {
		// dir === 'down'
		if (alreadyDown) {
			// Toggle off: remove downvote
			update = {
				$pull: { downvoters: voterId },
				$inc: { downvotes: -1, score: 1 },
			};
			karmaChange = 1;
		} else if (alreadyUp) {
			// Switch from up to down
			update = {
				$pull:    { upvoters: voterId },
				$addToSet: { downvoters: voterId },
				$inc: { upvotes: -1, downvotes: 1, score: -2 },
			};
			karmaChange = -2;
		} else {
			// Fresh downvote
			update = {
				$addToSet: { downvoters: voterId },
				$inc: { downvotes: 1, score: -1 },
			};
			karmaChange = -1;
		}
	}

	const updated = await Model.findByIdAndUpdate(docId, update, { new: true });

	// Side-effect: update content author's karma (best-effort, no transaction)
	if (karmaChange !== 0 && doc.author) {
		await User.updateOne(
			{ _id: doc.author },
			{ $inc: { karma: karmaChange } },
		);
	}

	return updated;
}

/**
 * Derive the current user's vote state from a document.
 * Returns 'up' | 'down' | null
 */
export function currentVoteState(doc, userId) {
	if (!doc || !userId) return null;
	const id = userId.toString();
	if (doc.upvoters?.some((v) => v.toString() === id)) return 'up';
	if (doc.downvoters?.some((v) => v.toString() === id)) return 'down';
	return null;
}
