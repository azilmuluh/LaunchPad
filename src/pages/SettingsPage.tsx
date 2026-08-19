import { useState, useEffect } from 'react';
import { apiRequest, setSession, getToken, clearSession } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Palette, Globe, Trash2, LogOut, Check, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { applyTheme, initTheme, type Theme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
export { initTheme };

function Section({ icon, title, children }: any) {
  return (
    <div className="nb-card p-5 mb-4">
      <h3 className="font-black text-base mb-3 flex items-center gap-2">{icon} {title}</h3>
      {children}
    </div>
  );
}

function Toggle({ label, desc, settingKey, active, onToggle }: {
  label: string;
  desc: string;
  settingKey: string;
  active: boolean;
  onToggle: (key: string, val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1.5px solid #f0ede6' }}>
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-xs font-bold" style={{ color: '#999' }}>{desc}</p>
      </div>
      <button onClick={() => onToggle(settingKey, !active)}
        className="w-12 h-6 rounded-full transition-all flex-shrink-0 relative"
        style={{ background: active ? '#FF5C00' : '#e0ddd6', border: '2px solid #0A0A0A' }}>
        <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
          style={{ background: 'var(--surface)', border: '1.5px solid #0A0A0A', left: active ? '26px' : '2px' }} />
      </button>
    </div>
  );
}

export default function SettingsPage({ user, setUser }: any) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [danger, setDanger]   = useState(false);
  const [theme, setThemeState] = useState<Theme>((localStorage.getItem('lp_theme') as Theme) || 'system');
  const settings = user.settings || {};

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    const newSettings = { ...settings, [key]: value };
    try {
      const res = await apiRequest('/api/auth?action=update', { method: 'PUT', body: JSON.stringify({ settings: newSettings }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(getToken()!, data.user);
      setUser(data.user);
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    saveSetting('theme', t);
  };

  // Apply theme on mount
  useEffect(() => { applyTheme(theme); }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black text-2xl">{t('settings')}</h1>
        {saved && <span className="nb-badge" style={{ color: '#065F46', borderColor: '#065F46', background: '#ECFDF5' }}><Check size={10} className="inline mr-1" />{t('saved')}</span>}
      </div>

      {/* Appearance — Theme switcher */}
      <Section icon={<Palette size={16} style={{ color: '#FFD600' }} />} title={t('appearance')}>
        <div className="mb-4">
          <p className="font-bold text-sm mb-3">{t('theme')}</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'light',  label: t('light'),  icon: <Sun  size={18} /> },
              { id: 'dark',   label: t('dark'),   icon: <Moon size={18} /> },
              { id: 'system', label: t('system'), icon: <Monitor size={18} /> },
            ] as const).map(t_theme => (
              <button key={t_theme.id} onClick={() => handleTheme(t_theme.id)}
                className="nb-btn flex flex-col items-center gap-2 py-4 text-xs font-black transition-all"
                style={theme === t_theme.id
                  ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00', boxShadow: '3px 3px 0 #0A0A0A' }
                  : { background: 'var(--surface, #fff)' }
                }>
                {t_theme.icon}
                {t_theme.label}
                {theme === t_theme.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
        <Toggle label={t('compact_cards')} desc={t('compact_cards_desc')} settingKey="compact_cards" active={!!settings.compact_cards} onToggle={saveSetting} />
        <Toggle label={t('show_xp_anim')} desc={t('show_xp_anim_desc')} settingKey="show_xp_anim" active={!!settings.show_xp_anim} onToggle={saveSetting} />
      </Section>

      <Section icon={<Bell size={16} style={{ color: '#FF5C00' }} />} title={t('notifications')}>
        <Toggle label={t('opp_alerts')} desc={t('opp_alerts_desc')} settingKey="notify_opportunities" active={!!settings.notify_opportunities} onToggle={saveSetting} />
        <Toggle label={t('comm_updates')} desc={t('comm_updates_desc')} settingKey="notify_community" active={!!settings.notify_community} onToggle={saveSetting} />
        <Toggle label={t('weekly_digest')} desc={t('weekly_digest_desc')} settingKey="notify_digest" active={!!settings.notify_digest} onToggle={saveSetting} />
        <Toggle label={t('badge_emails')} desc={t('badge_emails_desc')} settingKey="notify_badges" active={!!settings.notify_badges} onToggle={saveSetting} />
        <div className="mt-2" />
        <Toggle label="Quest updates" desc="Get notified when you complete quests." settingKey="notify_quests" active={!!settings.notify_quests} onToggle={saveSetting} />
        <Toggle label="AI roadmaps" desc="Get notified when LaunchPad AI creates a roadmap/goal for you." settingKey="notify_ai" active={!!settings.notify_ai} onToggle={saveSetting} />
        <Toggle label="Streak reminders" desc="Get a reminder when your streak is at risk." settingKey="notify_streak" active={!!settings.notify_streak} onToggle={saveSetting} />
      </Section>

      <Section icon={<Globe size={16} style={{ color: 'var(--surface)' }} />} title={t('discovery')}>
        <Toggle label={t('include_remote')} desc={t('include_remote_desc')} settingKey="include_remote" active={!!settings.include_remote} onToggle={saveSetting} />
        <Toggle label={t('cameroon_focused')} desc={t('cameroon_only_desc')} settingKey="cameroon_only" active={!!settings.cameroon_only} onToggle={saveSetting} />
        <Toggle label={t('personalized_feed')} desc={t('personalized_feed_desc')} settingKey="personalized_feed" active={!!settings.personalized_feed} onToggle={saveSetting} />
      </Section>

      <Section icon={<Shield size={16} style={{ color: '#00C853' }} />} title={t('privacy')}>
        <Toggle label={t('show_leaderboard')} desc={t('show_leaderboard_desc')} settingKey="show_leaderboard" active={!!settings.show_leaderboard} onToggle={saveSetting} />
        <Toggle label={t('share_activity')} desc={t('share_activity_desc')} settingKey="share_activity" active={!!settings.share_activity} onToggle={saveSetting} />
      </Section>

      <div className="nb-card p-5">
        <h3 className="font-black text-base mb-3 flex items-center gap-2">
          <Shield size={16} style={{ color: '#E53935' }} /> {t('account')}
        </h3>
        <button onClick={() => { clearSession(); setUser(null); navigate('/login'); }}
          className="nb-btn w-full flex items-center justify-between px-4 py-3 text-sm mb-2"
          style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
          <span className="flex items-center gap-2"><LogOut size={14} /> {t('sign_out')}</span>
          <ChevronRight size={14} />
        </button>
        <button onClick={() => setDanger(d => !d)}
          className="nb-btn w-full flex items-center justify-between px-4 py-3 text-sm"
          style={{ background: '#FFF0F0', color: '#E53935', borderColor: '#E53935' }}>
          <span className="flex items-center gap-2"><Trash2 size={14} /> {t('delete_account')}</span>
          <ChevronRight size={14} />
        </button>
        {danger && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: '#FFF0F0', border: '2px solid #E53935' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#E53935' }}>{t('permanently_delete')}</p>
            <a href="mailto:support@launchpad.app" className="nb-btn nb-btn-ghost px-3 py-1.5 text-xs block text-center" style={{ borderColor: '#E53935', color: '#E53935' }}>{t('contact_support')}</a>
          </div>
        )}
      </div>

      <p className="text-center text-xs font-bold mt-4" style={{ color: 'var(--muted)' }}>LaunchPad v2.1 &middot; Founded Dec 5, 2025</p>
    </div>
  );
}
