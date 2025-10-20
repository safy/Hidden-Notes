/**
 * @file: external-backup.ts
 * @description: Система внешних бэкапов для защиты данных при удалении расширения
 * @dependencies: Chrome Storage API, IndexedDB API, types/note
 * @created: 2025-10-20
 */

import { StorageSchema } from '@/types/note';

const INDEXEDDB_NAME = 'HiddenNotesDB';
const INDEXEDDB_VERSION = 1;
const STORE_NAME = 'backups';

/**
 * Инициализация IndexedDB (персистентное хранилище, остается после удаления расширения)
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Создаем object store для бэкапов
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id',
          autoIncrement: false 
        });
        
        // Индексы для быстрого поиска
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

/**
 * Сохранить бэкап в IndexedDB
 * IndexedDB остается доступным даже после удаления расширения!
 */
export async function saveToIndexedDB(schema: StorageSchema): Promise<void> {
  try {
    const db = await openIndexedDB();
    
    const backup = {
      id: `backup-${Date.now()}`,
      timestamp: Date.now(),
      type: 'auto',
      data: schema,
      notesCount: schema.notes?.length || 0,
      version: 1,
    };
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.add(backup);
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('💾 Saved to IndexedDB:', new Date(backup.timestamp).toLocaleString());
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
    
    // Очистка старых бэкапов (храним последние 20)
    await cleanupOldIndexedDBBackups(db);
    
    db.close();
  } catch (error) {
    console.error('❌ Failed to save to IndexedDB:', error);
  }
}

/**
 * Очистка старых бэкапов в IndexedDB (храним последние 20)
 */
async function cleanupOldIndexedDBBackups(db: IDBDatabase): Promise<void> {
  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const allBackups: any[] = [];
    const request = index.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        allBackups.push(cursor.value);
        cursor.continue();
      } else {
        // Сортируем по timestamp и удаляем старые
        allBackups.sort((a, b) => b.timestamp - a.timestamp);
        
        // Удаляем все кроме последних 20
        if (allBackups.length > 20) {
          const toDelete = allBackups.slice(20);
          toDelete.forEach(backup => {
            store.delete(backup.id);
          });
          console.log(`🧹 Cleaned ${toDelete.length} old IndexedDB backups`);
        }
      }
    };
  } catch (error) {
    console.error('❌ Failed to cleanup IndexedDB:', error);
  }
}

/**
 * Получить все бэкапы из IndexedDB
 */
export async function listIndexedDBBackups(): Promise<Array<{
  id: string;
  timestamp: number;
  date: string;
  notesCount: number;
  type: string;
}>> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const backups = request.result || [];
        const formatted = backups.map((backup: any) => ({
          id: backup.id,
          timestamp: backup.timestamp,
          date: new Date(backup.timestamp).toLocaleString('ru-RU'),
          notesCount: backup.notesCount,
          type: backup.type,
        }));
        
        // Сортируем от новых к старым
        formatted.sort((a, b) => b.timestamp - a.timestamp);
        
        db.close();
        resolve(formatted);
      };
      
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Failed to list IndexedDB backups:', error);
    return [];
  }
}

/**
 * Восстановить данные из IndexedDB бэкапа
 */
