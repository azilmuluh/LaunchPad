export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => console.log('[PWA] SW registered:', reg.scope))
        .catch(err => console.warn('[PWA] SW registration failed:', err));
    });
  }
}

// Install prompt
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  deferredPrompt = e;
  // Dispatch custom event so components can show install button
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

export function promptInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  }
}

export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}
