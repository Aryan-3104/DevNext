import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import VoteButtons from '../components/VoteButtons.jsx';
import CommentForm from '../components/CommentForm.jsx';
import CommentThread from '../components/CommentThread.jsx';

export default function PostPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuthStore();

	const [post, setPost] = useState(null);
	const [comments, setComments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [postVoteState, setPostVoteState] = useState(null); // stores user's current vote on the post

	useEffect(() => {
		const fetchPostAndComments = async () => {
			try {
				const [postRes, commentsRes] = await Promise.all([
					api.get(`/posts/${id}`),
					api.get(`/posts/${id}/comments`),
				]);
				setPost(postRes.data);
				setComments(commentsRes.data.comments);
				
				// Calculate initial post vote state based on user
				if (user) {
					const isUp = postRes.data.upvoters?.includes(user._id);
					const isDown = postRes.data.downvoters?.includes(user._id);
					setPostVoteState(isUp ? 'up' : isDown ? 'down' : null);
				}
			} catch (err) {
				console.error(err);
				setError(err.response?.data?.message || 'Failed to load post.');
			} finally {
				setLoading(false);
			}
		};

		fetchPostAndComments();
	}, [id, user]);

	if (loading) {
		return (
			<div className="loader-container">
				<div className="spinner"></div>
				<p style={{ color: 'var(--text-secondary)' }}>Retrieving post...</p>
			</div>
		);
	}

	if (error || !post) {
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
					{error || 'Post not found.'}
				</p>
				<Link to="/" className="btn btn-secondary">
					Back to Home
				</Link>
			</div>
		);
	}

	// Derive permissions.
	// moderators is a raw ObjectId array (not auto-populated), so .toString()
	// both sides is required — same pattern the server's deletePost uses.
	const isAuthor = user && post.author?._id === user._id;
	const isMod =
		user &&
		post.community?.moderators?.some(
			(modId) => modId.toString() === user._id,
		);

	const handleDelete = async () => {
		const confirmed = window.confirm(
			'Are you sure you want to delete this post? This action cannot be undone.',
		);
		if (!confirmed) return;

		setDeleteLoading(true);
		try {
			await api.delete(`/posts/${id}`);
			navigate(`/c/${post.community?.slug}`);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to delete post.');
			setDeleteLoading(false);
		}
	};

	const handlePostVote = async (dir) => {
		const res = await api.post(`/posts/${id}/vote`, { dir });
		setPostVoteState(res.data.currentVote);
	};

	const handleCommentAdded = (newComment) => {
		// To maintain sorting by path, we need to insert the comment in the correct place.
		// Re-sorting the array in-memory by path is easiest.
		setComments((prev) => [...prev, newComment].sort((a, b) => a.path.localeCompare(b.path)));
	};

	const handleCommentDeleted = (commentId) => {
		// Soft delete: just update the comment body in state
		setComments((prev) =>
			prev.map((c) => (c._id === commentId ? { ...c, body: '[deleted]', isDeleted: true } : c)),
		);
	};

	return (
		<div
			style={{
				maxWidth: '800px',
				margin: '0 auto',
				padding: '2rem 1.5rem',
				textAlign: 'left',
			}}
		>
			{/* Breadcrumbs */}
			<div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
				<Link to="/" style={{ color: 'var(--text-muted)' }}>
					Home
				</Link>{' '}
				/{' '}
				{post.community && (
					<Link to={`/c/${post.community.slug}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
						c/{post.community.name}
					</Link>
				)}
			</div>

			<div
				className="glass"
				style={{
					padding: '2.5rem',
					borderRadius: '24px',
					background: 'var(--bg-secondary)',
					border: '1px solid var(--border-color)',
				}}
			>
				{/* Author / Date Header */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						fontSize: '0.85rem',
						color: 'var(--text-secondary)',
						marginBottom: '1rem',
					}}
				>
					<span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
						@{post.author?.username || 'anonymous'}
					</span>
					<span style={{ margin: '0 0.5rem' }}>•</span>
					<span>{new Date(post.createdAt).toLocaleString()}</span>
				</div>

				{/* Title row with Voting and Actions */}
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						gap: '1.5rem',
						marginBottom: '1.5rem',
					}}
				>
					<div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
						<VoteButtons
							initialScore={post.score}
							initialVote={postVoteState}
							onVote={handlePostVote}
						/>
					</div>
					
					<div style={{ flex: 1, minWidth: 0 }}>
						<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
							<h1 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: '1.3' }}>
						{post.title}
					</h1>

					{(isAuthor || isMod) && (
						<div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
							{isAuthor && (
								<button
									className="btn btn-secondary"
									style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
									onClick={() => navigate(`/post/${id}/edit`)}
								>
									✏️ Edit
								</button>
							)}
							<button
								className="btn btn-danger"
								style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
								onClick={handleDelete}
								disabled={deleteLoading}
							>
								{deleteLoading ? 'Deleting…' : '🗑️ Delete'}
							</button>
						</div>
					)}
						</div>
					</div>
				</div>

				{/* Tags list */}
				{post.tags && post.tags.length > 0 && (
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
						{post.tags.map((tag, idx) => (
							<span
								key={idx}
								style={{
									fontSize: '0.75rem',
									fontWeight: '600',
									background: 'rgba(255, 255, 255, 0.05)',
									color: 'var(--text-secondary)',
									padding: '0.2rem 0.6rem',
									borderRadius: '20px',
									border: '1px solid var(--border-color)',
								}}
							>
								#{tag}
							</span>
						))}
					</div>
				)}

				<hr style={{ border: 'none', height: '1px', background: 'var(--border-color)', marginBottom: '1.5rem' }} />

				{/* Body Content */}
				{post.body && (
					<p
						style={{
							fontSize: '1.05rem',
							lineHeight: '1.7',
							color: 'var(--text-primary)',
							whiteSpace: 'pre-wrap',
							marginBottom: '2rem',
						}}
					>
						{post.body}
					</p>
				)}

				{/* Code Blocks list */}
				{post.codeBlocks && post.codeBlocks.map((block, idx) => (
					<div
						key={idx}
						style={{
							margin: '2rem 0',
							borderRadius: '12px',
							overflow: 'hidden',
							border: '1px solid var(--border-color)',
							background: '#1e1e1e',
						}}
					>
						<div
							style={{
								background: 'rgba(255, 255, 255, 0.03)',
								borderBottom: '1px solid var(--border-color)',
								padding: '0.5rem 1rem',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
								Snippet ({block.language})
							</span>
						</div>
						<Editor
							height="250px"
							language={block.language}
							value={block.code}
							theme="vs-dark"
							options={{
								readOnly: true,
								domReadOnly: true,
								minimap: { enabled: false },
								fontSize: 13,
								fontFamily: 'var(--font-mono)',
							}}
						/>
					</div>
				))}

				{/* Comments Section */}
				<div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
					<h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
						Comments ({comments.length})
					</h3>
					
					<CommentForm 
						postId={id} 
						onCommentAdded={handleCommentAdded} 
					/>

					{comments.length > 0 ? (
						<CommentThread
							comments={comments}
							postId={id}
							onReplyAdded={handleCommentAdded}
							onCommentDeleted={handleCommentDeleted}
						/>
					) : (
						<p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center' }}>
							No comments yet. Be the first to share your thoughts!
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
