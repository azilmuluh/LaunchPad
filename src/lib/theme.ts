export type Theme = 'light' | 'dark' | 'system';

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  
  if (isDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
  localStorage.setItem('lp_theme', theme);
}

export function initTheme() {
  const saved = (localStorage.getItem('lp_theme') as Theme) || 'system';
  applyTheme(saved);
}
