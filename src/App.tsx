import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken, getUser } from './lib/auth';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const PostOpportunityPage = lazy(() => import('./pages/PostOpportunityPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CirclePage = lazy(() => import('./pages/CirclePage'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const BlipsPage = lazy(() => import('./pages/BlipsPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
import Layout from './components/Layout';
import WalkthroughModal from './components/WalkthroughModal';

import { initNotifications } from './lib/notifications';
import { apiRequest } from './lib/auth';
import { useState, useEffect } from 'react';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    const token = getToken();
    const saved = getUser();
    if (token && saved) {
      setUser(saved);
      initNotifications(saved.id);
      // Best-effort push triggers (respects user notification prefs server-side)
      apiRequest('/api/notify', { method: 'POST', body: JSON.stringify({ type: 'weekly_quests' }) }).catch(() => {});
      apiRequest('/api/notify', { method: 'POST', body: JSON.stringify({ type: 'streak_risk' }) }).catch(() => {});
      if (!localStorage.getItem(`lp_walkthrough_seen_${saved.id}`)) {
        setShowWalkthrough(true);
      }
    }
    setAuthChecked(true);
    const onUpdate = (e: any) => { 
      if (e.detail) {
        setUser(e.detail);
        initNotifications(e.detail.id);
      }
    };
    window.addEventListener('lp-user-updated', onUpdate);
    return () => window.removeEventListener('lp-user-updated', onUpdate);
  }, []);

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: '3px solid #0A0A0A', boxShadow: '4px 4px 0 #0A0A0A' }}>
          <img src="/LaunchPad.svg" alt="LaunchPad" className="w-full h-full object-cover" />
        </div>
        <p className="font-black text-2xl">LaunchPad</p>
        <div className="w-6 h-6 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/login"  element={!user ? <AuthPage setUser={setUser} />  : <Navigate to="/feed" />} />
          <Route path="/signup" element={!user ? <SignupPage setUser={setUser} /> : <Navigate to="/feed" />} />
          <Route path="/" element={user ? <Navigate to="/feed" /> : <LandingPage />} />
          <Route element={<Layout user={user} setUser={setUser} />}>
            <Route path="/feed"           element={user ? <FeedPage user={user} />                       : <Navigate to="/login" />} />
            <Route path="/blips"          element={user ? <BlipsPage user={user} />                      : <Navigate to="/login" />} />
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
      </Suspense>
      {showWalkthrough && user && (
        <WalkthroughModal 
          userName={user.full_name || 'Explorer'} 
          onClose={() => {
            setShowWalkthrough(false);
            localStorage.setItem(`lp_walkthrough_seen_${user.id}`, 'true');
          }} 
        />
      )}
    </BrowserRouter>
  );
}
