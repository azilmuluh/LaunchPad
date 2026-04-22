import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/auth';
import OpportunityCard from '../components/OpportunityCard';
import { Search, RefreshCw, Sparkles, Plus, Globe, Users, AlertCircle, Filter } from 'lucide-react';
import { INTERESTS } from '../lib/interests';

const CATS = [
  { id: 'all',         label: 'All',          emoji: '✨' },
  { id: 'scholarship', label: 'Scholarships', emoji: '🎓' },
  { id: 'internship',  label: 'Internships',  emoji: '💼' },
  { id: 'competition', label: 'Competitions', emoji: '🏆' },
  { id: 'event',       label: 'Events',       emoji: '🎉' },
  { id: 'job',         label: 'Jobs',         emoji: '🚀' },
  { id: 'grant',       label: 'Grants',       emoji: '💰' },
];

type Tab = 'discover' | 'community';

export default function FeedPage({ user }: any) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('discover');

  const [discoverItems,      setDiscoverItems]      = useState<any[]>([]);
  const [discoverPage,       setDiscoverPage]       = useState(1);
  const [discoverHasMore,    setDiscoverHasMore]    = useState(true);
  const [discoverLoading,    setDiscoverLoading]    = useState(true);
  const [discoverLoadMore,   setDiscoverLoadMore]   = useState(false);
  const [discoverError,      setDiscoverError]      = useState('');

  const [communityItems,     setCommunityItems]     = useState<any[]>([]);
  const [communityPage,      setCommunityPage]      = useState(1);
  const [communityHasMore,   setCommunityHasMore]   = useState(true);
  const [communityLoading,   setCommunityLoading]   = useState(true);
  const [communityLoadMore,  setCommunityLoadMore]  = useState(false);

  const [cat,       setCat]       = useState('all');
  const [search,    setSearch]    = useState('');
  const [bookmarks, setBookmarks] = useState(new Set<string>());
  const [refreshing,setRefreshing]= useState(false);

  const dLoaderRef = useRef<HTMLDivElement>(null);
  const cLoaderRef = useRef<HTMLDivElement>(null);

  const interests = JSON.parse(user.interests || '[]');

  /* ── fetch discover ── */
  const fetchDiscover = useCallback(async (p = 1, c = cat, reset = false) => {
    if (p === 1) { setDiscoverLoading(true); setDiscoverError(''); }
    else setDiscoverLoadMore(true);
    try {
      const res  = await apiRequest(`/api/opportunities?page=${p}&category=${c}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setDiscoverItems(prev => (reset || p === 1) ? (data.items || []) : [...prev, ...(data.items || [])]);
      setDiscoverHasMore(!!data.hasMore);
      setDiscoverPage(p);
    } catch (e: any) {
      setDiscoverError(e.message);
    } finally {
      setDiscoverLoading(false);
      setDiscoverLoadMore(false);
      setRefreshing(false);
    }
  }, [cat]);

  /* ── fetch community ── */
  const fetchCommunity = useCallback(async (p = 1, c = cat, reset = false) => {
    if (p === 1) setCommunityLoading(true);
    else setCommunityLoadMore(true);
    try {
      const res  = await apiRequest(`/api/verified-opps?page=${p}&category=${c}&limit=12`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setCommunityItems(prev => (reset || p === 1) ? (data.items || []) : [...prev, ...(data.items || [])]);
      setCommunityHasMore(!!data.hasMore);
      setCommunityPage(p);
    } catch (e: any) { console.error(e); }
    finally { setCommunityLoading(false); setCommunityLoadMore(false); }
  }, [cat]);

  useEffect(() => {
    if (tab === 'discover') fetchDiscover(1, cat, true);
    else                    fetchCommunity(1, cat, true);
  }, [cat, tab]);

  /* ── infinite scroll ── */
  useEffect(() => {
    const el = dLoaderRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && discoverHasMore && !discoverLoadMore && !discoverLoading)
        fetchDiscover(discoverPage + 1, cat);
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [discoverHasMore, discoverLoadMore, discoverLoading, discoverPage, cat]);

  useEffect(() => {
    const el = cLoaderRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && communityHasMore && !communityLoadMore && !communityLoading)
        fetchCommunity(communityPage + 1, cat);
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [communityHasMore, communityLoadMore, communityLoading, communityPage, cat]);

  /* ── bookmarks ── */
  useEffect(() => {
    apiRequest('/api/bookmarks').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setBookmarks(new Set(d.map((b: any) => b.link)));
    }).catch(() => {});
  }, []);

  const handleBookmark = async (item: any) => {
    if (bookmarks.has(item.link)) {
      await apiRequest('/api/bookmarks', { method: 'DELETE', body: JSON.stringify({ link: item.link }) });
      setBookmarks(prev => { const s = new Set(prev); s.delete(item.link); return s; });
    } else {
      await apiRequest('/api/bookmarks', { method: 'POST', body: JSON.stringify(item) });
      setBookmarks(prev => new Set([...prev, item.link]));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (tab === 'discover') fetchDiscover(1, cat, true);
    else                    fetchCommunity(1, cat, true);
  };

  const raw      = tab === 'discover' ? discoverItems : communityItems;
  const isLoad   = tab === 'discover' ? discoverLoading  : communityLoading;
  const isMore   = tab === 'discover' ? discoverLoadMore : communityLoadMore;
  const hasMore  = tab === 'discover' ? discoverHasMore  : communityHasMore;

  const filtered = search.trim()
    ? raw.filter(i =>
        (i.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.description || i.snippet || '').toLowerCase().includes(search.toLowerCase())
      )
    : raw;

  const interestLabels = interests.slice(0, 4).map((id: string) => {
    const int = INTERESTS.find((i: any) => i.id === id);
    return int ? int.label : id;
  });

  return (
    <div className="min-h-screen" style={{ background: '#080F1E' }}>

      {/* ── Hero header ── */}
      <div className="px-4 pt-8 pb-0" style={{ background: 'linear-gradient(180deg, #0B1628 0%, #080F1E 100%)' }}>
        <div className="max-w-5xl mx-auto">

          {/* Greeting */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-white text-2xl font-bold">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Welcome back, <span style={{ color: '#F97316' }}>{user.full_name?.split(' ')[0]}</span> 👋
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/post')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F97316, #c2410c)', color: 'white' }}>
                <Plus size={14} /> Post
              </button>
              <button onClick={handleRefresh} disabled={refreshing}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Interest pills */}
          {interestLabels.length > 0 && tab === 'discover' && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Sparkles size={11} style={{ color: '#F97316' }} />
              <span className="text-slate-600 text-xs">Personalised for:</span>
              {interestLabels.map((l: string) => (
                <span key={l} className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: 'rgba(249,115,22,0.08)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.15)' }}>
                  {l}
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#334155' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search opportunities…"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-white outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', caretColor: '#F97316' }}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              { id: 'discover',  label: 'Discover',         icon: <Globe  size={12} /> },
              { id: 'community', label: 'Community Posted', icon: <Users  size={12} /> },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={tab === t.id
                  ? { background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.25)' }
                  : { color: '#334155' }
                }>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={{
                  background: cat === c.id ? '#F97316'                  : 'rgba(255,255,255,0.04)',
                  color:      cat === c.id ? 'white'                    : '#334155',
                  border:     cat === c.id ? 'none'                     : '1px solid rgba(255,255,255,0.06)',
                  boxShadow:  cat === c.id ? '0 4px 14px rgba(249,115,22,0.3)' : 'none',
                }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-5xl mx-auto px-4 py-5">

        {/* Error */}
        {tab === 'discover' && discoverError && !discoverLoading && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertCircle size={15} style={{ color: '#fca5a5' }} />
            <span className="text-sm flex-1" style={{ color: '#fca5a5' }}>{discoverError}</span>
            <button onClick={() => fetchDiscover(1, cat, true)}
              className="text-xs font-bold px-3 py-1 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>Retry</button>
          </div>
        )}

        {/* Skeleton */}
        {isLoad ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-[3px]" style={{ background: 'rgba(249,115,22,0.15)' }} />
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-20 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-5 w-14 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                  <div className="h-4 w-4/5 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <div className="h-4 w-3/5 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <div className="h-3 w-full rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <div className="h-3 w-4/5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <div className="flex gap-2 pt-2">
                    <div className="h-9 flex-1 rounded-xl animate-pulse" style={{ background: 'rgba(249,115,22,0.07)' }} />
                    <div className="h-9 flex-1 rounded-xl animate-pulse" style={{ background: 'rgba(249,115,22,0.12)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">{tab === 'community' ? '📢' : '🔍'}</div>
            <h3 className="text-white text-xl font-bold mb-2">
              {tab === 'community' ? 'No community posts yet' : 'No opportunities found'}
            </h3>
            <p className="text-sm mb-5" style={{ color: '#334155' }}>
              {tab === 'community'
                ? 'Be the first to share a life-changing opportunity!'
                : 'Try a different category, or check back after a refresh.'}
            </p>
            {tab === 'community' && (
              <button onClick={() => navigate('/post')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #F97316, #c2410c)' }}>
                <Plus size={14} /> Post First Opportunity
              </button>
            )}
          </div>

        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: '#1e293b' }}>
              {filtered.length} opportunity{filtered.length !== 1 ? 'ies' : 'y'}
              {search && ` matching "${search}"`}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item: any, idx: number) => (
                <OpportunityCard
                  key={`${item.link || item.id}-${idx}`}
                  item={item}
                  user={user}
                  isBookmarked={bookmarks.has(item.link)}
                  onBookmark={() => handleBookmark(item)}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={tab === 'discover' ? dLoaderRef : cLoaderRef} className="py-10 flex justify-center">
              {isMore && (
                <div className="flex items-center gap-3 text-sm" style={{ color: '#1e293b' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  Loading more…
                </div>
              )}
              {!hasMore && filtered.length > 0 && (
                <p className="text-xs" style={{ color: '#1e293b' }}>All opportunities loaded ✓</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
