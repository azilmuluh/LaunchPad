import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Check, ExternalLink, Users, FileText } from 'lucide-react';
import { apiRequest } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export default function ApplicationPrepModal({
  opportunity,
  user,
  onClose,
}: {
  opportunity: any;
  user: any;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const itemId = opportunity.id || opportunity.link;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [communityCount, setCommunityCount] = useState(0);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest(`/api/applications?item_id=${encodeURIComponent(itemId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setApplication(data.application);
      setCommunityCount(data.community_applications || 0);
      if (!data.application) {
        const createRes = await apiRequest('/api/applications', {
          method: 'POST',
          body: JSON.stringify({ item_id: itemId, opportunity }),
        });
        const created = await createRes.json();
        if (createRes.ok) setApplication(created);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [itemId]);

  const toggleCheck = async (index: number) => {
    if (!application) return;
    try {
      const res = await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId, opportunity, toggle_index: index }),
      });
      const data = await res.json();
      if (res.ok) setApplication(data);
    } catch (e) { console.error(e); }
  };

  const generatePlan = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate_plan', item_id: itemId, opportunity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      setApplication(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const checklist = application?.checklist || [];
  const doneCount = checklist.filter((c: any) => c.done).length;
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden nb-card">
        <div className="flex-shrink-0 px-5 py-4 border-b-2 border-black flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">Application workspace</p>
            <h2 className="font-black text-base leading-snug">{opportunity.title}</h2>
            <p className="text-xs font-bold mt-1 flex items-center gap-2 flex-wrap" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1"><Users size={10} /> {communityCount} preparing on LaunchPad</span>
            </p>
          </div>
          <button onClick={onClose} className="nb-btn p-1.5 flex-shrink-0"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-orange-500" size={28} />
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl text-xs font-bold" style={{ background: '#FFF0F0', border: '2px solid #E53935', color: '#E53935' }}>
                  {error}
                </div>
              )}

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-black uppercase" style={{ color: '#999' }}>Checklist progress</span>
                  <span className="text-xs font-black" style={{ color: '#FF5C00' }}>{progress}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#f0ede6', border: '1.5px solid #0A0A0A' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#FF5C00' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                {checklist.map((m: any, i: number) => (
                  <button key={i} onClick={() => toggleCheck(i)}
                    className="w-full flex items-center gap-2 text-left px-2 py-2 rounded-lg"
                    style={{ background: m.done ? '#E8FFF0' : '#FAFAF7', border: `1.5px solid ${m.done ? '#00C853' : '#e0ddd6'}` }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: m.done ? '#00C853' : '#fff', border: '1.5px solid #0A0A0A' }}>
                      {m.done && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold" style={{ textDecoration: m.done ? 'line-through' : 'none' }}>{m.text}</span>
                  </button>
                ))}
              </div>

              {application?.ai_plan && (
                <div className="nb-card p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                    <FileText size={10} /> LaunchPad AI plan
                  </p>
                  <div className="text-xs font-bold leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto" style={{ color: '#444' }}>
                    {application.ai_plan}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t-2 border-black space-y-2">
          <button onClick={generatePlan} disabled={generating || loading}
            className="nb-btn nb-btn-orange w-full py-2.5 text-xs flex items-center justify-center gap-2 disabled:opacity-50">
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {application?.ai_plan ? 'Regenerate AI plan' : 'Generate AI application plan'}
          </button>
          {opportunity.link && (
            <a href={opportunity.link} target="_blank" rel="noopener noreferrer"
              className="nb-btn w-full py-2.5 text-xs flex items-center justify-center gap-2"
              onClick={() => apiRequest('/api/social-proof', { method: 'POST', body: JSON.stringify({ action: 'track_apply', item_id: itemId }) }).catch(() => {})}>
              Official apply page <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={() => { onClose(); navigate('/ai', { state: { prompt: `Help me polish my application for "${opportunity.title}". Deadline: ${opportunity.deadline || 'unknown'}.` } }); }}
            className="nb-btn w-full py-2 text-xs" style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
            Chat with LaunchPad AI
          </button>
        </div>
      </div>
    </div>
  );
}
