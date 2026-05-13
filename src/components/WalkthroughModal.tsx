import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Sparkles, Video, Users, Trophy, ChevronRight, X } from 'lucide-react';

interface WalkthroughModalProps {
  onClose: () => void;
  userName: string;
}

export default function WalkthroughModal({ onClose, userName }: WalkthroughModalProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Welcome to LaunchPad, ${userName.split(' ')[0]}! 🚀`,
      description: "Let's take a quick tour of your new hub for personalized opportunities and networking.",
      icon: <Sparkles size={48} className="text-orange-500 mb-4" />,
      color: "#FF5C00",
    },
    {
      title: "Discover Blips 🎬",
      description: "Watch short, TikTok-style videos to quickly digest the latest scholarships, internships, and tips. Swipe up to see more!",
      icon: <Video size={48} className="text-yellow-400 mb-4" />,
      color: "#FFD600",
    },
    {
      title: "Join the Community 🤝",
      description: "Connect with like-minded individuals in Circles. Share your experiences, ask questions, and grow your network.",
      icon: <Users size={48} className="text-blue-500 mb-4" />,
      color: "#3B82F6",
    },
    {
      title: "Climb the Leaderboard 🏆",
      description: "Earn XP by posting, commenting, and helping others. Unlock badges, climb the ranks, and stand out as a top contributor!",
      icon: <Trophy size={48} className="text-purple-500 mb-4" />,
      color: "#8B5CF6",
    }
  ];

  const currentStep = steps[step];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-[#FDFCFB] rounded-3xl overflow-hidden shadow-2xl border-4 border-black relative"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white rounded-full border-2 border-black hover:bg-neutral-100 transition-colors z-10"
        >
          <X size={16} />
        </button>

        <div 
          className="h-32 flex items-end justify-center pb-4 transition-colors duration-500"
          style={{ background: `${currentStep.color}22` }}
        >
          {currentStep.icon}
        </div>

        <div className="p-6 text-center">
          <h2 className="text-xl font-black mb-3 text-slate-900 leading-tight">
            {currentStep.title}
          </h2>
          <p className="text-sm font-bold text-slate-600 mb-8 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-slate-800' : 'w-2 bg-slate-300'}`}
                />
              ))}
            </div>

            <button 
              onClick={nextStep}
              className="flex items-center gap-1 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black active:scale-95 transition-transform"
            >
              {step === steps.length - 1 ? 'Get Started' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
