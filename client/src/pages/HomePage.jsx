import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import PostCard from '../components/PostCard';
import FeedSortTabs from '../components/FeedSortTabs';

export default function HomePage() {
  const { user, token, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!user && !!token);

  // Feed state
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('hot');
  const [windowState, setWindowState] = useState('all');
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const fetchPosts = async (reset = false) => {
    try {
      const currentCursor = reset ? null : cursor;
      let url = `/posts?limit=10&sort=${sort}`;
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
    if (!user) return;
    setPosts([]);
    setCursor(null);
    fetchPosts(true);
  }, [user, sort, windowState]);

  const loadMore = async () => {
    if (loadingMore || !hasNextPage) return;
    setLoadingMore(true);
    await fetchPosts(false);
    setLoadingMore(false);
  };

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

      <div style={{ width: '100%', maxWidth: '800px', marginTop: '3rem', textAlign: 'left' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Global Feed</h2>
        
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
            <p style={{ fontSize: '1.05rem' }}>No posts available in this feed.</p>
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
    </div>
  );
}
