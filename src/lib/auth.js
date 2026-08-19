import { QueryClient } from '@tanstack/react-query';

const TOKEN_KEY = 'lp_token';
const USER_KEY  = 'lp_user';

// React Query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        // Retry max 2 times with exponential backoff
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export function getToken()  { return localStorage.getItem(TOKEN_KEY); }
export function getUser()   { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null; }
export function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
export function isAuthenticated() { return !!getToken(); }

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Broadcast to all tabs so nav/profile updates everywhere
  try { window.dispatchEvent(new CustomEvent('lp-user-updated', { detail: user })); } catch {}
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const res = await fetch(path, { 
      ...options, 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    // Intercept 401 Unauthorized or expired JWT error
    if (res.status === 401) {
      clearSession();
      const pathname = window.location.pathname;
      if (!pathname.startsWith('/login') && !pathname.startsWith('/signup') && pathname !== '/') {
        window.location.href = '/login';
      }
    } else if (res.status === 500) {
      try {
        const clone = res.clone();
        const data = await clone.json();
        if (data.error && (
          data.error.includes('jwt expired') || 
          data.error.includes('jwt malformed') || 
          data.error.includes('invalid token') ||
          data.error.includes('TokenExpiredError')
        )) {
          clearSession();
          const pathname = window.location.pathname;
          if (!pathname.startsWith('/login') && !pathname.startsWith('/signup') && pathname !== '/') {
            window.location.href = '/login';
          }
        }
      } catch {}
    }
    
    // Auto-refresh user in localStorage if auth route returns updated user
    if (res.ok && path.includes('/api/auth')) {
      try {
        const clone = res.clone();
        const data  = await clone.json();
        if (data.user && token) setSession(token, data.user);
      } catch {}
    }
    
    return res;
  } catch (error) {
    // Handle network errors
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout (30s)');
      timeoutError.name = 'AbortError';
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  }
}

// Re-fetch fresh user from server and update localStorage
export async function refreshUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const res  = await fetch('/api/auth?action=me', { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (res.ok && data.user) {
      setSession(token, data.user);
      return data.user;
    } else if (res.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
  } catch {}
  return null;
}

// Utility for consistent error message extraction
export function extractErrorMessage(error) {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
}