export async function restoreFromIndexedDB(backupId: string): Promise<StorageSchema | null> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(backupId);
      
      request.onsuccess = () => {
        const backup = request.result;
        db.close();
        
        if (backup && backup.data) {
          console.log('♻️ Restored from IndexedDB:', new Date(backup.timestamp).toLocaleString());
          resolve(backup.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Failed to restore from IndexedDB:', error);
    return null;
  }
}

/**
 * Восстановить последний бэкап из IndexedDB
 */
export async function restoreLatestIndexedDBBackup(): Promise<StorageSchema | null> {
  try {
    const backups = await listIndexedDBBackups();
    if (backups.length === 0) return null;
    
    const latest = backups[0]; // Уже отсортированы от новых к старым
    if (!latest) return null;
    
    return await restoreFromIndexedDB(latest.id);
  } catch (error) {
    console.error('❌ Failed to restore latest IndexedDB backup:', error);
    return null;
  }
}

/**
 * Экспорт в downloadable файл (пользователь может сохранить локально)
 */
export async function downloadBackupFile(schema: StorageSchema): Promise<void> {
  try {
    const backup = {
      exportedAt: Date.now(),
      exportedAtDate: new Date().toISOString(),
      source: 'Hidden Notes Extension',
      version: 1,
      data: schema,
      metadata: {
        notesCount: schema.notes?.length || 0,
        hasSettings: !!schema.settings,
      },
    };
    
    const jsonData = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    link.download = `hidden-notes-full-backup-${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📥 Backup file downloaded');
  } catch (error) {
    console.error('❌ Failed to download backup:', error);
  }
}

/**
 * Импорт из файла бэкапа
 */
export async function importBackupFile(fileContent: string): Promise<StorageSchema | null> {
  try {
    const parsed = JSON.parse(fileContent);
    
    // Валидация структуры
    if (!parsed.data || !parsed.data.notes || !Array.isArray(parsed.data.notes)) {
      throw new Error('Invalid backup file format');
    }
    
    console.log('📤 Backup file imported, notes:', parsed.data.notes.length);
    return parsed.data as StorageSchema;
  } catch (error) {
    console.error('❌ Failed to import backup file:', error);
    return null;
  }
}

/**
 * Синхронизация с IndexedDB при каждом изменении данных
 */
export async function syncToIndexedDB(): Promise<void> {
  try {
    const data = await chrome.storage.local.get('hidden_notes');
    const schema = data.hidden_notes as StorageSchema;
    
    if (schema) {
      await saveToIndexedDB(schema);
    }
  } catch (error) {
    console.error('❌ IndexedDB sync failed:', error);
  }
}

/**
 * Инициализация внешних бэкапов
 * Запускает периодическую синхронизацию с IndexedDB
 */
export function initExternalBackups(): void {
  // Первая синхронизация сразу
  syncToIndexedDB();
  
  // Синхронизация каждые 2 минуты (чаще чем обычные бэкапы)
  setInterval(() => {
    syncToIndexedDB();
  }, 2 * 60 * 1000);
  
  console.log('🌐 External Backup System initialized (IndexedDB)');
}

/**
 * Проверка доступности IndexedDB при запуске
 * Если есть данные в IndexedDB но нет в chrome.storage - автовосстановление
 */
export async function checkAndRestoreFromIndexedDB(): Promise<boolean> {
  try {
    // Проверяем chrome.storage
    const chromeData = await chrome.storage.local.get('hidden_notes');
    const chromeSchema = chromeData.hidden_notes as StorageSchema;
    
    // Если в chrome.storage пусто или мало данных
    const chromeNotesCount = chromeSchema?.notes?.length || 0;
    
    // Проверяем IndexedDB
    const indexedDBBackups = await listIndexedDBBackups();
    
    if (indexedDBBackups.length === 0) {
      console.log('ℹ️ No IndexedDB backups available');
      return false;
    }
    
    const latestBackup = indexedDBBackups[0];
    
    // Если IndexedDB содержит больше данных - предлагаем восстановление
    if (!latestBackup) return false;
    
    if (latestBackup.notesCount > chromeNotesCount) {
      console.warn(`⚠️ IndexedDB has more notes (${latestBackup.notesCount}) than chrome.storage (${chromeNotesCount})`);
      
      // Автоматическое восстановление если chrome.storage пуст
      if (chromeNotesCount === 0) {
        const restored = await restoreLatestIndexedDBBackup();
        if (restored) {
          await chrome.storage.local.set({ hidden_notes: restored });
          console.log('✅ Auto-restored from IndexedDB');
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ IndexedDB check failed:', error);
    return false;
  }
}

/**
 * Экспорт в облако (для будущих версий)
 * Сейчас только подготовка интерфейса
 */
export interface CloudBackupProvider {
  name: string;
  upload: (data: string) => Promise<string>; // возвращает URL
  download: (url: string) => Promise<string>; // возвращает JSON
  list: () => Promise<Array<{ url: string; timestamp: number }>>;
}

/**
 * Google Drive backup (заглушка для v2.0)
 */
export const GoogleDriveBackup: CloudBackupProvider = {
  name: 'Google Drive',
  upload: async (_data: string) => {
    throw new Error('Google Drive backup will be available in v2.0.0 Pro');
  },
  download: async (_url: string) => {
    throw new Error('Google Drive backup will be available in v2.0.0 Pro');
  },
  list: async () => {
    throw new Error('Google Drive backup will be available in v2.0.0 Pro');
  },
};

/**
 * Экспорт всех данных включая внешние бэкапы
 */
export async function exportAllBackupSources(): Promise<{
  chromeStorage: StorageSchema | null;
  indexedDB: any[];
  localStorage: any;
  timestamp: number;
}> {
  try {
    // Chrome Storage
    const chromeData = await chrome.storage.local.get('hidden_notes');
    const chromeSchema = chromeData.hidden_notes as StorageSchema;
    
    // IndexedDB
    const indexedDBBackups = await listIndexedDBBackups();
    
    // localStorage emergency backup
    const localStorageBackup = localStorage.getItem('hidden_notes_emergency_backup');
    const parsedLocalStorage = localStorageBackup ? JSON.parse(localStorageBackup) : null;
    
    return {
      chromeStorage: chromeSchema || null,
      indexedDB: indexedDBBackups,
      localStorage: parsedLocalStorage,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Failed to export all sources:', error);
    return {
      chromeStorage: null,
      indexedDB: [],
      localStorage: null,
      timestamp: Date.now(),
    };
  }
}

/**
 * Создать ссылку для восстановления данных
 * Генерирует специальную ссылку которую пользователь может сохранить
 */
export async function generateRecoveryLink(): Promise<string> {
  try {
    const data = await chrome.storage.local.get('hidden_notes');
    const schema = data.hidden_notes as StorageSchema;
    
    if (!schema) {
      throw new Error('No data to create recovery link');
    }
    
    // Сжимаем данные (можно добавить LZString compression позже)
    const jsonData = JSON.stringify(schema);
    const base64Data = btoa(unescape(encodeURIComponent(jsonData)));
    
    // Генерируем recovery URL (для GitHub Pages или отдельного сайта)
    const recoveryUrl = `https://your-domain.com/recover?data=${base64Data}`;
    
    console.log('🔗 Recovery link generated');
    return recoveryUrl;
  } catch (error) {
    console.error('❌ Failed to generate recovery link:', error);
    return '';
  }
}

/**
 * Восстановление из recovery link
 */
export async function restoreFromRecoveryLink(recoveryUrl: string): Promise<StorageSchema | null> {
  try {
    const url = new URL(recoveryUrl);
    const base64Data = url.searchParams.get('data');
    
    if (!base64Data) {
      throw new Error('Invalid recovery link');
    }
    
    const jsonData = decodeURIComponent(escape(atob(base64Data)));
    const schema = JSON.parse(jsonData) as StorageSchema;
    
    console.log('✅ Restored from recovery link');
    return schema;
  } catch (error) {
    console.error('❌ Failed to restore from recovery link:', error);
    return null;
  }
}

/**
 * Webhook для отправки бэкапов на внешний сервер (опционально)
 */
export async function sendWebhookBackup(webhookUrl: string, schema: StorageSchema): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: Date.now(),
        data: schema,
        source: 'Hidden Notes Extension',
        version: 1,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
    
    console.log('📡 Webhook backup sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Webhook backup failed:', error);
    return false;
  }
}

