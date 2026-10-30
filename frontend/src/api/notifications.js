const NOTIFICATIONS_STORAGE_KEY = 'jkn_notifications_v1';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function isDemoMode() {
  try { return localStorage.getItem('jkn_demo_mode') === 'true'; } catch { return false; }
}

async function apiCall(endpoint, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('jkn_token');
  const res = await fetch(API_BASE + endpoint, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event('jkn_session_expired'));
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || 'Gagal memuat notifikasi.');
  }
  return res.json();
}

export function getNotificationsSync() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export const getNotifications = getNotificationsSync;

export async function fetchNotifications() {
  if (isDemoMode() || !localStorage.getItem('jkn_token')) {
    return getNotificationsSync();
  }
  try {
    const res = await apiCall('/notifications');
    const list = res?.data || [];
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: list }));
    } catch (e) {}
    return list;
  } catch (e) {
    return getNotificationsSync();
  }
}

export function addNotification(notif) {
  const current = getNotificationsSync();
  const updated = [
    {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    },
    ...current
  ].slice(0, 30);
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: updated }));
  } catch (e) {}
  return updated;
}

export async function markNotificationsAsRead() {
  if (!isDemoMode() && localStorage.getItem('jkn_token')) {
    try {
      const res = await apiCall('/notifications/read-all', { method: 'POST' });
      const list = res?.data || [];
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: list }));
      } catch (e) {}
      return list;
    } catch (e) {}
  }
  const current = getNotificationsSync();
  const updated = current.map(n => ({ ...n, read: true }));
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: updated }));
  } catch (e) {}
  return updated;
}

export async function markNotificationAsRead(id) {
  if (!isDemoMode() && localStorage.getItem('jkn_token') && id) {
    try {
      await apiCall(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
    } catch (e) {}
  }
  const current = getNotificationsSync();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: updated }));
  } catch (e) {}
  return updated;
}
