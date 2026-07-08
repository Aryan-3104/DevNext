import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			const error = new Error('Not authenticated');
			error.status = 401;
			return next(error);
		}

		const token = authHeader.split(' ')[1];
		if (!token) {
			const error = new Error('Not authenticated');
			error.status = 401;
			return next(error);
		}

		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
		} catch (err) {
			const error = new Error('Invalid or expired token');
			error.status = 401;
			return next(error);
		}

		const userId = decoded.userId || decoded.id || decoded._id;
		if (!userId) {
			const error = new Error('Invalid or expired token');
			error.status = 401;
			return next(error);
		}

		const user = await User.findById(userId).select('-passwordHash');
		if (!user) {
			const error = new Error('Not authenticated');
			error.status = 401;
			return next(error);
		}

		req.user = user;
		next();
	} catch (err) {
		next(err);
	}
};
