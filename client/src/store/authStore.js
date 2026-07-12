import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../lib/socket';
import api from '../lib/axios';

// Initialize socket if token already exists on load
const initialToken = localStorage.getItem('token');
if (initialToken) {
  connectSocket(initialToken);
}


export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user });
    } catch (error) {
      localStorage.removeItem('token');
      disconnectSocket();
      set({ user: null, token: null });
    }
  },
  setAuth: (user, token) => {
    if (token) {
      localStorage.setItem('token', token);
      connectSocket(token);
    } else {
      localStorage.removeItem('token');
      disconnectSocket();
    }
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null });
  },
}));

// Fetch user data on startup if token exists
useAuthStore.getState().initializeAuth();
