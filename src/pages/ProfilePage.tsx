import { useState, useRef, useEffect } from 'react';
import { apiRequest, setSession, getToken } from '../lib/auth';
import { INTERESTS, INTEREST_CATEGORIES, getInterestsByCategory } from '../lib/interests';
import { Edit3, Check, X, Upload, FileText, TrendingUp, Lightbulb, ChevronRight, Plus, Trash2, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EDU_LEVELS = ["High School", "Undergraduate", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Degree", "Other"];
const LOCATIONS  = ["Yaound\u00e9", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaound\u00e9r\u00e9", "Bertoua", "Ebolowa", "Kribi", "Other"];
const GOAL_CATS  = ['scholarship', 'internship', 'competition', 'career', 'learning', 'other'];

function Field({ label, value, onSave, type = 'text', options }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  useEffect(() => { if (!editing) setVal(value || ''); }, [value, editing]);
  const save = () => { onSave(val); setEditing(false); };
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1.5px solid #f0ede6' }}>
      <span className="text-xs font-black uppercase tracking-widest flex-shrink-0" style={{ color: '#aaa', width: '80px' }}>{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 ml-2">
          {options ? (
            <select className="nb-input text-sm flex-1 py-1.5" value={val} onChange={e => setVal(e.target.value)}>
              <option value="">Select...</option>
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
          <span className="text-sm font-bold text-right" style={{ color: val ? '#0A0A0A' : '#ccc' }}>{val || 'Not set'}</span>
          <button onClick={() => setEditing(true)} className="p-1 hover:opacity-60"><Edit3 size={11} style={{ color: '#ccc' }} /></button>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: any) {
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
          <button onClick={() => onDelete(goal.id)} className="p-1 hover:opacity-60"><Trash2 size={11} style={{ color: '#ccc' }} /></button>
        </div>
      </div>
      {goal.description && <p className="text-xs font-medium mb-2" style={{ color: '#666' }}>{goal.description}</p>}
      {goal.target_date && <p className="text-xs font-bold mb-2" style={{ color: '#aaa' }}>Target: {new Date(goal.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
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
            style={progress === p ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' } : { background: '#fff', color: '#666' }}>
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}

function AddGoalForm({ onAdd, onCancel }: any) {
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
      <h4 className="font-black text-sm">New Goal</h4>
      <input className="nb-input text-sm" placeholder="Goal title..." value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <textarea className="nb-input text-sm resize-none" rows={2} placeholder="Description (optional)"
        value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <select className="nb-input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {GOAL_CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <input type="date" className="nb-input text-sm" value={form.target_date}
          onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={!form.title.trim() || loading}
          className="nb-btn nb-btn-orange flex-1 py-2 text-sm disabled:opacity-40">
          {loading ? 'Adding...' : 'Add Goal'}
        </button>
        <button onClick={onCancel} className="nb-btn nb-btn-ghost px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>
  );
}

export default function ProfilePage({ user, setUser }: any) {
  const navigate  = useNavigate();
  const [tab, setTab] = useState<'profile' | 'interests' | 'goals' | 'cv' | 'insights'>('profile');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [selCat,  setSelCat]  = useState(INTEREST_CATEGORIES[0]);
  const [interests, setInterests] = useState<string[]>(JSON.parse(user.interests || '[]'));
  const [avatarPreview, setAvatarPrev] = useState(user.avatar_url || '');
  const [cvText,    setCvText]    = useState(user.cv_text || '');
  const [cvFilename, setCvFilename] = useState('');
  const [cvDrag,    setCvDrag]    = useState(false);
  const [stats,     setStats]     = useState<any>(null);
  const [goals,     setGoals]     = useState<any[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const cvRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiRequest('/api/leaderboard').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setStats(d.find((u: any) => u.user_id === user.id) || null);
    }).catch(() => {});
    apiRequest('/api/goals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setGoals(d);
    }).catch(() => {});
  }, []);

  const saveField = async (field: string, value: any) => {
    setSaving(true);
    try {
      const res = await apiRequest('/api/auth?action=update', { method: 'PUT', body: JSON.stringify({ [field]: value }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(getToken()!, data.user);
      setUser(data.user);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const url = e.target?.result as string;
      setAvatarPrev(url);
      await saveField('avatar_url', url);
    };
    reader.readAsDataURL(file);
  };

  const handleCVFile = (file: File) => {
    setCvFilename(file.name);
    const reader = new FileReader();
    reader.onload = e => setCvText(e.target?.result as string || '');
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
    if (!confirm('Delete this goal?')) return;
    await apiRequest('/api/goals', { method: 'DELETE', body: JSON.stringify({ id }) });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '2026';
  const isOrg = user.account_type === 'organization';

  const insights = [
    !stats?.total_xp && { icon: '\uD83D\uDE80', text: 'Post your first opportunity to earn 50 XP and appear on the leaderboard!', action: 'Post Opportunity', route: '/post' },
    (stats?.comments_made || 0) < 3 && { icon: '\uD83D\uDCAC', text: 'Comment on community posts to earn XP and build your presence.', action: 'Go to Community', route: '/community' },
    !user.cv_text && !isOrg && { icon: '\uD83D\uDCC4', text: 'Upload your CV to unlock smarter opportunity matching.', action: 'Upload CV', route: null },
    (stats?.current_streak || 0) < 7 && { icon: '\uD83D\uDD25', text: `Build a 7-day streak for a 75 XP bonus! You're on ${stats?.current_streak || 0} days.`, action: null, route: null },
    JSON.parse(user.interests || '[]').length < 5 && { icon: '\u2B50', text: 'Add more interests to get better personalized recommendations.', action: 'Edit Interests', route: null },
    goals.length === 0 && { icon: '\uD83C\uDFAF', text: 'Set your first goal to track your progress and stay motivated!', action: 'Add Goal', route: null },
  ].filter(Boolean) as any[];

  const TABS = [
    { id: 'profile',   label: 'Profile'    },
    { id: 'interests', label: 'Interests'  },
    { id: 'goals',     label: 'Goals'      },
    { id: 'cv',        label: 'CV'         },
    { id: 'insights',  label: `Insights${insights.length > 0 ? ` (${insights.length})` : ''}` },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
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
              {isOrg && <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: '#FFD600', color: '#0A0A0A' }}>ORG</span>}
            </div>
            <p className="text-sm font-bold mt-0.5" style={{ color: '#FFD600' }}>{user.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {user.location && <span className="text-xs font-bold" style={{ color: '#aaa' }}>{user.location}</span>}
              {user.education_level && <span className="text-xs font-bold" style={{ color: '#aaa' }}>{user.education_level}</span>}
              <span className="text-xs font-bold" style={{ color: '#aaa' }}>Since {memberSince}</span>
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
            style={tab === t.id ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' } : { background: '#fff' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PROFILE */}
      {tab === 'profile' && (
        <div className="nb-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base">Personal Details</h3>
            {saved && <span className="text-xs font-black" style={{ color: '#00C853' }}>\u2713 Saved</span>}
          </div>
          <Field label="Name" value={user.full_name} onSave={v => saveField('full_name', v)} />
          <Field label="Phone" value={user.phone} onSave={v => saveField('phone', v)} type="tel" />
          <Field label="Education" value={user.education_level} onSave={v => saveField('education_level', v)} options={EDU_LEVELS} />
          <Field label="Location" value={user.location} onSave={v => saveField('location', v)} options={LOCATIONS} />
          <Field label="Age" value={user.age?.toString()} onSave={v => saveField('age', v)} type="number" />
          <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1.5px solid #f0ede6' }}>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#aaa', width: '80px' }}>Email</span>
            <span className="text-sm font-bold">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#aaa', width: '80px' }}>Verified</span>
            <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: '#E8FFF0', color: '#00C853', border: '1.5px solid #00C853' }}>
              {user.email_verified ? '\u2713 Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      )}

      {/* INTERESTS */}
      {tab === 'interests' && (
        <div className="nb-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base">My Interests ({interests.length})</h3>
            <button onClick={() => saveField('interests', interests)} disabled={saving}
              className="nb-btn nb-btn-orange px-4 py-1.5 text-xs disabled:opacity-50">
              {saving ? 'Saving...' : saved ? '\u2713 Saved' : 'Save'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {INTEREST_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelCat(cat)}
                className="nb-btn px-2.5 py-1 text-xs"
                style={selCat === cat ? { background: '#0B1E3D', color: '#fff' } : { background: '#fff' }}>{cat}</button>
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
                  <span className="text-xs font-bold">{int.label}</span>
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
            <h3 className="font-black text-base">My Goals ({goals.length})</h3>
            <button onClick={() => setShowAddGoal(true)} className="nb-btn nb-btn-orange px-3 py-1.5 text-xs flex items-center gap-1">
              <Plus size={12} /> Add Goal
            </button>
          </div>
          {showAddGoal && (
            <AddGoalForm onAdd={(g: any) => { setGoals(prev => [g, ...prev]); setShowAddGoal(false); }} onCancel={() => setShowAddGoal(false)} />
          )}
          {goals.length === 0 && !showAddGoal ? (
            <div className="nb-card p-10 text-center">
              <Target size={36} className="mx-auto mb-3" style={{ color: '#FF5C00' }} />
              <h4 className="font-black text-base mb-1">No goals yet</h4>
              <p className="text-sm font-bold mb-3" style={{ color: '#999' }}>Set goals to track your progress toward opportunities.</p>
              <button onClick={() => setShowAddGoal(true)} className="nb-btn nb-btn-orange px-4 py-2 text-sm">Add First Goal</button>
            </div>
          ) : (
            goals.map(g => <GoalCard key={g.id} goal={g} onUpdate={handleGoalUpdate} onDelete={handleGoalDelete} />)
          )}
        </div>
      )}

      {/* CV */}
      {tab === 'cv' && (
        <div className="nb-card p-5 space-y-4">
          <h3 className="font-black text-base">CV / Resume</h3>
          <p className="text-sm font-bold" style={{ color: '#999' }}>Stored securely. Used only to improve your opportunity matching.</p>
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
                <p className="font-black">{cvFilename || 'CV loaded'}</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#00C853' }}>{Math.round(cvText.length / 10) / 100}KB ready</p></>
            ) : user.cv_text ? (
              <><FileText size={32} className="mx-auto mb-2" style={{ color: '#0B1E3D' }} />
                <p className="font-black">CV on file</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#aaa' }}>Click to replace</p></>
            ) : (
              <><Upload size={32} className="mx-auto mb-2" style={{ color: '#aaa' }} />
                <p className="font-black">Drop or click to upload</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#aaa' }}>.txt, .pdf, .doc, .docx</p></>
            )}
          </div>
          {cvText && (
            <button onClick={async () => { await saveField('cv_text', cvText); setCvFilename(''); }}
              disabled={saving} className="nb-btn nb-btn-orange w-full py-3 text-sm disabled:opacity-50">
              {saving ? 'Saving...' : saved ? '\u2713 Saved!' : 'Save CV'}
            </button>
          )}
        </div>
      )}

      {/* INSIGHTS */}
      {tab === 'insights' && (
        <div className="space-y-4">
          {stats && stats.total_xp > 0 && (
            <div className="nb-card p-4">
              <h3 className="font-black text-base mb-3">Activity Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total XP',    value: stats.total_xp.toLocaleString(), color: '#FFD600' },
                  { label: 'Level',       value: `Lv.${stats.level}`,             color: '#FF5C00' },
                  { label: 'Streak',      value: `${stats.current_streak}d`,      color: '#E53935' },
                  { label: 'Best Streak', value: `${stats.longest_streak}d`,      color: '#FFD600' },
                  { label: 'Posted',      value: stats.opps_posted,               color: '#00C853' },
                  { label: 'Bookmarked',  value: stats.opps_bookmarked,           color: '#0B1E3D' },
                  { label: 'Comments',    value: stats.comments_made,             color: '#7C3AED' },
                  { label: 'Goals',       value: goals.length,                    color: '#FF5C00' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: '#FAFAF7', border: '2px solid #f0ede6' }}>
                    <p className="font-black text-lg" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs font-bold" style={{ color: '#999' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="nb-card p-4">
            <h3 className="font-black text-base mb-3">Suggestions</h3>
            {insights.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">\uD83C\uDF89</p>
                <p className="font-black">You're crushing it!</p>
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
        </div>
      )}
    </div>
  );
}
