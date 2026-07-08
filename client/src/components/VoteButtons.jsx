import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

/**
 * Shared VoteButtons component for posts and comments.
 * Displays up/down arrows and optimistic score.
 *
 * @param {Object} props
 * @param {number} props.initialScore
 * @param {'up'|'down'|null} props.initialVote
 * @param {Function} props.onVote - async function(dir: 'up'|'down')
 */
export default function VoteButtons({ initialScore, initialVote, onVote }) {
	const { user } = useAuthStore();
	const navigate = useNavigate();

	const [score, setScore] = useState(initialScore || 0);
	const [currentVote, setCurrentVote] = useState(initialVote || null);
	const [isVoting, setIsVoting] = useState(false);

	const handleVote = async (dir, e) => {
		e.stopPropagation(); // prevent card clicks

		if (!user) {
			navigate('/login');
			return;
		}
		if (isVoting) return;

		// Optimistic UI calculation
		const prevScore = score;
		const prevVote = currentVote;
		let nextScore = score;
		let nextVote = dir;

		if (dir === 'up') {
			if (currentVote === 'up') {
				nextScore -= 1;
				nextVote = null;
			} else if (currentVote === 'down') {
				nextScore += 2;
			} else {
				nextScore += 1;
			}
		} else {
			if (currentVote === 'down') {
				nextScore += 1;
				nextVote = null;
			} else if (currentVote === 'up') {
				nextScore -= 2;
			} else {
				nextScore -= 1;
			}
		}

		setScore(nextScore);
		setCurrentVote(nextVote);
		setIsVoting(true);

		try {
			// Trigger parent async action (the actual API call)
			await onVote(dir);
		} catch (err) {
			console.error('Vote failed:', err);
			// Revert on failure
			setScore(prevScore);
			setCurrentVote(prevVote);
		} finally {
			setIsVoting(false);
		}
	};

	const upActive = currentVote === 'up';
	const downActive = currentVote === 'down';

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: '0.25rem',
				padding: '0.5rem',
				background: 'rgba(255, 255, 255, 0.02)',
				borderRadius: '12px',
				border: '1px solid var(--border-color)',
			}}
		>
			<button
				onClick={(e) => handleVote('up', e)}
				disabled={isVoting}
				style={{
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					color: upActive ? 'var(--primary)' : 'var(--text-muted)',
					fontSize: '1.2rem',
					padding: '0 0.25rem',
					display: 'flex',
					alignItems: 'center',
					transition: 'color var(--transition-fast)',
				}}
				title="Upvote"
			>
				▲
			</button>
			<span
				style={{
					fontSize: '0.85rem',
					fontWeight: 'bold',
					color: upActive
						? 'var(--primary)'
						: downActive
						? '#ef4444'
						: 'var(--text-primary)',
					minWidth: '2ch',
					textAlign: 'center',
				}}
			>
				{score}
			</span>
			<button
				onClick={(e) => handleVote('down', e)}
				disabled={isVoting}
				style={{
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					color: downActive ? '#ef4444' : 'var(--text-muted)',
					fontSize: '1.2rem',
					padding: '0 0.25rem',
					display: 'flex',
					alignItems: 'center',
					transition: 'color var(--transition-fast)',
				}}
				title="Downvote"
			>
				▼
			</button>
		</div>
	);
}
