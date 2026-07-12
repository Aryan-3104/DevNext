import Notification from '../models/Notification.js';

export const createNotification = async ({ io, recipient, actor, type, post, comment }) => {
	// Self-notification guard
	if (String(recipient) === String(actor)) {
		return undefined;
	}

	const newNotification = await Notification.create({
		recipient,
		actor,
		type,
		post,
		comment,
	});

	const populatedDoc = await newNotification.populate('actor', 'username avatar');

	if (io) {
		try {
			io.to(`user:${recipient}`).emit('notification:new', populatedDoc);
		} catch (err) {
			console.error('Failed to emit notification socket event:', err);
		}
	}

	return populatedDoc;
};
