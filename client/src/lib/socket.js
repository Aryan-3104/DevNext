import { io } from 'socket.io-client';
import { useNotificationStore } from '../store/useNotificationStore';

let socket = null;

export function connectSocket(token) {
	if (!socket) {
		socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
			auth: { token },
		});

		socket.on('notification:new', (notif) => {
			useNotificationStore.getState().addLiveNotification(notif);
		});
	}
	return socket;
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}

export function getSocket() {
	return socket;
}
