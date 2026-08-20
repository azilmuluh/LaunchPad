import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/auth';
import {
  Heart, MessageCircle, Share2, Sparkles,
  ArrowUpRight, Bookmark, Loader2, X, Send,
  Video, RefreshCw, Trash2
} from 'lucide-react';
import RoadmapModal from '../components/RoadmapModal';
import CreateBlipModal from '../components/CreateBlipModal';
import SEO from '../components/SEO';
import { useI18n } from '../lib/i18n';

export default function BlipsPage({ user }: any) {
  const { t } = useI18n();
  const [blips, setBlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeBlip, setActiveBlip] = useState(0);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBlips(1, true);
  }, []);

  const fetchBlips = async (pageNum: number, refresh = false) => {
    if (pageNum > 1) setLoadingMore(true);
    else setLoading(true);
    
    try {
      const res = await apiRequest(`/api/blips?page=${pageNum}`);
      const data = await res.json();
      // Support both old (array) and new ({ blips, hasMore }) response shapes
      const items: any[] = Array.isArray(data) ? data : (data.blips || []);
      const more: boolean = Array.isArray(data) ? items.length >= 5 : !!data.hasMore;
      if (refresh) {
        setBlips(items);
      } else {
        setBlips(prev => {
          const seen = new Set(prev.map((b: any) => b.embed_id || b.id));
          return [...prev, ...items.filter((b: any) => !seen.has(b.embed_id || b.id))];
        });
      }
      setHasMore(more);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchBlips(next);
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    setActiveBlip(0);
    if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
    fetchBlips(1, true);
  };

  const handleLike = async (id: string, type: string) => {
    try {
      if (navigator.vibrate) navigator.vibrate(50);
      setBlips(prev => prev.map(b => b.id === id ? { ...b, liked: !b.liked, likes_count: (b.likes_count || 0) + (b.liked ? -1 : 1) } : b));
      await apiRequest('/api/engage', {
        method: 'POST',
        body: JSON.stringify({ action: 'like', item_id: id, item_type: type })
      });
    } catch (e) { console.error(e); }
  };

  const fetchComments = async (id: string, type: string) => {
    try {
      const res = await apiRequest(`/api/engage?action=comment&item_id=${id}&item_type=${type}`);
      const data = await res.json();
      setComments(data);
    } catch (e) { console.error(e); }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    const blip = blips[activeBlip];
    try {
      const res = await apiRequest('/api/engage', {
        method: 'POST',
        body: JSON.stringify({ action: 'comment', item_id: blip.id, item_type: 'blip', content: newComment })
      });
      const data = await res.json();
      setComments(prev => [...prev, data]);
      setNewComment('');
      setBlips(prev => prev.map(b => b.id === blip.id ? { ...b, comments_count: (b.comments_count || 0) + 1 } : b));
    } catch (e) { console.error(e); }
    finally { setPostingComment(false); }
  };

  const shareBlip = (blip: any) => {
    const url = `${window.location.origin}/blips?id=${blip.id}`;
    if (navigator.share) {
      navigator.share({
        title: blip.title,
        text: `Check out this opportunity: ${blip.title}`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeBlip) {
      setActiveBlip(index);
      setCommentsOpen(false);
    }
    // Load more when user is 1 full screen from the bottom
    if (hasMore && !loadingMore && scrollTop + clientHeight >= scrollHeight - clientHeight * 1.5) {
      loadMore();
    }
  };

  if (loading && page === 1) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-white" />
    </div>
  );

  return (
    <div className="absolute inset-0 bg-black overflow-hidden flex flex-col md:flex-row">
      <SEO 
        title="Blips" 
        description="Watch short, impactful videos about the latest opportunities and educational tips."
        canonical="/blips"
        noindex={true}
      />

      {/* Floating Buttons */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3">
        <button 
          onClick={() => setShowCreate(true)}
          className="w-12 h-12 rounded-full bg-[#FFD600] border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <Video size={24} />
        </button>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="w-12 h-12 rounded-full bg-white border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
        >
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {showCreate && (
        <CreateBlipModal 
          onClose={() => setShowCreate(false)} 
          onCreated={(newBlip) => setBlips([newBlip, ...blips])} 
        />
      )}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory h-full no-scrollbar"
      >
        {blips.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Video size={48} className="text-neutral-500" />
            <p className="text-white font-black uppercase tracking-widest text-sm">{t('no_blips')}</p>
            <button onClick={handleRefresh} className="nb-btn-orange px-6 py-2">{t('try_again')}</button>
          </div>
        )}

        {blips.map((blip, i) => (
          <div key={`${blip.id}-${i}`} className="h-full w-full snap-start relative bg-neutral-900">
            {/* VIDEO LAYER */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {(() => {
                const isYouTube = blip.video_source === 'youtube' || (blip.video_url && (blip.video_url.includes('youtube') || blip.video_url.includes('youtu.be')));
                const cleanEmbedId = blip.embed_id ? blip.embed_id.replace(/^yt-/, '') : (blip.video_url ? (blip.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/) || [])[1] : null);

                if (isYouTube && cleanEmbedId) {
                  return (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${cleanEmbedId}?autoplay=${i === activeBlip ? 1 : 0}&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1`}
                      title={blip.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ pointerEvents: 'auto', border: 'none' }}
                    />
                  );
                } else if (blip.video_url && (blip.video_url.endsWith('.mp4') || blip.video_url.endsWith('.webm') || blip.video_source === 'direct')) {
                  return (
                    <video
                      className="w-full h-full object-cover"
                      src={blip.video_url}
                      controls
                      playsInline
                      autoPlay={i === activeBlip}
                      loop
                    />
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                      <Video size={36} className="text-orange-500 animate-pulse" />
                      <p className="text-white text-xs font-black uppercase tracking-widest">{blip.title}</p>
                      {blip.video_url && (
                        <a
                          href={blip.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-bold text-white flex items-center gap-1.5"
                        >
                          Watch Video <ArrowUpRight size={12} />
                        </a>
                      )}
                    </div>
                  );
                }
              })()}
            </div>

            {/* CONTEXT LAYER OVERLAY - Positioned higher to avoid navbar */}
            <div className="absolute inset-x-0 bottom-0 p-4 pb-36 md:pb-12 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none">
              <div className="max-w-xl mx-auto w-full pointer-events-auto">
                <div className="flex gap-1 mb-2">
                  {blip.tags?.map((t: string) => (
                    <span key={t} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                      #{t}
                    </span>
                  ))}
                </div>
                <h2 className="text-white font-black text-base mb-1 shadow-black drop-shadow-md" style={{ color: '#FFFFFF' }}>{blip.title}</h2>
                <div className="mb-4">
                  <p className={`text-white font-medium text-[10px] leading-relaxed ${expandedId === blip.id ? '' : 'line-clamp-2'}`} style={{ color: '#FFFFFF' }}>
                    {blip.summary}
                  </p>
                  {blip.summary && blip.summary.length > 80 && (
                    <button 
                      onClick={() => setExpandedId(expandedId === blip.id ? null : blip.id)}
                      className="text-white text-[9px] font-black uppercase mt-1 underline tracking-wider"
                      style={{ color: '#FFFFFF' }}
                    >
                      {expandedId === blip.id ? t('read_less') : t('read_more')}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {blip.type === 'opportunity' ? (
                    <>
                      <a href={blip.apply_link} target="_blank" rel="noopener noreferrer" className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-1.5 transition-all shadow-lg border border-orange-400/50">
                        {t('apply_now')} <ArrowUpRight size={10} />
                      </a>
                      <button onClick={() => setShowRoadmap(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-lg px-3 py-1.5 text-[9px] font-black flex items-center gap-1.5 transition-all">
                        <Sparkles size={10} className="text-orange-400" /> {t('roadmap')}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => shareBlip(blip)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-lg px-3 py-1.5 text-[9px] font-black flex items-center gap-1.5 transition-all">
                      <Share2 size={10} /> {t('share')}
                    </button>
                  )}
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-lg px-3 py-1.5 text-[9px] font-black flex items-center gap-1.5 transition-all">
                    <Bookmark size={10} /> {t('save')}
                  </button>
                </div>
              </div>
            </div>

            {/* SIDE ACTIONS - Positioned higher */}
            <div className="absolute right-4 bottom-44 md:bottom-24 flex flex-col gap-4 items-center">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleLike(blip.id, 'blip')}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${blip.liked ? 'bg-red-500 scale-110' : 'bg-black/40 hover:bg-black/60'} border border-white/20 backdrop-blur-md text-white shadow-xl`}
                >
                  <Heart size={20} fill={blip.liked ? 'white' : 'transparent'} />
                </button>
                <span className="text-white text-[9px] font-black drop-shadow-md">{blip.likes_count || 0}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => { setCommentsOpen(true); fetchComments(blip.id, 'blip'); }}
                  className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xl"
                >
                  <MessageCircle size={20} />
                </button>
                <span className="text-white text-[9px] font-black drop-shadow-md">{blip.comments_count || 0}</span>
              </div>

              <button
                onClick={() => shareBlip(blip)}
                className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xl"
              >
                <Share2 size={20} />
              </button>

              {blip.creator_id === user.id && (
                <button
                  onClick={async () => {
                    if (!confirm('Delete this blip?')) return;
                    await apiRequest('/api/blips', { method: 'DELETE', body: JSON.stringify({ id: blip.id }) });
                    setBlips(prev => prev.filter(b => b.id !== blip.id));
                  }}
                  className="w-11 h-11 rounded-full bg-red-500/80 hover:bg-red-500 border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xl"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
        {loadingMore && (
          <div className="h-20 flex items-center justify-center bg-black">
            <Loader2 className="animate-spin text-white" />
          </div>
        )}
      </div>

      {/* COMMENTS PANEL */}
      {commentsOpen && (
        <div className="fixed inset-x-0 bottom-0 h-[65vh] md:relative md:h-full md:w-96 bg-white md:bg-[#FDFCFB] border-t-4 md:border-t-0 md:border-l-4 border-black z-[100] flex flex-col shadow-2xl">
          <div className="p-4 border-b-2 border-black flex items-center justify-between bg-[#FDFCFB]">
            <h3 className="font-black text-sm uppercase tracking-widest">{t('comments')}</h3>
            <button onClick={() => setCommentsOpen(false)} className="hover:rotate-90 transition-transform"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((c: any) => (
              <div key={c.id} className="nb-card p-4 border-2 border-black">
                <p className="text-[10px] font-black text-orange-600 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  {c.user_name}
                </p>
                <p className="text-sm font-bold leading-relaxed">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-center text-xs font-bold text-neutral-400 py-12">{t('be_first')}</p>}
          </div>
          <div className="p-4 border-t-2 border-black bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={t('add_comment')}
                className="nb-input flex-1 py-3 text-sm"
                onKeyDown={e => e.key === 'Enter' && postComment()}
              />
              <button
                onClick={postComment}
                disabled={postingComment}
                className="nb-btn-orange p-3 flex items-center justify-center rounded-xl"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoadmap && blips[activeBlip] && (
        <RoadmapModal
          opportunity={blips[activeBlip]}
          user={user}
          onClose={() => setShowRoadmap(false)}
        />
      )}
    </div>
  );
}
