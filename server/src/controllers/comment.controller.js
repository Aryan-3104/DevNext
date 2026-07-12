import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import { applyVote, currentVoteState } from '../utils/vote.js';
import { createNotification } from '../utils/createNotification.js';

/**
 * POST /api/posts/:postId/comments
 * JWT required (protect middleware).
 * Body: { body, parentComment? }
 */
export const createComment = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const { body, parentComment: parentCommentId } = req.body;
		const authorId = req.user._id;

		// Validate postId
		if (!mongoose.Types.ObjectId.isValid(postId)) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		// Verify post exists
		const post = await Post.findById(postId);
		if (!post) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		// Require comment body
		if (!body || body.trim().length === 0) {
			const error = new Error('Comment body is required');
			error.status = 400;
			return next(error);
		}

		let path;
		let depth = 0;
		let parentComment = null;

		if (parentCommentId) {
			// Validate parentComment ObjectId format
			if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
				const error = new Error('Invalid parentComment id');
				error.status = 400;
				return next(error);
			}

			// Fetch the parent and verify it belongs to the same post
			const parent = await Comment.findById(parentCommentId);
			if (!parent) {
				const error = new Error('Parent comment not found');
				error.status = 404;
				return next(error);
			}

			if (parent.post.toString() !== postId) {
				const error = new Error(
					'Parent comment does not belong to this post',
				);
				error.status = 400;
				return next(error);
			}

			parentComment = parent._id;
			depth = parent.depth + 1;
			// Path will be extended after we know the new comment's _id
			// We create the document first with a placeholder then update
			const newComment = new Comment({
				post: postId,
				author: authorId,
				body: body.trim(),
				parentComment,
				depth,
				// Temporary path — will be set below
				path: parent.path,
			});

			// Set proper path: parentPath + "." + newComment._id
			newComment.path = `${parent.path}.${newComment._id}`;
			await newComment.save();

			// Increment commentCount on post
			await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

			createNotification({
				io: req.app.get('io'),
				recipient: parent.author,
				actor: req.user._id,
				type: 'comment_reply',
				post: postId,
				comment: newComment._id,
			}).catch((err) => {
				console.error('Failed to create comment_reply notification:', err);
			});

			const populated = await Comment.findById(newComment._id)
				.populate('author', 'username avatar')
				.populate('parentComment', '_id body author');

			return res.status(201).json(populated);
		}

		// Root comment: path === own _id string
		const newComment = new Comment({
			post: postId,
			author: authorId,
			body: body.trim(),
			parentComment: null,
			depth: 0,
			path: 'placeholder', // replaced below
		});

		newComment.path = newComment._id.toString();
		await newComment.save();

		// Increment commentCount on post
		await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

		createNotification({
			io: req.app.get('io'),
			recipient: post.author,
			actor: req.user._id,
			type: 'post_reply',
			post: postId,
			comment: newComment._id,
		}).catch((err) => {
			console.error('Failed to create post_reply notification:', err);
		});

		const populated = await Comment.findById(newComment._id).populate(
			'author',
			'username avatar',
		);

		return res.status(201).json(populated);
	} catch (err) {
		return next(err);
	}
};

/**
 * GET /api/posts/:postId/comments
 * Public. Returns all comments for a post sorted by materialized path
 * (lexicographic order preserves tree structure for the client).
 */
export const getComments = async (req, res, next) => {
	try {
		const { postId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(postId)) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		const post = await Post.findById(postId).select('_id');
		if (!post) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		const comments = await Comment.find({ post: postId, isDeleted: false })
			.sort({ path: 1 })
			.populate('author', 'username avatar karma')
			.populate('parentComment', '_id');

		return res.status(200).json({ comments });
	} catch (err) {
		return next(err);
	}
};

/**
 * POST /api/posts/:postId/comments/:commentId/vote
 * JWT required. Body: { dir: 'up' | 'down' }
 */
export const voteOnComment = async (req, res, next) => {
	try {
		const { postId, commentId } = req.params;
		const { dir } = req.body;

		if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
			const error = new Error('Comment not found');
			error.status = 404;
			return next(error);
		}

		if (dir !== 'up' && dir !== 'down') {
			const error = new Error("dir must be 'up' or 'down'");
			error.status = 400;
			return next(error);
		}

		// Verify comment belongs to the post
		const comment = await Comment.findOne({ _id: commentId, post: postId });
		if (!comment) {
			const error = new Error('Comment not found');
			error.status = 404;
			return next(error);
		}

		const updated = await applyVote(Comment, commentId, req.user._id, dir);

		return res.status(200).json({
			upvotes: updated.upvotes,
			downvotes: updated.downvotes,
			score: updated.score,
			currentVote: currentVoteState(updated, req.user._id),
		});
	} catch (err) {
		return next(err);
	}
};

/**
 * DELETE /api/posts/:postId/comments/:commentId
 * JWT required. Soft-delete only: blanks body, sets isDeleted.
 * Hard-delete is intentionally avoided because removing a comment with
 * replies would orphan all descendant paths in the materialized-path tree.
 */
export const deleteComment = async (req, res, next) => {
	try {
		const { postId, commentId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
			const error = new Error('Comment not found');
			error.status = 404;
			return next(error);
		}

		const comment = await Comment.findOne({ _id: commentId, post: postId });
		if (!comment) {
			const error = new Error('Comment not found');
			error.status = 404;
			return next(error);
		}

		const isAuthor = comment.author.toString() === req.user._id.toString();
		let isMod = false;
		
		if (!isAuthor) {
			const post = await Post.findById(postId);
			if (post) {
				const community = await Community.findById(post.community);
				if (community) {
					isMod = community.moderators.some(
						(modId) => modId.toString() === req.user._id.toString()
					);
				}
			}
		}

		if (!isAuthor && !isMod) {
			const error = new Error('Not authorized to delete this comment');
			error.status = 403;
			return next(error);
		}

		comment.body = '[deleted]';
		comment.isDeleted = true;
		await comment.save();

		return res.status(200).json({ message: 'Comment deleted' });
	} catch (err) {
		return next(err);
	}
};
