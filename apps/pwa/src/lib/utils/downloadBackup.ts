import * as db from '@/lib/db';

/** Скачивает JSON-бэкап и отмечает момент экспорта (для баннера напоминания). */
export async function downloadBackup(): Promise<void> {
  const json = await db.exportBackup();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `monesto-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  await db.markBackupExported();
}
