import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/auth';
import { X, Map, RefreshCw, Copy, Check } from 'lucide-react';
import { useI18n } from '../lib/i18n';

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.includes('<roadmap_json>') || line.includes('</roadmap_json>')) { i++; continue; }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold mt-5 mb-2 flex items-center gap-2" style={{ color: '#F97316' }}>
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold mt-3 mb-1" style={{ color: '#fbbf24' }}>
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="text-sm font-bold mt-2" style={{ color: '#e2e8f0' }}>
          {line.replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.match(/^\d+\. /)) {
      elements.push(
        <div key={i} className="flex gap-3 my-1.5">
          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(249,115,22,0.2)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
            {line.match(/^(\d+)\./)?.[1]}
          </span>
          <span className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}
            dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 my-1">
          <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#F97316' }} />
          <span className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}
            dangerouslySetInnerHTML={{ __html: line.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed my-1" style={{ color: '#cbd5e1' }}
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
      );
    }
    i++;
  }
  return <div>{elements}</div>;
}

export default function RoadmapModal({ opportunity, user, onClose }) {
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    generateRoadmap();
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [content]);

  const generateRoadmap = async () => {
    setContent('');
    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('/api/ai-roadmap', {
        method: 'POST',
        body: JSON.stringify({ opportunity, userProfile: user }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate roadmap');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setContent(accumulated);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    // Strip JSON tag for copying
    const clean = content.replace(/<roadmap_json>[\s\S]*?<\/roadmap_json>/g, '').trim();
    navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToGoals = async () => {
    const match = content.match(/<roadmap_json>([\s\S]*?)<\/roadmap_json>/);
    if (!match) return alert(t('error')); // Use t('error') or similar if needed, or keep generic for now
    
    setSaving(true);
    try {
      let steps = JSON.parse(match[1]);
      const res = await apiRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: `Goal: ${opportunity.title}`,
          description: `Roadmap for ${opportunity.title}`,
          category: opportunity.category || 'opportunity',
          target_date: opportunity.deadline || new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
          milestones: steps.map((s: string) => ({ text: s, completed: false }))
        })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save goals.');
    } finally {
      setSaving(false);
    }
  };

  const CATEGORY_CONFIG = {
    scholarship: { color: '#60a5fa', emoji: '🎓' },
    internship:  { color: '#34d399', emoji: '💼' },
    competition: { color: '#fbbf24', emoji: '🏆' },
    event:       { color: '#a78bfa', emoji: '📅' },
    job:         { color: '#fb923c', emoji: '🚀' },
    opportunity: { color: '#94a3b8', emoji: '✨' },
  };
  const catConf = CATEGORY_CONFIG[opportunity.category] || CATEGORY_CONFIG.opportunity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#0F2952', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                🗺️
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#F97316' }}>{t('ai_roadmap')}</p>
                <h2 className="text-white font-bold text-sm leading-snug">{opportunity.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: catConf.color }}>{catConf.emoji} {t(opportunity.category || 'opportunity')}</span>
                  {opportunity.deadline && (
                    <span className="text-xs" style={{ color: '#fbbf24' }}>⏰ {t('due')}: {opportunity.deadline}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {content && (
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {copied ? <><Check size={11} /> {t('copied')}</> : <><Copy size={11} /> {t('copy')}</>}
                </button>
              )}
              {!loading && (
                <button onClick={saveToGoals} disabled={saving || saved}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                  {saving ? t('saving') : saved ? `✓ ${t('saved')}` : <><RefreshCw size={11} className={saving ? 'animate-spin' : ''} /> {t('save_checklist')}</>}
                </button>
              )}
              {!loading && (
                <button onClick={generateRoadmap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.25)' }}>
                  <RefreshCw size={11} /> {t('regenerate')}
                </button>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X size={15} className="text-blue-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4">
          {loading && content === '' ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">{t('generating_roadmap')}</p>
                <p className="text-blue-400 text-sm">{t('analyzing_profile')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl">⚠️</div>
              <p className="text-white font-semibold">Failed to generate roadmap</p>
              <p className="text-red-400 text-sm text-center">{error}</p>
              <button onClick={generateRoadmap}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)', color: 'white' }}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <MarkdownRenderer content={content} />
              {loading && (
                <div className="flex items-center gap-2 mt-3" style={{ color: '#F97316' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  <span className="text-xs">{t('writing')}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Footer CTA */}
        {!loading && content && opportunity.link && (
          <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <a href={opportunity.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)', color: 'white' }}>
              {t('apply_now')} — {opportunity.title} <span>→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
