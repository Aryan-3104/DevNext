import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export default function CommunitiesPage() {
	const { user, token } = useAuthStore();
	const navigate = useNavigate();

	const [communities, setCommunities] = useState([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState({});
	const [error, setError] = useState('');

	useEffect(() => {
		if (!token) {
			navigate('/login');
			return;
		}

		const fetchCommunities = async () => {
			try {
				const response = await api.get('/communities?limit=100');
				setCommunities(response.data.communities);
			} catch (err) {
				console.error(err);
				setError('Failed to load communities.');
			} finally {
				setLoading(false);
			}
		};

		fetchCommunities();
	}, [token, navigate]);

	const handleJoinCommunity = async (slug) => {
		setActionLoading((prev) => ({ ...prev, [slug]: true }));
		try {
			await api.post(`/communities/${slug}/join`);
			// Refresh list
			const response = await api.get('/communities?limit=100');
			setCommunities(response.data.communities);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to join community.');
		} finally {
			setActionLoading((prev) => ({ ...prev, [slug]: false }));
		}
	};

	const handleLeaveCommunity = async (slug) => {
		setActionLoading((prev) => ({ ...prev, [slug]: true }));
		try {
			await api.post(`/communities/${slug}/leave`);
			// Refresh list
			const response = await api.get('/communities?limit=100');
			setCommunities(response.data.communities);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to leave community.');
		} finally {
			setActionLoading((prev) => ({ ...prev, [slug]: false }));
		}
	};

	if (loading) {
		return (
			<div className="loader-container">
				<div className="spinner"></div>
				<p style={{ color: 'var(--text-secondary)' }}>Loading communities...</p>
			</div>
		);
	}

	return (
		<div style={{ padding: '1rem 0' }}>
			<div className="page-header">
				<div>
					<h1 className="page-title">Explore Communities</h1>
					<p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
						Join communities to share and view developer posts.
					</p>
				</div>
				<Link to="/communities/create" className="btn btn-primary">
					🚀 Create Community
				</Link>
			</div>

			{error && <div className="error-message">{error}</div>}

			{communities.length === 0 ? (
				<div
					className="glass"
					style={{
						padding: '3rem',
						borderRadius: '16px',
						textAlign: 'center',
						color: 'var(--text-secondary)',
					}}
				>
					<p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
						No communities have been created yet. Be the first to build one!
					</p>
					<Link to="/communities/create" className="btn btn-primary">
						Create a Community
					</Link>
				</div>
			) : (
				<div className="communities-grid">
					{communities.map((comm) => {
						const isMember = user ? comm.members.includes(user._id) : false;
						return (
							<div key={comm._id} className="community-card glass">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '1rem',
										marginBottom: '1rem',
									}}
								>
									{comm.avatar ? (
										<img
											src={comm.avatar}
											alt={`${comm.name} avatar`}
											className="community-avatar"
										/>
									) : (
										<div
											className="community-avatar"
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												background: 'var(--bg-tertiary)',
												fontWeight: 'bold',
												color: 'var(--primary)',
												fontSize: '1.25rem',
											}}
										>
											{comm.name.slice(0, 2).toUpperCase()}
										</div>
									)}
									<div>
										<Link
											to={`/c/${comm.slug}`}
											style={{
												fontSize: '1.15rem',
												fontWeight: '700',
												color: 'var(--text-primary)',
											}}
										>
											c/{comm.name}
										</Link>
										<div
											style={{
												fontSize: '0.8rem',
												color: 'var(--text-muted)',
												marginTop: '0.1rem',
											}}
										>
											{comm.members?.length || 0} members •{' '}
											{comm.postCount || 0} posts
										</div>
									</div>
								</div>

								<p
									style={{
										color: 'var(--text-secondary)',
										fontSize: '0.9rem',
										lineHeight: '1.5',
										marginBottom: '1.5rem',
										flex: 1,
									}}
								>
									{comm.description.length > 100
										? comm.description.slice(0, 100) + '...'
										: comm.description}
								</p>

								<div style={{ display: 'flex', gap: '0.75rem' }}>
									<Link
										to={`/c/${comm.slug}`}
										className="btn btn-secondary"
										style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
									>
										View
									</Link>
									<button
										onClick={() =>
											isMember
												? handleLeaveCommunity(comm.slug)
												: handleJoinCommunity(comm.slug)
										}
										className={`btn ${isMember ? 'btn-secondary' : 'btn-primary'}`}
										style={{ flex: 1.2, fontSize: '0.9rem', padding: '0.5rem' }}
										disabled={actionLoading[comm.slug]}
									>
										{actionLoading[comm.slug]
											? '...'
											: isMember
												? 'Leave'
												: 'Join'}
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
