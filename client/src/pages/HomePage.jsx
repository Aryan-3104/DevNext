import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export default function HomePage() {
  const { user, token, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!user && !!token);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchMe = async () => {
      if (!user) {
        try {
          const response = await api.get('/users/me');
          setAuth(response.data, token);
        } catch (err) {
          console.error('Fetch me failed:', err);
          logout();
          navigate('/login');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMe();
  }, [token, user, navigate, setAuth, logout]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          Retrieving developer profile...
        </p>
      </div>
    );
  }

  if (!user) return null;

  // Render a clean developer dashboard layout
  return (
    <div className="home-container">
      <div className="profile-card glass">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.username}'s avatar`}
            className="profile-avatar-large"
          />
        ) : (
          <div className="profile-avatar-large" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'var(--bg-tertiary)',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'var(--primary)'
          }}>
            {user.username.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="profile-info">
          <h2 className="profile-username">Welcome, {user.username}!</h2>
          <span className="profile-badge">
            {user.githubId ? 'GitHub Connected' : 'Local Developer'}
          </span>
        </div>

        <p className="profile-bio">
          {user.bio || "This developer hasn't added a bio yet. Keep building!"}
        </p>

        <div className="profile-details">
          <div className="profile-stat-box">
            <div className="stat-label">Karma Points</div>
            <div className="stat-value">{user.karma ?? 0} ✨</div>
          </div>
          <div className="profile-stat-box">
            <div className="stat-label">GitHub Username</div>
            <div className="stat-value">
              {user.githubUsername ? `@${user.githubUsername}` : 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', width: '100%' }}>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
