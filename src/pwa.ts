export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  const notifyReady = () => window.dispatchEvent(new CustomEvent('lp-sw-update-ready'));

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(reg => {
        console.log('[PWA] SW registered:', reg.scope);
        (window as any).__lp_sw_reg = reg;

        if (reg.waiting && navigator.serviceWorker.controller) notifyReady();

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyReady();
            }
          });
        });

        reg.update().catch(() => {});
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch(err => console.warn('[PWA] SW registration failed:', err));
  });

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !(window as any).__lp_pending_reload) return;
    reloaded = true;
    (window as any).__lp_pending_reload = false;
    window.location.reload();
  });
}

export async function applyUpdate() {
  (window as any).__lp_pending_reload = true;

  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }
    }
  } catch (e) {
    console.warn('[PWA] applyUpdate:', e);
  }

  window.location.href = `${window.location.pathname}${window.location.search}${window.location.search ? '&' : '?'}_v=${Date.now()}`;
}

let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  deferredPrompt = e;
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
