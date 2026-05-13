import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Rocket, Users, Trophy, Zap, BookOpen, PlusSquare, Mic } from 'lucide-react';
import { useI18n } from '../lib/i18n';

const ONBOARDING_KEY = 'lp_onboarding_done';

export function useOnboarding() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) setShow(true);
  }, []);
  const dismiss = () => { localStorage.setItem(ONBOARDING_KEY, '1'); setShow(false); };
  const reopen  = () => setShow(true);
  return { show, dismiss, reopen };
}

export default function OnboardingGuide({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const STEPS = [
    {
      icon: <Rocket size={32} style={{ color: '#FF5C00' }} />,
      title: t('welcome_title'),
      desc: t('welcome_desc'),
      tip: t('welcome_tip'),
    },
    {
      icon: <BookOpen size={32} style={{ color: '#1D4ED8' }} />,
      title: t('discover_title'),
      desc: t('discover_desc'),
      tip: t('discover_tip'),
    },
    {
      icon: <PlusSquare size={32} style={{ color: '#00C853' }} />,
      title: t('post_title'),
      desc: t('post_desc'),
      tip: t('post_tip'),
    },
    {
      icon: <Users size={32} style={{ color: '#7C3AED' }} />,
      title: t('community_title'),
      desc: t('community_desc'),
      tip: t('community_tip'),
    },
    {
      icon: <Trophy size={32} style={{ color: '#FFD600' }} />,
      title: t('leaderboard_title'),
      desc: t('leaderboard_desc'),
      tip: t('leaderboard_tip'),
    },
    {
      icon: <Zap size={32} style={{ color: '#FF5C00' }} />,
      title: t('ai_title_onboarding'),
      desc: t('ai_desc_onboarding'),
      tip: t('ai_tip_onboarding'),
    },
    {
      icon: <Mic size={32} style={{ color: 'var(--surface)' }} />,
      title: t('voice_title'),
      desc: t('voice_desc'),
      tip: t('voice_tip'),
    },
  ];

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>

      <div className="w-full max-w-md nb-card overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5" style={{ background: '#f0ede6' }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: '#FF5C00' }} />
        </div>

        <div className="p-6">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              {t('step_count', { n: step + 1, total: STEPS.length })}
            </span>
            <button onClick={onDone} className="nb-btn nb-btn-ghost p-1.5">
              <X size={14} style={{ color: '#999' }} />
            </button>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'var(--bg)', border: '2.5px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' }}>
            {current.icon}
          </div>

          {/* Content */}
          <h2 className="font-black text-xl mb-3">{current.title}</h2>
          <p className="font-bold text-sm leading-relaxed mb-4" style={{ color: '#444' }}>
            {current.desc}
          </p>

          {/* Tip box */}
          <div className="p-3 rounded-xl mb-6"
            style={{ background: '#FFFBEB', border: '2px solid #FFD600' }}>
            <p className="text-xs font-bold" style={{ color: '#92400E' }}>
              {current.tip}
            </p>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  background: i === step ? '#FF5C00' : '#ddd',
                  border: '1.5px solid #0A0A0A',
                }} />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="nb-btn nb-btn-ghost px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-30">
              <ChevronLeft size={14} /> {t('back')}
            </button>
            {isLast ? (
              <button onClick={onDone}
                className="nb-btn nb-btn-orange px-6 py-2.5 text-sm font-black">
                {t('launch_btn')}
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)}
                className="nb-btn nb-btn-orange px-5 py-2 text-sm flex items-center gap-1.5">
                {t('continue')} <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
