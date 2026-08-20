import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/auth';
import OpportunityCard from '../components/OpportunityCard';
import {
  Search, RefreshCw, Sparkles, Plus, Globe, Users,
  AlertCircle, GraduationCap, Briefcase, Trophy,
  PartyPopper, Rocket, DollarSign, Zap, MapPin, Wifi
} from 'lucide-react';
import { INTERESTS } from '../lib/interests';
import SEO from '../components/SEO';
import { useI18n } from '../lib/i18n';

const CATS = [
  { id: 'all',         label: 'All',          icon: <Sparkles size={14} /> },
  { id: 'scholarship', label: 'Scholarships', icon: <GraduationCap size={14} /> },
  { id: 'internship',  label: 'Internships',  icon: <Briefcase size={14} /> },
  { id: 'competition', label: 'Competitions', icon: <Trophy size={14} /> },
  { id: 'event',       label: 'Events',       icon: <PartyPopper size={14} /> },
  { id: 'job',         label: 'Jobs',         icon: <Rocket size={14} /> },
  { id: 'grant',       label: 'Grants',       icon: <DollarSign size={14} /> },
];

type Tab = 'discover' | 'community';

/** Generate a short random nonce to bust shuffle seed on each refresh */
function newNonce() {
  return Math.random().toString(36).slice(2, 10);
}

