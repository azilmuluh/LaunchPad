import { useState, useRef, useEffect } from 'react';
import { apiRequest, setSession, getToken } from '../lib/auth';
import { INTERESTS, INTEREST_CATEGORIES, getInterestsByCategory } from '../lib/interests';
import { Edit3, Check, X, Upload, FileText, TrendingUp, Lightbulb, ChevronRight, Plus, Trash2, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BADGE_DEFS } from '../lib/badges';
import SEO from '../components/SEO';
import { useI18n } from '../lib/i18n';

const EDU_LEVELS_EN = ["High School", "Undergraduate", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Degree", "Other"];
const EDU_LEVELS_FR = ["Lycée", "Premier Cycle", "Licence", "Master", "Doctorat", "Diplôme Professionnel", "Autre"];
const LOCATIONS  = ["Yaound\u00e9", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaound\u00e9r\u00e9", "Bertoua", "Ebolowa", "Kribi", "Other"];
const GOAL_CATS  = ['scholarship', 'internship', 'competition', 'career', 'learning', 'other'];

function Field({ label, value, onSave, type = 'text', options }: any) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  useEffect(() => { if (!editing) setVal(value || ''); }, [value, editing]);
  const save = () => { onSave(val); setEditing(false); };
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1.5px solid #f0ede6' }}>
      <span className="text-xs font-black uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--muted)', width: '80px' }}>{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 ml-2">
          {options ? (
            <select className="nb-input text-sm flex-1 py-1.5" value={val} onChange={e => setVal(e.target.value)}>
              <option value="">{t('select_prompt')}</option>
              {options.map((o: string) => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input className="nb-input text-sm flex-1 py-1.5" type={type} value={val}
              onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} />
          )}
          <button onClick={save} className="nb-btn nb-btn-orange p-1.5"><Check size={12} /></button>
          <button onClick={() => setEditing(false)} className="nb-btn nb-btn-ghost p-1.5"><X size={12} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end ml-2">
          <span className="text-sm font-bold text-right" style={{ color: val ? '#0A0A0A' : '#ccc' }}>{val || t('not_set')}</span>
          <button onClick={() => setEditing(true)} className="p-1 hover:opacity-60"><Edit3 size={11} style={{ color: 'var(--muted)' }} /></button>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: any) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const progress = goal.progress || 0;
  const statusColors: Record<string, string> = { active: '#FF5C00', completed: '#00C853', paused: '#FFD600' };
  return (
    <div className="nb-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={14} style={{ color: '#FF5C00' }} />
          <h4 className="font-black text-sm">{goal.title}</h4>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-black px-2 py-0.5 rounded-full"
            style={{ background: `${statusColors[goal.status]}22`, color: statusColors[goal.status], border: `1.5px solid ${statusColors[goal.status]}` }}>
            {goal.status}
          </span>
          <button onClick={() => onDelete(goal.id)} className="p-1 hover:opacity-60"><Trash2 size={11} style={{ color: 'var(--muted)' }} /></button>
        </div>
      </div>
      {goal.description && <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>{goal.description}</p>}
      {goal.target_date && <p className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>{t('target')}: {new Date(goal.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full" style={{ background: '#f0ede6', border: '1.5px solid #0A0A0A' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#FF5C00' }} />
        </div>
        <span className="text-xs font-black" style={{ color: '#FF5C00' }}>{progress}%</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {[0, 25, 50, 75, 100].map(p => (
          <button key={p} onClick={() => onUpdate(goal.id, { progress: p, status: p === 100 ? 'completed' : 'active' })}
            className="text-xs font-bold px-2 py-0.5 rounded nb-btn"
            style={progress === p ? { background: '#FF5C00', color: 'var(--ink)', borderColor: '#FF5C00' } : { background: 'var(--surface)', color: 'var(--muted)' }}>
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}

function AddGoalForm({ onAdd, onCancel }: any) {
  const { t } = useI18n();
  const [form, setForm] = useState({ title: '', description: '', category: 'scholarship', target_date: '' });
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const r = await apiRequest('/api/goals', { method: 'POST', body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onAdd(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  return (
    <div className="nb-card p-4 space-y-3">
      <h4 className="font-black text-sm">{t('new_goal')}</h4>
      <input className="nb-input text-sm" placeholder={t('goal_title')} value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <textarea className="nb-input text-sm resize-none" rows={2} placeholder={t('description_optional')}
        value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <select className="nb-input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {GOAL_CATS.map(c => <option key={c} value={c}>{t(c as any)}</option>)}
        </select>
        <input type="date" className="nb-input text-sm" value={form.target_date}
          onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={!form.title.trim() || loading}
          className="nb-btn nb-btn-orange flex-1 py-2 text-sm disabled:opacity-40">
          {loading ? t('adding') : t('add_goal')}
        </button>
        <button onClick={onCancel} className="nb-btn nb-btn-ghost px-4 py-2 text-sm">{t('cancel')}</button>
      </div>
    </div>
  );
}

export default function ProfilePage({ user, setUser }: any) {
  const { t } = useI18n();
  const navigate  = useNavigate();
  const [tab, setTab] = useState<'profile' | 'interests' | 'preferences' | 'goals' | 'cv' | 'insights'>('profile');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [selCat,  setSelCat]  = useState(INTEREST_CATEGORIES[0]);
  const [interests, setInterests] = useState<string[]>(JSON.parse(user.interests || '[]'));
  const [oppCategories, setOppCategories] = useState<string[]>(JSON.parse(user.opportunity_categories || '[]'));
  const [avatarPreview, setAvatarPrev] = useState(user.avatar_url || '');
  const [cvText,    setCvText]    = useState(user.cv_text || '');
  const [cvFilename, setCvFilename] = useState('');
  const [cvDrag,    setCvDrag]    = useState(false);
  const [stats,     setStats]     = useState<any>(null);
  const [weekInsights, setWeekInsights] = useState<any>(null);
  const [goals,     setGoals]     = useState<any[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [aiFbLoading, setAiFbLoading] = useState(false);
  const [aiFbError, setAiFbError] = useState<string>('');
  const avatarRef = useRef<HTMLInputElement>(null);
  const cvRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiRequest('/api/leaderboard').then(r => r.json()).then(d => {
      if (d.board && Array.isArray(d.board)) {
        const me = d.board.find((u: any) => u.user_id === user.id);
        if (me) setStats({ ...me, earned_badges: d.my_badges || [] });
      }
    }).catch(() => {});
    apiRequest('/api/insights').then(r => r.json()).then(d => {
      if (!d?.error) setWeekInsights(d);
    }).catch(() => {});
    apiRequest('/api/goals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setGoals(d);
    }).catch(() => {});
  }, []);

  const [toast, setToast] = useState<{ kind: 'info' | 'err' | 'xp'; text: string } | null>(null);

  const saveProfile = async (updates: any) => {
    setSaving(true);
    try {
      const res = await apiRequest('/api/auth?action=update', { method: 'PUT', body: JSON.stringify(updates) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(getToken()!, data.user);
      setUser(data.user);
      setToast({ kind: 'info', text: t('profile_updated') });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { 
      console.error(e);
      setToast({ kind: 'err', text: e.message || 'Update failed' });
    }
    setSaving(false);
  };

  const saveField = (field: string, value: any) => saveProfile({ [field]: value });

  const handleAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const url = e.target?.result as string;
      setAvatarPrev(url);
      await saveProfile({ avatar_url: url });
    };
    reader.readAsDataURL(file);
  };

  const handleCVFile = (file: File) => {
    setCvFilename(file.name);
    const reader = new FileReader();
    reader.onload = async e => {
      const text = e.target?.result as string || '';
      setCvText(text);
      // Save CV text and filename to backend in one go
      await saveProfile({ cv_text: text, cv_filename: file.name });
      if (file.type === 'application/pdf') {
        alert('Note: PDF text extraction is basic. For best results with AI matching, please use a .txt file or paste your CV text.');
      }
    };
    reader.readAsText(file);
  };

  const handleGoalUpdate = async (id: number, updates: any) => {
    try {
      const r = await apiRequest('/api/goals', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
      const d = await r.json();
      if (r.ok) setGoals(prev => prev.map(g => g.id === id ? d : g));
    } catch {}
  };

  const handleGoalDelete = async (id: number) => {
    if (!confirm(t('delete_goal_confirm'))) return;
    await apiRequest('/api/goals', { method: 'DELETE', body: JSON.stringify({ id }) });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '2026';
  const isOrg = user.account_type === 'organization';

  const insights = [
    !stats?.total_xp && { icon: '\uD83D\uDE80', text: t('insight_post_opp'), action: t('post_opportunity'), route: '/post' },
    (stats?.comments_made || 0) < 3 && { icon: '\uD83D\uDCAC', text: t('insight_comment'), action: t('go_to_community'), route: '/community' },
    !user.cv_text && !isOrg && { icon: '\uD83D\uDCC4', text: t('insight_cv'), action: t('upload_cv'), route: null },
    (stats?.current_streak || 0) < 7 && { icon: '\uD83D\uDD25', text: t('insight_streak', { days: stats?.current_streak || 0 }), action: null, route: null },
    JSON.parse(user.interests || '[]').length < 5 && { icon: '\u2B50', text: t('insight_interests'), action: t('edit_interests'), route: null },
    goals.length === 0 && { icon: '\uD83C\uDFAF', text: t('insight_goal'), action: t('add_goal'), route: null },
  ].filter(Boolean) as any[];

  const TABS = [
    { id: 'profile',   label: t('profile')    },
    { id: 'interests', label: t('interests')  },
    { id: 'preferences', label: t('preferences') || 'Preferences' },
    ...(!isOrg ? [{ id: 'goals', label: t('goals') }] : []),
    ...(!isOrg ? [{ id: 'cv', label: t('cv') }] : []),
    { id: 'insights',  label: `${t('insights')}${insights.length > 0 ? ` (${insights.length})` : ''}` },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 w-full overflow-x-hidden">
      <SEO 
        title="My Profile" 
        description="Manage your LaunchPad profile, interests, and goals."
        noindex={true}
      />
      {/* Header card */}
      <div className="nb-card nb-card-navy p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer"
              style={{ border: '3px solid #FFD600', boxShadow: '3px 3px 0 #0A0A0A' }}
              onClick={() => avatarRef.current?.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white" style={{ background: '#FF5C00' }}>{initials}</div>
              }
            </div>
            <button onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: '#FF5C00', border: '2px solid #0A0A0A' }}>
              <Upload size={10} className="text-white" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-white font-black text-xl leading-none">{user.full_name}</h1>
              {isOrg && <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: '#FFD600', color: 'var(--ink)' }}>ORG</span>}
            </div>
            <p className="text-sm font-bold mt-0.5" style={{ color: '#FFD600' }}>{user.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {user.location && <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{user.location}</span>}
              {user.education_level && <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{user.education_level}</span>}
              <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Since {memberSince}</span>
            </div>
          </div>
          {stats && stats.total_xp > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-white font-black text-2xl">{stats.total_xp.toLocaleString()}</p>
              <p className="text-xs font-bold" style={{ color: '#FFD600' }}>XP &middot; Lv.{stats.level}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="nb-btn px-3 py-2 text-xs"
            style={tab === t.id ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' } : { background: 'var(--surface)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PROFILE */}
      {tab === 'profile' && (
        <div className="nb-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base">{t('personal_details')}</h3>
            {saved && <span className="text-xs font-black" style={{ color: '#00C853' }}>✓ {t('saved')}</span>}
          </div>
          <Field label={t('name')} value={user.full_name} onSave={v => saveField('full_name', v)} />
          <Field label={t('phone')} value={user.phone} onSave={v => saveField('phone', v)} type="tel" />
          <Field label={t('education')} value={user.education_level} onSave={v => saveField('education_level', v)} options={t('lang') === 'fr' ? EDU_LEVELS_FR : EDU_LEVELS_EN} />
          <Field label={t('location')} value={user.location} onSave={v => saveField('location', v)} options={LOCATIONS} />
          <Field label={t('age')} value={user.age?.toString()} onSave={v => saveField('age', v)} type="number" />
          <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1.5px solid #f0ede6' }}>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)', width: '80px' }}>{t('email')}</span>
            <span className="text-sm font-bold">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)', width: '80px' }}>{t('verified')}</span>
            <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: '#E8FFF0', color: '#00C853', border: '1.5px solid #00C853' }}>
              {user.email_verified ? `✓ ${t('verified')}` : t('unverified')}
            </span>
          </div>
          
          <button
            onClick={() => saveProfile({
              full_name: user.full_name,
              location: user.location,
              education_level: user.education_level,
              phone: user.phone,
              age: user.age
            })}
            disabled={saving}
            className="nb-btn nb-btn-orange w-full py-3 mt-4 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? t('saving') : <><Check size={16} /> {t('save_all_btn') || 'Update Profile'}</>}
          </button>
        </div>
      )}

      {/* INTERESTS */}
      {tab === 'interests' && (
        <div className="nb-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base">{t('my_interests')} ({interests.length})</h3>
            <button onClick={() => saveField('interests', interests)} disabled={saving}
              className="nb-btn nb-btn-orange px-4 py-1.5 text-xs disabled:opacity-50">
              {saving ? t('saving') : saved ? `✓ ${t('saved')}` : t('save')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {INTEREST_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelCat(cat)}
                className="nb-btn px-2.5 py-1 text-xs"
                style={selCat === cat ? { background: 'var(--surface)', color: 'var(--ink)' } : { background: 'var(--surface)' }}>
                {t(`cat_${cat.toLowerCase()}` as any)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
            {getInterestsByCategory(selCat).map((int: any) => {
              const sel = interests.includes(int.id);
              return (
                <button key={int.id} onClick={() => setInterests(prev => sel ? prev.filter(i => i !== int.id) : [...prev, int.id])}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                  style={{ background: sel ? '#FF5C00' : '#fff', color: sel ? '#fff' : '#0A0A0A', border: '2px solid #0A0A0A', boxShadow: sel ? '2px 2px 0 #0A0A0A' : '1px 1px 0 #ddd' }}>
                  <span>{int.icon}</span>
                  <span className="text-xs font-bold">{t(int.id as any)}</span>
                  {sel && <Check size={11} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PREFERENCES */}
      {tab === 'preferences' && (
        <div className="nb-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base">{t('opportunity_preferences') || 'Opportunity Categories'}</h3>
            <button onClick={() => saveField('opportunity_categories', oppCategories)} disabled={saving}
              className="nb-btn nb-btn-orange px-4 py-1.5 text-xs disabled:opacity-50">
              {saving ? t('saving') : saved ? `✓ ${t('saved')}` : t('save')}
            </button>
          </div>
          <p className="text-xs font-bold mb-4" style={{ color: 'var(--muted)' }}>Select the types of opportunities you want to see in your feed.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {['scholarship', 'internship', 'event', 'competition', 'grant', 'job'].map(cat => {
              const sel = oppCategories.includes(cat);
              return (
                <button key={cat} onClick={() => setOppCategories(prev => sel ? prev.filter(c => c !== cat) : [...prev, cat])}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                  style={{ background: sel ? '#FF5C00' : '#fff', color: sel ? '#fff' : '#0A0A0A', border: '2px solid #0A0A0A', boxShadow: sel ? '2px 2px 0 #0A0A0A' : '1px 1px 0 #ddd' }}>
                  <span className="text-xs font-bold capitalize">{cat}</span>
                  {sel && <Check size={11} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GOALS */}
      {tab === 'goals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base">{t('my_goals')} ({goals.length})</h3>
            <button onClick={() => setShowAddGoal(true)} className="nb-btn nb-btn-orange px-3 py-1.5 text-xs flex items-center gap-1">
              <Plus size={12} /> {t('add_goal')}
            </button>
          </div>
          {showAddGoal && (
            <AddGoalForm onAdd={(g: any) => { setGoals(prev => [g, ...prev]); setShowAddGoal(false); }} onCancel={() => setShowAddGoal(false)} />
          )}
          {goals.length === 0 && !showAddGoal ? (
            <div className="nb-card p-10 text-center">
              <Target size={36} className="mx-auto mb-3" style={{ color: '#FF5C00' }} />
              <h4 className="font-black text-base mb-1">{t('no_goals_yet')}</h4>
              <p className="text-sm font-bold mb-3" style={{ color: '#999' }}>{t('set_goals_track')}</p>
              <button onClick={() => setShowAddGoal(true)} className="nb-btn nb-btn-orange px-4 py-2 text-sm">{t('add_first_goal')}</button>
            </div>
          ) : (
            goals.map(g => <GoalCard key={g.id} goal={g} onUpdate={handleGoalUpdate} onDelete={handleGoalDelete} />)
          )}
        </div>
      )}

      {/* CV */}
      {tab === 'cv' && (
        <div className="nb-card p-5 space-y-4">
          <h3 className="font-black text-base">{t('resume')}</h3>
          <p className="text-sm font-bold" style={{ color: '#999' }}>{t('stored_securely')}</p>
          <div
            className="border-dashed border-4 rounded-2xl p-8 text-center cursor-pointer transition-all"
            style={{ borderColor: cvDrag ? '#FF5C00' : '#0A0A0A', background: cvDrag ? '#FFF3EE' : '#FAFAF7' }}
            onDragOver={e => { e.preventDefault(); setCvDrag(true); }}
            onDragLeave={() => setCvDrag(false)}
            onDrop={e => { e.preventDefault(); setCvDrag(false); const f = e.dataTransfer.files[0]; if (f) handleCVFile(f); }}
            onClick={() => cvRef.current?.click()}
          >
            <input ref={cvRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCVFile(f); }} />
            {cvFilename || cvText ? (
              <><FileText size={32} className="mx-auto mb-2" style={{ color: '#00C853' }} />
                <p className="font-black">{cvFilename || t('cv_loaded')}</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#00C853' }}>{Math.round(cvText.length / 10) / 100}KB {t('ready')}</p></>
            ) : user.cv_text ? (
              <><FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--surface)' }} />
                <p className="font-black">{t('cv')} {t('on_file')}</p>
                <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>{t('click_replace')}</p></>
            ) : (
              <><Upload size={32} className="mx-auto mb-2" style={{ color: 'var(--muted)' }} />
                <p className="font-black">{t('drop_click')}</p>
                <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>.txt, .pdf, .doc, .docx</p></>
            )}
          </div>
          {(cvText || user.cv_text) && (
            <button onClick={async () => { await saveField('cv_text', cvText); setCvFilename(''); }}
              disabled={saving || !cvText} className="nb-btn nb-btn-orange w-full py-3 text-sm disabled:opacity-50">
              {saving ? t('saving') : saved ? `✓ ${t('saved')}` : t('save_cv_content')}
            </button>
          )}
        </div>
      )}

      {/* INSIGHTS */}
      {tab === 'insights' && (
        <div className="space-y-4">
          {weekInsights?.deltas && (
            <div className="nb-card p-4">
              <h3 className="font-black text-base mb-3">This week vs last week</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Comments',   v: weekInsights.deltas.comments },
                  { label: 'Bookmarks',  v: weekInsights.deltas.bookmarks },
                  { label: 'Posts',      v: weekInsights.deltas.posts },
                  { label: 'Active days',v: weekInsights.deltas.activeDays },
                ].map(({ label, v }: any) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ background: '#FAFAF7', border: '2px solid #f0ede6' }}>
                    <p className="font-black text-lg" style={{ color: '#FF5C00' }}>{v.current}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#999' }}>{label}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: v.delta >= 0 ? '#00C853' : '#E53935' }}>
                      {v.delta >= 0 ? '+' : ''}{v.delta} vs last week
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weekInsights?.nextBestAction && (
            <div className="nb-card p-4" style={{ background: '#FFF3EE', borderColor: '#FF5C00', boxShadow: '3px 3px 0 #FF5C00' }}>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#FF5C00' }}>Next best action</p>
              <p className="font-black text-base">{weekInsights.nextBestAction.title}</p>
              <p className="text-xs font-bold mt-1" style={{ color: '#999' }}>{weekInsights.nextBestAction.why}</p>
              <button
                onClick={() => navigate(weekInsights.nextBestAction.route)}
                className="mt-3 nb-btn nb-btn-orange px-4 py-2 text-xs w-full"
              >
                {weekInsights.nextBestAction.cta}
              </button>
            </div>
          )}

          {stats && stats.total_xp > 0 && (
            <div className="nb-card p-4">
              <h3 className="font-black text-base mb-3">{t('activity_overview')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('total_xp'),    value: stats.total_xp.toLocaleString(), color: '#FFD600' },
                  { label: t('level'),       value: `Lv.${stats.level}`,             color: '#FF5C00' },
                  { label: t('streak'),      value: `${stats.current_streak}d`,      color: '#E53935' },
                  { label: t('best_streak'), value: `${stats.longest_streak}d`,      color: '#FFD600' },
                  { label: t('posted'),      value: stats.opps_posted,               color: '#00C853' },
                  { label: t('saved'),       value: stats.opps_bookmarked,           color: 'var(--surface)' },
                  { label: t('comments'),    value: stats.comments_made,             color: '#7C3AED' },
                  { label: t('goals'),       value: goals.length,                    color: '#FF5C00' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: '#FAFAF7', border: '2px solid #f0ede6' }}>
                    <p className="font-black text-lg" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs font-bold" style={{ color: '#999' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Feedback Button */}
          <div className="nb-card p-4 mb-5" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
            <div className="text-center">
              <h3 className="font-black text-white text-base mb-2">Want to improve your chances?</h3>
              <p className="text-xs text-slate-300 font-bold mb-4">Let LaunchPad AI analyze your engagement and give you personalized tips.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={async () => {
                  if (aiFbLoading) return;
                  setAiFbLoading(true);
                  setAiFbError('');
                  try {
                    const r = await apiRequest('/api/ai-feedback');
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error || 'AI feedback error');
                    setAiFeedback(d);
                  } catch (e: any) {
                    setAiFbError(e.message || 'Failed to load AI feedback');
                  } finally {
                    setAiFbLoading(false);
                  }
                }}
                className="nb-btn px-4 py-2 text-xs text-black flex-1 flex justify-center items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: '#FFD600' }}
                disabled={aiFbLoading}
              >
                {aiFbLoading ? 'Analyzing…' : 'Generate AI Feedback'}
              </button>
              <button
                onClick={async () => {
                  if (aiFbLoading) return;
                  setAiFbLoading(true);
                  setAiFbError('');
                  try {
                    const r = await apiRequest('/api/ai-feedback?refresh=1');
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error || 'AI feedback error');
                    setAiFeedback(d);
                  } catch (e: any) {
                    setAiFbError(e.message || 'Failed to refresh AI feedback');
                  } finally {
                    setAiFbLoading(false);
                  }
                }}
                className="nb-btn px-4 py-2 text-xs flex-1"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                disabled={aiFbLoading}
              >
                Refresh
              </button>
              <button
                onClick={() => navigate('/ai', { state: { prompt: "Analyze my profile and engagement stats, and tell me how I can use LaunchPad better to achieve my goals." } })}
                className="nb-btn px-4 py-2 text-xs flex-1"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Chat with AI
              </button>
            </div>

            {aiFbError && (
              <p className="mt-3 text-xs font-bold text-red-200 text-center">{aiFbError}</p>
            )}

            {aiFeedback?.summary && (
              <div className="mt-4 nb-card p-4" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#FFD600' }}>
                  Your AI Summary
                </p>
                <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>{aiFeedback.summary}</p>
                {Array.isArray(aiFeedback.tips) && aiFeedback.tips.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {aiFeedback.tips.slice(0, 6).map((tip: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,214,0,0.08)', border: '1.5px solid rgba(255,214,0,0.22)' }}>
                        <p className="text-sm font-black" style={{ color: '#FFD600' }}>{tip.title}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>{tip.why}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                          Next: <span style={{ color: 'rgba(255,255,255,0.92)' }}>{tip.next_step}</span>
                        </p>
                        {tip.route && (
                          <button
                            onClick={() => navigate(tip.route)}
                            className="mt-2 nb-btn nb-btn-orange px-3 py-1 text-xs"
                          >
                            Go
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="nb-card p-4">
            <h3 className="font-black text-base mb-3">{t('suggestions')}</h3>
            {insights.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-black">{t('insight_crushing')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((ins: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FFF3EE', border: '2px solid #FFD600' }}>
                    <span className="text-xl flex-shrink-0">{ins.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{ins.text}</p>
                      {ins.action && (
                        <button onClick={() => ins.route ? navigate(ins.route) : setTab('goals')}
                          className="mt-2 nb-btn nb-btn-orange px-3 py-1 text-xs">
                          {ins.action}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="nb-card p-4">
            <h3 className="font-black text-base mb-3">Earned Badges</h3>
            {stats?.earned_badges?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.earned_badges.map((bk: string) => {
                  const b = BADGE_DEFS[bk];
                  return (
                    <div key={bk} className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-xl shadow-sm" title={b?.label || bk}>
                      {b?.icon || '🏅'}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-bold" style={{ color: '#999' }}>{t('no_badges_yet')}</p>
            )}
            <button onClick={() => navigate('/leaderboard')} className="mt-3 text-xs font-black text-orange-600 underline uppercase tracking-widest">
              {t('badge_catalogue')}
            </button>
          </div>
        </div>
      {/* Toast notifications */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] anim-up">
          <div className="nb-card px-4 py-2 flex items-center gap-2 shadow-2xl"
            style={{ 
              background: toast.kind === 'err' ? '#FFF0F0' : toast.kind === 'xp' ? '#FFD600' : '#E8FFF0',
              borderColor: toast.kind === 'err' ? '#E53935' : toast.kind === 'xp' ? '#0A0A0A' : '#00C853'
            }}>
            {toast.kind === 'err' ? <X size={14} className="text-red-600" /> : <Check size={14} className="text-green-600" />}
            <p className="text-xs font-black" style={{ color: toast.kind === 'err' ? '#E53935' : 'inherit' }}>{toast.text}</p>
            <button onClick={() => setToast(null)} className="ml-2 opacity-50"><X size={12} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
