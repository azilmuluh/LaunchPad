
// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received', event);
  
  let notification = {
    title: 'LaunchPad',
    body: 'You have a new notification',
    icon: '/icons/logo-192.png',
    badge: '/icons/badge-72.png',
    data: { url: '/feed' }
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      notification = { ...notification, ...payload };
    } catch (e) {
      notification.body = event.data.text();
    }
  }
  
  const options = {
    body: notification.body,
    icon: notification.icon || '/icons/logo-192.png',
    badge: notification.badge || '/icons/badge-72.png',
    image: notification.image,
    vibrate: notification.vibrate || [200, 100, 200],
    tag: notification.tag || 'default',
    requireInteraction: notification.requireInteraction || false,
    actions: notification.actions || [
      { action: 'open', title: 'Open', icon: '/icons/open.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/close.png' }
    ],
    data: notification.data
  };
  
  event.waitUntil(
    self.registration.showNotification(notification.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/feed';
  
  // Handle action buttons
  if (event.action === 'dismiss') {
    return;
  }
  
  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to the URL and focus
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline notification queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sync any pending notifications when back online
  console.log('[SW] Syncing notifications');
}

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed', event.notification.tag);
  
  // Track notification dismissal
  const data = event.notification.data;
  if (data?.trackDismissal) {
    fetch('/api/track-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dismissed',
        tag: event.notification.tag
      })
    }).catch(() => {});
  }
});
