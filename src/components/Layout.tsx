import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, apiRequest } from '../lib/auth';
import {
  LayoutDashboard, PlusSquare, Trophy, Users,
  Bookmark, User, Zap, LogOut, Settings, Network, Clapperboard, Bell
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import AIFAB from './AIFAB';
import { useEffect, useState } from 'react';
import { applyUpdate } from '../pwa';
import NotificationsDrawer from './NotificationsDrawer';

export default function Layout({ user, setUser }: any) {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useI18n();
  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const handleLogout = () => { clearSession(); setUser(null); navigate('/login'); };
  const [updateReady, setUpdateReady] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnread = async () => {
    if (!user) return;
    try {
      const res = await apiRequest('/api/notifications?limit=1');
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 30000); // Polling every 30s
    window.addEventListener('lp-refresh-notifications', checkUnread);
    
    const onReady = () => setUpdateReady(true);
    window.addEventListener('lp-sw-update-ready', onReady);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('lp-refresh-notifications', checkUnread);
      window.removeEventListener('lp-sw-update-ready', onReady);
    };
  }, [user]);

  const NAV_ITEMS = [
    { to: '/feed',        icon: LayoutDashboard, label: t('discover')    },
    { to: '/blips',       icon: Clapperboard,    label: t('blips')       },
    { to: '/community',   icon: Users,           label: t('community')   },
    { to: '/network',     icon: Network,         label: t('network')     },
    { to: '/leaderboard', icon: Trophy,          label: t('leaderboard') },
    { to: '/post',        icon: PlusSquare,      label: t('post')        },
    { to: '/bookmarks',   icon: Bookmark,        label: t('saved')       },
    { to: '/ai',          icon: Zap,             label: t('ai')          },
  ];

  const MOBILE_NAV_ITEMS = [
    ...NAV_ITEMS.slice(0, 5),
    { to: '/profile',     icon: User,            label: t('profile')     },
    { to: '/settings',    icon: Settings,        label: t('settings')    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {updateReady && (
        <div className="sticky top-0 z-[60] px-4 py-2 flex items-center justify-between gap-3"
          style={{ background: '#FFD600', borderBottom: '2.5px solid #0A0A0A' }}>
          <p className="text-xs font-black">Update ready. Refresh to get the latest version.</p>
          <div className="flex gap-2">
            <button onClick={() => setUpdateReady(false)} className="nb-btn px-3 py-1 text-xs" style={{ background: '#fff' }}>
              Later
            </button>
            <button
              type="button"
              onClick={() => { setUpdateReady(false); applyUpdate(); }}
              className="nb-btn nb-btn-orange px-3 py-1 text-xs">
              Update
            </button>
          </div>
        </div>
      )}

      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex items-center justify-between px-5 py-2.5 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '2.5px solid var(--border)' }}>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden"
            style={{ border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }}>
            <img src="/LaunchPad.svg" alt="LaunchPad" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-base uppercase tracking-tighter" style={{ color: 'var(--heading)' }}>LaunchPad</span>
        </div>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all"
              style={({ isActive }) => isActive
                ? { background: '#FF5C00', color: 'var(--ink)', border: '2px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
                : { color: 'var(--ink)', border: '2px solid transparent' }
              }>
              <Icon size={13} />
              {label}
              {label === t('ai') && <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#00C853' }} />}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={toggleLang}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all"
            style={{ background: 'var(--surface)', border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }}>
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
          
          <button onClick={() => setShowNotifications(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all relative"
            style={{ background: 'var(--surface)', border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A', color: 'var(--ink)' }}>
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NavLink to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
            style={({ isActive }) => isActive
              ? { background: '#FF5C00', color: 'var(--ink)', border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
              : { background: 'var(--surface)', border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
            }>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-md object-cover" style={{ border: '1.5px solid #FFD600' }} />
              : <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black" style={{ background: '#FF5C00', color: 'var(--ink)' }}>{initials}</div>
            }
            <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{user?.full_name?.split(' ')[0]}</span>
          </NavLink>

          <NavLink to="/settings"
            className="nb-btn w-8 h-8 flex items-center justify-center text-xs"
            style={({ isActive }) => isActive
              ? { background: '#FF5C00', color: 'var(--ink)', borderColor: '#FF5C00' }
              : { background: 'var(--surface)', color: 'var(--ink)' }
            }>
            <Settings size={13} />
          </NavLink>

          <button onClick={handleLogout}
            className="nb-btn nb-btn-ghost w-8 h-8 flex items-center justify-center text-xs"
            style={{ color: 'var(--muted)' }}>
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between px-3 py-2.5 border-b-2 border-black sticky top-0 z-40"
        style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-1.5">
           <img src="/LaunchPad.svg" className="w-7 h-7" alt="LaunchPad" />
           <span className="font-black text-base uppercase tracking-tighter" style={{ color: 'var(--heading)' }}>LaunchPad</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotifications(true)} className="relative p-1.5">
            <Bell size={20} strokeWidth={2.5} style={{ color: 'var(--ink)' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-[1.5px] border-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button onClick={toggleLang}
            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_#000]"
            style={{ background: 'var(--surface)', color: 'var(--ink)' }}>
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto flex flex-col relative">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        style={{ background: 'var(--bg)', borderTop: '2.5px solid var(--border)' }}>
        <div className="flex items-center justify-around px-1 py-2 gap-0.5 overflow-x-auto hide-scrollbar">
          {MOBILE_NAV_ITEMS.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all relative flex-shrink-0 min-w-[56px]"
              style={({ isActive }) => isActive
                ? { background: '#FF5C00', color: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '1px 1px 0 #0A0A0A' }
                : { color: 'var(--muted)', border: '2px solid transparent' }
              }>
              <Icon size={20} strokeWidth={2.5} />
              <span style={{ fontSize: '9px', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
              {label === t('ai') && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#00C853' }} />
              )}
            </NavLink>
          ))}
          <NavLink to="/profile"
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all relative flex-shrink-0 min-w-[56px]"
            style={({ isActive }) => isActive
              ? { background: '#FF5C00', color: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '1px 1px 0 #0A0A0A' }
              : { color: 'var(--muted)', border: '2px solid transparent' }
            }>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" style={{ border: '1.5px solid currentColor' }} />
              : <User size={20} strokeWidth={2.5} />
            }
            <span style={{ fontSize: '9px', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap' }}>{t('profile')}</span>
          </NavLink>
        </div>
      </nav>

      {/* Global AI Floating Action Button */}
      {user && <AIFAB user={user} />}
      
      {/* Notifications Drawer */}
      {showNotifications && (
        <NotificationsDrawer onClose={() => {
          setShowNotifications(false);
          checkUnread(); // Refresh count when drawer is closed
        }} />
      )}
    </div>
  );
}

