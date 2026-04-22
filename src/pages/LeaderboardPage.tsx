import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/auth';
import { Trophy, Flame, Zap, TrendingUp, MessageSquare, BookOpen } from 'lucide-react';

const LEVEL_TITLES = [
  '', 'Newcomer', 'Explorer', 'Seeker', 'Hustler', 'Achiever',
  'Champion', 'Pioneer', 'Trailblazer', 'Legend', 'Elite',
  'Master', 'Grandmaster', 'Visionary', 'Icon', 'Titan',
];

const XP_ACTIONS = [
  { label: 'Daily Login',      xp: 10,  color: '#FFD600', icon: '\u26A1' },
  { label: 'Post Opportunity', xp: 50,  color: '#00C853', icon: '\uD83D\uDE80' },
  { label: 'Community Post',   xp: 20,  color: '#FF5C00', icon: '\uD83D\uDCDD' },
  { label: 'Comment',          xp: 10,  color: '#7C3AED', icon: '\uD83D\uDCAC' },
  { label: 'Bookmark',         xp: 5,   color: '#0B1E3D', icon: '\uD83D\uDD16' },
  { label: '3-Day Streak',     xp: 30,  color: '#FF5C00', icon: '\uD83D\uDD25' },
  { label: '7-Day Streak',     xp: 75,  color: '#FF5C00', icon: '\uD83D\uDD25\uD83D\uDD25' },
  { label: '30-Day Streak',    xp: 200, color: '#FF5C00', icon: '\uD83C\uDFC6' },
];

const RANK_MEDALS: Record<number, string> = { 1: '\uD83E\uDD47', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };

function getLvTitle(lvl: number) {
  return LEVEL_TITLES[Math.min(lvl, LEVEL_TITLES.length - 1)] || 'Legend';
}

