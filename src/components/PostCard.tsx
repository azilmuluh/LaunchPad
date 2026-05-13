import { useState } from 'react';
import { apiRequest } from '../lib/auth';
import { Heart, MessageCircle, Share2, ExternalLink, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';

const CATEGORY_CONFIG = {
  scholarship: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', emoji: '🎓' },
  internship: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', emoji: '💼' },
  competition: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', emoji: '🏆' },
  event: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', emoji: '📅' },
  job: { color: '#F97316', bg: 'rgba(249,115,22,0.15)', emoji: '🚀' },
  tip: { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', emoji: '💡' },
  win: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', emoji: '🎉' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function PostCard({ post, currentUser, onUpdated, onDeleted }) {
  const [liked, setLiked] = useState(post.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [shared, setShared] = useState(false);
  const [sharesCount, setSharesCount] = useState(post.shares_count || 0);

  const catConfig = CATEGORY_CONFIG[post.category] || null;
  const isOwner = currentUser && post.user_id === currentUser.id;

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
    try {
      const res = await apiRequest('/api/likes', {
        method: 'POST',
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikesCount(data.likes_count);
        setLiked(data.liked);
        onUpdated({ ...post, likes_count: data.likes_count, liked_by_me: data.liked });
      }
    } catch {}
  };

  const loadComments = async () => {
    if (comments.length > 0) return;
    setLoadingComments(true);
    try {
      const res = await apiRequest(`/api/comments?post_id=${post.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch {}
    setLoadingComments(false);
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) loadComments();
  };

  const handleComment = async () => {
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ post_id: post.id, content: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [...prev, data]);
        setCommentText('');
        onUpdated({ ...post, comments_count: (post.comments_count || 0) + 1 });
      }
    } catch {}
    setPostingComment(false);
  };

  const handleShare = () => {
    const text = `${post.content}${post.opportunity_link ? '\n' + post.opportunity_link : ''}`;
    if (navigator.share) {
      navigator.share({ title: 'LaunchPad Opportunity', text, url: post.opportunity_link || window.location.href });
    } else {
      navigator.clipboard.writeText(text);
    }
    setShared(true);
    setSharesCount(c => c + 1);
    setTimeout(() => setShared(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    await apiRequest('/api/posts', { method: 'DELETE', body: JSON.stringify({ id: post.id }) });
    onDeleted(post.id);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden"
              style={{ 
                background: post.user_avatar ? 'none' : `linear-gradient(135deg, hsl(${(post.user_name?.charCodeAt(0) || 200) % 360}, 60%, 45%), hsl(${(post.user_name?.charCodeAt(0) || 200) % 360 + 40}, 60%, 35%))`,
                border: post.user_avatar ? '2px solid rgba(255,255,255,0.1)' : 'none'
              }}>
              {post.user_avatar 
                ? <img src={post.user_avatar} alt="" className="w-full h-full object-cover" />
                : post.user_name?.charAt(0)?.toUpperCase()
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{post.user_name}</span>
                {catConfig && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: catConfig.bg, color: catConfig.color }}>
                    {catConfig.emoji} {post.category}
                  </span>
                )}
              </div>
              <span className="text-blue-400 text-xs">{timeAgo(post.created_at)}</span>
            </div>
          </div>
          {isOwner && (
            <button onClick={handleDelete} className="text-blue-500 hover:text-red-400 transition-colors p-1">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-blue-100 text-sm leading-relaxed mb-3" style={{ whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>

        {/* Opportunity link card */}
        {post.opportunity_link && (
          <a href={post.opportunity_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl mb-3 transition-all hover:opacity-80"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.2)' }}>
              <ExternalLink size={14} style={{ color: '#F97316' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#fed7aa' }}>
                {post.opportunity_title || post.opportunity_link}
              </p>
              <p className="text-xs text-blue-400 truncate">{post.opportunity_link}</p>
            </div>
          </a>
        )}

        {/* Engagement bar */}
        <div className="flex items-center gap-1 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
            style={{
              background: liked ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              color: liked ? '#f87171' : '#64748b',
              border: liked ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            <Heart size={13} fill={liked ? '#f87171' : 'none'} />
            <span>{likesCount}</span>
          </button>

          <button onClick={toggleComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
            style={{
              background: showComments ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              color: showComments ? '#93c5fd' : '#64748b',
              border: showComments ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            <MessageCircle size={13} />
            <span>{post.comments_count || 0}</span>
            {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <button onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
            style={{
              background: shared ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
              color: shared ? '#86efac' : '#64748b',
              border: shared ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            <Share2 size={13} />
            <span>{shared ? 'Copied!' : sharesCount}</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-5 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
          <div className="pt-4 space-y-3">
            {loadingComments ? (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-blue-500 text-xs text-center py-2">No comments yet. Be the first!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, hsl(${(c.user_name?.charCodeAt(0) || 150) % 360}, 55%, 45%), hsl(${(c.user_name?.charCodeAt(0) || 150) % 360 + 40}, 55%, 35%))` }}>
                    {c.user_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-xs font-semibold">{c.user_name}</span>
                      <span className="text-blue-500 text-xs">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-blue-200 text-xs leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))
            )}

            {/* Comment input */}
            <div className="flex gap-2 pt-2">
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)' }}>
                {currentUser?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 rounded-xl text-white placeholder-blue-500 outline-none text-xs"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button onClick={handleComment} disabled={!commentText.trim() || postingComment}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)' }}>
                  <Send size={12} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
