import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/auth';
import { Trophy, Flame, Zap, TrendingUp, MessageSquare, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import { useI18n } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';

import { BADGE_DEFS } from '../lib/badges';

export default function LeaderboardPage({ user }: any) {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const LEVEL_TITLES = t('level_titles');

  const XP_ACTIONS = [
    { label: t('daily_login'),      xp: 10,  color: '#FFD600', icon: '⚡' },
    { label: t('post'),             xp: 50,  color: '#00C853', icon: '🚀' },
    { label: t('community_post'),   xp: 20,  color: '#FF5C00', icon: '📝' },
    { label: t('comment'),          xp: 10,  color: '#7C3AED', icon: '💬' },
    { label: t('bookmark'),         xp: 5,   color: 'var(--surface)', icon: '🔖' },
    { label: t('streak_3d'),        xp: 30,  color: '#FF5C00', icon: '🔥' },
    { label: t('streak_7d'),        xp: 75,  color: '#FF5C00', icon: '🔥🔥' },
    { label: t('streak_30d'),       xp: 200, color: '#FF5C00', icon: '🏆' },
  ];

  const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  function getLvTitle(lvl: number) {
    const titles = t('level_titles') as string[];
    return titles[Math.min(lvl, titles.length - 1)] || 'Legend';
  }
  const [board,   setBoard]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState<any>(null);
  const [tab,     setTab]     = useState<'ranks' | 'quests' | 'badges' | 'guide'>('ranks');
  const [quests, setQuests] = useState<any[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [questErr, setQuestErr] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; kind: 'xp' | 'err' } | null>(null);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    apiRequest('/api/leaderboard')
      .then(r => r.json())
      .then(d => {
        if (d.board && Array.isArray(d.board)) {
          setBoard(d.board);
          const me = d.board.find((u: any) => u.user_id === user.id);
          if (me) setMyStats({ ...me, earned_badges: d.my_badges || [] });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // Log daily login XP silently
    apiRequest('/api/leaderboard', { method: 'POST', body: JSON.stringify({ action: 'daily_login' }) }).catch(() => {});
  }, []);

  const top3 = board.slice(0, 3);

  useEffect(() => {
    if (tab !== 'quests') return;
    if (questsLoading) return;
    if (quests.length) return;
    setQuestsLoading(true);
    setQuestErr('');
    apiRequest('/api/quests')
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Failed to load quests');
        setQuests(d.quests || []);
      })
      .catch((e: any) => setQuestErr(e.message || 'Failed to load quests'))
      .finally(() => setQuestsLoading(false));
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!confetti) return;
    const t = setTimeout(() => setConfetti(false), 1400);
    return () => clearTimeout(t);
  }, [confetti]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 w-full overflow-x-hidden">
      <SEO 
        title="Leaderboard" 
        description="See who's leading the LaunchPad community and learn how to earn XP."
        canonical="/leaderboard"
      />

      {/* Hero */}
      <div className="nb-card p-6 mb-5 text-center relative overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg,#FFD600 0,#FFD600 1px,transparent 0,transparent 50%)',
          backgroundSize: '20px 20px',
        }} />
        <Trophy size={36} className="mx-auto mb-3" style={{ color: '#FF5C00' }} />
        <h1 className="font-black text-2xl mb-1" style={{ color: '#0B1E3D' }}>{t('leaderboard')}</h1>
        <p className="text-sm font-bold" style={{ color: '#FFD600' }}>LaunchPad &middot; 2026</p>
        <p className="text-xs font-bold mt-1" style={{ color: '#888' }}>{t('start_engaging_leaderboard')}</p>
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
                <p className="font-black text-sm">{t('your_ranking')}</p>
                <p className="text-xs font-bold" style={{ color: '#FF5C00' }}>Lv.{myStats.level} {getLvTitle(myStats.level)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-2xl" style={{ color: '#FF5C00' }}>{myStats.total_xp.toLocaleString()}</p>
              <p className="text-xs font-bold" style={{ color: '#999' }}>{t('total_xp')}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: '2px solid #f0ede6' }}>
            {[
              { label: t('streak'),   value: `${myStats.current_streak}d`, color: '#FF5C00' },
              { label: t('posted'),   value: myStats.opps_posted,          color: '#00C853' },
              { label: t('comments'), value: myStats.comments_made,        color: '#7C3AED' },
              { label: t('saved'),    value: myStats.opps_bookmarked,      color: '#3B82F6' },
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
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['ranks', 'quests', 'badges', 'guide'] as const).map(t_tab => (
          <button key={t_tab} onClick={() => setTab(t_tab)}
            className="nb-btn px-4 py-2 text-sm capitalize"
            style={tab === t_tab ? { background: '#FF5C00', color: 'var(--ink)', borderColor: '#FF5C00' } : { background: 'var(--surface)' }}>
            {t_tab === 'ranks'
              ? `🏆 ${t('rankings')}`
              : t_tab === 'quests'
                ? `🎯 Quests`
                : t_tab === 'badges'
                  ? `🏅 ${t('badges')}`
                  : `⚡ ${t('xp_guide')}`}
          </button>
        ))}
      </div>

      {tab === 'quests' && (
        <div className="space-y-4">
          <div className="nb-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-lg mb-1">Quests</h2>
                <p className="text-xs font-bold" style={{ color: '#999' }}>
                  Complete quests to earn XP and level up.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setQuestsLoading(true);
                    setQuestErr('');
                    try {
                      const r = await apiRequest('/api/quests');
                      const d = await r.json();
                      if (!r.ok) throw new Error(d.error || 'Failed to load quests');
                      setQuests(d.quests || []);
                    } catch (e: any) {
                      setQuestErr(e.message || 'Failed to load quests');
                    } finally {
                      setQuestsLoading(false);
                    }
                  }}
                  className="nb-btn nb-btn-orange px-4 py-2 text-xs"
                  disabled={questsLoading}
                >
                  {questsLoading ? 'Loading…' : 'Refresh'}
                </button>
                <button
                  onClick={async () => {
                    setQuestErr('');
                    try {
                      const r = await apiRequest('/api/quests', { method: 'POST', body: JSON.stringify({ claimAll: true }) });
                      const d = await r.json();
                      if (!r.ok) throw new Error(d.error || 'Claim failed');
                      setQuests((prev) => prev.map((q) => (d.claimed?.includes(q.id) ? { ...q, claimed: true } : q)));
                      setToast({ kind: 'xp', text: `+${d.xp} XP claimed!` });
                      setConfetti(true);
                    } catch (e: any) {
                      setToast({ kind: 'err', text: e.message || 'Claim failed' });
                      setQuestErr(e.message || 'Claim failed');
                    }
                  }}
                  className="nb-btn px-4 py-2 text-xs"
                  style={{ background: 'var(--surface)' }}
                  disabled={questsLoading}
                >
                  Claim all
                </button>
              </div>
            </div>

            {questErr && <p className="text-xs font-bold mt-3 text-red-600">{questErr}</p>}

            <div className="mt-4 space-y-3">
              {(quests || []).length === 0 && !questsLoading ? (
                <div className="p-8 text-center rounded-2xl" style={{ background: '#FAFAF7', border: '2px solid #f0ede6' }}>
                  <p className="font-black">No quests loaded yet.</p>
                  <p className="text-xs font-bold mt-1" style={{ color: '#999' }}>Tap refresh to load your quests.</p>
                </div>
              ) : (
                quests.map((q: any) => {
                  const pct = Math.min(100, Math.round(((q.progress || 0) / (q.target || 1)) * 100));
                  const canClaim = q.completed && !q.claimed;
                  return (
                    <div key={q.id} className="nb-card p-4" style={{ background: '#FFFDF7', borderColor: q.completed ? '#00C853' : '#FFD600' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                            {q.scope === 'daily' ? 'Daily' : q.scope === 'weekly' ? 'Weekly' : 'Streak'}
                          </p>
                          <p className="font-black text-base">{q.title}</p>
                          <p className="text-xs font-bold mt-1" style={{ color: '#999' }}>{q.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-black px-2 py-1 rounded-full"
                            style={{ background: '#FF5C00', color: '#fff', border: '2px solid #0A0A0A' }}>
                            +{q.rewardXp} XP
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold" style={{ color: '#999' }}>
                            {q.progress || 0}/{q.target}
                          </p>
                          <p className="text-xs font-black" style={{ color: q.completed ? '#00C853' : '#FF5C00' }}>
                            {pct}%
                          </p>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: '#f0ede6', border: '1.5px solid #0A0A0A' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: q.completed ? '#00C853' : '#FF5C00' }} />
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {q.ctaRoute && (
                          <button onClick={() => navigate(q.ctaRoute)}
                            className="nb-btn px-4 py-2 text-xs flex-1"
                            style={{ background: 'var(--surface)' }}>
                            Go
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!canClaim) return;
                            try {
                              const r = await apiRequest('/api/quests', { method: 'POST', body: JSON.stringify({ questId: q.id }) });
                              const d = await r.json();
                              if (!r.ok) throw new Error(d.error || 'Claim failed');
                              setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, claimed: true } : x)));
                              setToast({ kind: 'xp', text: `+${d.xp} XP` });
                              setConfetti(true);
                            } catch (e: any) {
                              setToast({ kind: 'err', text: e.message || 'Claim failed' });
                              setQuestErr(e.message || 'Claim failed');
                            }
                          }}
                          disabled={!canClaim}
                          className="nb-btn nb-btn-orange px-4 py-2 text-xs flex-1 disabled:opacity-40"
                        >
                          {q.claimed ? 'Claimed' : canClaim ? 'Claim reward' : 'Not ready'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0_#0A0A0A]"
              style={{ background: toast.kind === 'xp' ? '#FFD600' : '#FEE2E2', color: '#0A0A0A' }}>
              <p className="text-xs font-black">{toast.text}</p>
            </div>
          )}

          {/* Confetti (tiny CSS-only burst) */}
          {confetti && (
            <div className="fixed inset-0 pointer-events-none z-[190]">
              <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2"
                    style={{
                      left: `${50 + (Math.random() * 20 - 10)}%`,
                      top: `${70 + (Math.random() * 10 - 5)}%`,
                      background: ['#FF5C00', '#FFD600', '#00C853', '#7C3AED'][i % 4],
                      transform: `rotate(${Math.random() * 360}deg)`,
                      animation: `lpConfetti 1.2s ease-out forwards`,
                      borderRadius: i % 3 === 0 ? '999px' : '2px',
                    }}
                  />
                ))}
              </div>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes lpConfetti {
                  0%   { opacity: 1; transform: translate(0,0) rotate(0deg); }
                  100% { opacity: 0; transform: translate(${Math.random() * 240 - 120}px, -240px) rotate(540deg); }
                }
              `}} />
            </div>
          )}
        </div>
      )}

      {tab === 'badges' && (
        <div className="space-y-4">
          <div className="nb-card p-5">
            <h2 className="font-black text-lg mb-1">{t('badge_collection')}</h2>
            <p className="text-xs font-bold mb-4" style={{ color: '#999' }}>{t('unlock_achievements')}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(BADGE_DEFS).map(([key, def]: [string, any]) => {
                const isEarned = myStats?.earned_badges?.includes(key);
                return (
                  <div key={key} className="nb-card p-4 flex items-start gap-3 transition-all"
                    style={isEarned ? { background: '#FFFDF7', borderColor: '#FFD600' } : { opacity: 0.6, background: '#F5F5F5', filter: 'grayscale(1)' }}>
                    <div className="text-3xl flex-shrink-0">{def.icon}</div>
                    <div>
                      <p className="font-black text-sm">{t(`badge_${key}` as any)}</p>
                      <p className="text-[10px] font-medium leading-tight" style={{ color: 'var(--muted)' }}>{t(`badge_${key}_desc` as any)}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 border border-orange-200">
                          +{def.xp} XP
                        </span>
                        {isEarned && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-green-100 text-green-600 border border-green-200">
                            ✓ {t('unlocked')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'guide' ? (
        <div className="nb-card p-5">
          <h2 className="font-black text-lg mb-4">{t('how_to_earn_xp')}</h2>
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
              {t('level_up_info')}
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
          <h3 className="font-black text-lg mb-1">{t('no_rankings_yet')}</h3>
          <p className="text-sm font-bold" style={{ color: '#999' }}>{t('start_engaging_leaderboard')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium — only render if we have enough */}
          {top3.length >= 2 && (
            <div className="nb-card p-4 mb-2">
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#999' }}>{t('top_champions')}</p>
              <div className="flex items-end justify-center gap-3">
                {/* 2nd */}
                {top3[1] && (
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white overflow-hidden"
                      style={{ 
                        background: top3[1].avatar_url ? 'none' : `hsl(${(top3[1].name?.charCodeAt(0)||200)%360},55%,40%)`, 
                        border: '2px solid #0A0A0A' 
                      }}>
                      {top3[1].avatar_url 
                        ? <img src={top3[1].avatar_url} alt="" className="w-full h-full object-cover" />
                        : top3[1].name?.charAt(0)?.toUpperCase()
                      }
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
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg overflow-hidden"
                      style={{ 
                        background: top3[0].avatar_url ? 'none' : `hsl(${(top3[0].name?.charCodeAt(0)||200)%360},55%,40%)`, 
                        border: '2.5px solid #0A0A0A', 
                        boxShadow: '3px 3px 0 #FFD600' 
                      }}>
                      {top3[0].avatar_url 
                        ? <img src={top3[0].avatar_url} alt="" className="w-full h-full object-cover" />
                        : top3[0].name?.charAt(0)?.toUpperCase()
                      }
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white overflow-hidden"
                      style={{ 
                        background: top3[2].avatar_url ? 'none' : `hsl(${(top3[2].name?.charCodeAt(0)||200)%360},55%,40%)`, 
                        border: '2px solid #0A0A0A' 
                      }}>
                      {top3[2].avatar_url 
                        ? <img src={top3[2].avatar_url} alt="" className="w-full h-full object-cover" />
                        : top3[2].name?.charAt(0)?.toUpperCase()
                      }
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
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 overflow-hidden"
                  style={{ 
                    background: entry.avatar_url ? 'none' : (RANK_MEDALS[entry.rank] ? (entry.rank === 1 ? '#FFD600' : entry.rank === 2 ? '#E8E8E8' : '#FF8C42') : '#FFF'),
                    color: 'var(--ink)', 
                    border: '2px solid #0A0A0A' 
                  }}>
                  {entry.avatar_url 
                    ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (RANK_MEDALS[entry.rank] ? RANK_MEDALS[entry.rank] : entry.name?.charAt(0)?.toUpperCase())
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm truncate">
                      {entry.name}
                      {isMe && <span className="text-xs font-bold ml-1" style={{ color: '#FF5C00' }}>({t('you')})</span>}
                    </p>
                    <span className="nb-badge text-xs" style={{ color: '#FF5C00', borderColor: '#FF5C00', background: '#FFF3EE' }}>
                      Lv.{entry.level}
                    </span>
                    {entry.level >= 10 && (
                      <span title="Verified Expert" className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px]" style={{ boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: '#FF5C00' }}>
                      {entry.current_streak}{t('d_streak')}
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#999' }}>{entry.posts_made} {t('posts')}</span>
                    <span className="text-xs font-bold" style={{ color: '#999' }}>{entry.comments_made} {t('comments')}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-base" style={{ color: 'var(--ink)' }}>{entry.total_xp.toLocaleString()}</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
