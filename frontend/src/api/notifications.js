const NOTIFICATIONS_STORAGE_KEY = 'jkn_notifications_v1';

export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'notif-1',
      caseId: 'CASE-PB-001',
      title: 'Permintaan Klarifikasi Medis',
      message: 'Ahmad Fauzi menugaskan klarifikasi ketidaksesuaian laporan pembedahan ke dr. Anindya.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
      type: 'assignment'
    },
    {
      id: 'notif-2',
      caseId: 'CASE-PB-003',
      title: 'Sanggahan Faskes Masuk',
      message: 'Komite Medik RSUD Dr. Soetomo telah melampirkan berkas bukti fisik rekam medis.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: false,
      type: 'dispute'
    },
    {
      id: 'notif-3',
      caseId: 'CASE-PB-001',
      title: 'Pembaruan telaah bukti',
      message: 'Buka detail kasus untuk memeriksa bukti dan status telaah terbaru.',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      read: true,
      type: 'ml'
    }
  ];
}

export function addNotification(notif) {
  const current = getNotifications();
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

export function markNotificationsAsRead() {
  const current = getNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jkn_notifications_updated', { detail: updated }));
  } catch (e) {}
  return updated;
}

