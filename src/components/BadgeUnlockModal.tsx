import { useState, useEffect } from 'react';
import { Share2, X, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Badge {
  key: string;
  label: string;
  icon: string;
  desc: string;
  xp: number;
}

export default function BadgeUnlockModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const [step, setStep] = useState<'reveal' | 'details'>('reveal');

  useEffect(() => {
    if (step === 'reveal') {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF5C00', '#FFD600', '#00C853']
        });
        setStep('details');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const shareText = `🚀 I just unlocked the "${badge.label}" badge on LaunchPad! ${badge.icon} Join me and reach your goals: ${window.location.origin}`;
  const shareUrl = window.location.origin;
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LaunchPad Achievement',
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
  };

  const handleSharePlatform = (platform: 'linkedin' | 'twitter' | 'whatsapp') => {
    let url = '';
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    if (platform === 'linkedin') {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    } else if (platform === 'whatsapp') {
      url = `https://wa.me/?text=${encodedText}`;
    }
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm relative">
        {step === 'reveal' ? (
          <div className="flex flex-col items-center justify-center animate-pulse">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#FF5C00] to-[#FFD600] flex items-center justify-center border-4 border-white shadow-[0_0_50px_rgba(255,92,0,0.5)] animate-bounce">
              <Trophy size={64} className="text-white" />
            </div>
            <h2 className="mt-8 font-black text-3xl text-white text-center tracking-tighter uppercase italic">
              New Achievement Unlocked!
            </h2>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-orange-500 animate-ping" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="nb-card p-8 bg-[#FDFCFB] border-4 border-black shadow-[8px_8px_0_#000] animate-in zoom-in-95 duration-500">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-black flex items-center justify-center text-5xl shadow-[4px_4px_0_#0A0A0A] animate-in slide-in-from-top duration-700 delay-200">
                {badge.icon}
              </div>
            </div>

            <div className="mt-12 text-center">
              <h2 className="font-black text-3xl text-[#0A0A0A] uppercase italic tracking-tighter leading-none mb-2">
                {badge.label}
              </h2>
              <p className="text-slate-600 font-bold text-sm mb-6">
                {badge.desc}
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FF5C00] border-2 border-black shadow-[3px_3px_0_#0A0A0A] mb-8">
                <Sparkles size={16} className="text-white" />
                <span className="font-black text-white">+{badge.xp} XP</span>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleShare}
                  className="nb-btn nb-btn-orange w-full py-4 font-black flex items-center justify-center gap-2"
                >
                  <Share2 size={18} /> Share Achievement
                </button>
                <div className="flex gap-2 justify-center mt-2">
                  <button title="Share on LinkedIn" aria-label="Share on LinkedIn" onClick={() => handleSharePlatform('linkedin')} className="rounded-full p-2 bg-[#0077b5] text-white"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg></button>
                  <button title="Share on Twitter" aria-label="Share on Twitter" onClick={() => handleSharePlatform('twitter')} className="rounded-full p-2 bg-[#1da1f2] text-white"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.384 4.482c-4.086-.205-7.713-2.164-10.141-5.144a4.822 4.822 0 0 0-.666 2.475c0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417a9.867 9.867 0 0 1-6.102 2.104c-.396 0-.787-.023-1.175-.069a13.945 13.945 0 0 0 7.548 2.212c9.057 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.457-2.548z"/></svg></button>
                  <button title="Share on WhatsApp" aria-label="Share on WhatsApp" onClick={() => handleSharePlatform('whatsapp')} className="rounded-full p-2 bg-[#25d366] text-white"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M20.52 3.48a12.07 12.07 0 0 0-17.04 0c-4.7 4.7-4.7 12.34 0 17.04a12.07 12.07 0 0 0 17.04 0c4.7-4.7 4.7-12.34 0-17.04zm-8.52 18.02c-1.7 0-3.36-.33-4.92-.98l-5.18 1.36 1.36-5.18c-.65-1.56-.98-3.22-.98-4.92 0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.07-7.75c-.14-.07-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.89-1.78-1.07-.95-1.79-2.12-2-2.48-.21-.36-.02-.55.16-.73.17-.17.38-.45.57-.68.19-.23.25-.39.38-.65.13-.26.07-.48-.03-.66-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.6-.81-.61-.21-.01-.46-.01-.71-.01-.25 0-.65.09-.99.45-.34.36-1.3 1.27-1.3 3.09 0 1.82 1.33 3.58 1.52 3.83.19.25 2.62 4.01 6.36 5.47.89.31 1.58.5 2.12.64.89.23 1.7.2 2.34.12.71-.09 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.68-.41z"/></svg></button>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center justify-center gap-1"
                >
                  Continue to App <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes reveal {
          0% { transform: scale(0.5); opacity: 0; filter: blur(10px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
      `}} />
    </div>
  );
}
