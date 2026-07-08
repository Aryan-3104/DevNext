import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserAndRedirect = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setError('No authentication token found in URL.');
        return;
      }

      try {
        // Fetch authenticated user data using the new token explicitly in headers
        const response = await api.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Save auth data to Zustand store & local storage
        setAuth(response.data, token);
        
        // Redirect to homepage
        navigate('/');
      } catch (err) {
        console.error('OAuth callback user fetch failed:', err);
        setError('Authentication failed. Please try logging in again.');
      }
    };

    fetchUserAndRedirect();
  }, [searchParams, setAuth, navigate]);

  if (error) {
    return (
      <div className="loader-container">
        <div className="error-message" style={{ maxWidth: '400px', textAlign: 'center' }}>
          {error}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
        Completing secure sign-in...
      </p>
    </div>
  );
}
