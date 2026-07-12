import Notification from '../models/Notification.js';

/**
 * GET /api/notifications
 * JWT required. Cursor-paginated list of notifications for the current user.
 */
export const getNotifications = async (req, res, next) => {
	try {
		const { cursor, limit: limitQuery } = req.query;
		const limit = Math.min(parseInt(limitQuery, 10) || 20, 50);

		const query = { recipient: req.user._id };
		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		// Fetch limit + 1 to determine if there is a next page
		const notifications = await Notification.find(query)
			.sort({ createdAt: -1 })
			.limit(limit + 1)
			.populate('actor', 'username avatar');

		let nextCursor = null;
		if (notifications.length > limit) {
			nextCursor = notifications[limit - 1].createdAt.toISOString();
		}

		const results = notifications.length > limit ? notifications.slice(0, limit) : notifications;
		
		return res.status(200).json({ notifications: results, nextCursor });
	} catch (err) {
		return next(err);
	}
};

/**
 * GET /api/notifications/unread-count
 * JWT required. Returns the total count of unread notifications for the user.
 */
export const getUnreadCount = async (req, res, next) => {
	try {
		const unreadCount = await Notification.countDocuments({ 
			recipient: req.user._id, 
			read: false 
		});

		return res.status(200).json({ unreadCount });
	} catch (err) {
		return next(err);
	}
};

/**
 * PATCH /api/notifications/:id/read
 * JWT required. Marks a specific notification as read.
 */
export const markAsRead = async (req, res, next) => {
	try {
		const { id } = req.params;

		// findOne with recipient ensures we only find notifications belonging to the requester.
		// If it doesn't exist or isn't theirs, we return a generic 404 to avoid leaking existence.
		const notification = await Notification.findOne({ _id: id, recipient: req.user._id });
		
		if (!notification) {
			const error = new Error('Notification not found');
			error.status = 404;
			return next(error);
		}

		notification.read = true;
		await notification.save();

		return res.status(200).json(notification);
	} catch (err) {
		return next(err);
	}
};

/**
 * PATCH /api/notifications/read-all
 * JWT required. Marks all unread notifications for the user as read.
 */
export const markAllAsRead = async (req, res, next) => {
	try {
		const result = await Notification.updateMany(
			{ recipient: req.user._id, read: false },
			{ $set: { read: true } }
		);

		return res.status(200).json({ modifiedCount: result.modifiedCount });
	} catch (err) {
		return next(err);
	}
};
