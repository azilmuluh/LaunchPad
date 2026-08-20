import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import {
  ArrowLeft, ExternalLink, Bookmark, BookmarkCheck, Clock, MapPin,
  Building2, Users, Gift, Sparkles, Heart, MessageCircle, Share2,
  CheckCircle2, Circle, Loader2, Send, ChevronRight, ArrowUpRight
} from 'lucide-react';
import SEO from '../components/SEO';

const CAT: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  scholarship: { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', emoji: '🎓' },
  internship:  { color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', emoji: '💼' },
  competition: { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', emoji: '🏆' },
  event:       { color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', emoji: '🎉' },
  job:         { color: '#9A3412', bg: '#FFF7ED', border: '#FED7AA', emoji: '🚀' },
  grant:       { color: '#14532D', bg: '#F0FDF4', border: '#BBF7D0', emoji: '💰' },
  opportunity: { color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', emoji: '✨' },
};

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function OpportunityDetailPage({ user }: any) {
  const { type, category, slug } = useParams<{ type?: string; category?: string; slug?: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'roadmap' | 'discussion'>('overview');

  const effectiveCategory = category || type;
  const effectiveSlug = slug;

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistProgress, setChecklistProgress] = useState(0);

  // AI Companion state
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Roadmap state
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Discussion state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Related opportunities
  const [relatedOpps, setRelatedOpps] = useState<any[]>([]);

  useEffect(() => {
    fetchOpportunity();
  }, [effectiveCategory, effectiveSlug]);

  useEffect(() => {
    if (opportunity) {
      fetchEngagement();
      fetchRelatedOpportunities();
      checkBookmarkStatus();
      generateDefaultChecklist();
    }
  }, [opportunity]);

  useEffect(() => {
    if (activeTab === 'roadmap' && roadmap.length === 0) {
      fetchRoadmap();
    }
    if (activeTab === 'discussion' && comments.length === 0) {
      fetchComments();
    }
  }, [activeTab]);

  const fetchOpportunity = async () => {
    setLoading(true);
    setError('');
    try {
      let resolvedOpportunityId = null;
      let isExpired = false;

      // 1. Try slug lifecycle lookup if slug is present
      if (effectiveSlug) {
        try {
          const pageRes = await apiRequest(`/api/opportunities/page/by-slug?slug=${encodeURIComponent(effectiveSlug)}`);
          if (pageRes.status === 410) {
            isExpired = true;
          } else if (pageRes.ok) {
            const pageData = await pageRes.json();
            resolvedOpportunityId = pageData.opportunityId;
          }
        } catch (err) {
          console.warn('Page lifecycle slug lookup failed, falling back:', err);
        }
      }

      if (isExpired) {
        navigate('/opportunities/expired');
        return;
      }

      // 2. Fetch specific opportunity by category and slug/id
      let endpoint = `/api/opportunities`;
      
      if (effectiveCategory && effectiveCategory !== 'opportunity') {
        endpoint += `?category=${effectiveCategory}`;
      }
      
      const searchQuery = resolvedOpportunityId || effectiveSlug;
      if (searchQuery) {
        endpoint += `${effectiveCategory ? '&' : '?'}search=${encodeURIComponent(searchQuery)}`;
      }
      
      const res = await apiRequest(endpoint);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        // Find the exact opportunity (the first one should be it, or find by ID if we have it)
        let opp = null;
        if (resolvedOpportunityId) {
          opp = data.items.find((o: any) => o.id === resolvedOpportunityId);
        }
        if (!opp && searchQuery) {
          opp = data.items.find((o: any) => o.id == searchQuery || o.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === searchQuery);
        }
        if (!opp) {
          opp = data.items[0];
        }
        
        if (opp) {
          setOpportunity(opp);
        } else {
          setError('Opportunity not found');
        }
      } else {
        setError('Opportunity not found');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  };

  const fetchEngagement = async () => {
    try {
      const res = await apiRequest(`/api/engage?action=like&item_id=${opportunity.id}&item_type=opportunity`);
      const data = await res.json();
      setLikes(data.count || 0);
      setLiked(data.liked || false);
    } catch (e) {
      console.error('Failed to fetch engagement:', e);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const res = await apiRequest('/api/bookmarks');
      const data = await res.json();
      if (Array.isArray(data)) {
        const isBookmarked = data.some((b: any) => b.link === opportunity.link);
        setIsBookmarked(isBookmarked);
      }
    } catch (e) {
      console.error('Failed to check bookmark:', e);
    }
  };

  const fetchRelatedOpportunities = async () => {
    try {
      const res = await apiRequest(`/api/opportunities?category=${opportunity.category || type}&limit=4`);
      const data = await res.json();
      if (data.items) {
        const filtered = data.items.filter((item: any) => item.id !== opportunity.id).slice(0, 3);
        setRelatedOpps(filtered);
      }
    } catch (e) {
      console.error('Failed to fetch related opportunities:', e);
    }
  };

  const generateDefaultChecklist = () => {
    let customSteps: string[] = [];
    if (Array.isArray(opportunity.application_steps) && opportunity.application_steps.length > 0) {
      customSteps = opportunity.application_steps;
    } else if (Array.isArray(opportunity.application_checklist) && opportunity.application_checklist.length > 0) {
      customSteps = opportunity.application_checklist;
    }

    const defaultItems: ChecklistItem[] = customSteps.length > 0
      ? customSteps.map((step: string, idx: number) => ({
          id: String(idx + 1),
          text: step.replace(/^\d+[\.\)]\s*/, ''),
          completed: false,
        }))
      : [
          { id: '1', text: 'Read all eligibility requirements carefully', completed: false },
          { id: '2', text: 'Gather required documents (ID, transcripts, certificates)', completed: false },
          { id: '3', text: 'Draft motivation letter / personal statement', completed: false },
          { id: '4', text: 'Request recommendation letters (if required)', completed: false },
          { id: '5', text: 'Prepare CV/Resume', completed: false },
          { id: '6', text: 'Review application form and questions', completed: false },
          { id: '7', text: 'Complete online application', completed: false },
          { id: '8', text: 'Proofread all materials', completed: false },
          { id: '9', text: 'Submit application before deadline', completed: false },
          { id: '10', text: 'Save confirmation email/receipt', completed: false },
        ];
    
    // Load saved checklist from localStorage
    const saved = localStorage.getItem(`checklist_${opportunity.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === defaultItems.length) {
          setChecklist(parsed);
          const completed = parsed.filter((item: any) => item.completed).length;
          setChecklistProgress(Math.round((completed / parsed.length) * 100));
          return;
        }
      } catch {
        // fallback
      }
    }
    setChecklist(defaultItems);
    const completed = defaultItems.filter(item => item.completed).length;
    setChecklistProgress(Math.round((completed / defaultItems.length) * 100));
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    localStorage.setItem(`checklist_${opportunity.id}`, JSON.stringify(updated));
    
    const completed = updated.filter(item => item.completed).length;
    setChecklistProgress(Math.round((completed / updated.length) * 100));
  };

  const fetchRoadmap = async () => {
    setRoadmapLoading(true);
    try {
      const res = await apiRequest('/api/ai-roadmap', {
        method: 'POST',
        body: JSON.stringify({ opportunity })
      });
      const data = await res.json();
      setRoadmap(data.steps || []);
    } catch (e) {
      console.error('Failed to generate roadmap:', e);
      // Fallback roadmap
      setRoadmap([
        { title: 'Research Phase', description: 'Understand the opportunity deeply', duration: '1-2 days' },
        { title: 'Preparation', description: 'Gather all required documents', duration: '3-5 days' },
        { title: 'Application Writing', description: 'Draft essays and statements', duration: '5-7 days' },
        { title: 'Review & Polish', description: 'Get feedback and refine', duration: '2-3 days' },
        { title: 'Submit', description: 'Complete and submit application', duration: '1 day' },
      ]);
    } finally {
      setRoadmapLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await apiRequest(`/api/engage?action=comment&item_id=${opportunity.id}&item_type=opportunity`);
      const data = await res.json();
      setComments(data || []);
    } catch (e) {
      console.error('Failed to fetch comments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await apiRequest('/api/engage', {
        method: 'POST',
        body: JSON.stringify({
          action: 'comment',
          item_id: opportunity.id,
          item_type: 'opportunity',
          content: newComment
        })
      });
      const data = await res.json();
      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setPostingComment(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await apiRequest('/api/engage', {
        method: 'POST',
        body: JSON.stringify({ action: 'like', item_id: opportunity.id, item_type: 'opportunity' })
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikes(prev => data.liked ? prev + 1 : prev - 1);
    } catch (e) {
      console.error('Failed to like:', e);
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await apiRequest('/api/bookmarks', {
          method: 'DELETE',
          body: JSON.stringify({ link: opportunity.link })
        });
        setIsBookmarked(false);
      } else {
        await apiRequest('/api/bookmarks', {
          method: 'POST',
          body: JSON.stringify(opportunity)
        });
        setIsBookmarked(true);
      }
    } catch (e) {
      console.error('Failed to bookmark:', e);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: opportunity.title,
        text: `Check out this opportunity: ${opportunity.title}`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert(t('copied'));
    }
  };

  const askAI = async () => {
    if (!aiMessage.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiRequest('/api/ai-assist', {
        method: 'POST',
        body: JSON.stringify({
          message: aiMessage,
          opportunity: opportunity,
          context: 'application_help'
        })
      });
      const data = await res.json();
      setAiResponse(data.response || 'I can help you with this application! What would you like to know?');
    } catch (e) {
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-black mb-4">Opportunity Not Found</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>{error}</p>
          <button onClick={() => navigate('/feed')} className="nb-btn nb-btn-orange px-6 py-3">
            <ArrowLeft size={16} className="mr-2" />
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const cfg = CAT[opportunity.category || type || 'opportunity'] || CAT.opportunity;
  const eligs = (opportunity.eligibility || '').split('•').map((s: string) => s.trim()).filter(Boolean);
  const bens = (opportunity.benefits || '').split('•').map((s: string) => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      <SEO
        title={opportunity.title}
        description={opportunity.description || opportunity.snippet}
        canonical={`/opportunities/${type}/${slug}/apply`}
      />

      {/* Header */}
      <div className="sticky top-0 z-40 border-b-2" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold hover:opacity-70"
              style={{ color: 'var(--ink)' }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button onClick={handleLike}
                className="nb-btn w-10 h-10 flex items-center justify-center"
                style={liked ? { background: '#FF5C00', color: '#fff' } : { background: 'var(--surface)' }}>
                <Heart size={16} fill={liked ? '#fff' : 'transparent'} />
              </button>
              <button onClick={handleBookmark}
                className="nb-btn w-10 h-10 flex items-center justify-center"
                style={isBookmarked ? { background: '#FF5C00', color: '#fff' } : { background: 'var(--surface)' }}>
                {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
              <button onClick={handleShare}
                className="nb-btn w-10 h-10 flex items-center justify-center"
                style={{ background: 'var(--surface)' }}>
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <div className="nb-card overflow-hidden">
              <div className="h-2" style={{ background: cfg.color }} />
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="nb-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                    {cfg.emoji} {t(opportunity.category || 'opportunity')}
                  </span>
                  {opportunity.verified && (
                    <span className="nb-badge" style={{ color: '#065F46', background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                      ✓ {t('verified')}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-black leading-tight" style={{ color: 'var(--ink)' }}>
                  {opportunity.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm font-bold" style={{ color: 'var(--muted)' }}>
                  {opportunity.source && (
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} /> {opportunity.source}
                    </span>
                  )}
                  {opportunity.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} /> {opportunity.location}
                    </span>
                  )}
                  {opportunity.deadline && (
                    <span className="flex items-center gap-1.5 text-orange-600">
                      <Clock size={14} /> {opportunity.deadline}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-6 pt-2" style={{ borderTop: '2px solid var(--border)' }}>
                  <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--muted)' }}>
                    <Heart size={14} /> {likes} {t('likes')}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--muted)' }}>
                    <MessageCircle size={14} /> {comments.length} {t('comments')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {(['overview', 'checklist', 'roadmap', 'discussion'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="nb-btn px-4 py-2 text-sm whitespace-nowrap"
                  style={activeTab === tab
                    ? { background: '#FF5C00', color: '#fff' }
                    : { background: 'var(--surface)', color: 'var(--muted)' }
                  }
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="nb-card p-6">
                  <h2 className="text-xl font-black mb-4" style={{ color: 'var(--ink)' }}>
                    About This Opportunity
                  </h2>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--ink)' }}>
                    {opportunity.description || opportunity.snippet}
                  </p>
                </div>

                {/* Eligibility */}
                {eligs.length > 0 && (
                  <div className="nb-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users size={20} style={{ color: '#1D4ED8' }} />
                      <h2 className="text-xl font-black" style={{ color: 'var(--ink)' }}>
                        {t('eligibility')}
                      </h2>
                    </div>
                    <ul className="space-y-2">
                      {eligs.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-bold" style={{ color: 'var(--ink)' }}>
                          <span className="text-blue-600 mt-0.5">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {bens.length > 0 && (
                  <div className="nb-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Gift size={20} style={{ color: '#065F46' }} />
                      <h2 className="text-xl font-black" style={{ color: 'var(--ink)' }}>
                        {t('benefits')}
                      </h2>
                    </div>
                    <ul className="space-y-2">
                      {bens.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-bold" style={{ color: 'var(--ink)' }}>
                          <span className="text-green-600 mt-0.5">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="nb-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black" style={{ color: 'var(--ink)' }}>
                    Application Checklist
                  </h2>
                  <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                    {checklistProgress}% Complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 rounded-full mb-6" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ background: cfg.color, width: `${checklistProgress}%` }}
                  />
                </div>

                <div className="space-y-3">
                  {checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className="w-full flex items-start gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                      style={{
                        background: item.completed ? cfg.bg : 'var(--surface)',
                        border: `2px solid ${item.completed ? cfg.border : 'var(--border)'}`,
                      }}
                    >
                      {item.completed ? (
                        <CheckCircle2 size={20} style={{ color: cfg.color }} />
                      ) : (
                        <Circle size={20} style={{ color: 'var(--muted)' }} />
                      )}
                      <span
                        className="text-left text-sm font-bold flex-1"
                        style={{
                          color: item.completed ? cfg.color : 'var(--ink)',
                          textDecoration: item.completed ? 'line-through' : 'none'
                        }}
                      >
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="nb-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={20} style={{ color: '#FF5C00' }} />
                  <h2 className="text-xl font-black" style={{ color: 'var(--ink)' }}>
                    AI-Powered Application Roadmap
                  </h2>
                </div>

                {roadmapLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-orange-600" size={32} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roadmap.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                            style={{ background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.border}` }}
                          >
                            {i + 1}
                          </div>
                          {i < roadmap.length - 1 && (
                            <div className="w-0.5 flex-1 my-2" style={{ background: cfg.border, minHeight: '20px' }} />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="text-base font-black mb-1" style={{ color: 'var(--ink)' }}>
                            {step.title}
                          </h3>
                          <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
                            {step.description}
                          </p>
                          {step.duration && (
                            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                              <Clock size={10} className="inline mr-1" />
                              {step.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="nb-card p-6">
                <h2 className="text-xl font-black mb-6" style={{ color: 'var(--ink)' }}>
                  Discussion
                </h2>

                {loadingComments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-orange-600" size={32} />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {comments.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--muted)' }} />
                          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
                            No comments yet. Be the first to discuss!
                          </p>
                        </div>
                      ) : (
                        comments.map((comment: any) => (
                          <div key={comment.id} className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs" style={{ background: cfg.bg, color: cfg.color }}>
                                {comment.user_name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-sm font-black" style={{ color: 'var(--ink)' }}>
                                {comment.user_name || 'Anonymous'}
                              </span>
                            </div>
                            <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ask a question or share your thoughts..."
                        className="nb-input flex-1 py-3"
                        onKeyDown={(e) => e.key === 'Enter' && postComment()}
                      />
                      <button
                        onClick={postComment}
                        disabled={postingComment}
                        className="nb-btn nb-btn-orange px-4"
                      >
                        {postingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Related Opportunities */}
            {relatedOpps.length > 0 && (
              <div className="nb-card p-6">
                <h2 className="text-xl font-black mb-4" style={{ color: 'var(--ink)' }}>
                  Related Opportunities
                </h2>
                <div className="space-y-3">
                  {relatedOpps.map((opp: any) => (
                    <Link
                      key={opp.id}
                      to={`/opportunities/${opp.category || 'opportunity'}/${opp.id}/apply`}
                      className="block p-4 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-black mb-1" style={{ color: 'var(--ink)' }}>
                            {opp.title}
                          </h3>
                          <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                            {opp.description || opp.snippet}
                          </p>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI Companion & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Apply Now CTA */}
            <div className="nb-card p-6 sticky top-24">
              <h3 className="text-lg font-black mb-4" style={{ color: 'var(--ink)' }}>
                Ready to Apply?
              </h3>
              
              {opportunity.link ? (
                <a
                  href={opportunity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-btn nb-btn-orange w-full flex items-center justify-center gap-2 py-3 mb-3"
                  onClick={() => {
                    // Track apply click
                    apiRequest('/api/social-proof', {
                      method: 'POST',
                      body: JSON.stringify({ action: 'track_apply', item_id: opportunity.id })
                    }).catch(console.error);
                  }}
                >
                  {t('apply_now')} <ExternalLink size={16} />
                </a>
              ) : (
                <div className="w-full py-3 text-center text-sm font-bold rounded-xl mb-3" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                  No application link available
                </div>
              )}

              {opportunity.deadline && (
                <div className="text-center p-3 rounded-lg" style={{ background: '#FFFBEB', border: '2px solid #FDE68A' }}>
                  <p className="text-xs font-black uppercase tracking-wider text-orange-900 mb-1">
                    Deadline
                  </p>
                  <p className="text-sm font-black text-orange-600">
                    {opportunity.deadline}
                  </p>
                </div>
              )}
            </div>

            {/* AI Companion */}
            <div className="nb-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF5C00, #FF8C42)' }}>
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: 'var(--ink)' }}>
                    AI Companion
                  </h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Ask me anything!
                  </p>
                </div>
              </div>

              {aiResponse && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: cfg.bg, border: `2px solid ${cfg.border}` }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    {aiResponse}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="e.g., How can I draft my motivation letter?"
                  className="nb-input w-full min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      askAI();
                    }
                  }}
                />
                <button
                  onClick={askAI}
                  disabled={aiLoading}
                  className="nb-btn nb-btn-orange w-full py-2 flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Ask AI
                    </>
                  )}
                </button>
              </div>

              {/* Quick Questions */}
              <div className="mt-4 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Quick Questions:
                </p>
                {[
                  'How do I write a strong motivation letter?',
                  'What documents do I need?',
                  'Can you review my eligibility?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setAiMessage(q);
                      setTimeout(() => askAI(), 100);
                    }}
                    className="w-full text-left text-xs font-bold p-2 rounded-lg transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
