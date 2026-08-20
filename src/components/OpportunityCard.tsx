import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink, Bookmark, BookmarkCheck, Clock,
  ChevronDown, ChevronUp, Users, Gift, MapPin, Building2, Sparkles, ArrowUpRight,
  Heart, MessageCircle, Share2, Send, X, Loader2, GraduationCap, Briefcase, Trophy, PartyPopper, Rocket, DollarSign, CheckCircle
} from 'lucide-react';
import RoadmapModal from './RoadmapModal';
import ApplicationPrepModal from './ApplicationPrepModal';
import { apiRequest } from '../lib/auth';
import { useI18n } from '../lib/i18n';

const CAT: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  scholarship: { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', icon: <GraduationCap size={16} />, label: 'Scholarship' },
  internship:  { color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', icon: <Briefcase size={16} />,     label: 'Internship'  },
  competition: { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: <Trophy size={16} />,        label: 'Competition' },
  event:       { color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', icon: <PartyPopper size={16} />,   label: 'Event'       },
  job:         { color: '#9A3412', bg: '#FFF7ED', border: '#FED7AA', icon: <Rocket size={16} />,        label: 'Job'         },
  grant:       { color: '#14532D', bg: '#F0FDF4', border: '#BBF7D0', icon: <DollarSign size={16} />,    label: 'Grant'       },
  opportunity: { color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', icon: <Sparkles size={16} />,      label: 'Opportunity' },
};

// Unsplash image helper based on category/tag
function getCoverImage(category: string, tag?: string): string {
  const images: Record<string, string> = {
    scholarship: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', // University/education
    internship: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',  // Team working
    competition: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',    // Trophy/success
    event: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',       // Conference/event
    job: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',         // Laptop/work
    grant: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',       // Money/funding
  };
  
  return images[category] || images.scholarship;
}

function Bullets({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs font-bold" style={{ color }}>
          <span className="mt-0.5 font-black">✓</span> {item}
        </li>
      ))}
    </ul>
  );
}

