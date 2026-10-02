/** Локальный пуш о достижении цели по активу — без сервера, через Notification API. */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Запрашивать разрешение можно только в ответ на жест пользователя. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function showGoalReachedNotification(assetName: string): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const title = 'Цель достигнута 🎉';
  const body = `«${assetName}» — план накопления выполнен`;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: `goal-reached-${assetName}`,
      });
      return;
    }
    new Notification(title, { body });
  } catch {
    // Пуш — бонус поверх экранного «ура», молча пропускаем при отказе браузера.
  }
}
