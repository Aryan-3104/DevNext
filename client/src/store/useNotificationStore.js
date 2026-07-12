import { create } from 'zustand';
import api from '../lib/axios';

export const useNotificationStore = create((set, get) => ({
	notifications: [],
	unreadCount: 0,
	cursor: null,
	hasMore: true,
	isLoading: false,

	fetchNotifications: async (reset = false) => {
		const { cursor, hasMore, isLoading } = get();
		if (isLoading || (!reset && !hasMore)) return;

		set({ isLoading: true });
		if (reset) {
			set({ notifications: [], cursor: null, hasMore: true });
		}

		try {
			const currentCursor = reset ? null : cursor;
			const params = currentCursor ? { cursor: currentCursor } : {};
			const res = await api.get('/notifications', { params });
			const { notifications: fetchedNotifications, nextCursor } = res.data;

			set((state) => ({
				notifications: reset ? fetchedNotifications : [...state.notifications, ...fetchedNotifications],
				cursor: nextCursor,
				hasMore: nextCursor !== null,
			}));
		} catch (error) {
			console.error('Failed to fetch notifications:', error);
		} finally {
			set({ isLoading: false });
		}
	},

	fetchUnreadCount: async () => {
		try {
			const res = await api.get('/notifications/unread-count');
			set({ unreadCount: res.data.unreadCount || 0 });
		} catch (error) {
			console.error('Failed to fetch unread count:', error);
		}
	},

	addLiveNotification: (notif) => {
		set((state) => ({
			notifications: [notif, ...state.notifications],
			unreadCount: state.unreadCount + 1,
		}));
	},

	markAsRead: async (id) => {
		const state = get();
		const notifToUpdate = state.notifications.find((n) => n._id === id);
		
		if (!notifToUpdate || notifToUpdate.read) return;

		// Optimistic update
		const prevNotifications = [...state.notifications];
		const prevUnreadCount = state.unreadCount;

		set((state) => ({
			notifications: state.notifications.map((n) =>
				n._id === id ? { ...n, read: true } : n
			),
			unreadCount: Math.max(0, state.unreadCount - 1),
		}));

		try {
			await api.patch(`/notifications/${id}/read`);
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
			// Revert on failure
			set({
				notifications: prevNotifications,
				unreadCount: prevUnreadCount,
			});
		}
	},

	markAllAsRead: async () => {
		const state = get();
		if (state.unreadCount === 0) return;

		// Optimistic update
		const prevNotifications = [...state.notifications];
		const prevUnreadCount = state.unreadCount;

		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, read: true })),
			unreadCount: 0,
		}));

		try {
			await api.patch('/notifications/read-all');
		} catch (error) {
			console.error('Failed to mark all notifications as read:', error);
			// Revert on failure
			set({
				notifications: prevNotifications,
				unreadCount: prevUnreadCount,
			});
		}
	},

	reset: () => {
		set({
			notifications: [],
			unreadCount: 0,
			cursor: null,
			hasMore: true,
			isLoading: false,
		});
	},
}));
