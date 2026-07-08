import mongoose from 'mongoose';
import Community from '../models/Community.js';

export const requireMembership = async (req, res, next) => {
	try {
		const slug = req.params.slug || req.body.communitySlug || req.body.community;

		if (!slug) {
			const error = new Error('Community slug or ID is required');
			error.status = 400;
			return next(error);
		}

		let community;
		if (mongoose.Types.ObjectId.isValid(slug)) {
			community = await Community.findById(slug);
		} else {
			community = await Community.findOne({ slug });
		}

		if (!community) {
			const error = new Error('Community not found');
			error.status = 404;
			return next(error);
		}

		const isMember = community.members.some(
			(id) => id.toString() === req.user._id.toString(),
		);

		if (!isMember) {
			const error = new Error('Join the community to post');
			error.status = 403;
			return next(error);
		}

		req.community = community;
		return next();
	} catch (err) {
		return next(err);
	}
};
