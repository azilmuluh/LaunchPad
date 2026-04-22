export type Theme = 'light' | 'dark' | 'system';

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  if (isDark) {
    root.style.setProperty('--bg',      '#0A0F1A');
    root.style.setProperty('--surface', '#0F1B2D');
    root.style.setProperty('--ink',     '#F0EDE6');
    root.style.setProperty('--border',  '#1E3A5F');
    root.style.setProperty('--muted',   '#64748b');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.style.setProperty('--bg',      '#F5F0E8');
    root.style.setProperty('--surface', '#FFFDF7');
    root.style.setProperty('--ink',     '#0A0A0A');
    root.style.setProperty('--border',  '#0A0A0A');
    root.style.setProperty('--muted',   '#666666');
    root.setAttribute('data-theme', 'light');
  }
  localStorage.setItem('lp_theme', theme);
}

export function initTheme() {
  const saved = (localStorage.getItem('lp_theme') as Theme) || 'system';
  applyTheme(saved);
}
