import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import PostCard from '../components/PostCard';
import FeedSortTabs from '../components/FeedSortTabs';

export default function CommunityPage() {
	const { slug } = useParams();
	const { user } = useAuthStore();
	const navigate = useNavigate();

	const [community, setCommunity] = useState(null);
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState('');

	// Feed state
	const [sort, setSort] = useState('hot');
	const [windowState, setWindowState] = useState('all');
	const [cursor, setCursor] = useState(null);
	const [hasNextPage, setHasNextPage] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const fetchCommunityData = async () => {
		try {
			setError('');
			// Fetch community details
			const commRes = await api.get(`/communities/${slug}`);
			setCommunity(commRes.data);
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.message || 'Failed to load community details.');
		} finally {
			setLoading(false);
		}
	};

	const fetchPosts = async (reset = false) => {
		try {
			const currentCursor = reset ? null : cursor;
			let url = `/posts?community=${slug}&limit=10&sort=${sort}`;
			if (sort === 'top' && windowState) {
				url += `&window=${windowState}`;
			}
			if (currentCursor) {
				url += `&cursor=${encodeURIComponent(currentCursor)}`;
			}

			const postsRes = await api.get(url);
			
			if (reset) {
				setPosts(postsRes.data.posts);
			} else {
				setPosts((prev) => [...prev, ...postsRes.data.posts]);
			}
			setCursor(postsRes.data.nextCursor);
			setHasNextPage(!!postsRes.data.nextCursor);
		} catch (err) {
			console.error('Failed to load posts:', err);
		}
	};

	useEffect(() => {
		fetchCommunityData();
	}, [slug]);

	useEffect(() => {
		// Fetch posts initially or when sort/window changes
		setPosts([]);
		setCursor(null);
		fetchPosts(true);
	}, [slug, sort, windowState]);

	const loadMore = async () => {
		if (loadingMore || !hasNextPage) return;
		setLoadingMore(true);
		await fetchPosts(false);
		setLoadingMore(false);
	};

	const handleJoinLeave = async () => {
		if (!user) {
			navigate('/login');
			return;
		}
		setActionLoading(true);
		try {
			const isMember = community.members.includes(user._id);
			const endpoint = `/communities/${slug}/${isMember ? 'leave' : 'join'}`;
			await api.post(endpoint);

			// Refresh community data
			const commRes = await api.get(`/communities/${slug}`);
			setCommunity(commRes.data);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to update membership.');
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="loader-container">
				<div className="spinner"></div>
				<p style={{ color: 'var(--text-secondary)' }}>Loading community feed...</p>
			</div>
		);
	}

	if (error || !community) {
		return (
			<div
				className="glass"
				style={{
					padding: '3rem',
					borderRadius: '16px',
					textAlign: 'center',
					margin: '2rem auto',
					maxWidth: '600px',
				}}
			>
				<h2 style={{ color: '#f87171', marginBottom: '1rem' }}>Error</h2>
				<p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
					{error || 'Community not found.'}
				</p>
				<Link to="/communities" className="btn btn-secondary">
					Back to Communities
				</Link>
			</div>
		);
	}

	const isMember = user ? community.members.includes(user._id) : false;

	return (
		<div style={{ padding: '1rem 0' }}>
			{/* Community header */}
			<div
				className="glass"
				style={{
					padding: '2.5rem',
					borderRadius: '24px',
					background: 'var(--bg-secondary)',
					border: '1px solid var(--border-color)',
					marginBottom: '2rem',
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '2rem',
					textAlign: 'left',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
					{community.avatar ? (
						<img
							src={community.avatar}
							alt={`${community.name} avatar`}
							style={{
								width: '72px',
								height: '72px',
								borderRadius: '16px',
								objectFit: 'cover',
								border: '3px solid var(--primary)',
							}}
						/>
					) : (
						<div
							style={{
								width: '72px',
								height: '72px',
								borderRadius: '16px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								background: 'var(--bg-tertiary)',
								fontWeight: 'bold',
								color: 'var(--primary)',
								fontSize: '1.75rem',
								border: '3px solid var(--primary)',
							}}
						>
							{community.name.slice(0, 2).toUpperCase()}
						</div>
					)}
					<div>
						<h1
							style={{
								fontSize: '2rem',
								fontWeight: '800',
								letterSpacing: '-1px',
								marginBottom: '0.25rem',
							}}
						>
							c/{community.name}
						</h1>
						<p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
							<span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
								{community.memberCount || community.members?.length || 0}
							</span>{' '}
							Members
						</p>
					</div>
				</div>

				<div style={{ display: 'flex', gap: '1rem' }}>
					{isMember && (
						<Link to={`/c/${community.slug}/create-post`} className="btn btn-primary">
							✍️ Create Post
						</Link>
					)}
					<button
						onClick={handleJoinLeave}
						className={`btn ${isMember ? 'btn-secondary' : 'btn-primary'}`}
						disabled={actionLoading}
						style={{ minWidth: '120px' }}
					>
						{actionLoading
							? '...'
							: isMember
								? 'Leave Community'
								: 'Join Community'}
					</button>
				</div>
			</div>

			{/* Main Feed Content Layout */}
			<div className="feed-layout">
				{/* Left Feed */}
				<div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1.5rem',
						}}
					>
						<h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Community Posts</h2>
					</div>

					<FeedSortTabs
						sort={sort}
						window={windowState}
						onChange={(state) => {
							setSort(state.sort);
							if (state.window !== undefined) setWindowState(state.window);
						}}
					/>

					{posts.length === 0 ? (
						<div
							className="glass"
							style={{
								padding: '4rem 2rem',
								borderRadius: '16px',
								textAlign: 'center',
								color: 'var(--text-secondary)',
							}}
						>
							<p style={{ fontSize: '1.05rem', marginBottom: '1.5rem' }}>
								No posts in this community yet.
							</p>
							{isMember && (
								<Link
									to={`/c/${community.slug}/create-post`}
									className="btn btn-primary"
								>
									Be the first to post!
								</Link>
							)}
						</div>
					) : (
						<div className="posts-feed">
							{posts.map((post) => (
								<PostCard key={post._id} post={post} />
							))}
							
							{hasNextPage && (
								<button
									onClick={loadMore}
									disabled={loadingMore}
									className="btn btn-secondary"
									style={{ width: '100%', marginTop: '1rem' }}
								>
									{loadingMore ? 'Loading...' : 'Load More'}
								</button>
							)}
						</div>
					)}
				</div>

				{/* Right Sidebar panels */}
				<div className="sidebar-panel">
					{/* About Panel */}
					<div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
						<h3
							style={{
								fontSize: '1.1rem',
								fontWeight: '700',
								marginBottom: '0.75rem',
							}}
						>
							About Community
						</h3>
						<p
							style={{
								color: 'var(--text-secondary)',
								fontSize: '0.9rem',
								lineHeight: '1.6',
								marginBottom: '1rem',
							}}
						>
							{community.description}
						</p>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								fontSize: '0.85rem',
								borderTop: '1px solid var(--border-color)',
								paddingTop: '0.75rem',
								color: 'var(--text-secondary)',
							}}
						>
							<span>Total Posts:</span>
							<span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
								{community.postCount ?? 0}
							</span>
						</div>
					</div>

					{/* Rules Panel */}
					{community.rules && community.rules.length > 0 && (
						<div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
							<h3
								style={{
									fontSize: '1.1rem',
									fontWeight: '700',
									marginBottom: '0.75rem',
								}}
							>
								Rules
							</h3>
							<ol className="rules-list">
								{community.rules.map((rule, idx) => (
									<li key={idx} style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
										{rule}
									</li>
								))}
							</ol>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
