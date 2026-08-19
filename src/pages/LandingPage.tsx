import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Trophy, Zap, Globe, BookOpen, Star } from 'lucide-react';
import SEO from '../components/SEO';
import { useI18n } from '../lib/i18n';

const Logo = ({ priority }: { priority?: string }) => (
  <img 
    src="/LaunchPad.svg" 
    alt="LaunchPad Community Logo" 
    className="w-full h-full object-contain" 
    fetchPriority={priority as any}
  />
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const featureIcons = [
    <Globe size={22} />, <Users size={22} />, <Trophy size={22} />,
    <Zap size={22} />, <BookOpen size={22} />, <Star size={22} />
  ];

  const features = (t('features_data') as any[] || []).map((f, i) => ({
    ...f,
    icon: featureIcons[i]
  }));

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SEO 
        title="LaunchPad Community — Scholarships & Opportunities for African Youth"
        description="LaunchPad Community is a youth-led platform helping Cameroonian and African students find verified scholarships, internships, competitions, and events. Join free."
        keywords="LaunchPad, LaunchPad Community, launchpadcm, scholarships Cameroon, African youth opportunities"
        canonical="/"
      />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 sticky top-0 z-50"
        style={{ background: 'var(--bg)', borderBottom: '2.5px solid #0A0A0A' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }}>
            <Logo />
          </div>
          <p className="font-black text-lg" style={{ color: 'var(--ink)' }}>LaunchPad</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/login')}
            className="nb-btn nb-btn-ghost px-4 py-2 text-sm">
            {t('sign_in_btn')}
          </button>
          <button onClick={() => navigate('/signup')}
            className="nb-btn nb-btn-orange px-4 py-2 text-sm">
            {t('get_started_btn')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 flex flex-col lg:flex-row items-center gap-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 font-bold text-xs"
            style={{ background: '#FFF3EE', border: '2px solid #FF5C00', color: 'var(--ink)' }}>
            {t('founded_on')} &bull; {t('members_count')}
          </div>
          <h1 className="font-black text-5xl lg:text-6xl leading-none mb-5" style={{ color: 'var(--ink)' }}>
            {t('hero_title').split('launchpad')[0]}launchpad<br />
            <span style={{ color: '#FF5C00' }}>{t('hero_title').split('launchpad')[1] || 'to opportunity.'}</span>
          </h1>
          <p className="text-lg font-bold mb-8" style={{ color: '#555', maxWidth: '480px', lineHeight: 1.6 }}>
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/signup')}
              className="nb-btn nb-btn-orange px-6 py-3 text-base flex items-center gap-2">
              {t('create_free_account')} <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')}
              className="nb-btn nb-btn-navy px-6 py-3 text-base">
              {t('sign_in_btn')}
            </button>
          </div>
          <p className="mt-4 text-xs font-bold" style={{ color: 'var(--muted)' }}>{t('no_cc_required')}</p>
        </div>

        <div className="flex-shrink-0">
          <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-3xl overflow-hidden"
            style={{ border: '3px solid #0A0A0A', boxShadow: '8px 8px 0 #0A0A0A' }}>
            <Logo priority="high" />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="max-w-5xl mx-auto px-6 mb-14">
        <div className="nb-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ background: 'var(--navy)' }}>
          {[
            { value: '1,000+', label: t('active_members') },
            { value: '5,000+', label: t('opps_shared') },
            { value: '2026',   label: 'IYMC & ICSC' },
            { value: t('free'),   label: t('always') },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-black text-2xl" style={{ color: '#FFD600' }}>{s.value}</p>
              <p className="text-xs font-bold" style={{ color: '#A0AEC0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="font-black text-3xl mb-8 text-center">{t('everything_you_need')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="nb-card p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#FFF3EE', border: '2px solid #FF5C00', color: 'var(--ink)' }}>
                {f.icon}
              </div>
              <h3 className="font-black text-base mb-1">{f.title}</h3>
              <p className="text-sm font-bold" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 mb-16">
        <h2 className="font-black text-3xl mb-8 text-center">{t('frequently_asked')}</h2>
        <div className="space-y-4">
          {[
            { q: t('what_is_lp'), a: t('lp_answer') },
            { q: t('is_lp_free'), a: t('lp_free_answer') },
            { q: t('how_find_scholarships'), a: t('lp_find_answer') },
          ].map((item, idx) => (
            <div key={idx} className="nb-card p-5">
              <h3 className="font-black text-lg mb-2">{item.q}</h3>
              <p className="text-sm font-bold" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="nb-card p-10 text-center" style={{ background: 'var(--surface)' }}>
          <h2 className="font-black text-3xl mb-3" style={{ color: 'var(--ink)' }}>{t('ready_to_launch')}</h2>
          <p className="font-bold mb-6" style={{ color: 'var(--muted)' }}>{t('join_thousands')}</p>
          <button onClick={() => navigate('/signup')}
            className="nb-btn nb-btn-orange px-8 py-3 text-base">
            {t('create_free_account')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 px-6" style={{ borderTop: '2px solid #e0ddd6' }}>
        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ border: '2px solid #0A0A0A' }}>
            <img src="/LaunchPad.svg" alt="LaunchPad Logo" className="w-full h-full object-cover" />
          </div>
          <p className="font-black">LaunchPad</p>
        </div>
        <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{t('founded_by')} Muluh Azinwi Success &bull; &copy; 2026 LaunchPad Community</p>
      </footer>
    </main>
  );
}