export default function LeaderboardPage({ user }: any) {
  const [board,   setBoard]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState<any>(null);
  const [tab,     setTab]     = useState<'ranks' | 'guide'>('ranks');

  useEffect(() => {
    apiRequest('/api/leaderboard')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setBoard(d);
          const me = d.find((u: any) => u.user_id === user.id);
          setMyStats(me || null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // Log daily login XP silently
    apiRequest('/api/leaderboard', { method: 'POST', body: JSON.stringify({ action: 'daily_login' }) }).catch(() => {});
  }, []);

  const top3 = board.slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Hero */}
      <div className="nb-card nb-card-navy p-6 mb-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg,#FFD600 0,#FFD600 1px,transparent 0,transparent 50%)',
          backgroundSize: '20px 20px',
        }} />
        <Trophy size={36} className="mx-auto mb-3" style={{ color: '#FFD600' }} />
        <h1 className="text-white font-black text-2xl mb-1">Leaderboard</h1>
        <p className="text-sm font-bold" style={{ color: '#FFD600' }}>LaunchPad &middot; 2026</p>
        <p className="text-xs font-bold mt-1" style={{ color: '#888' }}>Earn XP by engaging, posting and maintaining streaks</p>
      </div>

      {/* My rank */}
      {myStats && (
        <div className="nb-card p-4 mb-5" style={{ background: '#FFF3EE', borderColor: '#FF5C00', boxShadow: '4px 4px 0 #FF5C00' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg"
                style={{ background: '#FF5C00', border: '2.5px solid #0A0A0A' }}>
                #{myStats.rank}
              </div>
              <div>
                <p className="font-black text-sm">Your Ranking</p>
                <p className="text-xs font-bold" style={{ color: '#FF5C00' }}>Lv.{myStats.level} {getLvTitle(myStats.level)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-2xl" style={{ color: '#FF5C00' }}>{myStats.total_xp.toLocaleString()}</p>
              <p className="text-xs font-bold" style={{ color: '#999' }}>Total XP</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: '2px solid #f0ede6' }}>
            {[
              { label: 'Streak',   value: `${myStats.current_streak}d`, color: '#FF5C00' },
              { label: 'Posted',   value: myStats.opps_posted,          color: '#00C853' },
              { label: 'Comments', value: myStats.comments_made,        color: '#7C3AED' },
              { label: 'Saved',    value: myStats.opps_bookmarked,      color: '#0B1E3D' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-black text-base" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-bold" style={{ color: '#999' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['ranks', 'guide'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="nb-btn px-4 py-2 text-sm"
            style={tab === t ? { background: '#0B1E3D', color: '#fff' } : { background: '#fff' }}>
            {t === 'ranks' ? '\uD83C\uDFC6 Rankings' : '\u26A1 XP Guide'}
          </button>
        ))}
      </div>

      {tab === 'guide' ? (
        <div className="nb-card p-5">
          <h2 className="font-black text-lg mb-4">How to Earn XP</h2>
          <div className="space-y-3">
            {XP_ACTIONS.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#FAFAF7', border: '2px solid #f0ede6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: a.color + '22', border: `2px solid ${a.color}` }}>
                    {a.icon}
                  </div>
                  <span className="font-bold text-sm">{a.label}</span>
                </div>
                <span className="nb-btn px-3 py-1 text-xs font-black"
                  style={{ background: a.color, color: a.color === '#FFD600' ? '#0A0A0A' : '#fff', borderColor: '#0A0A0A' }}>
                  +{a.xp} XP
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl" style={{ background: '#FFF3EE', border: '2px solid #FF5C00' }}>
            <p className="text-xs font-bold" style={{ color: '#FF5C00' }}>
              Level up every 500 XP. Higher levels unlock badges and recognition!
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="nb-card p-4 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl" style={{ background: '#e0ddd6' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded" style={{ background: '#e0ddd6' }} />
                <div className="h-2 w-1/4 rounded" style={{ background: '#e0ddd6' }} />
              </div>
              <div className="h-6 w-16 rounded" style={{ background: '#e0ddd6' }} />
            </div>
          ))}
        </div>
      ) : board.length === 0 ? (
        <div className="nb-card p-12 text-center">
          <Trophy size={40} className="mx-auto mb-4" style={{ color: '#FFD600' }} />
          <h3 className="font-black text-lg mb-1">No rankings yet</h3>
          <p className="text-sm font-bold" style={{ color: '#999' }}>Start engaging to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium — only render if we have enough */}
          {top3.length >= 2 && (
            <div className="nb-card p-4 mb-2">
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#999' }}>Top Champions</p>
              <div className="flex items-end justify-center gap-3">
                {/* 2nd */}
                {top3[1] && (
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                      style={{ background: `hsl(${(top3[1].name?.charCodeAt(0)||200)%360},55%,40%)`, border: '2px solid #0A0A0A' }}>
                      {top3[1].name?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="text-xs font-black text-center">{top3[1].name?.split(' ')[0]}</p>
                    <div className="w-full rounded-t-xl flex flex-col items-center justify-end py-2 h-16"
                      style={{ background: '#E8E8E8', border: '2px solid #0A0A0A', borderBottom: 'none' }}>
                      <span className="text-xl">{RANK_MEDALS[2]}</span>
                      <span className="text-xs font-black">{top3[1].total_xp} XP</span>
                    </div>
                  </div>
                )}
                {/* 1st */}
                {top3[0] && (
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg"
                      style={{ background: `hsl(${(top3[0].name?.charCodeAt(0)||200)%360},55%,40%)`, border: '2.5px solid #0A0A0A', boxShadow: '3px 3px 0 #FFD600' }}>
                      {top3[0].name?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="text-xs font-black text-center">{top3[0].name?.split(' ')[0]}</p>
                    <div className="w-full rounded-t-xl flex flex-col items-center justify-end py-2 h-24"
                      style={{ background: '#FFD600', border: '2.5px solid #0A0A0A', borderBottom: 'none' }}>
                      <span className="text-2xl">{RANK_MEDALS[1]}</span>
                      <span className="text-xs font-black">{top3[0].total_xp} XP</span>
                    </div>
                  </div>
                )}
                {/* 3rd */}
                {top3[2] && (
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                      style={{ background: `hsl(${(top3[2].name?.charCodeAt(0)||200)%360},55%,40%)`, border: '2px solid #0A0A0A' }}>
                      {top3[2].name?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="text-xs font-black text-center">{top3[2].name?.split(' ')[0]}</p>
                    <div className="w-full rounded-t-xl flex flex-col items-center justify-end py-2 h-12"
                      style={{ background: '#FF8C42', border: '2px solid #0A0A0A', borderBottom: 'none' }}>
                      <span className="text-lg">{RANK_MEDALS[3]}</span>
                      <span className="text-xs font-black text-white">{top3[2].total_xp} XP</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full ranked list */}
          {board.map((entry: any) => {
            const isMe = entry.user_id === user.id;
            return (
              <div key={entry.user_id}
                className="nb-card p-3.5 flex items-center gap-3"
                style={isMe ? { background: '#FFF3EE', borderColor: '#FF5C00', boxShadow: '3px 3px 0 #FF5C00' } : {}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={RANK_MEDALS[entry.rank]
                    ? { background: entry.rank === 1 ? '#FFD600' : entry.rank === 2 ? '#E8E8E8' : '#FF8C42', color: '#0A0A0A', border: '2px solid #0A0A0A' }
                    : { background: '#f0ede6', color: '#666', border: '2px solid #ddd' }
                  }>
                  {RANK_MEDALS[entry.rank] || `#${entry.rank}`}
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                  style={{ background: `hsl(${(entry.name?.charCodeAt(0)||200)%360},55%,40%)`, border: '2px solid #0A0A0A' }}>
                  {entry.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm truncate">
                      {entry.name}
                      {isMe && <span className="text-xs font-bold ml-1" style={{ color: '#FF5C00' }}>(You)</span>}
                    </p>
                    <span className="nb-badge text-xs" style={{ color: '#FF5C00', borderColor: '#FF5C00', background: '#FFF3EE' }}>
                      Lv.{entry.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: '#FF5C00' }}>
                      {entry.current_streak}d streak
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#999' }}>{entry.posts_made} posts</span>
                    <span className="text-xs font-bold" style={{ color: '#999' }}>{entry.comments_made} comments</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-base" style={{ color: '#0B1E3D' }}>{entry.total_xp.toLocaleString()}</p>
                  <p className="text-xs font-bold" style={{ color: '#aaa' }}>XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
