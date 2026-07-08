import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import VoteButtons from './VoteButtons.jsx';
import CommentForm from './CommentForm.jsx';

/**
 * Recursive component to render a comment tree based on materialized path structure.
 */
export default function CommentThread({ comments, postId, onReplyAdded, onCommentDeleted }) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
			{comments.map((comment) => (
				<CommentNode
					key={comment._id}
					comment={comment}
					postId={postId}
					onReplyAdded={onReplyAdded}
					onCommentDeleted={onCommentDeleted}
				/>
			))}
		</div>
	);
}

function CommentNode({ comment, postId, onReplyAdded, onCommentDeleted }) {
	const { user } = useAuthStore();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [showReplyForm, setShowReplyForm] = useState(false);

	const isAuthor = user && comment.author?._id === user._id;

	// Depth drives indentation. Cap at 6 visually to prevent layout squeeze.
	const maxIndent = 6;
	const indentLevel = Math.min(comment.depth || 0, maxIndent);
	const marginLeft = `${indentLevel * 1.5}rem`;

	// Vote handler for comments
	const handleVote = async (dir) => {
		await api.post(`/posts/${postId}/comments/${comment._id}/vote`, { dir });
	};

	// Delete handler
	const handleDelete = async () => {
		const confirmed = window.confirm('Are you sure you want to delete this comment?');
		if (!confirmed) return;

		try {
			await api.delete(`/posts/${postId}/comments/${comment._id}`);
			if (onCommentDeleted) onCommentDeleted(comment._id);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to delete comment.');
		}
	};

	if (isCollapsed) {
		return (
			<div
				style={{
					marginLeft,
					padding: '0.5rem 1rem',
					background: 'rgba(255, 255, 255, 0.02)',
					border: '1px solid var(--border-color)',
					borderRadius: '8px',
					fontSize: '0.85rem',
					color: 'var(--text-secondary)',
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					gap: '0.5rem',
				}}
				onClick={() => setIsCollapsed(false)}
			>
				<span style={{ color: 'var(--primary)' }}>+</span>
				<span>@{comment.author?.username || 'anonymous'}</span>
				<span>(collapsed)</span>
			</div>
		);
	}

	return (
		<div
			style={{
				marginLeft,
				position: 'relative',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.75rem',
				padding: '1rem',
				background: comment.depth === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
				borderLeft: comment.depth > 0 ? '2px solid var(--border-color)' : '1px solid var(--border-color)',
				border: comment.depth === 0 ? '1px solid var(--border-color)' : undefined,
				borderRadius: comment.depth === 0 ? '12px' : '0',
				transition: 'border-color var(--transition-fast)',
			}}
		>
			<div style={{ display: 'flex', gap: '1rem' }}>
				{/* Voting */}
				{!comment.isDeleted && (
					<div style={{ flexShrink: 0 }}>
						<VoteButtons
							initialScore={comment.score}
							initialVote={null} // Materialized path tree doesn't natively pack currentVote per comment easily without extra aggregation; defaults to null for simplicity in this PRD
							onVote={handleVote}
						/>
					</div>
				)}

				{/* Content */}
				<div style={{ flex: 1, minWidth: 0 }}>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem',
							fontSize: '0.85rem',
							color: 'var(--text-secondary)',
							marginBottom: '0.5rem',
						}}
					>
						<span
							onClick={() => setIsCollapsed(true)}
							style={{ cursor: 'pointer', fontWeight: 'bold' }}
							title="Collapse"
						>
							[-]
						</span>
						<span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
							@{comment.author?.username || 'anonymous'}
						</span>
						<span>•</span>
						<span>{new Date(comment.createdAt).toLocaleString()}</span>
						{comment.author?.karma !== undefined && (
							<span style={{ color: 'var(--accent-cyan)' }}>
								(karma: {comment.author.karma})
							</span>
						)}
					</div>

					{/* Body */}
					<p
						style={{
							fontSize: '0.95rem',
							lineHeight: '1.5',
							color: comment.isDeleted ? 'var(--text-muted)' : 'var(--text-primary)',
							fontStyle: comment.isDeleted ? 'italic' : 'normal',
							whiteSpace: 'pre-wrap',
						}}
					>
						{comment.body}
					</p>

					{/* Actions */}
					{!comment.isDeleted && (
						<div
							style={{
								display: 'flex',
								gap: '1rem',
								marginTop: '0.75rem',
								fontSize: '0.8rem',
								fontWeight: '600',
							}}
						>
							<span
								onClick={() => setShowReplyForm(!showReplyForm)}
								style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
							>
								Reply
							</span>
							{isAuthor && (
								<span
									onClick={handleDelete}
									style={{ color: '#ef4444', cursor: 'pointer' }}
								>
									Delete
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{showReplyForm && (
				<div style={{ marginTop: '0.5rem' }}>
					<CommentForm
						postId={postId}
						parentCommentId={comment._id}
						onCancel={() => setShowReplyForm(false)}
						onCommentAdded={(newComment) => {
							setShowReplyForm(false);
							if (onReplyAdded) onReplyAdded(newComment);
						}}
					/>
				</div>
			)}
		</div>
	);
}
