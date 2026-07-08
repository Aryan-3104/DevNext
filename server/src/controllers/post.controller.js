import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import { applyVote, currentVoteState } from '../utils/vote.js';


export const createPost = async (req, res, next) => {
	try {
		const { title, body, codeBlocks, tags } = req.body;
		const community = req.community; // Populated by requireMembership
		const authorId = req.user._id;

		if (!title) {
			const error = new Error('Title is required');
			error.status = 400;
			return next(error);
		}

		const post = new Post({
			title,
			body,
			codeBlocks: codeBlocks || [],
			tags: tags || [],
			author: authorId,
			community: community._id,
		});

		await post.save();

		// Increment postCount on the community
		await Community.updateOne(
			{ _id: community._id },
			{ $inc: { postCount: 1 } },
		);

		// Populate author and community on response
		const populatedPost = await Post.findById(post._id)
			.populate('author', 'username avatar')
			.populate('community', 'name slug');

		return res.status(201).json(populatedPost);
	} catch (err) {
		return next(err);
	}
};

export const getPosts = async (req, res, next) => {
	try {
		const { community: communitySlug, limit: limitQuery, cursor } = req.query;
		const limit = parseInt(limitQuery, 10) || 10;

		const query = {};

		if (communitySlug) {
			const community = await Community.findOne({ slug: communitySlug });
			if (!community) {
				return res.status(200).json({ posts: [], nextCursor: null });
			}
			query.community = community._id;
		}

		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		// Fetch limit + 1 posts
		const posts = await Post.find(query)
			.sort({ createdAt: -1 })
			.limit(limit + 1)
			.populate('author', 'username avatar karma')
			.populate('community', 'name slug');

		let hasNextPage = false;
		let nextCursor = null;

		if (posts.length > limit) {
			hasNextPage = true;
			nextCursor = posts[limit - 1].createdAt.toISOString();
		}

		const results = hasNextPage ? posts.slice(0, limit) : posts;

		return res.status(200).json({
			posts: results,
			nextCursor,
		});
	} catch (err) {
		return next(err);
	}
};

export const getPostById = async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		const post = await Post.findById(id)
			.populate('author', 'username avatar karma githubUsername')
			.populate('community', 'name slug description moderators');

		if (!post) {

			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		return res.status(200).json(post);
	} catch (err) {
		return next(err);
	}
};

export const deletePost = async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		const post = await Post.findById(id);
		if (!post) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		const community = await Community.findById(post.community);
		const isAuthor = post.author.toString() === req.user._id.toString();
		const isMod = community
			? community.moderators.some(
					(modId) => modId.toString() === req.user._id.toString(),
				)
			: false;

		if (!isAuthor && !isMod) {
			const error = new Error('Not authorized to delete this post');
			error.status = 403;
			return next(error);
		}

		await Post.deleteOne({ _id: post._id });

		// Decrement postCount on community
		if (community) {
			await Community.updateOne(
				{ _id: community._id },
				{ $inc: { postCount: -1 } },
			);
		}

		return res.status(200).json({ message: 'Post deleted' });
	} catch (err) {
		return next(err);
	}
};

export const updatePost = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { title, body, codeBlocks, tags } = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		const post = await Post.findById(id);
		if (!post) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		const isAuthor = post.author.toString() === req.user._id.toString();
		if (!isAuthor) {
			const error = new Error('Not authorized to edit this post');
			error.status = 403;
			return next(error);
		}

		if (title !== undefined) post.title = title;
		if (body !== undefined) post.body = body;
		if (codeBlocks !== undefined) post.codeBlocks = codeBlocks;
		if (tags !== undefined) post.tags = tags;

		await post.save();

		const populatedPost = await Post.findById(post._id)
			.populate('author', 'username avatar karma')
			.populate('community', 'name slug');

		return res.status(200).json(populatedPost);
	} catch (err) {
		return next(err);
	}
};

/**
 * POST /api/posts/:id/vote
 * JWT required. Body: { dir: 'up' | 'down' }
 */
export const voteOnPost = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { dir } = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

		if (dir !== 'up' && dir !== 'down') {
			const error = new Error("dir must be 'up' or 'down'");
			error.status = 400;
			return next(error);
		}

		const updated = await applyVote(Post, id, req.user._id, dir);
		if (!updated) {
			const error = new Error('Post not found');
			error.status = 404;
			return next(error);
		}

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