export default function OpportunityCard({ item, isBookmarked, onBookmark, user }: any) {
  const navigate = useNavigate();
  const [expanded,    setExpanded]    = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [likes, setLikes] = useState(item.upvotes || 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [applyCount, setApplyCount] = useState(0);
  // Lifecycle-aware navigation state (Requirements 5.1–5.6, 13.1–13.2)
  const [navigating, setNavigating] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    fetchEngagement();
  }, [item.id]);

  const fetchEngagement = async () => {
    try {
      const [engRes, proofRes] = await Promise.all([
        apiRequest(`/api/engage?action=like&item_id=${item.id}&item_type=opportunity`),
        apiRequest(`/api/social-proof?action=get_counts&item_id=${item.id}`)
      ]);
      const engData = await engRes.json();
      setLikes(engData.count);
      setLiked(engData.liked);
      
      const proofData = await proofRes.json();
      const stats = proofData.find((s: any) => s.item_id === item.id);
      if (stats) setApplyCount(stats.apply_count || 0);
    } catch (e) { console.error(e); }
  };

  const trackApply = async () => {
    try {
      setApplyCount(prev => prev + 1);
      await apiRequest('/api/social-proof', {
        method: 'POST',
        body: JSON.stringify({ action: 'track_apply', item_id: item.id })
      });
    } catch (e) { console.error(e); }
  };

  /**
   * Lifecycle-aware "View & Apply" handler.
   *
   * 1. Check if an opportunity detail page already exists (GET)
   * 2. If not, create one (POST) — idempotent on the server side
   * 3. Navigate to the page URL
   * 4. Fall back to legacy /apply route if lifecycle API is unavailable
   *
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 13.1, 13.2
   */
  const handleNavigateToDetail = async () => {
    // Prevent multiple concurrent clicks (race condition guard — Req 5.6)
    if (navigating) return;

    setNavigating(true);
    setNavError(null);

    // Store opportunity data in localStorage for downstream pages
    localStorage.setItem(`lp_opp_${item.id}`, JSON.stringify(item));

    try {
      // Step 1: Check if page already exists
      const checkRes = await apiRequest(`/api/opportunities/${encodeURIComponent(item.id)}/page`);

      if (checkRes.ok) {
        // Page exists — navigate to it directly (Req 5.1)
        const pageData = await checkRes.json();
        navigate(pageData.url || `/opportunities/${item.category || 'opportunity'}/${pageData.slug}`);
        return;
      }

      if (checkRes.status === 404) {
        // Page does not exist — create it (Req 5.2, 5.3)
        const createRes = await apiRequest(`/api/opportunities/${encodeURIComponent(item.id)}/page`, {
          method: 'POST',
          body: JSON.stringify({
            title:    item.title    || '',
            category: item.category || 'opportunity',
            deadline: item.deadline || null,
          }),
        });

        if (createRes.ok) {
          const pageData = await createRes.json();
          navigate(pageData.url || `/opportunities/${item.category || 'opportunity'}/${pageData.slug}`);
          return;
        }
      }

      // If lifecycle API returns a non-OK / non-404 status (e.g., feature disabled),
      // fall back gracefully to the legacy apply route (Req 5.4)
      navigate(`/opportunities/${item.id}/apply`);
    } catch (_err) {
      // Network error or API unavailable — fall back to legacy route
      navigate(`/opportunities/${item.id}/apply`);
    } finally {
      setNavigating(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await apiRequest('/api/engage', {
        method: 'POST',
        body: JSON.stringify({ action: 'like', item_id: item.id, item_type: 'opportunity' })
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikes(prev => data.liked ? prev + 1 : prev - 1);
    } catch (e) { console.error(e); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/feed?id=${item.id}`;
    navigator.clipboard.writeText(url);
    alert(t('copied'));
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await apiRequest(`/api/engage?action=comment&item_id=${item.id}&item_type=opportunity`);
      const data = await res.json();
      setComments(data);
    } catch (e) { console.error(e); }
    finally { setLoadingComments(false); }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await apiRequest('/api/engage', {
        method: 'POST',
        body: JSON.stringify({ action: 'comment', item_id: item.id, item_type: 'opportunity', content: newComment })
      });
      const data = await res.json();
      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch (e) { console.error(e); }
    finally { setPostingComment(false); }
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  const cfg  = CAT[item.category] || CAT.opportunity;
  const desc = item.description || item.snippet || '';
  const eligs = (item.eligibility || '').split('•').map((s: string) => s.trim()).filter(Boolean);
  const bens  = (item.benefits   || '').split('•').map((s: string) => s.trim()).filter(Boolean);
  const hasExtra = eligs.length > 0 || bens.length > 0 || desc.length > 180 || (item.application_steps && item.application_steps.length > 0);

  return (
    <>
      <article id={`opp-${item.id}`} className="nb-card overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5">
        {/* Cover Image */}
        <div className="relative h-32 overflow-hidden" style={{ background: cfg.bg }}>
          <img 
            src={getCoverImage(item.category || 'scholarship', item.tag)} 
            alt={item.title}
            className="w-full h-full object-cover opacity-90"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, ${cfg.bg})` }} />
        </div>

        {/* Top accent stripe */}
        <div className="h-2" style={{ background: cfg.color }} />

        <div className="p-4 flex flex-col gap-3">
          {/* Row 1: badge + bookmark */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {item.featured && (
                <span className="nb-badge flex items-center gap-1.5 font-black" style={{ color: '#B45309', borderColor: '#F59E0B', background: '#FEF3C7' }}>
                  <Sparkles size={12} className="text-amber-500 fill-amber-500" />
                  {item.featured_rank ? `Top #${item.featured_rank}` : 'Top 25'}
                </span>
              )}
              <span className="nb-badge flex items-center gap-1.5" style={{ color: cfg.color, borderColor: cfg.color, background: cfg.bg }}>
                {cfg.icon} {t(item.category || 'opportunity')}
              </span>
              {item.verified && (
                <span className="nb-badge flex items-center gap-1.5" style={{ color: '#065F46', borderColor: '#065F46', background: '#ECFDF5' }}>
                  <CheckCircle size={12} /> {t('verified')}
                </span>
              )}
              {item.tag && (
                <span className="nb-tag" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                  #{item.tag.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <button onClick={onBookmark}
              className="nb-btn w-8 h-8 flex items-center justify-center"
              style={isBookmarked
                ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' }
                : { background: 'var(--surface)', color: 'var(--muted)' }
              }>
              {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            </button>
          </div>

          {/* Title */}
          <h3 className="font-black text-base leading-snug" style={{ color: 'var(--ink)' }}>
            {item.title}
          </h3>

          {/* Social Proof */}
          {applyCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-50 border border-orange-100 w-fit">
              <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                {t('people_applied', { n: applyCount })}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-3">
            {item.source && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--muted)' }}>
                <Building2 size={10} /> {item.source}
              </span>
            )}
            {item.location && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--muted)' }}>
                <MapPin size={10} /> {item.location}
              </span>
            )}
            {item.deadline && (
              <span className="nb-badge" style={{ color: '#92400E', borderColor: '#FDE68A', background: '#FFFBEB' }}>
                <Clock size={9} className="mr-0.5" /> {item.deadline}
              </span>
            )}
          </div>

          {/* Quick Details Badges */}
          <div className="flex flex-wrap gap-2">
            {item.amount && (
              <span className="nb-badge" style={{ color: '#047857', borderColor: '#A7F3D0', background: '#ECFDF5' }}>
                💰 {item.amount}
              </span>
            )}
            {item.degree_level && (
              <span className="nb-badge" style={{ color: '#1D4ED8', borderColor: '#BFDBFE', background: '#EFF6FF' }}>
                🎓 {item.degree_level}
              </span>
            )}
            {item.country_focus && (
              <span className="nb-badge" style={{ color: '#7C2D12', borderColor: '#FED7AA', background: '#FFF7ED' }}>
                📍 {item.country_focus}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--ink)' }}>
            {expanded || desc.length <= 180 ? desc : desc.slice(0, 180) + '...'}
          </p>

          {/* Expanded panels */}
          {expanded && (
            <div className="space-y-3">
              {eligs.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: '#EFF6FF', border: '2px solid #BFDBFE' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users size={12} style={{ color: '#1D4ED8' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#1D4ED8' }}>{t('eligibility')}</span>
                  </div>
                  <Bullets items={eligs} color="#1D4ED8" />
                </div>
              )}
              {bens.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: '#ECFDF5', border: '2px solid #A7F3D0' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Gift size={12} style={{ color: '#065F46' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#065F46' }}>{t('benefits')}</span>
                  </div>
                  <Bullets items={bens} color="#065F46" />
                </div>
              )}
              {item.application_steps && Array.isArray(item.application_steps) && item.application_steps.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: '#FFFBEB', border: '2px solid #FDE68A' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={12} style={{ color: '#92400E' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#92400E' }}>Application Steps</span>
                  </div>
                  <ul className="space-y-1.5">
                    {item.application_steps.map((step: string, i: number) => (
                      <li key={i} className="text-xs font-bold" style={{ color: '#92400E' }}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Expand toggle */}
          {hasExtra && (
            <button onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-black transition-opacity hover:opacity-70 w-fit"
              style={{ color: cfg.color }}>
              {expanded ? <><ChevronUp size={12} /> {t('show_less')}</> : <><ChevronDown size={12} /> {t('eligibility')} & {t('benefits')}</>}
            </button>
          )}

          {/* Engagement Row */}
          <div className="flex items-center gap-4 pt-1">
            <button 
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              className="flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-70"
              style={{ color: liked ? '#FF5C00' : 'var(--muted)' }}
            >
              <Heart size={14} fill={liked ? '#FF5C00' : 'transparent'} />
              {likes}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
              className="flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              <MessageCircle size={14} />
              {t('discuss')}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              <Share2 size={14} />
              {t('share')}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 flex-wrap" style={{ borderTop: '2px solid var(--border)' }}>
            {navError && (
              <p className="w-full text-xs font-bold text-red-600 mb-1">{navError}</p>
            )}
            <button
              id={`view-apply-${item.id}`}
              onClick={handleNavigateToDetail}
              disabled={navigating}
              className="nb-btn flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 text-xs nb-btn-orange"
              style={{ opacity: navigating ? 0.75 : 1, cursor: navigating ? 'wait' : 'pointer' }}
              aria-label={navigating ? 'Opening opportunity page…' : 'View & Apply'}
            >
              {navigating
                ? <><Loader2 size={11} className="animate-spin" /> Opening…</>
                : <><ArrowUpRight size={11} /> View &amp; Apply</>
              }
            </button>
            <button onClick={() => setShowRoadmap(true)}
              className="nb-btn flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 text-xs"
              style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
              <Sparkles size={11} /> {t('roadmap')}
            </button>
          </div>

        </div>
      </article>

      {showRoadmap && (
        <RoadmapModal opportunity={item} user={user} onClose={() => setShowRoadmap(false)} />
      )}

      {showApplication && user && (
        <ApplicationPrepModal opportunity={item} user={user} onClose={() => setShowApplication(false)} />
      )}

      {/* COMMENTS DRAWER/SECTION */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border-4 border-black shadow-[8px 8px 0 #000] flex flex-col animate-in slide-in-from-right" style={{ background: 'var(--surface)' }}>
            <div className="p-4 border-b-4 border-black flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest">{t('discussion')}</h3>
              <button onClick={() => setShowComments(false)} className="nb-btn p-1"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-orange-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400">{t('loading')}</p>
                </div>
              ) : (
                <>
                  {comments.map((c: any) => (
                    <div key={c.id} className="nb-card p-3">
                      <p className="text-[10px] font-black text-orange-600 mb-1">{c.user_name}</p>
                      <p className="text-xs font-bold leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                      <MessageCircle className="mx-auto mb-2" size={32} />
                      <p className="text-xs font-black uppercase tracking-widest">{t('no_comments')}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t-4 border-black bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t('ask_question')}
                  className="nb-input flex-1 py-2.5 text-xs"
                  onKeyDown={e => e.key === 'Enter' && postComment()}
                />
                <button 
                  onClick={postComment}
                  disabled={postingComment}
                  className="nb-btn nb-btn-orange px-3 flex items-center justify-center"
                >
                  {postingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
