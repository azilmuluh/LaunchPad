import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/auth';

interface Badge {
  key: string;
  label: string;
  icon: string;
  xp: number;
  desc: string;
}

let _setBadgeQueue: ((fn: (q: Badge[]) => Badge[]) => void) | null = null;

export function triggerBadgeCheck() {
  apiRequest('/api/badges', { method: 'POST' })
    .then(r => r.json())
    .then(d => {
      if (d.new_badges?.length && _setBadgeQueue) {
        _setBadgeQueue(q => [...q, ...d.new_badges]);
      }
    })
    .catch(() => {});
}

export default function BadgeToast() {
  const [queue, setQueue] = useState<Badge[]>([]);
  const [current, setCurrent] = useState<Badge | null>(null);
  const [visible, setVisible] = useState(false);

  _setBadgeQueue = setQueue;

  useEffect(() => {
    if (queue.length > 0 && !current) {
      const next = queue[0];
      setQueue(q => q.slice(1));
      setCurrent(next);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setCurrent(null), 400);
      }, 4000);
    }
  }, [queue, current]);

  if (!current) return null;

  return (
    <div
      className="fixed top-4 left-1/2 z-[100] transition-all duration-400"
      style={{
        transform: `translateX(-50%) translateY(${visible ? '0' : '-120px'})`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="nb-card flex items-center gap-4 px-5 py-4"
        style={{ background: '#0B1E3D', borderColor: '#FFD600', boxShadow: '4px 4px 0 #FFD600', minWidth: '280px', maxWidth: '360px' }}>
        <div className="text-4xl badge-pop flex-shrink-0">{current.icon}</div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#FFD600' }}>New Badge Unlocked!</p>
          <p className="text-white font-black text-base leading-tight">{current.label}</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: '#aaa' }}>{current.desc}</p>
          <p className="text-xs font-black mt-1" style={{ color: '#FF5C00' }}>+{current.xp} XP</p>
        </div>
      </div>
    </div>
  );
}
