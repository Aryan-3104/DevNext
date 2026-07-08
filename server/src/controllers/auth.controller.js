import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sanitizeUser = (user) => {
	const userObject = user.toObject ? user.toObject() : { ...user };
	delete userObject.passwordHash;
	return userObject;
};

const signToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

export const register = async (req, res, next) => {
	try {
		const { username, email, password } = req.body;

		if (!username || !email || !password) {
			const error = new Error('username, email, and password are required');
			error.status = 400;
			return next(error);
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({
			username,
			email,
			passwordHash,
		});

		const token = signToken(user._id.toString());

		return res.status(201).json({
			user: sanitizeUser(user),
			token,
		});
	} catch (error) {
		return next(error);
	}
};

export const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });

		if (!user || !user.passwordHash) {
			const error = new Error('Invalid credentials');
			error.status = 401;
			return next(error);
		}

		const isMatch = await user.comparePassword(password);

		if (!isMatch) {
			const error = new Error('Invalid credentials');
			error.status = 401;
			return next(error);
		}

		const token = signToken(user._id.toString());

		return res.status(200).json({
			user: sanitizeUser(user),
			token,
		});
	} catch (error) {
		return next(error);
	}
};
