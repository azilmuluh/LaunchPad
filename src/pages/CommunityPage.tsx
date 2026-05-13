import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/auth';
import {
  Heart, MessageCircle, Share2, Trash2, Send,
  Plus, Users, Globe, Lock, ChevronRight, Search, X
} from 'lucide-react';
import SEO from '../components/SEO';
import { triggerBadgeCheck } from '../components/BadgeToast';
import { useI18n } from '../lib/i18n';

const GET_POST_CATS = (t: any) => [
  { id: 'win',         label: t('win') || 'Win',         emoji: '\uD83C\uDF89', color: '#00C853', bg: '#E8FFF0' },
  { id: 'tip',         label: t('tip') || 'Tip',         emoji: '\uD83D\uDCA1', color: '#FF5C00', bg: '#FFF3EE' },
  { id: 'thought',     label: t('thought') || 'Thought',     emoji: '\uD83D\uDCAD', color: '#7C3AED', bg: '#F3F0FF' },
  { id: 'opportunity', label: t('opportunity') || 'Opportunity', emoji: '\uD83D\uDE80', color: 'var(--surface)', bg: '#EEF2FF' },
];

function useTimeAgo() {
  const { t } = useI18n();
  return (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
    if (m < 1) return t('just_now');
    if (m < 60) return t('m_ago', { n: m });
    if (h < 24) return t('h_ago', { n: h });
    if (dy < 7) return t('d_ago', { n: dy });
    return new Date(d).toLocaleDateString(t('lang') === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
  };
}

function PostCard({ post, currentUser, onUpdated, onDeleted }: any) {
  const { t } = useI18n();
  const timeAgo = useTimeAgo();
  const [liked, setLiked]       = useState(post.liked_by_me || false);
  const [likes, setLikes]       = useState(post.likes_count || 0);
  const [showCmts, setShowCmts] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [cmtText, setCmtText]   = useState('');
  const [posting, setPosting]   = useState(false);
  const [shared, setShared]     = useState(false);
  const cat     = GET_POST_CATS(t).find(c => c.id === post.category);
  const isOwner = currentUser?.id === post.user_id;
  const hue     = (post.user_name?.charCodeAt(0) || 200) % 360;

  const handleLike = async () => {
    const next = !liked;
    setLiked(next); setLikes((c: number) => next ? c + 1 : Math.max(0, c - 1));
    try {
      const r = await apiRequest('/api/likes', { method: 'POST', body: JSON.stringify({ post_id: post.id }) });
      const d = await r.json();
      if (r.ok) { setLikes(d.likes_count); setLiked(d.liked); }
    } catch {}
  };

  const loadCmts = async () => {
    if (comments.length) return;
    const r = await apiRequest(`/api/comments?post_id=${post.id}`);
    const d = await r.json();
    if (Array.isArray(d)) setComments(d);
  };

  const handleComment = async () => {
    if (!cmtText.trim() || posting) return;
    setPosting(true);
    try {
      const r = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ post_id: post.id, content: cmtText.trim() }),
      });
      const d = await r.json();
      if (r.ok) {
        setComments(p => [...p, d]);
        setCmtText('');
        onUpdated({ ...post, comments_count: (post.comments_count || 0) + 1 });
        apiRequest('/api/leaderboard', { method: 'POST', body: JSON.stringify({ action: 'comment' }) }).catch(() => {});
      }
    } catch {}
    setPosting(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('delete_post_confirm'))) return;
    await apiRequest('/api/posts', { method: 'DELETE', body: JSON.stringify({ id: post.id }) });
    onDeleted(post.id);
  };

  return (
    <div className="nb-card overflow-hidden">
      {cat && <div className="h-1.5" style={{ background: cat.color }} />}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: `hsl(${hue},55%,40%)`, border: '2px solid #0A0A0A' }}>
              {post.user_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">{post.user_name}</span>
                {cat && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: cat.bg, color: cat.color, border: `1.5px solid ${cat.color}` }}>
                    {cat.emoji} {cat.label}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{timeAgo(post.created_at)}</span>
            </div>
          </div>
          {isOwner && (
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:opacity-60 transition-opacity"
              style={{ border: '1.5px solid var(--border)' }}>
              <Trash2 size={12} style={{ color: 'var(--muted)' }} />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm font-medium leading-relaxed mb-3" style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>

        {post.opportunity_link && (
          <a href={post.opportunity_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-xl mb-3 hover:opacity-80 transition-opacity"
            style={{ background: '#FFF3EE', border: '2px solid #FF5C00' }}>
            <div className="min-w-0">
              <p className="text-xs font-black truncate" style={{ color: '#FF5C00' }}>
                {post.opportunity_title || post.opportunity_link}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{post.opportunity_link}</p>
            </div>
          </a>
        )}

        {/* Engagement */}
        <div className="flex items-center gap-2 pt-3" style={{ borderTop: '2px solid var(--border)' }}>
          <button onClick={handleLike}
            className="nb-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-black"
            style={liked
              ? { background: '#FFE8E8', color: '#E53935', borderColor: '#E53935' }
              : { background: 'var(--surface)', color: 'var(--muted)' }
            }>
            <Heart size={12} fill={liked ? '#E53935' : 'none'} /> {likes} {t('likes' as any)}
          </button>
          <button
            onClick={() => { const n = !showCmts; setShowCmts(n); if (n) loadCmts(); }}
            className="nb-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-black"
            style={showCmts
              ? { background: '#EEF2FF', color: '#3730a3', borderColor: '#3730a3' }
              : { background: 'var(--surface)', color: 'var(--muted)' }
            }>
            <MessageCircle size={12} /> {post.comments_count || 0} {t('comments')}
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(post.content).catch(() => {});
              setShared(true);
              setTimeout(() => setShared(false), 2000);
            }}
            className="nb-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-black"
            style={shared
              ? { background: '#E8FFF0', color: '#00C853', borderColor: '#00C853' }
              : { background: 'var(--surface)', color: 'var(--muted)' }
            }>
            <Share2 size={12} /> {shared ? t('copied') : t('share')}
          </button>
        </div>
      </div>

      {/* Comments */}
      {showCmts && (
        <div className="px-4 pb-4" style={{ borderTop: '2px solid var(--border)', background: 'var(--surface)' }}>
          <div className="pt-3 space-y-3">
            {comments.length === 0
              ? <p className="text-xs font-bold text-center py-2" style={{ color: 'var(--muted)' }}>{t('no_comments_yet')}</p>
              : comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: `hsl(${(c.user_name?.charCodeAt(0)||150)%360},50%,40%)`, border: '1.5px solid #0A0A0A' }}>
                    {c.user_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">{c.user_name}</span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{c.content}</p>
                  </div>
                </div>
              ))
            }
            <div className="flex gap-2 pt-1">
              <input
                value={cmtText}
                onChange={e => setCmtText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder={t('add_comment')}
                className="nb-input text-xs py-2 flex-1"
              />
              <button
                onClick={handleComment}
                disabled={!cmtText.trim() || posting}
                className="nb-btn nb-btn-orange px-3 py-2 text-xs disabled:opacity-40">
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePost({ user, onCreated }: any) {
  const { t } = useI18n();
  const [content, setContent]   = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content, category }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onCreated(d);
      setContent(''); setCategory(''); setExpanded(false);
      apiRequest('/api/leaderboard', { method: 'POST', body: JSON.stringify({ action: 'community_post' }) })
        .then(() => triggerBadgeCheck())
        .catch(() => {});
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="nb-card p-4">
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="w-full flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black text-white"
            style={{ background: '#FF5C00', border: '2px solid #0A0A0A' }}>
            {user.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>{t('share_win')}</span>
        </button>
      ) : (
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black text-white"
            style={{ background: '#FF5C00', border: '2px solid #0A0A0A' }}>
            {user.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t('mind_share')}
              rows={3}
              autoFocus
              className="nb-input resize-none text-sm leading-relaxed w-full"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {GET_POST_CATS(t).map(c => (
                <button key={c.id}
                  onClick={() => setCategory(ct => ct === c.id ? '' : c.id)}
                  className="nb-btn px-2.5 py-1 text-xs"
                  style={category === c.id
                    ? { background: c.color, color: 'var(--ink)', borderColor: c.color }
                    : { background: 'var(--surface)', color: 'var(--muted)' }
                  }>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            {error && <p className="text-xs font-bold mt-2" style={{ color: '#E53935' }}>{error}</p>}
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '2px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: content.length > 480 ? '#E53935' : '#bbb' }}>
                  {content.length}/500
                </span>
                <button
                  onClick={() => { setExpanded(false); setContent(''); setCategory(''); }}
                  className="nb-btn nb-btn-ghost px-3 py-1.5 text-xs">
                  {t('cancel')}
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={!content.trim() || loading || content.length > 500}
                className="nb-btn nb-btn-orange px-4 py-2 text-sm disabled:opacity-40">
                {loading ? t('posting_btn') : t('post')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CircleCard({ circle, isMember, onJoin, onClick }: any) {
  const { t } = useI18n();
  const hue = (circle.name?.charCodeAt(0) || 180) % 360;
  return (
    <div className="nb-card p-4 cursor-pointer hover:shadow-lg transition-all" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `hsl(${hue},55%,92%)`, border: '2px solid #0A0A0A' }}>
            {circle.emoji || '\uD83D\uDC65'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm">{circle.name}</h3>
              {circle.is_private
                ? <Lock size={11} style={{ color: 'var(--muted)' }} />
                : <Globe size={11} style={{ color: '#00C853' }} />
              }
            </div>
            <p className="text-xs font-bold" style={{ color: '#999' }}>
              {circle.member_count || 0} {t('members')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMember ? (
            <span className="nb-badge" style={{ color: '#065F46', borderColor: '#065F46', background: '#ECFDF5' }}>{t('joined')}</span>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onJoin(); }}
              className="nb-btn nb-btn-orange px-3 py-1.5 text-xs">
              {t('join')}
            </button>
          )}
          <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
        </div>
      </div>
      {circle.description && (
        <p className="text-xs font-medium mt-2" style={{ color: 'var(--muted)' }}>
          {circle.description.slice(0, 100)}{circle.description.length > 100 ? '...' : ''}
        </p>
      )}
      {circle.goal && (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5"
          style={{ background: '#FFF3EE', border: '1.5px solid #FF5C00' }}>
          <span className="text-xs font-black" style={{ color: '#FF5C00' }}>{t('circle_goal')}: {circle.goal}</span>
        </div>
      )}
    </div>
  );
}

function CreateCircleModal({ user, onClose, onCreated }: any) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: '', description: '', goal: '', emoji: '\uD83D\uDC65', is_private: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const EMOJIS = ['\uD83D\uDC65','\uD83D\uDE80','\uD83C\uDF93','\uD83D\uDCBC','\uD83C\uDFC6','\uD83D\uDCA1','\uD83C\uDF0D','\uD83D\uDCDA','\uD83D\uDCBB','\u2696\uFE0F','\uD83C\uDFA8','\u2699\uFE0F'];

  const submit = async () => {
    if (!form.name.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await apiRequest('/api/circles', { method: 'POST', body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onCreated(d); onClose();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden nb-card">
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '2px solid #f0ede6' }}>
          <h2 className="font-black text-lg">{t('create_circle')}</h2>
          <button onClick={onClose} className="nb-btn nb-btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('icon')}</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className="w-9 h-9 rounded-xl text-lg nb-btn"
                  style={form.emoji === e ? { background: '#FF5C00', borderColor: '#FF5C00' } : { background: 'var(--surface)' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('circle_name')} *</label>
            <input className="nb-input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. 2026 IYMC Applicants" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('circle_goal')}</label>
            <input className="nb-input" value={form.goal}
              onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              placeholder="e.g. Prepare for IYMC Pre-Final 2026" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('circle_desc')}</label>
            <textarea className="nb-input resize-none" rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this circle about?" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{t('private_circle')}</p>
              <p className="text-xs font-bold" style={{ color: '#999' }}>{t('private_circle_desc')}</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, is_private: !f.is_private }))}
              className="w-12 h-6 rounded-full relative"
              style={{ background: form.is_private ? '#FF5C00' : '#e0ddd6', border: '2px solid #0A0A0A' }}>
              <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                style={{ background: 'var(--surface)', border: '1.5px solid #0A0A0A', left: form.is_private ? '26px' : '2px' }} />
            </button>
          </div>
          {error && <p className="text-xs font-bold" style={{ color: '#E53935' }}>{error}</p>}
          <button onClick={submit} disabled={!form.name.trim() || loading}
            className="nb-btn nb-btn-orange w-full py-3 text-sm disabled:opacity-40">
            {loading ? t('creating') : t('create_circle')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage({ user }: any) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab]           = useState<'feed' | 'circles'>('feed');
  const [posts, setPosts]       = useState<any[]>([]);
  const [circles, setCircles]   = useState<any[]>([]);
  const [memberOf, setMemberOf] = useState(new Set<number>());
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // User's interests for personalized feed
  const userInterests: string[] = JSON.parse(user.interests || '[]');
  const interestParam = userInterests.join(',');

  const fetchPosts = async (p = 1, reset = false) => {
    if (p === 1) setLoading(true); else setLoadMore(true);
    try {
      // Pass interests to backend for server-side personalized filtering
      const params = new URLSearchParams({ page: String(p), limit: '10' });
      if (interestParam) params.set('interests', interestParam);
      const r = await apiRequest(`/api/posts?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPosts(prev => (reset || p === 1) ? (d.posts || []) : [...prev, ...(d.posts || [])]);
      setHasMore(!!d.hasMore);
      setPage(p);
      setTotal(d.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadMore(false); }
  };

  const fetchCircles = async () => {
    try {
      const r = await apiRequest('/api/circles');
      const d = await r.json();
      if (Array.isArray(d.circles)) {
        setCircles(d.circles);
        setMemberOf(new Set(d.member_of || []));
      }
    } catch {}
  };

  useEffect(() => { fetchPosts(1, true); fetchCircles(); }, []);

  // Re-fetch circles when tab becomes visible again (e.g. returning from CirclePage)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchCircles(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    const el = loaderRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loadMore) fetchPosts(page + 1);
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [hasMore, loadMore, page]);

  const handleJoinCircle = async (id: number) => {
    try {
      await apiRequest('/api/circles', { method: 'POST', body: JSON.stringify({ action: 'join', circle_id: id }) });
      setMemberOf(prev => new Set([...prev, id]));
      setCircles(prev => prev.map(c => c.id === id ? { ...c, member_count: (c.member_count || 0) + 1 } : c));
    } catch {}
  };

  // Client-side search filter (on top of server-side interest filter)
  const filteredPosts = search
    ? posts.filter(p =>
        p.content?.toLowerCase().includes(search.toLowerCase()) ||
        p.user_name?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const filteredCircles = search
    ? circles.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.goal?.toLowerCase().includes(search.toLowerCase())
      )
    : circles;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <SEO 
        title="Community" 
        description="Connect with other students and professionals, share tips, and find study groups in the LaunchPad community."
        canonical="/community"
      />

      {/* Header — clean, no branding labels */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-black text-2xl">{t('community')}</h1>
          <p className="text-sm font-bold" style={{ color: '#999' }}>
            {total > 0 ? t('community_stats', { count: total, s: total !== 1 ? 's' : '' }) : t('be_first_post')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="nb-btn nb-btn-orange flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus size={14} /> {t('new_circle')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'feed' ? t('search_posts') : t('search_circles')}
          className="nb-input pl-9 text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {(['feed', 'circles'] as const).map(t_tab => (
          <button key={t_tab} onClick={() => setTab(t_tab)}
            className="nb-btn px-5 py-2 text-sm capitalize"
            style={tab === t_tab
              ? { background: 'var(--navy)', color: '#fff', border: '2.5px solid var(--border)' }
              : { background: 'var(--surface)', color: 'var(--ink)', border: '2.5px solid var(--border)' }
            }>
            {t_tab === 'feed' ? t('feed') : `${t('circles_tab')}${circles.length > 0 ? ` (${circles.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* FEED */}
      {tab === 'feed' && (
        <>
          <div className="mb-4">
            <CreatePost
              user={user}
              onCreated={(p: any) => { setPosts(prev => [p, ...prev]); setTotal(t => t + 1); }}
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="nb-card p-5 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl" style={{ background: '#e0ddd6' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded" style={{ background: '#e0ddd6' }} />
                      <div className="h-2 w-1/4 rounded" style={{ background: '#e0ddd6' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded" style={{ background: '#e0ddd6' }} />
                    <div className="h-3 w-4/5 rounded" style={{ background: '#e0ddd6' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="nb-card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#FFF3EE', border: '2.5px solid #FF5C00' }}>
                <Users size={24} style={{ color: '#FF5C00' }} />
              </div>
              <h3 className="font-black text-lg mb-1">{t('no_posts_yet')}</h3>
              <p className="text-sm font-bold" style={{ color: '#999' }}>
                {t('be_first_post')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, idx) => (
                <div key={post.id} className="anim-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <PostCard
                    post={post}
                    currentUser={user}
                    onUpdated={(up: any) => setPosts(prev => prev.map(p => p.id === up.id ? up : p))}
                    onDeleted={(id: number) => { setPosts(prev => prev.filter(p => p.id !== id)); setTotal(t => t - 1); }}
                  />
                </div>
              ))}
              <div ref={loaderRef} className="py-4 flex justify-center">
                {loadMore && (
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{t('all_caught_up')}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* CIRCLES */}
      {tab === 'circles' && (
        filteredCircles.length === 0 ? (
          <div className="nb-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#EEF2FF', border: '2.5px solid var(--surface)' }}>
              <Users size={24} style={{ color: 'var(--surface)' }} />
            </div>
            <h3 className="font-black text-lg mb-1">{t('no_circles_yet')}</h3>
            <p className="text-sm font-bold mb-4" style={{ color: '#999' }}>{t('create_study_group')}</p>
            <button onClick={() => setShowCreate(true)} className="nb-btn nb-btn-orange px-5 py-2.5 text-sm">
              {t('create_first_circle')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCircles.map((c, idx) => (
              <div key={c.id} className="anim-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <CircleCard
                  circle={c}
                  isMember={memberOf.has(c.id)}
                  onJoin={() => handleJoinCircle(c.id)}
                  onClick={() => navigate(`/community/${c.id}`)}
                />
              </div>
            ))}
          </div>
        )
      )}

      {showCreate && (
        <CreateCircleModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={(c: any) => {
            setCircles(prev => [c, ...prev]);
            setMemberOf(prev => new Set([...prev, c.id]));
            triggerBadgeCheck();
          }}
        />
      )}
    </div>
  );
}
