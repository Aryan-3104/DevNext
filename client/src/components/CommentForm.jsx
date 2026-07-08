import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

/**
 * Reusable comment form for top-level comments and replies.
 */
export default function CommentForm({ postId, parentCommentId = null, onCommentAdded, onCancel }) {
	const { user } = useAuthStore();
	const [body, setBody] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	if (!user) {
		return (
			<div
				className="glass"
				style={{
					padding: '1.5rem',
					borderRadius: '12px',
					textAlign: 'center',
					color: 'var(--text-secondary)',
				}}
			>
				Please log in to leave a comment.
			</div>
		);
	}

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!body.trim()) return;

		setIsSubmitting(true);
		setError('');

		try {
			const res = await api.post(`/posts/${postId}/comments`, {
				body,
				parentComment: parentCommentId,
			});
			setBody('');
			if (onCommentAdded) onCommentAdded(res.data);
		} catch (err) {
			console.error('Comment error:', err);
			setError(err.response?.data?.message || 'Failed to post comment.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="glass"
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				padding: '1.5rem',
				borderRadius: '12px',
				border: '1px solid var(--border-color)',
				background: 'var(--bg-secondary)',
			}}
		>
			<textarea
				placeholder={parentCommentId ? "Write a reply..." : "What are your thoughts?"}
				value={body}
				onChange={(e) => setBody(e.target.value)}
				rows="3"
				style={{
					width: '100%',
					padding: '1rem',
					borderRadius: '8px',
					border: '1px solid var(--border-color)',
					background: 'rgba(255, 255, 255, 0.03)',
					color: 'var(--text-primary)',
					resize: 'vertical',
					fontFamily: 'inherit',
					fontSize: '0.95rem',
				}}
			/>
			{error && <div className="error-message" style={{ margin: 0 }}>{error}</div>}
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="btn btn-secondary"
						style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
						disabled={isSubmitting}
					>
						Cancel
					</button>
				)}
				<button
					type="submit"
					className="btn btn-primary"
					style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
					disabled={isSubmitting || !body.trim()}
				>
					{isSubmitting ? 'Posting...' : 'Comment'}
				</button>
			</div>
		</form>
	);
}
