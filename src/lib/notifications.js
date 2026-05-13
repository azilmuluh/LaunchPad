export function initNotifications(userId) {
  const OneSignalDeferred = window.OneSignalDeferred || [];
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId) {
    console.warn('OneSignal App ID missing. Set VITE_ONESIGNAL_APP_ID in environment.');
    return;
  }

  OneSignalDeferred.push(async function(OneSignal) {
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
