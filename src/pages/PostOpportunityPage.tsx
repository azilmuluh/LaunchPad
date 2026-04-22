import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/auth';
import OpportunityCard from '../components/OpportunityCard';
import {
  Shield, Sparkles, AlertCircle, ArrowLeft, Loader2,
  Eye, EyeOff, Upload, Image, Wand2, X, Check
} from 'lucide-react';

const CATEGORIES = [
  { id: 'scholarship', label: 'Scholarship', emoji: '\uD83C\uDF93' },
  { id: 'internship',  label: 'Internship',  emoji: '\uD83D\uDCBC' },
  { id: 'event',       label: 'Event',       emoji: '\uD83C\uDF89' },
  { id: 'competition', label: 'Competition', emoji: '\uD83C\uDFC6' },
  { id: 'grant',       label: 'Grant',       emoji: '\uD83D\uDCB0' },
  { id: 'job',         label: 'Job',         emoji: '\uD83D\uDE80' },
];

const TAGS = [
  'technology','business','medicine','engineering','law','education',
  'arts','agriculture','finance','entrepreneurship','data_science',
  'research','health','social_sciences','media','environment','leadership','sports',
];

const FIELD = 'nb-input w-full';
const LBL   = 'block text-xs font-black uppercase tracking-widest mb-1.5';

