import mongoose from 'mongoose';
import Community from '../models/Community.js';
import User from '../models/User.js';

export const createCommunity = async (req, res, next) => {
	try {
		const { name, description, avatar, rules } = req.body;

		if (!name || !description) {
			const error = new Error('Name and description are required');
			error.status = 400;
			return next(error);
		}

		// Create community with creator as first member and moderator
		const community = new Community({
			name,
			description,
			avatar: avatar || '',
			rules: rules || [],
			createdBy: req.user._id,
			members: [req.user._id],
			moderators: [req.user._id],
		});

		await community.save();

		// Add community to creator's communities list
		await User.updateOne(
			{ _id: req.user._id },
			{ $addToSet: { communities: community._id } },
		);

		return res.status(201).json(community);
	} catch (err) {
		return next(err);
	}
};

export const getCommunities = async (req, res, next) => {
	try {
		const limit = parseInt(req.query.limit, 10) || 20;
		const cursor = req.query.cursor;

		const query = {};
		if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
			query._id = { $gt: new mongoose.Types.ObjectId(cursor) };
		}

		// Fetch limit + 1 communities to determine if there's a next page
		const communities = await Community.find(query)
			.sort({ createdAt: -1 })
			.limit(limit + 1);

		let hasNextPage = false;
		let nextCursor = null;

		if (communities.length > limit) {
			hasNextPage = true;
			nextCursor = communities[limit - 1]._id;
		}

		const results = hasNextPage ? communities.slice(0, limit) : communities;

		return res.status(200).json({
			communities: results,
			nextCursor,
		});
	} catch (err) {
		return next(err);
	}
};

export const getCommunityBySlug = async (req, res, next) => {
	try {
		const community = await Community.findOne({ slug: req.params.slug });
		if (!community) {
			const error = new Error('Community not found');
			error.status = 404;
			return next(error);
		}

		const communityObj = community.toObject();
		communityObj.memberCount = community.members.length;

		return res.status(200).json(communityObj);
	} catch (err) {
		return next(err);
	}
};

export const joinCommunity = async (req, res, next) => {
	try {
		const community = await Community.findOne({ slug: req.params.slug });
		if (!community) {
			const error = new Error('Community not found');
			error.status = 404;
			return next(error);
		}

		await Community.updateOne(
			{ _id: community._id },
			{ $addToSet: { members: req.user._id } },
		);

		await User.updateOne(
			{ _id: req.user._id },
			{ $addToSet: { communities: community._id } },
		);

		return res.status(200).json({ message: 'Joined successfully' });
	} catch (err) {
		return next(err);
	}
};

export const leaveCommunity = async (req, res, next) => {
	try {
		const community = await Community.findOne({ slug: req.params.slug });
		if (!community) {
			const error = new Error('Community not found');
			error.status = 404;
			return next(error);
		}

		await Community.updateOne(
			{ _id: community._id },
			{ $pull: { members: req.user._id } },
		);

		await User.updateOne(
			{ _id: req.user._id },
			{ $pull: { communities: community._id } },
		);

		return res.status(200).json({ message: 'Left successfully' });
	} catch (err) {
		return next(err);
	}
};

export const deleteCommunity = async (req, res, next) => {
	try {
		const community = await Community.findOne({ slug: req.params.slug });
		if (!community) {
			const error = new Error('Community not found');
			error.status = 404;
			return next(error);
		}

		const isMod = community.moderators.some((modId) =>
			modId.equals(req.user._id),
		);
		if (!isMod) {
			const error = new Error('Not authorized to delete this community');
			error.status = 403;
			return next(error);
		}

		await Community.deleteOne({ _id: community._id });

		return res.status(200).json({ message: 'Community deleted' });
	} catch (err) {
		return next(err);
	}
};
