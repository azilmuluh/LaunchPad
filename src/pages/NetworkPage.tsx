import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/auth';
import { UserPlus, MessageCircle, Users, Check, X, ChevronRight, Send, ArrowLeft, Search, Shield } from 'lucide-react';
import { INTERESTS } from '../lib/interests';
import { useI18n } from '../lib/i18n';

const BADGE_DEFS: Record<string, { label: string; icon: string }> = {
  first_post:    { label: 'First Post',    icon: '\uD83D\uDCDD' },
  first_opp:     { label: 'Trailblazer',  icon: '\uD83D\uDE80' },
  streak_3:      { label: '3-Day Streak', icon: '\uD83D\uDD25' },
  streak_7:      { label: 'Week Warrior', icon: '\u26A1' },
  streak_30:     { label: 'Unstoppable',  icon: '\uD83C\uDFC6' },
  circle_maker:  { label: 'Circle Maker', icon: '\uD83D\uDC65' },
  commenter:     { label: 'Commenter',    icon: '\uD83D\uDCAC' },
  bookmarker:    { label: 'Bookmarker',   icon: '\uD83D\uDD16' },
};

function Avatar({ user, size = 40 }: any) {
  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const hue = (user?.full_name?.charCodeAt(0) || 200) % 360;
  return user?.avatar_url
    ? <img src={user.avatar_url} alt="" className="rounded-xl object-cover flex-shrink-0"
        style={{ width: size, height: size, border: '2px solid #0A0A0A' }} />
    : <div className="rounded-xl flex items-center justify-center font-black text-white flex-shrink-0"
        style={{ width: size, height: size, background: `hsl(${hue},55%,40%)`, border: '2px solid #0A0A0A', fontSize: size * 0.3 }}>
        {initials}
      </div>;
}

