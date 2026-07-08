import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNewPost = () => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'c' && pathParts[2]) {
      navigate(`/c/${pathParts[2]}/create-post`);
    } else {
      alert('Please select a community to create a post in!');
      navigate('/communities');
    }
  };

  return (
    <nav className="navbar glass">
      <Link to="/" className="nav-brand">
        <span>🎯 DevNest</span>
      </Link>

      <div className="nav-links">
        <Link to="/communities" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
          🌐 Communities
        </Link>
        {user && (
          <button
            onClick={handleNewPost}
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            ✏️ New Post
          </button>
        )}
        {user ? (
          <div className="nav-user">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.username}'s avatar`}
                className="avatar"
              />
            ) : (
              <div className="avatar" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--bg-tertiary)',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: 'var(--primary)'
              }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="username">{user.username}</span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', borderRadius: '8px' }}>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
