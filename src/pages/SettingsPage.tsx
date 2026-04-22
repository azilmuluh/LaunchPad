import { useState, useEffect } from 'react';
import { apiRequest, setSession, getToken, clearSession } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Palette, Globe, Trash2, LogOut, Check, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { applyTheme, initTheme, type Theme } from '../lib/theme';
export { initTheme };

export default function SettingsPage({ user, setUser }: any) {
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

  const Toggle = ({ label, desc, settingKey }: { label: string; desc: string; settingKey: string }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1.5px solid #f0ede6' }}>
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-xs font-bold" style={{ color: '#999' }}>{desc}</p>
      </div>
      <button onClick={() => saveSetting(settingKey, !settings[settingKey])}
        className="w-12 h-6 rounded-full transition-all flex-shrink-0 relative"
        style={{ background: settings[settingKey] ? '#FF5C00' : '#e0ddd6', border: '2px solid #0A0A0A' }}>
        <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
          style={{ background: '#fff', border: '1.5px solid #0A0A0A', left: settings[settingKey] ? '26px' : '2px' }} />
      </button>
    </div>
  );

  const Section = ({ icon, title, children }: any) => (
    <div className="nb-card p-5 mb-4">
      <h3 className="font-black text-base mb-3 flex items-center gap-2">{icon} {title}</h3>
      {children}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black text-2xl">Settings</h1>
        {saved && <span className="nb-badge" style={{ color: '#065F46', borderColor: '#065F46', background: '#ECFDF5' }}><Check size={10} className="inline mr-1" />Saved</span>}
      </div>

      {/* Appearance — Theme switcher */}
      <Section icon={<Palette size={16} style={{ color: '#FFD600' }} />} title="Appearance">
        <div className="mb-4">
          <p className="font-bold text-sm mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'light',  label: 'Light',  icon: <Sun  size={18} /> },
              { id: 'dark',   label: 'Dark',   icon: <Moon size={18} /> },
              { id: 'system', label: 'System', icon: <Monitor size={18} /> },
            ] as const).map(t => (
              <button key={t.id} onClick={() => handleTheme(t.id)}
                className="nb-btn flex flex-col items-center gap-2 py-4 text-xs font-black transition-all"
                style={theme === t.id
                  ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00', boxShadow: '3px 3px 0 #0A0A0A' }
                  : { background: 'var(--surface, #fff)' }
                }>
                {t.icon}
                {t.label}
                {theme === t.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Compact Cards" desc="Show more opportunities per screen" settingKey="compact_cards" />
        <Toggle label="Show XP Animations" desc="Animated XP gain notifications" settingKey="show_xp_anim" />
      </Section>

      <Section icon={<Bell size={16} style={{ color: '#FF5C00' }} />} title="Notifications">
        <Toggle label="Opportunity Alerts" desc="Get notified about new matching opportunities" settingKey="notify_opportunities" />
        <Toggle label="Community Updates" desc="Notifications for likes, comments, and replies" settingKey="notify_community" />
        <Toggle label="Weekly Digest" desc="Weekly summary of top opportunities" settingKey="notify_digest" />
        <Toggle label="Badge Emails" desc="Email when you earn a new badge" settingKey="notify_badges" />
      </Section>

      <Section icon={<Globe size={16} style={{ color: '#0B1E3D' }} />} title="Discovery">
        <Toggle label="Include Remote Opportunities" desc="Show online and remote opportunities globally" settingKey="include_remote" />
        <Toggle label="Cameroon-Focused" desc="Prioritise opportunities relevant to Cameroon" settingKey="cameroon_only" />
        <Toggle label="Personalized Feed" desc="Show community posts based on your interests" settingKey="personalized_feed" />
      </Section>

      <Section icon={<Shield size={16} style={{ color: '#00C853' }} />} title="Privacy">
        <Toggle label="Show on Leaderboard" desc="Display your name in the public leaderboard" settingKey="show_leaderboard" />
        <Toggle label="Share Activity" desc="Let others see your engagement stats" settingKey="share_activity" />
      </Section>

      <div className="nb-card p-5">
        <h3 className="font-black text-base mb-3 flex items-center gap-2">
          <Shield size={16} style={{ color: '#E53935' }} /> Account
        </h3>
        <button onClick={() => { clearSession(); setUser(null); navigate('/login'); }}
          className="nb-btn w-full flex items-center justify-between px-4 py-3 text-sm mb-2"
          style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
          <span className="flex items-center gap-2"><LogOut size={14} /> Sign Out</span>
          <ChevronRight size={14} />
        </button>
        <button onClick={() => setDanger(d => !d)}
          className="nb-btn w-full flex items-center justify-between px-4 py-3 text-sm"
          style={{ background: '#FFF0F0', color: '#E53935', borderColor: '#E53935' }}>
          <span className="flex items-center gap-2"><Trash2 size={14} /> Delete Account</span>
          <ChevronRight size={14} />
        </button>
        {danger && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: '#FFF0F0', border: '2px solid #E53935' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#E53935' }}>This permanently deletes your account. Contact support to proceed.</p>
            <a href="mailto:support@launchpad.app" className="nb-btn nb-btn-ghost px-3 py-1.5 text-xs block text-center" style={{ borderColor: '#E53935', color: '#E53935' }}>Contact Support</a>
          </div>
        )}
      </div>

      <p className="text-center text-xs font-bold mt-4" style={{ color: '#ccc' }}>LaunchPad v2.1 &middot; Founded Dec 5, 2025</p>
    </div>
  );
}
