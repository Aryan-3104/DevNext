import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import { applyVote, currentVoteState } from '../utils/vote.js';
import { updateHotFeed } from '../utils/updateHotFeed.js';
import redis from '../config/redis.js';


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

		// Fire-and-forget: seed the hot feed with this new post (score=0, pure time-based)
		updateHotFeed(post._id, 0, post.createdAt, community.slug);

		return res.status(201).json(populatedPost);
	} catch (err) {
		return next(err);
	}
};

export const getPosts = async (req, res, next) => {
	try {
		const {
			community: communitySlug,
			limit: limitQuery,
			cursor,
			sort = 'new',
		} = req.query;
		const limit = parseInt(limitQuery, 10) || 10;

		// Resolve community ObjectId if filtered by slug
		let communityDoc = null;
		if (communitySlug) {
			communityDoc = await Community.findOne({ slug: communitySlug });
			if (!communityDoc) {
				return res.status(200).json({ posts: [], nextCursor: null });
			}
		}

		// ── sort=new (unchanged from Week 2) ──
		if (sort === 'new') {
			const query = {};
			if (communityDoc) query.community = communityDoc._id;
			if (cursor) query.createdAt = { $lt: new Date(cursor) };

			const posts = await Post.find(query)
				.sort({ createdAt: -1 })
				.limit(limit + 1)
				.populate('author', 'username avatar karma')
				.populate('community', 'name slug');

			let nextCursor = null;
			if (posts.length > limit) {
				nextCursor = posts[limit - 1].createdAt.toISOString();
			}

			const results = posts.length > limit ? posts.slice(0, limit) : posts;
			return res.status(200).json({ posts: results, nextCursor });
		}

		// ── sort=hot ──
		if (sort === 'hot') {
			const offset = parseInt(cursor, 10) || 0;

			// Try Redis first
			if (redis.status === 'ready') {
				try {
					const key = communitySlug
						? `feed:hot:community:${communitySlug}`
						: 'feed:hot:global';

					// ZREVRANGE: highest score first; fetch limit+1 to detect next page
					const ids = await redis.zrevrange(key, offset, offset + limit);

					if (ids.length === 0) {
						return res.status(200).json({ posts: [], nextCursor: null });
					}

					const hasNextPage = ids.length > limit;
					const pageIds = hasNextPage ? ids.slice(0, limit) : ids;

					// Fetch full documents from Mongo
					const posts = await Post.find({ _id: { $in: pageIds } })
						.populate('author', 'username avatar karma')
						.populate('community', 'name slug');

					// Re-sort to match Redis's rank order (Mongo $in doesn't preserve order)
					const order = new Map(pageIds.map((id, i) => [id, i]));
					posts.sort((a, b) => order.get(a._id.toString()) - order.get(b._id.toString()));

					const nextCursor = hasNextPage ? String(offset + limit) : null;
					return res.status(200).json({ posts, nextCursor });
				} catch (redisErr) {
					console.error('Redis hot feed read failed, falling back to Mongo:', redisErr.message);
					// Fall through to Mongo aggregation below
				}
			}

			// Fallback: approximate hot ranking directly in Mongo when Redis is down
			const matchStage = {};
			if (communityDoc) matchStage.community = communityDoc._id;

			const pipeline = [
				{ $match: matchStage },
				{ $addFields: {
					ageInHours: { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 3600000] },
				}},
				{ $addFields: {
					// sign(score): 1 if positive, -1 if negative, 0 if zero
					scoreSign: { $cond: [
						{ $gt: ['$score', 0] }, 1,
						{ $cond: [{ $lt: ['$score', 0] }, -1, 0] },
					]},
				}},
				{ $addFields: {
					hotScoreApprox: { $subtract: [
						{ $multiply: [
							'$scoreSign',
							{ $log10: { $max: [{ $abs: '$score' }, 1] } },
						]},
						{ $divide: ['$ageInHours', 12.5] },
					]},
				}},
				{ $sort: { hotScoreApprox: -1 } },
				{ $skip: offset },
				{ $limit: limit + 1 },
			];

			const rawPosts = await Post.aggregate(pipeline);

			const hasNextPage = rawPosts.length > limit;
			const pageRaw = hasNextPage ? rawPosts.slice(0, limit) : rawPosts;

			// Aggregate returns plain objects — populate via a second query
			const postIds = pageRaw.map((p) => p._id);
			const posts = await Post.find({ _id: { $in: postIds } })
				.populate('author', 'username avatar karma')
				.populate('community', 'name slug');

			// Preserve aggregation sort order
			const order = new Map(postIds.map((id, i) => [id.toString(), i]));
			posts.sort((a, b) => order.get(a._id.toString()) - order.get(b._id.toString()));

			const nextCursor = hasNextPage ? String(offset + limit) : null;
			return res.status(200).json({ posts, nextCursor });
		}

		// Unknown sort value — fall back to new
		return res.status(400).json({ message: "sort must be 'new' or 'hot'" });
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

		// Fire-and-forget: update hot feed sorted sets in Redis.
		// `updated` from applyVote's findByIdAndUpdate already carries createdAt
		// and community (ObjectId) — no need to re-fetch the Post.
		Community.findById(updated.community).select('slug').lean().then((comm) => {
			if (comm?.slug) {
				updateHotFeed(id, updated.score, updated.createdAt, comm.slug);
			}
		}).catch((err) => {
			console.error('Hot feed community lookup failed (non-fatal):', err.message);
		});

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
