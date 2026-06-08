/**
 * React Hook for Push Notifications
 * Handles subscription, permission requests, and notification management
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/auth';

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual key

interface PushNotificationState {
  supported: boolean;
  permission: NotificationPermission | null;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    permission: null,
    subscribed: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      const permission = supported ? Notification.permission : null;
      
      setState(prev => ({
        ...prev,
        supported,
        permission,
        loading: false
      }));

      if (supported && permission === 'granted') {
        await checkSubscription();
      }
    } catch (error) {
      console.error('[Push] Support check error:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to check support' }));
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        subscribed: !!subscription
      }));
    } catch (error) {
      console.error('[Push] Subscription check error:', error);
    }
  };

  const requestPermission = async () => {
    if (!state.supported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        await subscribe();
        return true;
      } else {
        setState(prev => ({ ...prev, error: 'Permission denied' }));
        return false;
      }
    } catch (error) {
      console.error('[Push] Permission request error:', error);
      setState(prev => ({ ...prev, error: 'Failed to request permission' }));
      return false;
    }
  };

  const subscribe = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Register service worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to backend
      const response = await apiRequest('/api/push-notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'subscribe',
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setState(prev => ({
        ...prev,
        subscribed: true,
        loading: false
      }));

      console.log('[Push] Successfully subscribed');
      return true;
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to subscribe'
      }));
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify backend
        await apiRequest('/api/push-notifications', {
          method: 'DELETE'
        });
      }

      setState(prev => ({
        ...prev,
        subscribed: false,
        loading: false
      }));

      console.log('[Push] Successfully unsubscribed');
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to unsubscribe'
      }));
      return false;
    }
  };

  const testNotification = async (type: string = 'new_match') => {
    try {
      const response = await apiRequest('/api/push-notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      console.log('[Push] Test notification sent');
      return true;
    } catch (error) {
      console.error('[Push] Test notification error:', error);
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  // Ensure we return a Uint8Array with ArrayBuffer (not ArrayBufferLike)
  return new Uint8Array(outputArray.buffer as ArrayBuffer);
}