export default function FeedPage({ user }: any) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('discover');

  const [discoverItems,    setDiscoverItems]    = useState<any[]>([]);
  const [discoverPage,     setDiscoverPage]     = useState(1);
  const [discoverHasMore,  setDiscoverHasMore]  = useState(true);
  const [discoverLoading,  setDiscoverLoading]  = useState(true);
  const [discoverLoadMore, setDiscoverLoadMore] = useState(false);
  const [discoverError,    setDiscoverError]    = useState('');

  const [communityItems,    setCommunityItems]    = useState<any[]>([]);
  const [communityPage,     setCommunityPage]     = useState(1);
  const [communityHasMore,  setCommunityHasMore]  = useState(true);
  const [communityLoading,  setCommunityLoading]  = useState(true);
  const [communityLoadMore, setCommunityLoadMore] = useState(false);

  const [cat,            setCat]            = useState('all');
  const [search,         setSearch]         = useState('');
  const [debouncedSearch,setDebouncedSearch] = useState('');
  const [bookmarks,      setBookmarks]      = useState(new Set<string>());
  const [refreshing,     setRefreshing]     = useState(false);
  const [refreshNonce,   setRefreshNonce]   = useState(newNonce);

  // Location mode from settings
  const userSettings    = user.settings || {};
  const locationMode    = userSettings.location_mode || 'all';
  const userLocation    = userSettings.user_location || user.location || user.region || '';

  const dLoaderRef = useRef<HTMLDivElement>(null);
  const cLoaderRef = useRef<HTMLDivElement>(null);

  const interests = JSON.parse(user.interests || '[]');

  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // ── fetch discover ──────────────────────────────────────────────────────────
  // All params are explicit arguments — no stale-closure problem
  const fetchDiscover = useCallback(async (
    p: number,
    c: string,
    reset: boolean,
    sq: string,
    nonce: string,
    locMode: string,
    locStr: string
  ) => {
    if (p === 1) { setDiscoverLoading(true); setDiscoverError(''); }
    else setDiscoverLoadMore(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        category: c,
        nonce,
        ...(reset ? { refresh: '1' } : {}),
        ...(sq ? { search: sq } : {}),
        ...(locMode !== 'all' ? { location_mode: locMode } : {}),
        ...(locStr ? { user_location: locStr } : {}),
      });
      const res  = await apiRequest(`/api/opportunities?${params}`);
      const data = await res.json();
      setDiscoverItems(prev => {
        if (reset || p === 1) return data.items || [];
        const seen = new Set(prev.map((it: any) => it.id || it.link || it.title));
        const newItems = (data.items || []).filter((it: any) => !seen.has(it.id || it.link || it.title));
        return [...prev, ...newItems];
      });
      setDiscoverHasMore(!!data.hasMore);
      setDiscoverPage(p);
    } catch (e: any) {
      setDiscoverError(e.message);
    } finally {
      setDiscoverLoading(false);
      setDiscoverLoadMore(false);
      setRefreshing(false);
    }
  }, []); // stable — all params passed explicitly

  // ── fetch community ─────────────────────────────────────────────────────────
  const fetchCommunity = useCallback(async (p: number, c: string, reset: boolean, sq: string) => {
    if (p === 1) setCommunityLoading(true);
    else setCommunityLoadMore(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        category: c,
        limit: '25',
        ...(sq ? { search: sq } : {}),
      });
      const res  = await apiRequest(`/api/verified-opps?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setCommunityItems(prev => {
        if (reset || p === 1) return data.items || [];
        const seen = new Set(prev.map((it: any) => it.id || it.link || it.title));
        const newItems = (data.items || []).filter((it: any) => !seen.has(it.id || it.link || it.title));
        return [...prev, ...newItems];
      });
      setCommunityHasMore(!!data.hasMore);
      setCommunityPage(p);
    } catch (e: any) {
      console.error('[FeedPage] fetchCommunity error:', e);
    } finally {
      setCommunityLoading(false);
      setCommunityLoadMore(false);
      setRefreshing(false);
    }
  }, []);

  // ── Trigger on filter/search/tab change ─────────────────────────────────────
  useEffect(() => {
    if (tab === 'discover') {
      fetchDiscover(1, cat, true, debouncedSearch, refreshNonce, locationMode, userLocation);
    } else {
      fetchCommunity(1, cat, true, debouncedSearch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, tab, debouncedSearch]);

  // ── Deep link scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    if (sharedId && !discoverLoading && !communityLoading) {
      setTimeout(() => {
        const el = document.getElementById(`opp-${sharedId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [discoverLoading, communityLoading, tab]);

  // ── Stable infinite-scroll observers ────────────────────────────────────────
  // Store ALL volatile values in refs so observer callbacks read current state
  const discoverStateRef = useRef({ page: discoverPage, hasMore: discoverHasMore, loadMore: discoverLoadMore, loading: discoverLoading });
  useEffect(() => {
    discoverStateRef.current = { page: discoverPage, hasMore: discoverHasMore, loadMore: discoverLoadMore, loading: discoverLoading };
  }, [discoverPage, discoverHasMore, discoverLoadMore, discoverLoading]);

  const communityStateRef = useRef({ page: communityPage, hasMore: communityHasMore, loadMore: communityLoadMore, loading: communityLoading });
  useEffect(() => {
    communityStateRef.current = { page: communityPage, hasMore: communityHasMore, loadMore: communityLoadMore, loading: communityLoading };
  }, [communityPage, communityHasMore, communityLoadMore, communityLoading]);

  // Ref for params that change independently of the observer lifecycle
  const paramsRef = useRef({ cat, debouncedSearch, refreshNonce, locationMode, userLocation });
  useEffect(() => {
    paramsRef.current = { cat, debouncedSearch, refreshNonce, locationMode, userLocation };
  }, [cat, debouncedSearch, refreshNonce, locationMode, userLocation]);

  // Stable discover sentinel — re-attaches as soon as skeleton unmounts and sentinel mounts
  useEffect(() => {
    if (tab !== 'discover' || discoverLoading) return;
    const el = dLoaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      const s = discoverStateRef.current;
      const p = paramsRef.current;
      if (entry.isIntersecting && s.hasMore && !s.loadMore && !s.loading) {
        fetchDiscover(s.page + 1, p.cat, false, p.debouncedSearch, p.refreshNonce, p.locationMode, p.userLocation);
      }
    }, { threshold: 0.1, rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, discoverLoading, discoverItems.length, fetchDiscover]);

  // Stable community sentinel
  useEffect(() => {
    if (tab !== 'community' || communityLoading) return;
    const el = cLoaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      const s = communityStateRef.current;
      const p = paramsRef.current;
      if (entry.isIntersecting && s.hasMore && !s.loadMore && !s.loading) {
        fetchCommunity(s.page + 1, p.cat, false, p.debouncedSearch);
      }
    }, { threshold: 0.1, rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, communityLoading, communityItems.length, fetchCommunity]);

  // ── Bookmarks ────────────────────────────────────────────────────────────────
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
    const nonce = newNonce();
    setRefreshNonce(nonce);
    if (tab === 'discover') {
      setDiscoverItems([]);
      setDiscoverPage(1);
      setDiscoverHasMore(true);
      setDiscoverError('');
      fetchDiscover(1, cat, true, debouncedSearch, nonce, locationMode, userLocation);
    } else {
      setCommunityItems([]);
      setCommunityPage(1);
      setCommunityHasMore(true);
      fetchCommunity(1, cat, true, debouncedSearch);
    }
  };

  const raw    = tab === 'discover' ? discoverItems : communityItems;
  const isLoad = tab === 'discover' ? discoverLoading  : communityLoading;
  const isMore = tab === 'discover' ? discoverLoadMore : communityLoadMore;
  const hasMore = tab === 'discover' ? discoverHasMore  : communityHasMore;

  // Client-side search fallback (instant filter while debounce fires)
  const items = search.trim()
    ? raw.filter(i =>
        (i.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.description || i.snippet || '').toLowerCase().includes(search.toLowerCase())
      )
    : raw;

  const interestLabels = interests.slice(0, 4).map((id: string) => t(id as any));

  // Location mode label + icon
  const locModeLabel = locationMode === 'remote' ? 'Remote only'
    : locationMode === 'onsite' ? (userLocation ? `Near ${userLocation}` : 'Onsite')
    : 'All locations';
  const LocIcon = locationMode === 'remote' ? Wifi : MapPin;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SEO 
        title="Dashboard" 
        description="Your personalized feed of scholarships, internships, and opportunities."
        noindex
      />

      {/* ── Hero header ── */}
      <div className="px-3 md:px-4 pt-4 md:pt-8 pb-0" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto">

          {/* Greeting */}
          <div className="flex items-start justify-between mb-3 md:mb-5 gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">{t('dashboard')}</h1>
              <p className="text-xs md:text-sm mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                {t('welcome_back')}, <span style={{ color: '#FF5C00' }}>{user.full_name?.split(' ')[0]}</span> <Zap size={14} className="inline md:hidden" style={{ color: '#FF5C00' }} /><Zap size={16} className="hidden md:inline" style={{ color: '#FF5C00' }} />
              </p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <button onClick={() => navigate('/post')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F97316, #c2410c)', color: 'white' }}>
                <Plus size={14} /> {t('post')}
              </button>
              <button onClick={() => navigate('/post')}
                className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F97316, #c2410c)', color: 'white' }}>
                <Plus size={18} />
              </button>
              <button onClick={handleRefresh} disabled={refreshing}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Interest + location pills */}
          {interestLabels.length > 0 && tab === 'discover' && (
            <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 flex-wrap">
              <Sparkles size={10} className="md:hidden" style={{ color: '#F97316' }} />
              <Sparkles size={11} className="hidden md:block" style={{ color: '#F97316' }} />
              <span className="text-slate-600 text-[10px] md:text-xs">{t('personalised_for')}</span>
              {interestLabels.map((l: string) => (
                <span key={l} className="px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs"
                  style={{ background: 'rgba(249,115,22,0.08)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.15)' }}>
                  {l}
                </span>
              ))}
              {/* Location mode badge */}
              <span
                className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs cursor-pointer"
                style={{ background: locationMode === 'remote' ? 'rgba(59,130,246,0.1)' : locationMode === 'onsite' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)', color: locationMode === 'remote' ? '#60a5fa' : locationMode === 'onsite' ? '#4ade80' : '#94a3b8', border: `1px solid ${locationMode === 'remote' ? 'rgba(59,130,246,0.2)' : locationMode === 'onsite' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}` }}
                onClick={() => navigate('/settings')}
                title="Change in Settings → Discovery"
              >
                <LocIcon size={10} />
                {locModeLabel}
              </span>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3 md:mb-4">
            <Search size={13} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('search_opps')}
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl outline-none text-sm nb-input"
              style={{ caretColor: '#FF5C00' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                style={{ color: 'var(--muted)' }}
              >✕</button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-3 md:mb-4"
            style={{ background: 'var(--surface)', border: '2.5px solid var(--border)' }}>
            {([
              { id: 'discover',  label: t('discover'),         icon: <><Globe  size={11} className="md:hidden" /><Globe  size={12} className="hidden md:block" /></> },
              { id: 'community', label: t('community_posted'), icon: <><Users  size={11} className="md:hidden" /><Users  size={12} className="hidden md:block" /></> },
            ] as const).map(t_tab => (
              <button key={t_tab.id} onClick={() => setTab(t_tab.id)}
                className="flex-1 flex items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all"
                style={tab === t_tab.id
                  ? { background: '#FF5C00', color: '#fff', border: '2px solid var(--border)' }
                  : { color: 'var(--muted)' }
                }>
                {t_tab.icon} <span className="hidden sm:inline">{t_tab.label}</span>
              </button>
            ))}
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-3 md:pb-4 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className="nb-btn px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs whitespace-nowrap flex items-center gap-1 md:gap-1.5 flex-shrink-0"
                style={cat === c.id 
                  ? { background: '#FF5C00', color: '#fff' }
                  : { background: 'var(--surface)', color: 'var(--ink)' }
                }>
                {c.icon} <span className="hidden sm:inline">{t(c.id as any)}</span><span className="sm:hidden">{c.id === 'all' ? t(c.id as any) : c.id.slice(0,3)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-5">

        {/* Error */}
        {tab === 'discover' && discoverError && !discoverLoading && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertCircle size={15} style={{ color: '#fca5a5' }} />
            <span className="text-sm flex-1" style={{ color: '#fca5a5' }}>{discoverError}</span>
            <button onClick={() => fetchDiscover(1, cat, true, debouncedSearch, refreshNonce, locationMode, userLocation)}
              className="text-xs font-bold px-3 py-1 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>{t('retry')}</button>
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

        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">{tab === 'community' ? '📢' : '🔍'}</div>
            <h3 className="text-white text-xl font-bold mb-2">
              {tab === 'community' ? t('no_comm_posts') : t('no_opps_found')}
            </h3>
            <p className="text-sm mb-5" style={{ color: '#334155' }}>
              {tab === 'community'
                ? t('be_first_share')
                : t('try_different')}
            </p>
            {tab === 'community' && (
              <button onClick={() => navigate('/post')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #F97316, #c2410c)' }}>
                <Plus size={14} /> {t('post_first')}
              </button>
            )}
          </div>

        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: '#1e293b' }}>
              {t('opportunities_count', { n: items.length, s: lang === 'en' ? (items.length === 1 ? 'y' : 'ies') : (items.length > 1 ? 's' : '') })}
              {search && ` ${t('matching')} "${search}"`}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item: any, idx: number) => (
                <div key={`${item.link || item.id}-${idx}`} className="anim-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <OpportunityCard
                    item={item}
                    user={user}
                    isBookmarked={bookmarks.has(item.link)}
                    onBookmark={() => handleBookmark(item)}
                  />
                </div>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={tab === 'discover' ? dLoaderRef : cLoaderRef} className="py-10 flex flex-col items-center justify-center gap-3">
              {isMore && (
                <div className="flex items-center gap-3 text-sm font-bold" style={{ color: '#1e293b' }}>
                  <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  {t('loading_more')}
                </div>
              )}
              {hasMore && !isMore && (
                <button
                  onClick={() => {
                    if (tab === 'discover') {
                      const s = discoverStateRef.current;
                      const p = paramsRef.current;
                      if (s.hasMore && !s.loadMore && !s.loading) {
                        fetchDiscover(s.page + 1, p.cat, false, p.debouncedSearch, p.refreshNonce, p.locationMode, p.userLocation);
                      }
                    } else {
                      const s = communityStateRef.current;
                      const p = paramsRef.current;
                      if (s.hasMore && !s.loadMore && !s.loading) {
                        fetchCommunity(s.page + 1, p.cat, false, p.debouncedSearch);
                      }
                    }
                  }}
                  className="nb-btn px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 shadow-sm transition-all hover:scale-105"
                  style={{ background: '#FF5C00', color: '#fff' }}>
                  <Sparkles size={16} /> Load More Opportunities
                </button>
              )}
              {!hasMore && items.length > 0 && (
                <p className="text-xs font-bold" style={{ color: '#64748b' }}>{t('all_loaded')}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
