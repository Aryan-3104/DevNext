import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PostCard({ post }) {
	const {
		_id,
		title,
		body,
		codeBlocks,
		tags,
		author,
		community,
		upvotes,
		createdAt,
	} = post;

	const navigate = useNavigate();

	// Calculate time-ago helper
	const timeAgo = (dateStr) => {
		const now = new Date();
		const past = new Date(dateStr);
		const diffMs = now - past;
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHr = Math.floor(diffMin / 60);
		const diffDays = Math.floor(diffHr / 24);

		if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
		if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
		if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
		return 'Just now';
	};

	// 3 lines code preview helper
	const getCodePreview = () => {
		if (!codeBlocks || codeBlocks.length === 0) return null;
		const firstBlock = codeBlocks[0];
		if (!firstBlock.code) return null;

		const lines = firstBlock.code.split('\n');
		const previewText = lines.slice(0, 3).join('\n');
		const hasMore = lines.length > 3;

		return {
			code: previewText + (hasMore ? '\n...' : ''),
			language: firstBlock.language,
		};
	};

	const codePreview = getCodePreview();

	const handleCardClick = () => {
		navigate(`/post/${_id}`);
	};

	return (
		<div
			onClick={handleCardClick}
			className="post-card glass"
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				padding: '1.5rem',
				borderRadius: '16px',
				border: '1px solid var(--border-color)',
				transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
				background: 'var(--bg-secondary)',
				textAlign: 'left',
				cursor: 'pointer',
			}}
		>
			{/* Top Header info */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					fontSize: '0.85rem',
					color: 'var(--text-secondary)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					{community && (
						<span
							onClick={(e) => {
								e.stopPropagation();
								navigate(`/c/${community.slug}`);
							}}
							style={{
								fontWeight: 'bold',
								color: 'var(--primary)',
								background: 'var(--primary-glow)',
								padding: '0.2rem 0.5rem',
								borderRadius: '6px',
								cursor: 'pointer',
							}}
						>
							c/{community.name}
						</span>
					)}
					<span>•</span>
					<span>
						Posted by @{author?.username || 'anonymous'}
					</span>
					<span>•</span>
					<span>{timeAgo(createdAt)}</span>
				</div>
			</div>

			{/* Post title */}
			<h3
				style={{
					fontSize: '1.2rem',
					fontWeight: '700',
					color: 'var(--text-primary)',
					lineHeight: '1.4',
				}}
			>
				{title}
			</h3>

			{/* Post body preview */}
			{body && (
				<p
					style={{
						color: 'var(--text-secondary)',
						fontSize: '0.95rem',
						lineHeight: '1.5',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{body}
				</p>
			)}

			{/* Code block preview (3 lines only) */}
			{codePreview && (
				<div
					style={{
						background: '#1e1e1e',
						border: '1px solid var(--border-color)',
						borderRadius: '8px',
						padding: '0.75rem 1rem',
						fontFamily: 'var(--font-mono)',
						fontSize: '0.8rem',
						color: '#d4d4d4',
						overflow: 'hidden',
						whiteSpace: 'pre-wrap',
						position: 'relative',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: '0.5rem',
							right: '0.75rem',
							fontSize: '0.7rem',
							color: 'var(--text-muted)',
							textTransform: 'uppercase',
						}}
					>
						{codePreview.language}
					</div>
					{codePreview.code}
				</div>
			)}

			{/* Tags list */}
			{tags && tags.length > 0 && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
					{tags.map((tag, index) => (
						<span
							key={index}
							style={{
								fontSize: '0.7rem',
								fontWeight: '600',
								background: 'rgba(255, 255, 255, 0.05)',
								color: 'var(--text-secondary)',
								padding: '0.15rem 0.5rem',
								borderRadius: '20px',
								border: '1px solid var(--border-color)',
							}}
						>
							#{tag}
						</span>
					))}
				</div>
			)}

			<hr style={{ border: 'none', height: '1px', background: 'var(--border-color)' }} />

			{/* Stats and metadata footer */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '1.5rem',
					fontSize: '0.85rem',
					color: 'var(--text-secondary)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
					<span>▲ Upvotes:</span>
					<span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
						{upvotes || 0}
					</span>
				</div>
			</div>
		</div>
	);
}