function UserProfileModal({ userId, currentUser, onClose, onStartChat }: any) {
  const { t } = useI18n();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<string | null>(null);

  useEffect(() => {
    apiRequest(`/api/connections?mode=profile&user_id=${userId}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
    // Check connection status
    apiRequest('/api/connections?mode=network')
      .then(r => r.json()).then(list => {
        if (Array.isArray(list) && list.find((u: any) => u.id === userId)) setConnStatus('accepted');
      });
  }, [userId]);

  const handleConnect = async () => {
    const r = await apiRequest('/api/connections', { method: 'POST', body: JSON.stringify({ addressee_id: userId }) });
    if (r.ok) setConnStatus('pending');
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="nb-card p-8"><div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto" /></div>
    </div>
  );

  const { user, extra, stats, posts, badges } = data || {};
  const interests = JSON.parse(user?.interests || '[]');
  const isMe = user?.id === currentUser?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg)', border: '2.5px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' }}>

        {/* Header */}
        <div className="nb-card-navy p-5 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <button onClick={onClose} className="text-white hover:opacity-70"><ArrowLeft size={18} /></button>
            {!isMe && (
              <div className="flex gap-2">
                {connStatus !== 'accepted' && (
                  <button onClick={handleConnect} disabled={connStatus === 'pending'}
                    className="nb-btn px-3 py-1.5 text-xs"
                    style={{ background: connStatus === 'pending' ? '#555' : '#FF5C00', color: 'var(--ink)', borderColor: '#FFD600' }}>
                    {connStatus === 'pending' ? t('pending') : <><UserPlus size={12} className="inline mr-1" />{t('connect')}</>}
                  </button>
                )}
                {connStatus === 'accepted' && (
                  <button onClick={() => { onClose(); onStartChat(user); }}
                    className="nb-btn nb-btn-yellow px-3 py-1.5 text-xs flex items-center gap-1">
                    <MessageCircle size={12} /> {t('message')}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Avatar user={{ ...user, avatar_url: extra?.avatar_url }} size={56} />
            <div>
              <h2 className="text-white font-black text-xl">{user?.full_name}</h2>
              {user?.education_level && <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>{user.education_level}</p>}
              {user?.location && <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{user.location}</p>}
            </div>
          </div>
          {stats && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { v: stats.total_xp || 0, l: 'XP', c: '#FFD600' },
                { v: `Lv.${stats.level || 1}`, l: t('level'), c: '#FF5C00' },
                { v: `${stats.current_streak || 0}d`, l: t('streak'), c: '#E53935' },
                { v: stats.opps_posted || 0, l: t('posted'), c: '#00C853' },
              ].map(s => (
                <div key={s.l} className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="font-black text-sm" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{s.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Badges */}
          {badges?.length > 0 && (
            <div className="nb-card p-4">
              <h3 className="font-black text-sm mb-2">{t('badges')}</h3>
              <div className="flex flex-wrap gap-2">
                {badges.map((b: any) => {
                  const def = BADGE_DEFS[b.badge_key];
                  return def ? (
                    <span key={b.badge_key} className="nb-tag text-xs" style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
                      {def.icon} {def.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <div className="nb-card p-4">
              <h3 className="font-black text-sm mb-2">{t('interests')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {interests.slice(0, 10).map((id: string) => {
                  const int = INTERESTS.find((i: any) => i.id === id);
                  return int ? (
                    <span key={id} className="nb-tag text-xs" style={{ background: 'var(--bg)' }}>
                      {int.icon} {int.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Recent posts */}
          {posts?.length > 0 && (
            <div className="nb-card p-4">
              <h3 className="font-black text-sm mb-3">{t('recent_posts')}</h3>
              <div className="space-y-3">
                {posts.map((p: any) => (
                  <div key={p.id} className="p-3 rounded-xl" style={{ background: '#FAFAF7', border: '1.5px solid #e0ddd6' }}>
                    <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{p.content.slice(0, 200)}{p.content.length > 200 ? '...' : ''}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{p.likes_count || 0} {t('likes' as any)}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{p.comments_count || 0} {t('comments')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatWindow({ peer, currentUser, onClose }: any) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  const fetchMessages = async () => {
    const r = await apiRequest(`/api/messages?with=${peer.id}`);
    const d = await r.json();
    if (Array.isArray(d)) setMessages(d);
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [peer.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    await apiRequest('/api/messages', { method: 'POST', body: JSON.stringify({ receiver_id: peer.id, content }) });
    await fetchMessages();
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-md h-[90vh] sm:h-[600px] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg)', border: '2.5px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '2.5px solid #0A0A0A' }}>
          <button onClick={onClose} className="text-white hover:opacity-70"><ArrowLeft size={16} /></button>
          <Avatar user={peer} size={34} />
          <div className="flex-1">
            <p className="text-white font-black text-sm">{peer.full_name}</p>
            <div className="flex items-center gap-1">
              <Shield size={10} style={{ color: '#00C853' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{t('encrypted')}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <Shield size={32} className="mx-auto mb-2" style={{ color: 'var(--muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--muted)' }}>{t('messages_encrypted')}</p>
              <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>{t('say_hello', { name: peer.full_name?.split(' ')[0] })}</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-xs rounded-2xl px-4 py-2.5"
                  style={isMe
                    ? { background: '#FF5C00', color: '#fff', border: '2px solid #0A0A0A', borderBottomRightRadius: '4px' }
                    : { background: 'var(--surface)', color: 'var(--ink)', border: '2px solid #0A0A0A', borderBottomLeftRadius: '4px' }
                  }>
                  <p className="text-sm font-medium">{msg.content}</p>
                  <p className="text-xs mt-0.5" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : '#aaa' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 p-3 flex-shrink-0" style={{ borderTop: '2.5px solid #0A0A0A' }}>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
            placeholder={t('type_message')} className="nb-input flex-1 py-2 text-sm" />
          <button onClick={sendMsg} disabled={!text.trim() || sending}
            className="nb-btn nb-btn-orange px-3 py-2 disabled:opacity-40">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage({ user }: any) {
  const { t } = useI18n();
  const [tab, setTab]             = useState<'suggestions' | 'network' | 'requests'>('suggestions');
  const [suggestions, setSugg]    = useState<any[]>([]);
  const [network, setNetwork]     = useState<any[]>([]);
  const [requests, setRequests]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [profileId, setProfileId] = useState<number | null>(null);
  const [chatPeer, setChatPeer]   = useState<any>(null);
  const [connecting, setConnecting] = useState<Set<number>>(new Set());

  const fetchAll = async () => {
    setLoading(true);
    const [s, n, r] = await Promise.all([
      apiRequest('/api/connections?mode=suggestions').then(r => r.json()),
      apiRequest('/api/connections?mode=network').then(r => r.json()),
      apiRequest('/api/connections?mode=requests').then(r => r.json()),
    ]);
    if (Array.isArray(s)) setSugg(s);
    if (Array.isArray(n)) setNetwork(n);
    if (Array.isArray(r)) setRequests(r);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleConnect = async (userId: number) => {
    setConnecting(prev => new Set([...prev, userId]));
    await apiRequest('/api/connections', { method: 'POST', body: JSON.stringify({ addressee_id: userId }) });
    setSugg(prev => prev.filter(u => u.id !== userId));
    setConnecting(prev => { const s = new Set(prev); s.delete(userId); return s; });
  };

  const handleRespond = async (connId: number, action: 'accept' | 'reject') => {
    await apiRequest('/api/connections', { method: 'PUT', body: JSON.stringify({ connection_id: connId, action }) });
    fetchAll();
  };

  const activeList = tab === 'suggestions' ? suggestions : tab === 'network' ? network : requests;
  const filtered = search ? activeList.filter(u => {
    const name = (u.full_name || u.requester?.full_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  }) : activeList;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="nb-card p-5 mb-5" style={{ background: 'var(--navy)' }}>
        <h1 className="text-white font-black text-2xl mb-1">{t('network')}</h1>
        <p className="font-bold text-sm" style={{ color: '#A0AEC0' }}>{t('connect_peers')}</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: t('suggestions'), value: suggestions.length, tab: 'suggestions' as const },
            { label: t('connected'),   value: network.length,     tab: 'network' as const },
            { label: t('requests'),    value: requests.length,    tab: 'requests' as const },
          ].map(s => (
            <button key={s.tab} onClick={() => setTab(s.tab)}
              className="p-3 rounded-xl text-center transition-all"
              style={tab === s.tab
                ? { background: '#FF5C00', border: '2px solid #FFD600', boxShadow: '3px 3px 0 #0A0A0A' }
                : { background: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' }
              }>
              <p className="font-black text-lg" style={{ color: tab === s.tab ? '#fff' : '#0A0A0A' }}>{s.value}</p>
              <p className="text-xs font-bold" style={{ color: tab === s.tab ? '#fff' : '#0A0A0A' }}>{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('search_by_name')} className="nb-input pl-9 text-sm" />
      </div>

      {/* Lists */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="nb-card p-4 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl" style={{ background: '#e0ddd6' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded" style={{ background: '#e0ddd6' }} />
                <div className="h-2 w-1/2 rounded" style={{ background: '#e0ddd6' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="nb-card p-10 text-center">
          <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
          <p className="font-black text-lg mb-1">
            {tab === 'suggestions' ? t('no_suggestions') : tab === 'network' ? t('no_connections') : t('requests_pending')}
          </p>
          <p className="text-sm font-bold" style={{ color: '#999' }}>
            {tab === 'suggestions' ? t('add_interests_find') : t('grow_network')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'requests' ? filtered.map((req: any) => (
            <div key={req.id} className="nb-card p-4 flex items-center gap-3">
              <Avatar user={req.requester} size={40} />
              <div className="flex-1">
                <p className="font-black text-sm">{req.requester?.full_name}</p>
                <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{t('wants_to_connect')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRespond(req.id, 'accept')}
                  className="nb-btn nb-btn-orange px-3 py-1.5 text-xs flex items-center gap-1">
                  <Check size={11} /> {t('accept')}
                </button>
                <button onClick={() => handleRespond(req.id, 'reject')}
                  className="nb-btn nb-btn-ghost px-3 py-1.5 text-xs flex items-center gap-1">
                  <X size={11} /> {t('decline')}
                </button>
              </div>
            </div>
          )) : filtered.map((u: any) => {
            const sharedInterests = JSON.parse(u.interests || '[]')
              .filter((id: string) => JSON.parse(user.interests || '[]').includes(id));
            return (
              <div key={u.id} className="nb-card p-4 flex items-center gap-3">
                <button onClick={() => setProfileId(u.id)} className="flex-shrink-0">
                  <Avatar user={u} size={42} />
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={() => setProfileId(u.id)} className="text-left">
                    <p className="font-black text-sm">{u.full_name}</p>
                    {u.education_level && <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{u.education_level}</p>}
                    {sharedInterests.length > 0 && (
                      <p className="text-xs font-bold" style={{ color: '#FF5C00' }}>
                        {t('shared_interests', { count: sharedInterests.length, s: sharedInterests.length > 1 ? 's' : '' })}
                      </p>
                    )}
                  </button>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {tab === 'network' ? (
                    <button onClick={() => setChatPeer(u)}
                      className="nb-btn nb-btn-navy px-3 py-1.5 text-xs flex items-center gap-1">
                      <MessageCircle size={11} /> {t('chat')}
                    </button>
                  ) : (
                    <button onClick={() => handleConnect(u.id)}
                      disabled={connecting.has(u.id)}
                      className="nb-btn nb-btn-orange px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-50">
                      {connecting.has(u.id) ? t('sent') : <><UserPlus size={11} /> {t('connect')}</>}
                    </button>
                  )}
                  <button onClick={() => setProfileId(u.id)}
                    className="nb-btn nb-btn-ghost px-2 py-1.5 text-xs">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {profileId && (
        <UserProfileModal
          userId={profileId}
          currentUser={user}
          onClose={() => setProfileId(null)}
          onStartChat={(peer: any) => { setProfileId(null); setChatPeer(peer); }}
        />
      )}
      {chatPeer && (
        <ChatWindow peer={chatPeer} currentUser={user} onClose={() => setChatPeer(null)} />
      )}
    </div>
  );
}
