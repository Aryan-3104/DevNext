import mongoose from 'mongoose';

/**
 * Materialized-path comment model (Week 3 PRD §2.1).
 *
 * path    – dot-separated ancestor ObjectId chain ending with this comment's
 *           own _id, e.g. "rootId.childId.grandChildId".
 *           Root comments: path === own _id string.
 * depth   – 0-based nesting level (root = 0).
 * parentComment – null for root; ObjectId of the immediate parent.
 */
const commentSchema = new mongoose.Schema(
	{
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Post',
			required: true,
			index: true,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		body: {
			type: String,
			required: true,
			trim: true,
			maxlength: 10000,
		},
		parentComment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment',
			default: null,
		},
		// Materialized path — full ancestor chain including self
		path: {
			type: String,
			required: true,
			index: true,
		},
		depth: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		upvotes: {
			type: Number,
			default: 0,
		},
		downvotes: {
			type: Number,
			default: 0,
		},
		score: {
			type: Number,
			default: 0,
		},
		upvoters: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		downvoters: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// Compound index: fetch all comments for a post sorted by materialized path
commentSchema.index({ post: 1, path: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
