import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import CommunitiesPage from './pages/CommunitiesPage.jsx';
import CreateCommunityPage from './pages/CreateCommunityPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import CreatePostPage from './pages/CreatePostPage.jsx';
import PostPage from './pages/PostPage.jsx';
import EditPostPage from './pages/EditPostPage.jsx';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/communities/create" element={<CreateCommunityPage />} />
            <Route path="/c/:slug" element={<CommunityPage />} />
            <Route path="/c/:slug/create-post" element={<CreatePostPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/post/:id/edit" element={<EditPostPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
