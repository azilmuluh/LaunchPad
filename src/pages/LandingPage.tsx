import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Trophy, Zap, Globe, BookOpen, Star } from 'lucide-react';

const Logo = () => (
  <img src="/logo.svg" alt="LaunchPad" className="w-full h-full object-contain" />
);

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: <Globe size={22} />, title: 'Discover Opportunities', desc: 'Scholarships, internships, competitions, events and jobs — personalized to your interests.' },
    { icon: <Users size={22} />, title: 'Circles & Community', desc: 'Join study groups, share wins, tips and resources with peers on the same journey.' },
    { icon: <Trophy size={22} />, title: 'Leaderboard & XP', desc: 'Earn points for every action. Climb the ranks and unlock badges as you grow.' },
    { icon: <Zap size={22} />, title: 'AI Roadmaps', desc: 'Get a personalized step-by-step plan to win any opportunity you discover.' },
    { icon: <BookOpen size={22} />, title: 'IYMC & ICSC Prep', desc: 'Dedicated circles and resources for Cameroon\'s top competition applicants.' },
    { icon: <Star size={22} />, title: 'Connect & Network', desc: 'Find peers with similar interests, view profiles, and chat securely.' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 sticky top-0 z-50"
        style={{ background: '#F5F0E8', borderBottom: '2.5px solid #0A0A0A' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border: '2.5px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }}>
            <Logo />
          </div>
          <span className="font-black text-lg" style={{ color: '#0A0A0A' }}>LaunchPad</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/login')}
            className="nb-btn nb-btn-ghost px-4 py-2 text-sm">
            Sign In
          </button>
          <button onClick={() => navigate('/signup')}
            className="nb-btn nb-btn-orange px-4 py-2 text-sm">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 flex flex-col lg:flex-row items-center gap-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 font-bold text-xs"
            style={{ background: '#FFF3EE', border: '2px solid #FF5C00', color: '#FF5C00' }}>
            Founded Dec 5, 2025 &bull; 1,000+ members
          </div>
          <h1 className="font-black text-5xl lg:text-6xl leading-none mb-5" style={{ color: '#0A0A0A' }}>
            Your launchpad<br />
            <span style={{ color: '#FF5C00' }}>to opportunity.</span>
          </h1>
          <p className="text-lg font-bold mb-8" style={{ color: '#555', maxWidth: '480px', lineHeight: 1.6 }}>
            LaunchPad helps Cameroonian youth discover scholarships, internships, competitions and jobs — powered by AI, driven by community.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/signup')}
              className="nb-btn nb-btn-orange px-6 py-3 text-base flex items-center gap-2">
              Create Free Account <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')}
              className="nb-btn nb-btn-navy px-6 py-3 text-base">
              Sign In
            </button>
          </div>
          <p className="mt-4 text-xs font-bold" style={{ color: '#aaa' }}>No credit card required &bull; Free forever</p>
        </div>

        <div className="flex-shrink-0">
          <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-3xl overflow-hidden"
            style={{ border: '3px solid #0A0A0A', boxShadow: '8px 8px 0 #0A0A0A' }}>
            <Logo />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="max-w-5xl mx-auto px-6 mb-14">
        <div className="nb-card-navy p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '1,000+', label: 'Active Members' },
            { value: '5,000+', label: 'Opps Shared' },
            { value: '2026',   label: 'IYMC & ICSC' },
            { value: 'Free',   label: 'Always' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-black text-2xl" style={{ color: '#FF5C00' }}>{s.value}</p>
              <p className="text-xs font-bold" style={{ color: '#aaa' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="font-black text-3xl mb-8 text-center">Everything you need to launch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="nb-card p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#FFF3EE', border: '2px solid #FF5C00', color: '#FF5C00' }}>
                {f.icon}
              </div>
              <h3 className="font-black text-base mb-1">{f.title}</h3>
              <p className="text-sm font-bold" style={{ color: '#666', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="nb-card p-10 text-center" style={{ background: '#0B1E3D' }}>
          <h2 className="font-black text-3xl text-white mb-3">Ready to launch?</h2>
          <p className="font-bold mb-6" style={{ color: '#aaa' }}>Join thousands of Cameroonian youth already on the platform.</p>
          <button onClick={() => navigate('/signup')}
            className="nb-btn nb-btn-orange px-8 py-3 text-base">
            Join LaunchPad Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 px-6" style={{ borderTop: '2px solid #e0ddd6' }}>
        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ border: '2px solid #0A0A0A' }}><Logo /></div>
          <span className="font-black">LaunchPad</span>
        </div>
        <p className="text-xs font-bold" style={{ color: '#aaa' }}>Founded Dec 5, 2025 by Muluh Azinwi Success &bull; &copy; 2026 LaunchPad Community</p>
      </footer>
    </div>
  );
}
