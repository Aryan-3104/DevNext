import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

export const getMe = (req, res) => {
	return res.status(200).json(req.user);
};

// a) getProfile(req, res, next)
export const getProfile = async (req, res, next) => {
	try {
		const { username } = req.params;
		const user = await User.findOne({ username }).select(
			'username avatar bio location githubUsername pinnedRepos karma createdAt'
		);

		if (!user) {
			const error = new Error('User not found');
			error.status = 404;
			return next(error);
		}

		const [postCount, commentCount] = await Promise.all([
			Post.countDocuments({ author: user._id }),
			Comment.countDocuments({ author: user._id, isDeleted: false }),
		]);

		return res.status(200).json({ user, postCount, commentCount });
	} catch (error) {
		return next(error);
	}
};

// b) updateProfile(req, res, next)
export const updateProfile = async (req, res, next) => {
	try {
		const { bio, location } = req.body;
		const updateData = {};
		if (bio !== undefined) updateData.bio = bio;
		if (location !== undefined) updateData.location = location;

		const user = await User.findByIdAndUpdate(
			req.user._id,
			updateData,
			{ new: true, runValidators: true }
		).select('username avatar bio location');

		if (!user) {
			const error = new Error('User not found');
			error.status = 404;
			return next(error);
		}

		return res.status(200).json({ user });
	} catch (error) {
		return next(error);
	}
};

// c) getKarmaBreakdown(req, res, next)
export const getKarmaBreakdown = async (req, res, next) => {
	try {
		const { username } = req.params;
		const user = await User.findOne({ username });
		if (!user) {
			const error = new Error('User not found');
			error.status = 404;
			return next(error);
		}

		const [postKarmaResult, commentKarmaResult] = await Promise.all([
			Post.aggregate([
				{ $match: { author: user._id } },
				{ $group: { _id: null, postKarma: { $sum: '$score' } } }
			]),
			Comment.aggregate([
				{ $match: { author: user._id, isDeleted: false } },
				{ $group: { _id: null, commentKarma: { $sum: '$score' } } }
			])
		]);

		const postKarma = postKarmaResult.length > 0 ? postKarmaResult[0].postKarma : 0;
		const commentKarma = commentKarmaResult.length > 0 ? commentKarmaResult[0].commentKarma : 0;
		const totalKarma = postKarma + commentKarma;

		return res.status(200).json({
			postKarma,
			commentKarma,
			totalKarma
		});
	} catch (error) {
		return next(error);
	}
};

// d) getUserPosts(req, res, next)
export const getUserPosts = async (req, res, next) => {
	try {
		const { username } = req.params;
		const user = await User.findOne({ username });
		if (!user) {
			const error = new Error('User not found');
			error.status = 404;
			return next(error);
		}

		const limit = Math.min(parseInt(req.query.limit) || 20, 50);
		const cursor = req.query.cursor;

		const query = { author: user._id };
		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		const posts = await Post.find(query)
			.sort({ createdAt: -1 })
			.limit(limit + 1)
			.populate('community', 'name slug')
			.populate('author', 'username avatar');

		let nextCursor = null;
		if (posts.length > limit) {
			nextCursor = posts[limit - 1].createdAt.toISOString();
		}

		const results = posts.slice(0, limit);
		return res.status(200).json({ posts: results, nextCursor });
	} catch (error) {
		return next(error);
	}
};

// getUserComments(req, res, next)
export const getUserComments = async (req, res, next) => {
	try {
		const { username } = req.params;
		const user = await User.findOne({ username });
		if (!user) {
			const error = new Error('User not found');
			error.status = 404;
			return next(error);
		}

		const limit = Math.min(parseInt(req.query.limit) || 20, 50);
		const cursor = req.query.cursor;

		const query = { author: user._id, isDeleted: false };
		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		const comments = await Comment.find(query)
			.sort({ createdAt: -1 })
			.limit(limit + 1)
			.populate('post', 'title')
			.populate('author', 'username avatar');

		let nextCursor = null;
		if (comments.length > limit) {
			nextCursor = comments[limit - 1].createdAt.toISOString();
		}

		const results = comments.slice(0, limit);
		return res.status(200).json({ comments: results, nextCursor });
	} catch (error) {
		return next(error);
	}
};
