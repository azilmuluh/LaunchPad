import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { clearSession } from '../lib/auth';
import {
  LayoutDashboard, PlusSquare, Trophy, Users,
  Bookmark, User, Zap, LogOut, Settings, Network
} from 'lucide-react';

// Desktop nav — all primary routes
const DESKTOP_NAV = [
  { to: '/feed',        icon: LayoutDashboard, label: 'Discover'    },
  { to: '/community',   icon: Users,           label: 'Community'   },
  { to: '/network',     icon: Network,         label: 'Network'     },
  { to: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
  { to: '/post',        icon: PlusSquare,      label: 'Post'        },
  { to: '/bookmarks',   icon: Bookmark,        label: 'Saved'       },
  { to: '/ai',          icon: Zap,             label: 'AI'          },
];

// Mobile bottom nav — 6 most important + Settings
const MOBILE_NAV = [
  { to: '/feed',        icon: LayoutDashboard, label: 'Discover'   },
  { to: '/community',   icon: Users,           label: 'Community'  },
  { to: '/network',     icon: Network,         label: 'Network'    },
  { to: '/leaderboard', icon: Trophy,          label: 'Ranks'      },
  { to: '/post',        icon: PlusSquare,      label: 'Post'       },
  { to: '/ai',          icon: Zap,             label: 'AI'         },
  { to: '/profile',     icon: User,            label: 'Profile'    },
  { to: '/settings',    icon: Settings,        label: 'Settings'   },
];

export default function Layout({ user, setUser }: any) {
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const handleLogout = () => { clearSession(); setUser(null); navigate('/login'); };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>

      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex items-center justify-between px-5 py-2.5 sticky top-0 z-40"
        style={{ background: '#F5F0E8', borderBottom: '2.5px solid #0A0A0A' }}>

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden"
            style={{ border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }}>
            <img src="/rocket-logo.png" alt="LaunchPad" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-base" style={{ color: '#0A0A0A' }}>LaunchPad</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {DESKTOP_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all"
              style={({ isActive }) => isActive
                ? { background: '#FF5C00', color: '#fff', border: '2px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
                : { color: '#0A0A0A', border: '2px solid transparent' }
              }>
              <Icon size={13} />
              {label}
              {label === 'AI' && <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#00C853' }} />}
            </NavLink>
          ))}
        </nav>

        {/* Right: Profile + Settings + Logout */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <NavLink to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
            style={({ isActive }) => isActive
              ? { background: '#FF5C00', color: '#fff', border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
              : { background: '#0B1E3D', border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
            }>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-md object-cover" style={{ border: '1.5px solid #FFD600' }} />
              : <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black text-white" style={{ background: '#FF5C00' }}>{initials}</div>
            }
            <span className="text-white text-xs font-bold">{user?.full_name?.split(' ')[0]}</span>
          </NavLink>

          <NavLink to="/settings"
            className="nb-btn w-8 h-8 flex items-center justify-center text-xs"
            style={({ isActive }) => isActive
              ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' }
              : { background: '#fff', color: '#0A0A0A' }
            }>
            <Settings size={13} />
          </NavLink>

          <button onClick={handleLogout}
            className="nb-btn nb-btn-ghost w-8 h-8 flex items-center justify-center text-xs"
            style={{ color: '#666' }}>
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto"
        style={{ background: '#F5F0E8', borderTop: '2.5px solid #0A0A0A' }}>
        <div className="flex items-center justify-start min-w-max px-1 py-1 gap-0.5">
          {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all relative flex-shrink-0"
              style={({ isActive }) => isActive
                ? { background: '#FF5C00', color: '#fff', border: '2px solid #0A0A0A', boxShadow: '1px 1px 0 #0A0A0A' }
                : { color: '#666', border: '2px solid transparent' }
              }>
              <Icon size={16} />
              <span style={{ fontSize: '8px', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
              {label === 'AI' && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#00C853' }} />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
