import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export default function CreateCommunityPage() {
	const { token } = useAuthStore();
	const navigate = useNavigate();

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!token) {
			navigate('/login');
		}
	}, [token, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		if (!name.trim() || !description.trim()) {
			setError('Name and description are required.');
			setLoading(false);
			return;
		}

		try {
			const response = await api.post('/communities', {
				name: name.trim(),
				description: description.trim(),
			});
			navigate(`/c/${response.data.slug}`);
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.message || 'Failed to create community.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				maxWidth: '600px',
				margin: '0 auto',
				padding: '2rem 1.5rem',
				textAlign: 'left',
			}}
		>
			<h1 className="page-title" style={{ marginBottom: '1.5rem' }}>
				Create a new community
			</h1>

			{error && <div className="error-message">{error}</div>}

			<form onSubmit={handleSubmit} className="glass" style={{ padding: '2.5rem', borderRadius: '20px' }}>
				<div className="form-group">
					<label className="form-label">Community Name</label>
					<input
						type="text"
						className="form-input"
						placeholder="e.g. React Developers"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className="form-group">
					<label className="form-label">Description</label>
					<textarea
						className="form-input"
						placeholder="Describe your community..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows="5"
						required
						style={{ resize: 'vertical' }}
					/>
				</div>

				<div
					style={{
						display: 'flex',
						gap: '1rem',
						justifyContent: 'flex-end',
						marginTop: '2rem',
					}}
				>
					<button
						type="button"
						onClick={() => navigate('/communities')}
						className="btn btn-secondary"
					>
						Cancel
					</button>
					<button type="submit" className="btn btn-primary" disabled={loading}>
						{loading ? 'Creating...' : 'Create Community'}
					</button>
				</div>
			</form>
		</div>
	);
}
