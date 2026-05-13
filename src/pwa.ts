export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('[PWA] SW registered:', reg.scope);
          (window as any).__lp_sw_reg = reg;

          const notifyReady = () => window.dispatchEvent(new CustomEvent('lp-sw-update-ready'));

          // If there's an updated worker already waiting, prompt in-app.
          if (reg.waiting && navigator.serviceWorker.controller) notifyReady();

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              // When the new SW is installed and waiting, prompt in-app.
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                notifyReady();
              }
            });
          });

          // Safety: periodically check for SW updates.
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch(err => console.warn('[PWA] SW registration failed:', err));

      // When SW takes control, reload once to get the new assets (after user accepts).
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    });
  }
}

export function applyUpdate() {
  const reg = (window as any).__lp_sw_reg;
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    window.location.reload();
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
