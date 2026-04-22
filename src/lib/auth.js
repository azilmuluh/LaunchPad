const TOKEN_KEY = 'lp_token';
const USER_KEY  = 'lp_user';

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
  const res = await fetch(path, { ...options, headers });
  // Auto-refresh user in localStorage if auth route returns updated user
  if (res.ok && path.includes('/api/auth')) {
    try {
      const clone = res.clone();
      const data  = await clone.json();
      if (data.user && token) setSession(token, data.user);
    } catch {}
  }
  return res;
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
    }
  } catch {}
  return null;
}
