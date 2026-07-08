import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

const LANGUAGES = [
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'typescript', label: 'TypeScript' },
	{ value: 'python', label: 'Python' },
	{ value: 'cpp', label: 'C++' },
	{ value: 'java', label: 'Java' },
	{ value: 'go', label: 'Go' },
	{ value: 'rust', label: 'Rust' },
	{ value: 'bash', label: 'Bash' },
	{ value: 'json', label: 'JSON' },
];

export default function CreatePostPage() {
	const { slug } = useParams();
	const { token } = useAuthStore();
	const navigate = useNavigate();

	const [title, setTitle] = useState('');
	const [body, setBody] = useState('');
	const [tagsInput, setTagsInput] = useState('');
	const [hasCode, setHasCode] = useState(false);
	const [code, setCode] = useState('// Write code here...');
	const [language, setLanguage] = useState('javascript');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!token) {
			navigate('/login');
		}
	}, [token, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		if (!title.trim()) {
			setError('Post title is required.');
			setLoading(false);
			return;
		}

		const codeBlocks = hasCode && code.trim() ? [{ code, language }] : [];

		if (!body.trim() && codeBlocks.length === 0) {
			setError('Please enter either body text or a code snippet.');
			setLoading(false);
			return;
		}

		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);

		if (tags.length > 5) {
			setError('Maximum of 5 tags allowed.');
			setLoading(false);
			return;
		}

		try {
			await api.post('/posts', {
				title: title.trim(),
				body: body.trim(),
				codeBlocks,
				tags,
				communitySlug: slug,
			});
			navigate(`/c/${slug}`);
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.message || 'Failed to create post.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				maxWidth: '750px',
				margin: '0 auto',
				padding: '2rem 1.5rem',
				textAlign: 'left',
			}}
		>
			<h1 className="page-title" style={{ marginBottom: '1.5rem' }}>
				Create a new post in c/{slug}
			</h1>

			{error && <div className="error-message">{error}</div>}

			<form
				onSubmit={handleSubmit}
				className="glass"
				style={{ padding: '2.5rem', borderRadius: '20px' }}
			>
				{/* Title */}
				<div className="form-group">
					<label className="form-label">Title</label>
					<input
						type="text"
						className="form-input"
						placeholder="Post title (max 150 characters)..."
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						maxLength={150}
						required
					/>
				</div>

				{/* Body */}
				<div className="form-group">
					<label className="form-label">Body Text (Optional if snippet is present)</label>
					<textarea
						className="form-input"
						placeholder="Explain your code block, ask a question, or describe what you built..."
						value={body}
						onChange={(e) => setBody(e.target.value)}
						rows="6"
						style={{ resize: 'vertical' }}
					/>
				</div>

				{/* Code Block checkbox */}
				<div className="form-group" style={{ margin: '1.5rem 0' }}>
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							cursor: 'pointer',
							fontWeight: '600',
							color: 'var(--text-primary)',
						}}
					>
						<input
							type="checkbox"
							checked={hasCode}
							onChange={(e) => setHasCode(e.target.checked)}
							style={{ width: '18px', height: '18px', cursor: 'pointer' }}
						/>
						💻 Include a code block snippet
					</label>
				</div>

				{/* Monaco Editor Wrapper */}
				{hasCode && (
					<div
						className="glass"
						style={{
							padding: '1.25rem',
							borderRadius: '12px',
							background: 'rgba(0, 0, 0, 0.2)',
							marginBottom: '1.5rem',
							border: '1px solid var(--border-color)',
						}}
					>
						<div
							className="form-group"
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '1rem',
							}}
						>
							<span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
								Code Language:
							</span>
							<select
								value={language}
								onChange={(e) => setLanguage(e.target.value)}
								className="form-input"
								style={{
									width: 'auto',
									padding: '0.4rem 1.5rem 0.4rem 0.8rem',
									fontSize: '0.85rem',
									background: 'var(--bg-tertiary)',
								}}
							>
								{LANGUAGES.map((lang) => (
									<option key={lang.value} value={lang.value}>
										{lang.label}
									</option>
								))}
							</select>
						</div>

						<div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
							<Editor
								height="220px"
								language={language}
								value={code}
								onChange={(val) => setCode(val || '')}
								theme="vs-dark"
								options={{
									minimap: { enabled: false },
									fontSize: 13,
									fontFamily: 'var(--font-mono)',
								}}
							/>
						</div>
					</div>
				)}

				{/* Tags */}
				<div className="form-group">
					<label className="form-label">Tags (comma-separated, max 5)</label>
					<input
						type="text"
						className="form-input"
						placeholder="e.g. javascript, react, hooks"
						value={tagsInput}
						onChange={(e) => setTagsInput(e.target.value)}
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
						onClick={() => navigate(`/c/${slug}`)}
						className="btn btn-secondary"
					>
						Cancel
					</button>
					<button type="submit" className="btn btn-primary" disabled={loading}>
						{loading ? 'Posting...' : 'Create Post'}
					</button>
				</div>
			</form>
		</div>
	);
}
