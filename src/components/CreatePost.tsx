import { useState } from 'react';
import { apiRequest } from '../lib/auth';
import { Send, Link, X, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { id: 'scholarship', label: 'Scholarship', emoji: '🎓' },
  { id: 'internship', label: 'Internship', emoji: '💼' },
  { id: 'competition', label: 'Competition', emoji: '🏆' },
  { id: 'event', label: 'Event', emoji: '📅' },
  { id: 'job', label: 'Job', emoji: '🚀' },
  { id: 'tip', label: 'Tip', emoji: '💡' },
  { id: 'win', label: 'Win', emoji: '🎉' },
];

export default function CreatePost({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [oppLink, setOppLink] = useState('');
  const [oppTitle, setOppTitle] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content,
          category: category || null,
          opportunity_link: oppLink || null,
          opportunity_title: oppTitle || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onPostCreated(data);
      setContent('');
      setCategory('');
      setOppLink('');
      setOppTitle('');
      setShowExtra(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)' }}>
          {user.full_name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share a win, tip, or opportunity with the community..."
            rows={3}
            className="w-full bg-transparent text-white placeholder-blue-400 outline-none text-sm resize-none leading-relaxed"
            style={{ caretColor: '#F97316' }}
          />

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(c => c === cat.id ? '' : cat.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: category === cat.id ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.06)',
                  color: category === cat.id ? '#fed7aa' : '#93c5fd',
                  border: category === cat.id ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.1)',
                }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Extra fields toggle */}
          <button onClick={() => setShowExtra(s => !s)}
            className="flex items-center gap-1 text-xs mb-3 transition-all hover:opacity-80"
            style={{ color: '#64748b' }}>
            <Link size={11} /> Attach opportunity link
            <ChevronDown size={11} className={`transition-transform ${showExtra ? 'rotate-180' : ''}`} />
          </button>

          {showExtra && (
            <div className="space-y-2 mb-3">
              <input type="text" value={oppTitle} onChange={e => setOppTitle(e.target.value)}
                placeholder="Opportunity title (optional)"
                className="w-full px-3 py-2 rounded-lg text-white placeholder-blue-400 outline-none text-xs"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input type="url" value={oppLink} onChange={e => setOppLink(e.target.value)}
                placeholder="https://opportunity-link.com"
                className="w-full px-3 py-2 rounded-lg text-white placeholder-blue-400 outline-none text-xs"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          )}

          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-blue-500 text-xs">{content.length}/500</span>
            <button onClick={handleSubmit} disabled={!content.trim() || loading || content.length > 500}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)' }}>
              {loading ? 'Posting...' : <><Send size={12} /> Post</> }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
