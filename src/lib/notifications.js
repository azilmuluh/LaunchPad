export function initNotifications(userId) {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId) {
    console.warn('OneSignal App ID missing. Set VITE_ONESIGNAL_APP_ID in environment.');
    return;
  }

  // Dynamically inject OneSignal script if not already added to the document
  if (!window.OneSignal && !document.getElementById('onesignal-sdk')) {
    const s = document.createElement('script');
    s.id = 'onesignal-sdk';
    s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    s.defer = true;
    document.head.appendChild(s);
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: appId,
      safari_web_id: "web.onesignal.auto.690859c6-834c-4740-9285-d85c8e31006a",
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });
    
    if (userId) {
      OneSignal.login(userId);
    }
  });
}
