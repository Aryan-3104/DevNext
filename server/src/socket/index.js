import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export default function initSocket(httpServer) {
	const io = new Server(httpServer, {
		cors: {
			origin: process.env.CLIENT_URL || 'http://localhost:5173',
		},
	});

	io.use((socket, next) => {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error('No token'));
		}

		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			
			// This matches exactly what protect() in auth.js uses
			const userId = decoded.userId || decoded.id || decoded._id;
			if (!userId) {
				return next(new Error('Invalid token'));
			}

			socket.userId = userId;
			next();
		} catch (err) {
			return next(new Error('Invalid token'));
		}
	});

	io.on('connection', (socket) => {
		console.log(`Socket connected for user: ${socket.userId}`);
		
		// Join per-user room
		socket.join(`user:${socket.userId}`);

		socket.on('disconnect', () => {
			console.log(`Socket disconnected for user: ${socket.userId}`);
		});
	});

	return io;
}
