import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { getToken, getUser, queryClient } from './lib/auth';

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
const OpportunityDetailPage = lazy(() => import('./pages/OpportunityDetailPage'));
const ApplicationWorkspacePage = lazy(() => import('./pages/ApplicationWorkspacePage'));
const ExpiredOpportunityPage = lazy(() => import('./pages/ExpiredOpportunityPage'));
import LandingPage from './pages/LandingPage';
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
      apiRequest('/api/notify', { method: 'POST', body: JSON.stringify({ type: 'daily_opportunity' }) }).catch(() => {});
      apiRequest('/api/notify', { method: 'POST', body: JSON.stringify({ type: 'trending_opportunity' }) }).catch(() => {});

      const lastActive = localStorage.getItem(`lp_last_active_${saved.id}`);
      if (lastActive) {
        const diff = Date.now() - parseInt(lastActive);
        if (diff > 24 * 60 * 60 * 1000) { // 24 hours
          apiRequest('/api/notify', { method: 'POST', body: JSON.stringify({ type: 'inactivity_reminder' }) }).catch(() => {});
        }
      }
      localStorage.setItem(`lp_last_active_${saved.id}`, Date.now().toString());

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
    <QueryClientProvider client={queryClient}>
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
              <Route path="/opportunities/expired" element={<ExpiredOpportunityPage />} />
              <Route path="/opportunities/:type/:slug/apply" element={user ? <OpportunityDetailPage user={user} /> : <Navigate to="/login" />} />
              {/* Lifecycle-managed detail pages: /opportunities/:category/:slug */}
              <Route path="/opportunities/:category/:slug" element={user ? <OpportunityDetailPage user={user} /> : <Navigate to="/login" />} />
              <Route path="/opportunities/:id/apply" element={user ? <ApplicationWorkspacePage user={user} /> : <Navigate to="/login" />} />
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
    </QueryClientProvider>
  );
}
