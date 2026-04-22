import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken, getUser } from './lib/auth';
import AuthPage from './pages/AuthPage';
import SignupPage from './pages/SignupPage';
import FeedPage from './pages/FeedPage';
import BookmarksPage from './pages/BookmarksPage';
import ProfilePage from './pages/ProfilePage';
import CommunityPage from './pages/CommunityPage';
import AIAssistantPage from './pages/AIAssistantPage';
import PostOpportunityPage from './pages/PostOpportunityPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SettingsPage from './pages/SettingsPage';
import CirclePage from './pages/CirclePage';
import NetworkPage from './pages/NetworkPage';
import Layout from './components/Layout';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    const saved = getUser();
    if (token && saved) setUser(saved);
    setAuthChecked(true);
    const onUpdate = (e: any) => { if (e.detail) setUser(e.detail); };
    window.addEventListener('lp-user-updated', onUpdate);
    return () => window.removeEventListener('lp-user-updated', onUpdate);
  }, []);

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: '3px solid #0A0A0A', boxShadow: '4px 4px 0 #0A0A0A' }}>
          <img src="/rocket-logo.png" alt="LaunchPad" className="w-full h-full object-cover" />
        </div>
        <p className="font-black text-2xl">LaunchPad</p>
        <div className="w-6 h-6 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"  element={!user ? <AuthPage setUser={setUser} />  : <Navigate to="/feed" />} />
        <Route path="/signup" element={!user ? <SignupPage setUser={setUser} /> : <Navigate to="/feed" />} />
        <Route path="/" element={<Navigate to={user ? '/feed' : '/login'} />} />
        <Route element={<Layout user={user} setUser={setUser} />}>
          <Route path="/feed"           element={user ? <FeedPage user={user} />                       : <Navigate to="/login" />} />
          <Route path="/community"      element={user ? <CommunityPage user={user} />                  : <Navigate to="/login" />} />
          <Route path="/community/:id" element={user ? <CirclePage user={user} />                    : <Navigate to="/login" />} />
          <Route path="/network"        element={user ? <NetworkPage user={user} />                    : <Navigate to="/login" />} />
          <Route path="/leaderboard"    element={user ? <LeaderboardPage user={user} />                : <Navigate to="/login" />} />
          <Route path="/post"           element={user ? <PostOpportunityPage user={user} />             : <Navigate to="/login" />} />
          <Route path="/ai"             element={user ? <AIAssistantPage user={user} />                : <Navigate to="/login" />} />
          <Route path="/bookmarks"      element={user ? <BookmarksPage user={user} />                  : <Navigate to="/login" />} />
          <Route path="/profile"        element={user ? <ProfilePage user={user} setUser={setUser} />  : <Navigate to="/login" />} />
          <Route path="/settings"       element={user ? <SettingsPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
