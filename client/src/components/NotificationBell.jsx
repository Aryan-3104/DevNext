import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';

export default function NotificationBell() {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [hasOpened, setHasOpened] = useState(false);
	const dropdownRef = useRef(null);

	const {
		notifications,
		unreadCount,
		isLoading,
		fetchNotifications,
		fetchUnreadCount,
		markAsRead,
		markAllAsRead
	} = useNotificationStore();

	useEffect(() => {
		fetchUnreadCount();
	}, [fetchUnreadCount]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const toggleDropdown = () => {
		if (!isOpen && !hasOpened) {
			fetchNotifications(true);
			setHasOpened(true);
		}
		setIsOpen(!isOpen);
	};

	const handleNotificationClick = (notif) => {
		markAsRead(notif._id);
		setIsOpen(false);

		const postId = notif.post?._id || notif.post;
		if (postId) {
			navigate(`/post/${postId}`);
		}
	};

	const getNotificationText = (notif) => {
		const username = notif.actor?.username || 'Someone';
		switch (notif.type) {
			case 'post_reply':
				return `${username} replied to your post`;
			case 'comment_reply':
				return `${username} replied to your comment`;
			case 'upvote_milestone':
				return `Your post reached a new milestone`;
			default:
				return `New notification from ${username}`;
		}
	};

	return (
		<div style={{ position: 'relative' }} ref={dropdownRef}>
			<button
				onClick={toggleDropdown}
				style={{
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					position: 'relative',
					padding: '0.4rem',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'var(--text-primary)',
				}}
				title="Notifications"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
					<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
				</svg>

				{unreadCount > 0 && (
					<span
						style={{
							position: 'absolute',
							top: 0,
							right: 0,
							background: '#ef4444',
							color: 'white',
							fontSize: '0.65rem',
							fontWeight: 'bold',
							padding: '0.1rem 0.3rem',
							borderRadius: '10px',
							minWidth: '16px',
							textAlign: 'center',
						}}
					>
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div
					className="glass"
					style={{
						position: 'absolute',
						top: '100%',
						right: '-10px',
						width: '320px',
						maxHeight: '400px',
						overflowY: 'auto',
						marginTop: '0.5rem',
						borderRadius: '12px',
						border: '1px solid var(--border-color)',
						background: 'var(--bg-secondary)',
						boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
						zIndex: 50,
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '0.75rem 1rem',
							borderBottom: '1px solid var(--border-color)',
						}}
					>
						<h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Notifications</h3>
						{unreadCount > 0 && (
							<button
								onClick={() => markAllAsRead()}
								style={{
									background: 'transparent',
									border: 'none',
									color: 'var(--primary)',
									fontSize: '0.8rem',
									cursor: 'pointer',
								}}
							>
								Mark all as read
							</button>
						)}
					</div>

					{isLoading && notifications.length === 0 ? (
						<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
							Loading...
						</div>
					) : notifications.length === 0 ? (
						<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
							No notifications yet
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column' }}>
							{notifications.map((notif) => (
								<div
									key={notif._id}
									onClick={() => handleNotificationClick(notif)}
									style={{
										padding: '0.75rem 1rem',
										borderBottom: '1px solid var(--border-color)',
										cursor: 'pointer',
										background: notif.read ? 'transparent' : 'rgba(255,255,255,0.05)',
										display: 'flex',
										gap: '0.75rem',
										alignItems: 'flex-start',
										transition: 'background var(--transition-fast)',
									}}
									onMouseEnter={(e) => {
										if (notif.read) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
									}}
									onMouseLeave={(e) => {
										if (notif.read) e.currentTarget.style.background = 'transparent';
									}}
								>
									{!notif.read && (
										<div
											style={{
												width: '8px',
												height: '8px',
												borderRadius: '50%',
												background: 'var(--primary)',
												marginTop: '6px',
												flexShrink: 0,
											}}
										/>
									)}
									<div style={{ flex: 1 }}>
										<div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
											{getNotificationText(notif)}
										</div>
										<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
											{new Date(notif.createdAt).toLocaleDateString()}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
