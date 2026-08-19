import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setSession, apiRequest } from '../lib/auth';
import { Eye, EyeOff } from 'lucide-react';
import SEO from '../components/SEO';
import { useI18n } from '../lib/i18n';

export default function AuthPage({ setUser }: any) {
  const { t } = useI18n();
  const [email, setEmail]    = useState('');
  const [password, setPass]  = useState('');
  const [showPass, setShowP] = useState(false);
  const [loading, setLoading]= useState(false);
  const [error, setError]    = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res  = await apiRequest('/api/auth?action=login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch(e) {}
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
      setSession(data.token, data.user);
      setUser(data.user);
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <SEO 
        title="Sign In — LaunchPad Community"
        description="Sign in to LaunchPad Community to access personalized scholarships, internships, and AI application help for African youth."
        keywords="LaunchPad login, LaunchPad Community sign in, launchpadcm"
        canonical="/login"
      />
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: 'var(--navy)', borderRight: '3px solid #0A0A0A' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden" style={{ border: '3px solid #FFD600', boxShadow: '3px 3px 0 #FFD600' }}>
            <img src="/LaunchPad.svg" alt="LaunchPad" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-black text-xl">LaunchPad</span>
        </div>

        <div>
          <h1 className="text-white font-black text-5xl leading-tight mb-4">
            {t('gateway_to')}<br />
            <span style={{ color: '#FF5C00' }}>{t('opportunities_word')}</span>
          </h1>
          {Array.isArray(t('features_data')) && t('features_data').length >= 2 && (
            <p className="font-bold text-sm mb-1" style={{ color: '#A0AEC0' }}>
              {t('features_data')[0]?.title}, {t('features_data')[1]?.title}
            </p>
          )}
          <p className="font-bold text-sm mb-8" style={{ color: '#A0AEC0' }}>{t('built_for')}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('scholarships') },
              { label: t('internships') },
              { label: t('competitions') },
              { label: t('jobs') },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)' }}>
                <div className="text-white font-black text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="font-bold text-xs" style={{ color: '#A0AEC0' }}>LaunchPad · {t('founded_date')}</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }}>
              <img src="/LaunchPad.svg" alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xl">LaunchPad</span>
          </div>

          <div className="nb-card p-8">
            <h2 className="font-black text-2xl mb-1">{t('welcome_back')}</h2>
            <p className="font-bold text-sm mb-6" style={{ color: '#999' }}>{t('signin_account')}</p>

            {error && (
              <div className="p-3 rounded-xl mb-4 font-bold text-sm"
                style={{ background: '#FFF0F0', border: '2px solid #E53935', color: '#E53935' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com" className="nb-input" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{t('password')}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPass(e.target.value)} required
                    placeholder="••••••" className="nb-input pr-10" />
                  <button type="button" onClick={() => setShowP(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#999' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="nb-btn nb-btn-orange w-full py-3 text-sm disabled:opacity-50">
                {loading ? t('signing_in_btn') : t('signin')}
              </button>
            </form>

            <p className="text-center text-sm font-bold mt-5" style={{ color: '#999' }}>
              {t('no_account')}{' '}
              <Link to="/signup" className="font-black" style={{ color: '#FF5C00' }}>{t('create_one')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
