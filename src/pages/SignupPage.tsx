import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { setSession, apiRequest } from '../lib/auth';
import { INTERESTS, INTEREST_CATEGORIES, getInterestsByCategory } from '../lib/interests';
import { Check, ChevronRight, ChevronLeft, Eye, EyeOff, Upload, FileText, RefreshCw, Building2, User } from 'lucide-react';

const EDU_LEVELS = ["High School", "Undergraduate", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Degree", "Other"];
const LOCATIONS  = ["Yaound\u00e9", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaound\u00e9r\u00e9", "Bertoua", "Ebolowa", "Kribi", "Other"];
const ORG_TYPES  = ["NGO / Non-Profit", "University / School", "Company / Startup", "Government Agency", "Research Institute", "Media / Press", "Other"];

const STEPS = [
  { num: 1, label: 'Account Type' },
  { num: 2, label: 'Account Info' },
  { num: 3, label: 'Verify Email' },
  { num: 4, label: 'Interests'    },
  { num: 5, label: 'Education'    },
  { num: 6, label: 'Upload CV'    },
];

export default function SignupPage({ setUser }: any) {
  const [step, setStep]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [selCat, setSelCat]         = useState(INTEREST_CATEGORIES[0]);
  const [showPass, setShowPass]     = useState(false);
  const [codeSent, setCodeSent]     = useState(false);
  const [codeVerified, setVerified] = useState(false);
  const [devCode, setDevCode]       = useState('');
  const [cvDragging, setCvDrag]     = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    account_type: '' as 'person' | 'organization' | '',
    full_name: '', email: '', password: '', phone: '',
    org_type: '', org_website: '',
    interests: [] as string[],
    education_level: '', age: '', location: '',
    code: '', cv_text: '', cv_filename: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isOrg = form.account_type === 'organization';

  // Org accounts skip steps 4 (interests) and 5 (education) and 6 (CV)
  const totalSteps = isOrg ? 3 : 6;
  const effectiveStep = isOrg && step > 3 ? 3 : step;

  const canNext = () => {
    if (step === 1) return !!form.account_type;
    if (step === 2) return form.full_name.trim().length > 1 && form.email.includes('@') && form.password.length >= 6;
    if (step === 3) return codeVerified;
    if (step === 4) return form.interests.length >= 3;
    if (step === 5) return !!form.education_level && !!form.age;
    if (step === 6) return true;
    return false;
  };

  const sendCode = async () => {
    setLoading(true); setError('');
    try {
      const r = await apiRequest('/api/auth?action=send-code', { method: 'POST', body: JSON.stringify({ email: form.email, name: form.full_name }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCodeSent(true);
      if (d.dev_code) setDevCode(d.dev_code);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const verifyCode = async () => {
    setLoading(true); setError('');
    try {
      const r = await apiRequest('/api/auth?action=verify-code', { method: 'POST', body: JSON.stringify({ email: form.email, code: form.code }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setVerified(true);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleCVFile = (file: File) => {
    set('cv_filename', file.name);
    const reader = new FileReader();
    reader.onload = e => set('cv_text', e.target?.result as string || '');
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        account_type: form.account_type,
        age: parseInt(form.age) || null,
      };
      const r = await apiRequest('/api/auth?action=signup', { method: 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSession(d.token, d.user);
      setUser(d.user);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const nextStep = () => {
    // Orgs jump from step 3 straight to submit
    if (isOrg && step === 3) { handleSubmit(); return; }
    setStep(s => s + 1);
  };

  const INP = 'nb-input w-full';
  const LBL = 'block text-xs font-black uppercase tracking-widest mb-1.5' as const;

  const visibleSteps = isOrg ? STEPS.slice(0, 3) : STEPS;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F0E8' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: '2.5px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' }}>
            <img src="/rocket-logo.png" alt="LaunchPad" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-2xl">LaunchPad</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-6 overflow-x-auto">
          {visibleSteps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all"
                  style={{
                    background: step > s.num ? '#00C853' : step === s.num ? '#FF5C00' : '#fff',
                    color: step >= s.num ? '#fff' : '#aaa',
                    border: '2px solid #0A0A0A',
                    boxShadow: step === s.num ? '2px 2px 0 #0A0A0A' : 'none',
                  }}>
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span className="mt-1 font-bold text-center" style={{ fontSize: '8px', color: step >= s.num ? '#0A0A0A' : '#aaa', maxWidth: '52px' }}>{s.label}</span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div className="w-6 h-0.5 mx-1 mb-4" style={{ background: step > s.num ? '#00C853' : '#ddd' }} />
              )}
            </div>
          ))}
        </div>

        <div className="nb-card p-6">
          {error && (
            <div className="p-3 rounded-xl mb-4 font-bold text-sm" style={{ background: '#FFF0F0', border: '2px solid #E53935', color: '#E53935' }}>
              {error}
            </div>
          )}

          {/* STEP 1 — Account Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl">Join LaunchPad</h2>
              <p className="text-sm font-bold" style={{ color: '#999' }}>Are you signing up as a person or an organization?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'person',       icon: <User size={28} />,       label: 'Person',       desc: 'Student, professional, or job seeker' },
                  { type: 'organization', icon: <Building2 size={28} />,  label: 'Organization', desc: 'NGO, company, university, or institution' },
                ].map(o => (
                  <button key={o.type} onClick={() => set('account_type', o.type)}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl text-center transition-all nb-btn"
                    style={form.account_type === o.type
                      ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00', boxShadow: '3px 3px 0 #0A0A0A' }
                      : { background: '#fff', color: '#0A0A0A' }
                    }>
                    {o.icon}
                    <span className="font-black text-sm">{o.label}</span>
                    <span className="text-xs font-bold" style={{ color: form.account_type === o.type ? 'rgba(255,255,255,0.8)' : '#999' }}>{o.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Account Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl">{isOrg ? 'Organization Info' : 'Create your account'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={LBL} style={{ color: '#666' }}>{isOrg ? 'Organization Name' : 'Full Name'} *</label>
                  <input className={INP} value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    placeholder={isOrg ? 'e.g. MasterCard Foundation' : 'e.g. Jean-Pierre Kamga'} />
                </div>
                {isOrg && (
                  <>
                    <div>
                      <label className={LBL} style={{ color: '#666' }}>Organization Type</label>
                      <select className={INP} value={form.org_type} onChange={e => set('org_type', e.target.value)}>
                        <option value="">Select type</option>
                        {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LBL} style={{ color: '#666' }}>Website</label>
                      <input className={INP} type="url" value={form.org_website} onChange={e => set('org_website', e.target.value)} placeholder="https://" />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className={LBL} style={{ color: '#666' }}>Email *</label>
                  <input className={INP} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <label className={LBL} style={{ color: '#666' }}>Password * (min 6)</label>
                  <div className="relative">
                    <input className={INP} type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#aaa' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LBL} style={{ color: '#666' }}>Phone</label>
                  <input className={INP} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+237 6XX..." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Email Verification */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl">Verify your email</h2>
              <p className="text-sm font-bold" style={{ color: '#999' }}>We'll send a 6-digit code to <strong style={{ color: '#0A0A0A' }}>{form.email}</strong></p>
              {devCode && (
                <div className="p-3 rounded-xl font-bold text-sm" style={{ background: '#FFFBEB', border: '2px solid #FFD600' }}>
                  Dev mode &mdash; your code: <strong style={{ fontSize: '20px', letterSpacing: '4px' }}>{devCode}</strong>
                </div>
              )}
              {!codeVerified ? (
                !codeSent ? (
                  <button onClick={sendCode} disabled={loading}
                    className="nb-btn nb-btn-navy w-full py-3 text-sm disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <label className={LBL} style={{ color: '#666' }}>Enter 6-digit code</label>
                    <input className="nb-input text-center text-2xl font-black tracking-widest w-full"
                      value={form.code} onChange={e => set('code', e.target.value.slice(0, 6))}
                      placeholder="000000" maxLength={6} />
                    <div className="flex gap-2">
                      <button onClick={verifyCode} disabled={loading || form.code.length !== 6}
                        className="nb-btn nb-btn-orange flex-1 py-2.5 text-sm disabled:opacity-50">
                        {loading ? 'Verifying...' : 'Verify'}
                      </button>
                      <button onClick={sendCode} disabled={loading} className="nb-btn nb-btn-ghost px-3">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-xl text-center" style={{ background: '#E8FFF0', border: '2.5px solid #00C853' }}>
                  <p className="font-black text-lg">\u2705 Email verified!</p>
                  <p className="text-sm font-bold" style={{ color: '#666' }}>{isOrg ? 'Click Create Account below.' : 'Continue to the next step.'}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Interests (persons only) */}
          {step === 4 && (
            <div>
              <h2 className="font-black text-xl mb-1">Your interests</h2>
              <p className="text-sm font-bold mb-1" style={{ color: '#999' }}>Pick at least 3 to personalize your feed</p>
              <p className="text-xs font-black mb-3" style={{ color: form.interests.length >= 3 ? '#00C853' : '#FF5C00' }}>
                {form.interests.length} selected {form.interests.length < 3 ? `(need ${3 - form.interests.length} more)` : '\u2713'}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {INTEREST_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelCat(cat)}
                    className="nb-btn px-2.5 py-1 text-xs"
                    style={selCat === cat ? { background: '#0B1E3D', color: '#fff' } : { background: '#fff' }}>{cat}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
                {getInterestsByCategory(selCat).map((int: any) => {
                  const sel = form.interests.includes(int.id);
                  return (
                    <button key={int.id} onClick={() => set('interests', sel ? form.interests.filter((i: string) => i !== int.id) : [...form.interests, int.id])}
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

          {/* STEP 5 — Education */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl">Education & profile</h2>
              <div>
                <label className={LBL} style={{ color: '#666' }}>Education Level *</label>
                <select className={INP} value={form.education_level} onChange={e => set('education_level', e.target.value)}>
                  <option value="">Select level</option>
                  {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL} style={{ color: '#666' }}>Age *</label>
                  <input className={INP} type="number" min="14" max="80" value={form.age} onChange={e => set('age', e.target.value)} placeholder="22" />
                </div>
                <div>
                  <label className={LBL} style={{ color: '#666' }}>City</label>
                  <select className={INP} value={form.location} onChange={e => set('location', e.target.value)}>
                    <option value="">Select city</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 — CV Upload */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl">Upload your CV</h2>
              <p className="text-sm font-bold" style={{ color: '#999' }}>Optional &mdash; helps us match better opportunities to your profile.</p>
              <div
                className="border-dashed border-4 rounded-2xl p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: cvDragging ? '#FF5C00' : '#0A0A0A', background: cvDragging ? '#FFF3EE' : '#FAFAF7' }}
                onDragOver={e => { e.preventDefault(); setCvDrag(true); }}
                onDragLeave={() => setCvDrag(false)}
                onDrop={e => { e.preventDefault(); setCvDrag(false); const f = e.dataTransfer.files[0]; if (f) handleCVFile(f); }}
                onClick={() => cvRef.current?.click()}
              >
                <input ref={cvRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCVFile(f); }} />
                {form.cv_filename ? (
                  <><FileText size={36} className="mx-auto mb-2" style={{ color: '#00C853' }} />
                    <p className="font-black">{form.cv_filename}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: '#00C853' }}>Ready to upload</p></>
                ) : (
                  <><Upload size={36} className="mx-auto mb-2" style={{ color: '#aaa' }} />
                    <p className="font-black">Drop or click to browse</p>
                    <p className="text-xs font-bold mt-1" style={{ color: '#aaa' }}>.txt, .pdf, .doc, .docx</p></>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '2px solid #f0ede6' }}>
            <div>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="nb-btn nb-btn-ghost px-4 py-2 text-sm flex items-center gap-1.5">
                  <ChevronLeft size={14} /> Back
                </button>
              )}
            </div>
            <button onClick={step < (isOrg ? 3 : 6) ? nextStep : handleSubmit}
              disabled={!canNext() || loading}
              className="nb-btn nb-btn-orange px-5 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-40">
              {loading ? 'Please wait...' : step === (isOrg ? 3 : 6) ? 'Create Account' : (<>Continue <ChevronRight size={14} /></>)}
            </button>
          </div>

          <p className="text-center text-sm font-bold mt-4" style={{ color: '#999' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-black" style={{ color: '#FF5C00' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