export default function PostOpportunityPage({ user }: any) {
  const navigate = useNavigate();
  const [preview, setPreview]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState<any>(null);
  const [error,   setError]         = useState('');
  const [focused, setFocused]       = useState('');
  // Flyer ingest
  const [flyerMode,   setFlyerMode]   = useState(false);
  const [flyerImg,    setFlyerImg]    = useState<string | null>(null);
  const [flyerText,   setFlyerText]   = useState('');
  const [flyerParsing, setFlyerParsing] = useState(false);
  const [flyerDrag,   setFlyerDrag]   = useState(false);
  const flyerRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', category: '', source: '', location: '',
    deadline: '', link: '', description: '',
    eligibility: '', benefits: '', tag: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const isValid = form.title.trim().length >= 10
    && !!form.category
    && form.description.trim().length >= 30;

  const linkValid = !form.link || (() => {
    try { const u = new URL(form.link); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
  })();

  const previewItem = { ...form, verified: false, user_name: user.full_name, link: form.link || null };

  // ── Flyer parsing ────────────────────────────────────────────────
  const handleFlyerFile = async (file: File) => {
    if (!file) return;
    // Store preview
    const reader = new FileReader();
    reader.onload = e => setFlyerImg(e.target?.result as string);
    reader.readAsDataURL(file);
    // Also read as text for PDF/doc
    const textReader = new FileReader();
    textReader.onload = e => setFlyerText(e.target?.result as string || '');
    textReader.readAsText(file);
  };

  const parseFlyer = async () => {
    setFlyerParsing(true); setError('');
    try {
      const res = await apiRequest('/api/flyer-parse', {
        method: 'POST',
        body: JSON.stringify({
          image_base64: flyerImg,
          image_text: flyerText || (flyerImg ? 'Image flyer provided' : ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Fill form with parsed data
      setForm(prev => ({
        ...prev,
        title:       data.title       || prev.title,
        category:    data.category    || prev.category,
        source:      data.source      || prev.source,
        location:    data.location    || prev.location,
        deadline:    data.deadline    || prev.deadline,
        link:        data.link        || prev.link,
        description: data.description || prev.description,
        eligibility: data.eligibility || prev.eligibility,
        benefits:    data.benefits    || prev.benefits,
        tag:         data.tag         || prev.tag,
      }));
      setFlyerMode(false); // Switch to edit mode
      setPreview(false);
    } catch (e: any) { setError(e.message); }
    setFlyerParsing(false);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    if (form.link && !linkValid) { setError('Please enter a valid URL.'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiRequest('/api/verified-opps', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data);
      // Badge check
      apiRequest('/api/badges', { method: 'POST' }).catch(() => {});
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fStyle = (name: string) => focused === name ? { boxShadow: '3px 3px 0 #FF5C00', borderColor: '#FF5C00' } : {};
  const fp = (name: string) => ({ onFocus: () => setFocused(name), onBlur: () => setFocused('') });

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-md">
          <div className="nb-card p-6 text-center mb-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: success.verified ? '#E8FFF0' : '#FFFBEB', border: `3px solid ${success.verified ? '#00C853' : '#FFD600'}`, boxShadow: `3px 3px 0 ${success.verified ? '#00C853' : '#FFD600'}` }}>
              {success.verified ? <Shield size={28} style={{ color: '#00C853' }} /> : <AlertCircle size={28} style={{ color: '#D97706' }} />}
            </div>
            <h2 className="font-black text-xl mb-1">{success.verified ? 'Verified & Live!' : 'Posted — Pending Review'}</h2>
            <p className="text-sm font-bold mb-4" style={{ color: success.verified ? '#00C853' : '#D97706' }}>
              {success.verified ? 'AI confirmed as a legitimate opportunity' : 'Will be reviewed shortly'}
            </p>
            <div className="p-3 rounded-xl mb-2" style={{ background: '#E8FFF0', border: '2px solid #00C853' }}>
              <p className="text-xs font-black" style={{ color: '#065F46' }}>+50 XP earned for posting!</p>
            </div>
          </div>
          <p className="text-xs font-black text-center mb-3" style={{ color: '#aaa' }}>YOUR OPPORTUNITY CARD</p>
          <OpportunityCard item={{ ...success, verified: success.verified }} user={user} isBookmarked={false} onBookmark={() => {}} />
          <div className="flex gap-3 mt-5">
            <button onClick={() => navigate('/feed')} className="flex-1 nb-btn nb-btn-ghost py-3 text-sm">View in Feed</button>
            <button onClick={() => { setSuccess(null); setForm({ title:'',category:'',source:'',location:'',deadline:'',link:'',description:'',eligibility:'',benefits:'',tag:'' }); setFlyerImg(null); setFlyerText(''); }}
              className="flex-1 nb-btn nb-btn-orange py-3 text-sm">Post Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/feed')}
          className="flex items-center gap-2 text-sm font-bold mb-5 hover:opacity-70 transition-opacity"
          style={{ color: '#666' }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-black text-2xl mb-1">Share an Opportunity</h1>
            <p className="text-sm font-bold" style={{ color: '#666' }}>
              Help the community. <span className="font-black" style={{ color: '#FF5C00' }}>Earn +50 XP!</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFlyerMode(m => !m)}
              className="nb-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5"
              style={flyerMode ? { background: '#0B1E3D', color: '#FFD600' } : { background: '#fff' }}>
              <Wand2 size={12} /> AI Flyer
            </button>
            {!flyerMode && (
              <button onClick={() => setPreview(p => !p)}
                className="nb-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                style={preview ? { background: '#FF5C00', color: '#fff' } : { background: '#fff' }}>
                {preview ? <EyeOff size={12} /> : <Eye size={12} />}
                {preview ? 'Edit' : 'Preview'}
              </button>
            )}
          </div>
        </div>

        {/* ── FLYER INGEST MODE ── */}
        {flyerMode && (
          <div className="space-y-4">
            <div className="nb-card p-4" style={{ background: '#FFF3EE', borderColor: '#FF5C00' }}>
              <div className="flex items-center gap-2 mb-2">
                <Wand2 size={16} style={{ color: '#FF5C00' }} />
                <p className="font-black text-sm" style={{ color: '#FF5C00' }}>AI Flyer Parser</p>
              </div>
              <p className="text-xs font-bold" style={{ color: '#666' }}>Upload a flyer image or document and our AI will automatically extract all opportunity details for you to review and edit.</p>
            </div>

            <div
              className="border-dashed border-4 rounded-2xl p-10 text-center cursor-pointer transition-all"
              style={{ borderColor: flyerDrag ? '#FF5C00' : '#0A0A0A', background: flyerDrag ? '#FFF3EE' : 'var(--surface)' }}
              onDragOver={e => { e.preventDefault(); setFlyerDrag(true); }}
              onDragLeave={() => setFlyerDrag(false)}
              onDrop={e => { e.preventDefault(); setFlyerDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFlyerFile(f); }}
              onClick={() => flyerRef.current?.click()}
            >
              <input ref={flyerRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFlyerFile(f); }} />
              {flyerImg ? (
                <>
                  <img src={flyerImg} alt="Flyer preview" className="max-h-48 mx-auto rounded-xl mb-3 object-contain" style={{ border: '2px solid #0A0A0A' }} />
                  <p className="font-black text-sm">Flyer loaded</p>
                  <p className="text-xs font-bold mt-1" style={{ color: '#00C853' }}>Ready to parse</p>
                </>
              ) : (
                <>
                  <Image size={40} className="mx-auto mb-3" style={{ color: '#aaa' }} />
                  <p className="font-black">Drop flyer here or click to upload</p>
                  <p className="text-xs font-bold mt-1" style={{ color: '#aaa' }}>PNG, JPG, PDF, TXT, DOC</p>
                </>
              )}
            </div>

            {flyerImg && (
              <div className="flex gap-3">
                <button onClick={() => { setFlyerImg(null); setFlyerText(''); }}
                  className="nb-btn nb-btn-ghost flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  <X size={14} /> Remove
                </button>
                <button onClick={parseFlyer} disabled={flyerParsing}
                  className="nb-btn nb-btn-orange flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                  {flyerParsing ? <><Loader2 size={14} className="animate-spin" /> Parsing...</> : <><Wand2 size={14} /> Parse with AI</>}
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FFF0F0', border: '2px solid #E53935' }}>
                <AlertCircle size={14} style={{ color: '#E53935' }} />
                <p className="text-sm font-bold" style={{ color: '#E53935' }}>{error}</p>
              </div>
            )}

            <button onClick={() => setFlyerMode(false)} className="w-full nb-btn nb-btn-ghost py-2.5 text-sm">
              Fill manually instead
            </button>
          </div>
        )}

        {/* ── PREVIEW MODE ── */}
        {!flyerMode && preview && (
          <div>
            {form.title && (
              <>
                <p className="text-xs font-black text-center mb-3" style={{ color: '#aaa' }}>LIVE CARD PREVIEW</p>
                <OpportunityCard item={previewItem} user={user} isBookmarked={false} onBookmark={() => {}} />
              </>
            )}
            <button onClick={() => setPreview(false)} className="w-full mt-4 nb-btn nb-btn-ghost py-3 text-sm">Back to Editing</button>
          </div>
        )}

        {/* ── FORM MODE ── */}
        {!flyerMode && !preview && (
          <div className="space-y-5">
            {flyerImg && (
              <div className="nb-card p-3 flex items-center gap-3" style={{ background: '#E8FFF0', borderColor: '#00C853' }}>
                <Check size={14} style={{ color: '#00C853' }} />
                <p className="text-xs font-bold" style={{ color: '#065F46' }}>Flyer parsed! Review and edit the fields below, then submit.</p>
                <button onClick={() => setFlyerMode(true)} className="ml-auto nb-btn nb-btn-ghost px-2 py-1 text-xs">Re-parse</button>
              </div>
            )}

            <div>
              <label className={LBL} style={{ color: '#666' }}>Category <span style={{ color: '#FF5C00' }}>*</span></label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => set('category', c.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: form.category === c.id ? 'rgba(255,92,0,0.12)' : 'var(--surface)',
                      border: form.category === c.id ? '2.5px solid #FF5C00' : '2px solid #0A0A0A',
                      boxShadow: form.category === c.id ? '2px 2px 0 #FF5C00' : '2px 2px 0 #0A0A0A',
                      color: form.category === c.id ? '#FF5C00' : 'var(--ink)',
                    }}>
                    <span className="text-xl">{c.emoji}</span>
                    <span style={{ fontSize: '10px' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={LBL} style={{ color: '#666' }}>Title <span style={{ color: '#FF5C00' }}>*</span></label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. MasterCard Foundation Scholars Program 2026"
                className={FIELD} style={fStyle('title')} {...fp('title')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LBL} style={{ color: '#666' }}>Organization</label>
                <input type="text" value={form.source} onChange={e => set('source', e.target.value)}
                  placeholder="e.g. MasterCard Foundation" className={FIELD} style={fStyle('source')} {...fp('source')} />
              </div>
              <div>
                <label className={LBL} style={{ color: '#666' }}>Location</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="Online / Yaound\u00e9" className={FIELD} style={fStyle('location')} {...fp('location')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LBL} style={{ color: '#666' }}>Deadline</label>
                <input type="text" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                  placeholder="March 31, 2026" className={FIELD} style={fStyle('deadline')} {...fp('deadline')} />
              </div>
              <div>
                <label className={LBL} style={{ color: '#666' }}>Application Link</label>
                <input type="url" value={form.link} onChange={e => set('link', e.target.value)}
                  placeholder="https://apply.example.com" className={FIELD}
                  style={{ ...fStyle('link'), ...(form.link && !linkValid ? { borderColor: '#E53935' } : form.link && linkValid ? { borderColor: '#00C853' } : {}) }}
                  {...fp('link')} />
              </div>
            </div>

            <div>
              <label className={LBL} style={{ color: '#666' }}>Description <span style={{ color: '#FF5C00' }}>*</span></label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the opportunity..."
                rows={5} className={`${FIELD} resize-none leading-relaxed`} style={fStyle('description')} {...fp('description')} />
              <div className="flex justify-end mt-1">
                <span className="text-xs font-bold" style={{ color: form.description.length >= 30 ? '#00C853' : '#aaa' }}>{form.description.length} chars</span>
              </div>
            </div>

            <div>
              <label className={LBL} style={{ color: '#666' }}>Eligibility <span className="normal-case font-normal" style={{ color: '#aaa' }}>(separate with &bull;)</span></label>
              <textarea value={form.eligibility} onChange={e => set('eligibility', e.target.value)}
                placeholder="Age 18-30 \u2022 African national \u2022 Bachelor's degree" rows={3}
                className={`${FIELD} resize-none`} style={fStyle('eligibility')} {...fp('eligibility')} />
            </div>

            <div>
              <label className={LBL} style={{ color: '#666' }}>Benefits <span className="normal-case font-normal" style={{ color: '#aaa' }}>(separate with &bull;)</span></label>
              <textarea value={form.benefits} onChange={e => set('benefits', e.target.value)}
                placeholder="Full tuition \u2022 Monthly stipend \u2022 Return airfare" rows={3}
                className={`${FIELD} resize-none`} style={fStyle('benefits')} {...fp('benefits')} />
            </div>

            <div>
              <label className={LBL} style={{ color: '#666' }}>Tag</label>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map(t => (
                  <button key={t} onClick={() => set('tag', form.tag === t ? '' : t)}
                    className="nb-btn px-2.5 py-1 text-xs capitalize"
                    style={form.tag === t ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' } : { background: 'var(--surface)', color: '#666' }}>
                    {t.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#E8FFF0', border: '2px solid #00C853' }}>
              <Shield size={14} style={{ color: '#00C853', marginTop: '1px', flexShrink: 0 }} />
              <p className="text-xs font-bold" style={{ color: '#065F46' }}>Automatically verified by NVIDIA AI before going live.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FFF0F0', border: '2px solid #E53935' }}>
                <AlertCircle size={14} style={{ color: '#E53935', flexShrink: 0 }} />
                <p className="text-sm font-bold" style={{ color: '#E53935' }}>{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={!isValid || loading || (!!form.link && !linkValid)}
              className="w-full nb-btn nb-btn-orange py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-30">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying...</> : <><Sparkles size={14} /> Post Opportunity</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
