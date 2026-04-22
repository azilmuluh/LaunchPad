import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Rocket, Users, Trophy, Zap, BookOpen, PlusSquare, Mic } from 'lucide-react';

const STEPS = [
  {
    icon: <Rocket size={32} style={{ color: '#FF5C00' }} />,
    title: 'Welcome to LaunchPad!',
    desc: 'Your personal gateway to scholarships, internships, competitions, events, and jobs. Built for ambitious youth across Africa and beyond.',
    tip: 'This guide walks you through every feature. You can re-open it anytime from your Profile.',
  },
  {
    icon: <BookOpen size={32} style={{ color: '#1D4ED8' }} />,
    title: 'Discover Opportunities',
    desc: 'The Discover tab is your personalized feed. It uses your interests, education level, and CV to surface the most relevant opportunities for you.',
    tip: 'Tip: Refresh the feed to pull the latest results. Use category filters to narrow down by Scholarship, Job, Competition, and more.',
  },
  {
    icon: <PlusSquare size={32} style={{ color: '#00C853' }} />,
    title: 'Post Opportunities',
    desc: 'Found a great opportunity? Share it with the community! Every post is verified by NVIDIA AI before going live. You earn +50 XP for each verified post.',
    tip: 'Tip: Fill in eligibility and benefits fields to make your post more useful to others.',
  },
  {
    icon: <Users size={32} style={{ color: '#7C3AED' }} />,
    title: 'Community & Circles',
    desc: 'The Community tab is where LaunchPad comes alive. Share wins, tips, and thoughts. Create or join Circles \u2014 focused study groups with chat, tasks, and shared resources.',
    tip: 'Tip: Create a Circle for a specific goal like "2026 IYMC Prep" and invite your study partners.',
  },
  {
    icon: <Trophy size={32} style={{ color: '#FFD600' }} />,
    title: 'Leaderboard & XP',
    desc: 'Earn XP by being active: posting opportunities (+50), community posts (+20), comments (+10), bookmarks (+5), and daily logins (+10). Level up and climb the leaderboard!',
    tip: 'Tip: Maintain a daily streak for bonus XP. A 7-day streak earns you 75 bonus XP.',
  },
  {
    icon: <Zap size={32} style={{ color: '#FF5C00' }} />,
    title: 'AI Assistant',
    desc: 'The AI tab gives you a personal career advisor powered by NVIDIA. Ask it to find opportunities, help write your application essay, prepare for interviews, or explain a scholarship.',
    tip: 'Tip: The AI knows your profile \u2014 ask it "What should I apply to this week?" for personalized picks.',
  },
  {
    icon: <Mic size={32} style={{ color: '#0B1E3D' }} />,
    title: 'Voice Assistant',
    desc: 'Tap the microphone button anywhere in the app for a hands-free experience. Speak naturally \u2014 ask for opportunities, get advice, or navigate the platform with your voice.',
    tip: 'Tip: Try saying "Find me scholarships for computer science" or "Improve my CV" for instant help.',
  },
];

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
  const [step, setStep] = useState(0);
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
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#aaa' }}>
              Step {step + 1} of {STEPS.length}
            </span>
            <button onClick={onDone} className="nb-btn nb-btn-ghost p-1.5">
              <X size={14} style={{ color: '#999' }} />
            </button>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: '#F5F0E8', border: '2.5px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' }}>
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
              <ChevronLeft size={14} /> Back
            </button>
            {isLast ? (
              <button onClick={onDone}
                className="nb-btn nb-btn-orange px-6 py-2.5 text-sm font-black">
                Launch LaunchPad!
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)}
                className="nb-btn nb-btn-orange px-5 py-2 text-sm flex items-center gap-1.5">
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
