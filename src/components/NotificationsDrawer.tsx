import { useState, useEffect, useMemo } from 'react';
import { X, Bell, Check, Users, Trophy, MessageSquare, Star, Info, Flame, GraduationCap, Compass, Sparkles, FileText, UserPlus } from 'lucide-react';
import { apiRequest } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  data: any;
  read: boolean;
  created_at: string;
}

type FilterTab = 'all' | 'opportunities' | 'community' | 'members';

const OPP_TYPES = new Set(['new_opportunity', 'deadline', 'daily_opportunity', 'trending']);
const COMMUNITY_TYPES = new Set(['new_post', 'message', 'win']);
const MEMBER_TYPES = new Set(['new_member', 'connection_request', 'connection_accept', 'connection']);

export default function NotificationsDrawer({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  const fetchNotifications = async () => {
    try {
      const r = await apiRequest('/api/notifications');
      const d = await r.json();
      if (d.notifications) setNotifications(d.notifications);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'opportunities') return notifications.filter(n => OPP_TYPES.has(n.type));
    if (filter === 'community') return notifications.filter(n => COMMUNITY_TYPES.has(n.type));
    return notifications.filter(n => MEMBER_TYPES.has(n.type));
  }, [notifications, filter]);

  const markRead = async (id: string) => {
    try {
      await apiRequest('/api/notifications', { method: 'PUT', body: JSON.stringify({ id }) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/api/notifications', { method: 'PUT', body: JSON.stringify({ read_all: true }) });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleNavigate = (n: Notification) => {
    if (!n.read) markRead(n.id);
    const link = n.data?.link;
    if (typeof link === 'string' && link.startsWith('/')) {
      navigate(link);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_opportunity':
      case 'daily_opportunity': return <GraduationCap size={16} className="text-orange-500" />;
      case 'new_post':            return <FileText size={16} className="text-purple-500" />;
      case 'new_member':          return <UserPlus size={16} className="text-blue-500" />;
      case 'connection_request':
      case 'connection_accept':
      case 'connection':          return <Users size={16} className="text-blue-500" />;
      case 'badge_unlock':        return <Trophy size={16} className="text-yellow-500" />;
      case 'message':             return <MessageSquare size={16} className="text-green-500" />;
      case 'win':                 return <Star size={16} className="text-orange-500" />;
      case 'deadline':            return <Bell size={16} className="text-red-500 animate-bounce" />;
      case 'trending':            return <Flame size={16} className="text-red-500" />;
      case 'inactivity':          return <Compass size={16} className="text-blue-500" />;
      case 'streak':              return <Sparkles size={16} className="text-yellow-500" />;
      default:                    return <Info size={16} className="text-gray-500" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return t('d_ago', { n: days });
    if (hours > 0) return t('h_ago', { n: hours });
    return t('m_ago', { n: Math.max(1, mins) });
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'community', label: 'Community' },
    { id: 'members', label: 'Members' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full flex flex-col animate-in slide-in-from-right duration-300"
        style={{ background: 'var(--bg)', borderLeft: '2.5px solid #0A0A0A' }}>

        <div className="p-4 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Bell size={18} />
            <h2 className="font-black text-lg">{t('notifications_title')}</h2>
          </div>
          <button onClick={onClose} className="nb-btn w-8 h-8 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-b-2 border-black/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="nb-btn px-2.5 py-1 text-[10px] font-black uppercase whitespace-nowrap flex-shrink-0"
              style={filter === tab.id
                ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' }
                : { background: 'var(--surface)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 border-2 border-black opacity-20">
                <Bell size={24} />
              </div>
              <p className="font-bold text-sm text-gray-400">
                {filter === 'all' ? t('no_notifications') : `No ${filter} notifications yet`}
              </p>
              <p className="text-[10px] font-bold text-gray-300 mt-1">Check back after new activity on LaunchPad</p>
            </div>
          ) : (
            filtered.map(n => (
              <div key={n.id}
                onClick={() => handleNavigate(n)}
                className={`nb-card p-3 transition-all cursor-pointer ${
                  !n.read
                    ? n.type === 'deadline'
                      ? 'ring-2 ring-red-500 bg-red-50/50 shadow-[4px_4px_0_#0A0A0A]'
                      : 'ring-2 ring-orange-500 shadow-[4px_4px_0_#0A0A0A]'
                    : 'opacity-70 grayscale-[0.5]'
                }`}>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_#0A0A0A]">
                    {n.type === 'new_member' && n.data?.member_name ? (
                      <span className="text-sm font-black text-blue-600">
                        {(n.data.member_name as string).charAt(0).toUpperCase()}
                      </span>
                    ) : getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-black text-xs truncate uppercase tracking-tight">{n.title}</p>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{getTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed text-gray-600 line-clamp-2">{n.content}</p>
                    {n.data?.link && typeof n.data.link === 'string' && n.data.link.startsWith('http') && (
                      <div className="mt-2">
                        <a
                          href={n.data.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center justify-center px-3 py-1 bg-[#FFD600] border-2 border-black rounded-lg text-[9px] font-black uppercase shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                          Apply Now
                        </a>
                      </div>
                    )}
                    {n.data?.link && typeof n.data.link === 'string' && n.data.link.startsWith('/') && (
                      <div className="mt-2">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-[#FFD600] border-2 border-black rounded-lg text-[9px] font-black uppercase shadow-[2px_2px_0_#000]">
                          View →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.some(n => !n.read) && (
          <div className="p-4 border-t-2 border-black">
            <button onClick={markAllRead}
              className="nb-btn nb-btn-orange w-full py-2.5 text-xs flex items-center justify-center gap-2">
              <Check size={14} />
              {t('mark_all_read')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