/**
 * Email backup (отправка бэкапа на email пользователя)
 * Использует mailto: протокол
 */
export async function emailBackup(schema: StorageSchema, userEmail: string): Promise<void> {
  try {
    const jsonData = JSON.stringify(schema, null, 2);
    const timestamp = new Date().toISOString();
    
    // Ограничение: mailto имеет лимит на размер (~2000 символов)
    // Для больших данных лучше использовать attachment API
    if (jsonData.length > 2000) {
      console.warn('⚠️ Data too large for email, use download instead');
      await downloadBackupFile(schema);
      return;
    }
    
    const subject = `Hidden Notes Backup - ${timestamp}`;
    const body = `Автоматический бэкап ваших заметок из Hidden Notes Extension.\n\nДата: ${timestamp}\nЗаметок: ${schema.notes?.length || 0}\n\nДанные:\n${jsonData}`;
    
    const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink, '_blank');
    console.log('📧 Email backup initiated');
  } catch (error) {
    console.error('❌ Email backup failed:', error);
  }
}

/**
 * Сохранение в облако через Web API (для v2.0)
 */
export interface CloudStorageConfig {
  provider: 'google-drive' | 'dropbox' | 'onedrive';
  accessToken: string;
  refreshToken?: string;
}

// Заглушки для будущих версий
export async function uploadToCloud(_config: CloudStorageConfig, _schema: StorageSchema): Promise<string> {
  throw new Error('Cloud backup will be available in v2.0.0 Pro');
}

export async function downloadFromCloud(_config: CloudStorageConfig, _fileId: string): Promise<StorageSchema> {
  throw new Error('Cloud backup will be available in v2.0.0 Pro');
}

