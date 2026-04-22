import { useState } from 'react';
import { apiRequest } from '../lib/auth';
import { X, Check, AlertCircle, Shield, Loader } from 'lucide-react';

const CATEGORIES = [
  { id: 'scholarship', label: 'Scholarship', emoji: '\uD83C\uDF93' },
  { id: 'internship',  label: 'Internship',  emoji: '\uD83D\uDCBC' },
  { id: 'competition', label: 'Competition', emoji: '\uD83C\uDFC6' },
  { id: 'event',       label: 'Event',       emoji: '\uD83D\uDCC5' },
  { id: 'job',         label: 'Job',         emoji: '\uD83D\uDE80' },
];

const TAGS = [
  'technology','business','medicine','engineering','law','education',
  'arts','agriculture','finance','entrepreneurship','data_science','research',
  'health','social_sciences','media','environment','leadership','sports',
];

const STEPS = ['Core Info', 'Eligibility & Benefits', 'Details & Submit'];

export default function PostOpportunityModal({ user, onClose, onPosted }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', category: '', description: '',
    eligibility: '', benefits: '',
    deadline: '', link: '', source: '', location: '', tag: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.title.trim().length > 5 && !!form.category && form.description.trim().length > 20;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/api/verified-opps', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      onPosted?.(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-4 py-3 rounded-xl text-white placeholder-blue-600 outline-none text-sm";
  const inpStyle = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' };
  const lbl = "text-blue-300 text-xs font-bold uppercase tracking-widest mb-1.5 block";

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    const isVerified = result.verified;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
        <div className="w-full max-w-sm rounded-2xl p-8 text-center"
          style={{ background: '#0F2952', border: '1px solid rgba(255,255,255,0.1)' }}>

          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5`}
            style={{
              background: isVerified ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
              border: `2px solid ${isVerified ? 'rgba(34,197,94,0.4)' : 'rgba(251,191,36,0.4)'}`,
            }}>
            {isVerified
              ? <Shield size={28} style={{ color: '#86efac' }} />
              : <AlertCircle size={28} style={{ color: '#fbbf24' }} />
            }
          </div>

          <h3 className="text-white text-xl font-bold mb-2">
            {isVerified ? 'Opportunity Verified!' : 'Opportunity Posted!'}
          </h3>
          <p className="text-sm mb-1" style={{ color: isVerified ? '#86efac' : '#fbbf24' }}>
            {isVerified
              ? '\u2713 AI-verified as a legitimate opportunity'
              : '\u26A0\uFE0F Pending manual verification'
            }
          </p>
          {result.verification?.reason && (
            <p className="text-blue-400 text-xs mb-5">{result.verification.reason}</p>
          )}
          <p className="text-blue-300 text-sm mb-6">Your opportunity is now live in the Community tab.</p>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)' }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full sm:max-w-lg max-h-[96vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#0B1E3D', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4"
          style={{ background: 'rgba(15,41,82,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>\uD83D\uDCE2</div>
              <div>
                <h2 className="text-white font-bold">Post an Opportunity</h2>
                <p className="text-blue-400 text-xs">Step {step + 1} of 3 — {STEPS[step]}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X size={15} className="text-blue-300" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-400"
                style={{ background: i <= step ? '#F97316' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* STEP 0 */}
          {step === 0 && (
            <>
              <div>
                <label className={lbl}>Title *</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. MasterCard Foundation Scholars Program 2025"
                  className={inp} style={inpStyle} />
              </div>

              <div>
                <label className={lbl}>Category *</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => set('category', c.id)}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.category === c.id ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
                        border: form.category === c.id ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        color: form.category === c.id ? '#fed7aa' : '#475569',
                      }}>
                      <span className="text-xl">{c.emoji}</span>
                      <span style={{ fontSize: '10px' }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lbl}>Description * <span className="normal-case text-blue-500 font-normal">(min 20 chars)</span></label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Describe the opportunity in detail — what it is, who offers it, and what it provides..."
                  rows={5} className={`${inp} resize-none leading-relaxed`} style={inpStyle} />
                <p className="text-right text-xs mt-1" style={{ color: form.description.length > 20 ? '#86efac' : '#475569' }}>
                  {form.description.length} chars
                </p>
              </div>
            </>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="rounded-xl p-3 flex items-start gap-2.5"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <AlertCircle size={14} style={{ color: '#60a5fa', marginTop: '1px', flexShrink: 0 }} />
                <p className="text-xs leading-relaxed" style={{ color: '#93c5fd' }}>
                  Separate multiple items with a bullet (\u2022). Example: <em>"Age 18-30 \u2022 African national \u2022 Bachelor's degree"</em>
                </p>
              </div>

              <div>
                <label className={lbl}>Eligibility Requirements</label>
                <textarea value={form.eligibility} onChange={e => set('eligibility', e.target.value)}
                  placeholder="Age 18-30 \u2022 African national \u2022 Bachelor's degree \u2022 Financial need demonstrated"
                  rows={4} className={`${inp} resize-none`} style={inpStyle} />
              </div>

              <div>
                <label className={lbl}>Benefits & Perks</label>
                <textarea value={form.benefits} onChange={e => set('benefits', e.target.value)}
                  placeholder="Full tuition \u2022 Monthly stipend \u2022 Return airfare \u2022 Health insurance \u2022 Mentorship"
                  rows={4} className={`${inp} resize-none`} style={inpStyle} />
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Application Deadline</label>
                  <input type="text" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                    placeholder="e.g. March 31, 2025" className={inp} style={inpStyle} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Application Link</label>
                  <input type="url" value={form.link} onChange={e => set('link', e.target.value)}
                    placeholder="https://apply.example.com" className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className={lbl}>Source / Org</label>
                  <input type="text" value={form.source} onChange={e => set('source', e.target.value)}
                    placeholder="e.g. MasterCard Foundation" className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className={lbl}>Location</label>
                  <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                    placeholder="Online / Yaound\u00E9" className={inp} style={inpStyle} />
                </div>
              </div>

              <div>
                <label className={lbl}>Interest Tag</label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map(t => (
                    <button key={t} onClick={() => set('tag', form.tag === t ? '' : t)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize"
                      style={{
                        background: form.tag === t ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
                        color: form.tag === t ? '#fed7aa' : '#475569',
                        border: form.tag === t ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      {t.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI verification notice */}
              <div className="rounded-xl p-3 flex items-start gap-2.5"
                style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Shield size={14} style={{ color: '#86efac', marginTop: '1px', flexShrink: 0 }} />
                <p className="text-xs leading-relaxed" style={{ color: '#86efac' }}>
                  Your submission will be <strong>automatically verified</strong> by NVIDIA AI to ensure it's a legitimate opportunity before going live.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,41,82,0.5)' }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)' }}>
              ← Back
            </button>
          ) : <div />}

          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)' }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #F97316, #ea6c0a)' }}>
              {loading ? <><Loader size={14} className="animate-spin" /> Verifying with AI...</> : '\uD83D\uDE80 Post Opportunity'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
