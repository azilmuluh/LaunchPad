import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/auth';
import {
  Target, Plus, Trash2, Check, ChevronUp, ChevronDown,
  Calendar, Sparkles, X, Bot, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

const EXAMPLE_GOALS = [
  'Get into Harvard on a full scholarship',
  'Win a fully funded scholarship to study in Canada',
  'Pass IYMC 2026 Final Round',
  'Land a software engineering internship at a top company',
  'Get accepted into the MasterCard Foundation Scholars Program',
  'Win the Tony Elumelu Foundation entrepreneurship grant',
  'Build a career in data science',
  'Study medicine in Germany',
];

function parseTargetDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  const m = raw.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (m) {
    const tryD = new Date(`${m[1]} ${m[2]}, ${m[3]}`);
    if (!isNaN(tryD.getTime())) return tryD;
  }
  return null;
}

function daysUntilTarget(raw: string): number | null {
  const d = parseTargetDate(raw);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function urgencyStyle(days: number | null) {
  if (days === null) return { color: '#374151', bg: '#F9FAFB', label: '' };
  if (days < 0) return { color: '#991B1B', bg: '#FEE2E2', label: 'Overdue' };
  if (days <= 14) return { color: '#991B1B', bg: '#FEE2E2', label: `${days}d left` };
  if (days <= 60) return { color: '#92400E', bg: '#FFFBEB', label: `${days}d left` };
  return { color: '#065F46', bg: '#ECFDF5', label: `${days}d left` };
}

function ProgressRing({ percent, color, size = 52 }: { percent: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0ede6" strokeWidth="5" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-black"
        style={{ fontSize: size < 56 ? 10 : 11, color }}
      >
        {percent}%
      </span>
    </div>
  );
}

function GoalCard({ goal, onDelete, onUpdate, onAskAI, t, GOAL_CATS }: any) {
  const [editing,   setEditing]   = useState(false);
  const [progress,  setProgress]  = useState(goal.progress || 0);
  const [newMile,   setNewMile]   = useState('');
  const [milestones, setMilestones] = useState<any[]>(goal.milestones || []);
  const [justToggled, setJustToggled] = useState<number | null>(null);

  const cat = GOAL_CATS.find(c => c.id === goal.category) || GOAL_CATS[6];
  const daysLeft = goal.target_date ? daysUntilTarget(goal.target_date) : null;
  const urgency = urgencyStyle(daysLeft);

  const toggleMilestone = async (idx: number) => {
    const updated = milestones.map((m: any, i: number) =>
      i === idx ? { ...m, done: !m.done } : m
    );
    setMilestones(updated);
    const done = updated.filter((m: any) => m.done).length;
    const prog = updated.length ? Math.round((done / updated.length) * 100) : 0;
    setProgress(prog);
    setJustToggled(idx);
    setTimeout(() => setJustToggled(null), 400);
    await apiRequest('/api/goals', { method: 'PUT', body: JSON.stringify({ id: goal.id, milestones: updated, progress: prog }) });
    onUpdate({ ...goal, milestones: updated, progress: prog });
  };

  const moveMilestone = async (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= milestones.length) return;
    const updated = [...milestones];
    [updated[idx], updated[next]] = [updated[next], updated[idx]];
    setMilestones(updated);
    await apiRequest('/api/goals', { method: 'PUT', body: JSON.stringify({ id: goal.id, milestones: updated }) });
    onUpdate({ ...goal, milestones: updated });
  };

  const addMilestone = async () => {
    if (!newMile.trim()) return;
    const updated = [...milestones, { text: newMile.trim(), done: false }];
    setMilestones(updated);
    setNewMile('');
    await apiRequest('/api/goals', { method: 'PUT', body: JSON.stringify({ id: goal.id, milestones: updated }) });
    onUpdate({ ...goal, milestones: updated });
  };

  const markComplete = async () => {
    await apiRequest('/api/goals', { method: 'PUT', body: JSON.stringify({ id: goal.id, status: 'completed', progress: 100 }) });
    onUpdate({ ...goal, status: 'completed', progress: 100 });
  };

  return (
    <div className="nb-card overflow-hidden">
      {/* Accent */}
      <div className="h-2" style={{ background: cat.color }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 flex-1">
            <ProgressRing percent={progress} color={cat.color} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="nb-badge" style={{ color: cat.color, borderColor: cat.color, background: cat.bg }}>{cat.label}</span>
                {goal.status === 'completed' && (
                  <span className="nb-badge" style={{ color: '#065F46', borderColor: '#065F46', background: '#ECFDF5' }}>✓ {t('complete_status')}</span>
                )}
              </div>
              <h3 className="font-black text-base mt-1 leading-snug">{goal.title}</h3>
              {goal.description && <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>{goal.description}</p>}
              {goal.target_date && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <p className="text-xs font-bold flex items-center gap-1" style={{ color: '#FF5C00' }}>
                    <Calendar size={10} /> {t('target_label')}: {goal.target_date}
                  </p>
                  {urgency.label && (
                    <span className="nb-badge text-[9px] py-0.5 px-1.5"
                      style={{ color: urgency.color, borderColor: urgency.color, background: urgency.bg }}>
                      {urgency.label}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onAskAI(goal)}
              className="nb-btn p-1.5" style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
              <Bot size={12} />
            </button>
            <button onClick={() => onDelete(goal.id)}
              className="nb-btn nb-btn-ghost p-1.5">
              <Trash2 size={12} style={{ color: '#999' }} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#999' }}>{t('progress_label')}</span>
            <span className="text-xs font-black" style={{ color: cat.color }}>{progress}%</span>
          </div>
          <div className="w-full h-3 rounded-full" style={{ background: '#f0ede6', border: '1.5px solid #0A0A0A' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: cat.color }} />
          </div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {milestones.map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-1">
                <button onClick={() => toggleMilestone(i)}
                  className={`flex-1 flex items-center gap-2 text-left px-2 py-1.5 rounded-lg transition-all ${
                    justToggled === i ? 'scale-[1.02]' : ''
                  }`}
                  style={{ background: m.done ? '#E8FFF0' : '#FAFAF7', border: `1.5px solid ${m.done ? '#00C853' : '#e0ddd6'}` }}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-transform ${
                    justToggled === i ? 'scale-125' : ''
                  }`}
                    style={{ background: m.done ? '#00C853' : '#fff', border: '1.5px solid #0A0A0A' }}>
                    {m.done && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-xs font-bold" style={{ color: m.done ? '#065F46' : '#0A0A0A', textDecoration: m.done ? 'line-through' : 'none' }}>
                    {m.text}
                  </span>
                </button>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button type="button" onClick={() => moveMilestone(i, -1)} disabled={i === 0}
                    className="nb-btn nb-btn-ghost p-0.5 disabled:opacity-30">
                    <ChevronUp size={12} />
                  </button>
                  <button type="button" onClick={() => moveMilestone(i, 1)} disabled={i === milestones.length - 1}
                    className="nb-btn nb-btn-ghost p-0.5 disabled:opacity-30">
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add milestone */}
        <div className="flex gap-2 mb-3">
          <input value={newMile} onChange={e => setNewMile(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMilestone()}
            placeholder={t('add_step_placeholder')}
            className="nb-input text-xs py-2 flex-1" />
          <button onClick={addMilestone} disabled={!newMile.trim()}
            className="nb-btn nb-btn-ghost px-2 py-2 disabled:opacity-40">
            <Plus size={13} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2" style={{ borderTop: '1.5px solid #f0ede6' }}>
          <button onClick={() => onAskAI(goal)}
            className="nb-btn flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
            style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
            <Sparkles size={11} /> {t('ai_guidance_btn')}
          </button>
          {goal.status !== 'completed' && (
            <button onClick={markComplete}
              className="nb-btn flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
              style={{ background: '#E8FFF0', color: '#065F46', borderColor: '#00C853' }}>
              <Check size={11} /> {t('mark_done_btn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewGoalModal({ onClose, onCreated, t, GOAL_CATS, EXAMPLE_GOALS }: any) {
  const [form, setForm] = useState({ title: '', description: '', category: 'general', target_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.title.trim()) { setError(t('goal_required')); return; }
    setLoading(true); setError('');
    try {
      const res = await apiRequest('/api/goals', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
      onClose();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden nb-card">
        <div className="flex-shrink-0 px-5 pt-5 pb-4" style={{ borderBottom: '2px solid #f0ede6' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-xl flex items-center gap-2"><Target size={18} style={{ color: '#FF5C00' }} /> {t('set_new_goal_title')}</h2>
            <button onClick={onClose} className="nb-btn nb-btn-ghost p-1.5"><X size={15} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && <div className="p-3 rounded-xl font-bold text-sm" style={{ background: '#FFF0F0', border: '2px solid #E53935', color: '#E53935' }}>{error}</div>}

          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('goal')} *</label>
            <input className="nb-input" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder={t('goal_placeholder')} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXAMPLE_GOALS.slice(0, 4).map(eg => (
                <button key={eg} onClick={() => set('title', eg)}
                  className="nb-btn px-2 py-1 text-xs" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                  {eg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('category')}</label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATS.map(c => (
                <button key={c.id} onClick={() => set('category', c.id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: form.category === c.id ? c.bg : '#fff',
                    border: form.category === c.id ? `2px solid ${c.color}` : '2px solid #e0ddd6',
                    color: form.category === c.id ? c.color : '#999',
                    boxShadow: form.category === c.id ? `2px 2px 0 ${c.color}` : 'none',
                  }}>
                  <span className="text-lg">{c.emoji}</span>
                  <span style={{ fontSize: '9px', textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('description')} ({t('optional')})</label>
            <textarea className="nb-input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder={t('any_context_placeholder')} />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('target_date_optional')}</label>
            <input className="nb-input" type="text" value={form.target_date} onChange={e => set('target_date', e.target.value)}
              placeholder="e.g. December 2026, March 31 2026" />
          </div>
        </div>
        <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: '2px solid #f0ede6' }}>
          <button onClick={handleCreate} disabled={loading || !form.title.trim()}
            className="nb-btn nb-btn-orange w-full py-3 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><RefreshCw size={14} className="animate-spin" /> {t('creating_btn')}</> : <><Zap size={14} /> {t('set_goal_ai_plan_btn')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GoalsPage({ user }: any) {
  const { t } = useI18n();

  const GOAL_CATS = [
    { id: 'scholarship',  label: t('goal_cat_scholarship'),  emoji: '🎓', color: '#1D4ED8', bg: '#EFF6FF' },
    { id: 'study_abroad', label: t('goal_cat_study_abroad'), emoji: '✈️', color: '#065F46', bg: '#ECFDF5' },
    { id: 'competition',  label: t('goal_cat_competition'),  emoji: '🏆', color: '#92400E', bg: '#FFFBEB' },
    { id: 'internship',   label: t('goal_cat_internship'),   emoji: '💼', color: '#5B21B6', bg: '#F5F3FF' },
    { id: 'job',          label: t('goal_cat_job'),          emoji: '🚀', color: '#9A3412', bg: '#FFF7ED' },
    { id: 'skill',        label: t('goal_cat_skill'),        emoji: '📚', color: '#0369A1', bg: '#F0F9FF' },
    { id: 'general',      label: t('goal_cat_general'),      emoji: '⭐', color: '#374151', bg: '#F9FAFB' },
  ];

  const navigate = useNavigate();
  const [goals,   setGoals]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [tab,     setTab]     = useState<'active' | 'completed'>('active');

  useEffect(() => {
    apiRequest('/api/goals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setGoals(d);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    await apiRequest('/api/goals', { method: 'DELETE', body: JSON.stringify({ id }) });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleAskAI = (goal: any) => {
    navigate('/ai', { state: { prompt: `Give me a detailed, step-by-step action plan for my goal: "${goal.title}". Include specific deadlines, resources, documents needed, and how to maximize my chances of success.` } });
  };

  const active    = goals.filter(g => g.status !== 'completed');
  const completed = goals.filter(g => g.status === 'completed');
  const displayed = tab === 'active' ? active : completed;
  const completionRate = goals.length
    ? Math.round((completed.length / goals.length) * 100)
    : 0;
  const avgProgress = active.length
    ? Math.round(active.reduce((s, g) => s + (g.progress || 0), 0) / active.length)
    : 0;
  const onTrackStreak = active.filter(g => (g.progress || 0) > 0).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="nb-card nb-card-navy p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl flex items-center gap-2"><Target size={22} style={{ color: '#FF5C00' }} /> {t('my_goals')}</h1>
            <p className="font-bold text-sm mt-0.5" style={{ color: '#FFD600' }}>
              {t('active_goals_count', { n: active.length })} · {t('completed_goals_count', { n: completed.length })}
            </p>
            {goals.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg border-2 border-[#FFD600] text-[#FFD600]">
                  {completionRate}% complete
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg border-2 border-white/30 text-white/90">
                  {avgProgress}% avg progress
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg border-2 border-[#FF5C00] text-[#FF5C00] bg-white/10">
                  {onTrackStreak} on track
                </span>
              </div>
            )}
          </div>
          <button onClick={() => setShowNew(true)}
            className="nb-btn nb-btn-orange px-4 py-2.5 text-sm flex items-center gap-2">
            <Plus size={14} /> {t('new_goal_btn')}
          </button>
        </div>

        {active.length === 0 && completed.length === 0 && (
          <div className="mt-4 p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-white font-bold text-sm">{t('no_goals_yet')}</p>
            <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>{t('set_first_goal_plan')}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['active', 'completed'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className="nb-btn px-4 py-2 text-sm capitalize"
            style={tab === tabKey ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' } : { background: 'var(--surface)' }}>
            {tabKey === 'active' ? t('active_tab') : t('completed_tab')} ({tabKey === 'active' ? active.length : completed.length})
          </button>
        ))}
      </div>

      {/* Goals */}
      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="nb-card h-40 animate-pulse" style={{ background: '#e0ddd6' }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="nb-card p-10 text-center">
          <div className="text-4xl mb-3">{tab === 'active' ? '🎯' : '🏆'}</div>
          <h3 className="font-black text-lg mb-1">{tab === 'active' ? t('no_active_goals') : t('no_completed_goals')}</h3>
          <p className="text-sm font-bold" style={{ color: '#999' }}>
            {tab === 'active' ? t('set_first_goal_plan') : t('no_completed_goals')}
          </p>
          {tab === 'active' && (
            <button onClick={() => setShowNew(true)} className="nb-btn nb-btn-orange px-5 py-2.5 text-sm mt-4">
              <Plus size={14} className="inline mr-1" /> {t('new_goal_btn')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(goal => (
            <GoalCard key={goal.id} goal={goal}
              onDelete={handleDelete}
              onUpdate={(updated: any) => setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))}
              onAskAI={handleAskAI}
              t={t}
              GOAL_CATS={GOAL_CATS}
            />
          ))}
        </div>
      )}

      {showNew && (
        <NewGoalModal
          onClose={() => setShowNew(false)}
          onCreated={(g: any) => { setGoals(prev => [g, ...prev]); }}
          t={t}
          GOAL_CATS={GOAL_CATS}
          EXAMPLE_GOALS={EXAMPLE_GOALS}
        />
      )}
    </div>
  );
}

function RefreshCw({ size, className }: any) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>;
}
