/**
 * @file: data-protection.ts
 * @description: Многоуровневая система защиты данных от потери
 * @dependencies: Chrome Storage API, types/note, external-backup
 * @created: 2025-10-20
 */

import { Note, StorageSchema } from '@/types/note';
import { Folder } from '@/types/folder';
import { syncToIndexedDB, checkAndRestoreFromIndexedDB, initExternalBackups } from './external-backup';

const BACKUP_KEY = 'hidden_notes_backup';
const DELETED_NOTES_KEY = 'hidden_notes_deleted';
const DELETED_FOLDERS_KEY = 'hidden_notes_deleted_folders';
const VERSION_HISTORY_KEY = 'hidden_notes_versions';

/**
 * Уровень 1: Автоматическое резервное копирование
 * Создает snapshot всех данных каждые 5 минут
 */
export async function createAutoBackup(): Promise<void> {
  try {
    // Получаем текущие данные
    const data = await chrome.storage.local.get('hidden_notes');
    const schema = data.hidden_notes as StorageSchema;
    
    if (!schema || !schema.notes || schema.notes.length === 0) {
      return; // Нечего бэкапить
    }

    // Создаем backup с timestamp
    const backup = {
      timestamp: Date.now(),
      data: schema,
      version: 1,
    };

    // Получаем существующие бэкапы
    const backupData = await chrome.storage.local.get(BACKUP_KEY);
    const backups = backupData[BACKUP_KEY] || [];
    
    // Добавляем новый бэкап
    backups.push(backup);
    
    // Храним только последние 3 бэкапа (защита от переполнения)
    const recentBackups = backups.slice(-3);
    
    await chrome.storage.local.set({ [BACKUP_KEY]: recentBackups });
    
    console.log(`✅ Auto-backup created: ${new Date(backup.timestamp).toLocaleString()}`);
  } catch (error) {
    console.error('❌ Auto-backup failed:', error);
  }
}

/**
 * Уровень 2: Восстановление из последнего бэкапа
 */
export async function restoreFromBackup(backupIndex: number = -1): Promise<boolean> {
  try {
    const backupData = await chrome.storage.local.get(BACKUP_KEY);
    const backups = backupData[BACKUP_KEY] || [];
    
    if (backups.length === 0) {
      console.warn('No backups available');
      return false;
    }
    
    // -1 = последний бэкап, 0 = самый старый
    const backup = backupIndex === -1 ? backups[backups.length - 1] : backups[backupIndex];
    
    if (!backup) {
      console.warn('Backup not found');
      return false;
    }
    
    // Восстанавливаем данные
    await chrome.storage.local.set({ hidden_notes: backup.data });
    
    console.log(`✅ Restored from backup: ${new Date(backup.timestamp).toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('❌ Restore failed:', error);
    return false;
  }
}

/**
 * Получить список доступных бэкапов
 */
export async function listBackups(): Promise<Array<{
  index: number;
  timestamp: number;
  notesCount: number;
  date: string;
}>> {
  try {
    const backupData = await chrome.storage.local.get(BACKUP_KEY);
    const backups = backupData[BACKUP_KEY] || [];
    
    return backups.map((backup: any, index: number) => ({
      index,
      timestamp: backup.timestamp,
      notesCount: backup.data?.notes?.length || 0,
      date: new Date(backup.timestamp).toLocaleString('ru-RU'),
    }));
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return [];
  }
}

/**
 * Уровень 3: Корзина удаленных заметок (soft delete)
 * Заметки хранятся 30 дней перед окончательным удалением
 */
export async function moveToTrash(note: Note): Promise<void> {
  try {
    const deletedData = await chrome.storage.local.get(DELETED_NOTES_KEY);
    const deletedNotes = deletedData[DELETED_NOTES_KEY] || [];
    
    // Добавляем метаданные удаления
    const trashedNote = {
      ...note,
      deletedAt: Date.now(),
      canRestoreUntil: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 дней
    };
    
    deletedNotes.push(trashedNote);
    
    // Очищаем старые удаленные заметки (> 30 дней)
    const now = Date.now();
    const validDeleted = deletedNotes.filter((n: any) => n.canRestoreUntil > now);
    
    await chrome.storage.local.set({ [DELETED_NOTES_KEY]: validDeleted });
    
    console.log(`🗑️ Note moved to trash: "${note.title}"`);
  } catch (error) {
    console.error('❌ Failed to move to trash:', error);
  }
}

/**
 * Восстановить заметку из корзины
 */
export async function restoreFromTrash(noteId: string): Promise<Note | null> {
  try {
    const deletedData = await chrome.storage.local.get(DELETED_NOTES_KEY);
    const deletedNotes = deletedData[DELETED_NOTES_KEY] || [];
    
    const noteIndex = deletedNotes.findIndex((n: any) => n.id === noteId);
    if (noteIndex === -1) return null;
    
    const restoredNote = deletedNotes[noteIndex];
    
    // Удаляем из корзины
    deletedNotes.splice(noteIndex, 1);
    await chrome.storage.local.set({ [DELETED_NOTES_KEY]: deletedNotes });
    
    // Очищаем метаданные удаления
    const { deletedAt, canRestoreUntil, ...cleanNote } = restoredNote;
    
    console.log(`♻️ Note restored from trash: "${cleanNote.title}"`);
    return cleanNote as Note;
  } catch (error) {
    console.error('❌ Failed to restore from trash:', error);
    return null;
  }
}

/**
 * Получить список удаленных заметок
 */
export async function listTrashedNotes(): Promise<Array<Note & {
  deletedAt: number;
  canRestoreUntil: number;
  daysUntilPermanentDelete: number;
}>> {
  try {
    const deletedData = await chrome.storage.local.get(DELETED_NOTES_KEY);
    const deletedNotes = deletedData[DELETED_NOTES_KEY] || [];
    
    const now = Date.now();
    return deletedNotes
      .filter((n: any) => n.canRestoreUntil > now)
      .map((n: any) => ({
        ...n,
        daysUntilPermanentDelete: Math.ceil((n.canRestoreUntil - now) / (24 * 60 * 60 * 1000)),
      }));
  } catch (error) {
    console.error('❌ Failed to list trashed notes:', error);
    return [];
  }
}

/**
 * Уровень 3: Корзина удаленных папок (soft delete)
 * Папки хранятся 30 дней перед окончательным удалением
 * При удалении папки в корзину перемещаются все заметки внутри
 */
export async function moveFolderToTrash(folder: Folder): Promise<void> {
  try {
    const deletedData = await chrome.storage.local.get(DELETED_FOLDERS_KEY);
    const deletedFolders = deletedData[DELETED_FOLDERS_KEY] || [];
    
    // Добавляем метаданные удаления
    const trashedFolder = {
      ...folder,
      deletedAt: Date.now(),
      canRestoreUntil: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 дней
    };
    
    deletedFolders.push(trashedFolder);
    
    // Очищаем старые удаленные папки (> 30 дней)
    const now = Date.now();
    const validDeleted = deletedFolders.filter((f: any) => f.canRestoreUntil > now);
    
    await chrome.storage.local.set({ [DELETED_FOLDERS_KEY]: validDeleted });
    
    console.log(`🗑️ Folder moved to trash: "${folder.name}"`);
  } catch (error) {
    console.error('❌ Failed to move folder to trash:', error);
  }
}

/**
 * Восстановить папку из корзины
 */
export async function restoreFolderFromTrash(folderId: string): Promise<Folder | null> {
  try {
    const deletedData = await chrome.storage.local.get(DELETED_FOLDERS_KEY);
    const deletedFolders = deletedData[DELETED_FOLDERS_KEY] || [];
    
    const folderIndex = deletedFolders.findIndex((f: any) => f.id === folderId);
    if (folderIndex === -1) return null;
    
    const restoredFolder = deletedFolders[folderIndex];
    
    // Удаляем из корзины
    deletedFolders.splice(folderIndex, 1);
    await chrome.storage.local.set({ [DELETED_FOLDERS_KEY]: deletedFolders });
    
    // Очищаем метаданные удаления
    const { deletedAt, canRestoreUntil, ...cleanFolder } = restoredFolder;
    
    console.log(`♻️ Folder restored from trash: "${cleanFolder.name}"`);
    return cleanFolder as Folder;
  } catch (error) {
    console.error('❌ Failed to restore folder from trash:', error);
    return null;
  }
}

/**
 * Получить список удаленных папок
 */
export async function listTrashedFolders(): Promise<Array<Folder & {
  deletedAt: number;
  canRestoreUntil: number;
  daysUntilPermanentDelete: number;
}>> {
  try {
    const deletedData = await chrome.storage.local.get(DELETED_FOLDERS_KEY);
    const deletedFolders = deletedData[DELETED_FOLDERS_KEY] || [];
    
    const now = Date.now();
    return deletedFolders
      .filter((f: any) => f.canRestoreUntil > now)
      .map((f: any) => ({
        ...f,
        daysUntilPermanentDelete: Math.ceil((f.canRestoreUntil - now) / (24 * 60 * 60 * 1000)),
      }));
  } catch (error) {
    console.error('❌ Failed to list trashed folders:', error);
    return [];
  }
}

/**
 * Уровень 4: Версионирование заметок (snapshot при каждом сохранении)
 * Храним последние 5 версий каждой заметки
 */
export async function saveNoteVersion(note: Note): Promise<void> {
  try {
    const versionData = await chrome.storage.local.get(VERSION_HISTORY_KEY);
    const allVersions = versionData[VERSION_HISTORY_KEY] || {};
    
    // Получаем версии для этой заметки
    const noteVersions = allVersions[note.id] || [];
    
    // Создаем новую версию
    const version = {
      ...note,
      versionTimestamp: Date.now(),
    };
    
    noteVersions.push(version);
    
    // Храним только последние 5 версий
    const recentVersions = noteVersions.slice(-5);
    
    allVersions[note.id] = recentVersions;
    
    await chrome.storage.local.set({ [VERSION_HISTORY_KEY]: allVersions });
  } catch (error) {
    console.error('❌ Failed to save note version:', error);
  }
}

/**
 * Получить историю версий заметки
 */
export async function getNoteVersions(noteId: string): Promise<Array<Note & { versionTimestamp: number }>> {
  try {
    const versionData = await chrome.storage.local.get(VERSION_HISTORY_KEY);
    const allVersions = versionData[VERSION_HISTORY_KEY] || {};
    return allVersions[noteId] || [];
  } catch (error) {
    console.error('❌ Failed to get note versions:', error);
    return [];
  }
}

/**
 * Восстановить конкретную версию заметки
 */
export async function restoreNoteVersion(noteId: string, versionIndex: number): Promise<Note | null> {
  try {
    const versions = await getNoteVersions(noteId);
    if (versionIndex < 0 || versionIndex >= versions.length) return null;
    
    const version = versions[versionIndex];
    if (!version) return null;
    
    const { versionTimestamp, ...cleanNote } = version;
    
    console.log(`♻️ Restored version from ${new Date(versionTimestamp).toLocaleString()}`);
    return cleanNote as Note;
  } catch (error) {
    console.error('❌ Failed to restore version:', error);
    return null;
  }
}

/**
 * Уровень 5: Валидация данных при чтении/записи
 */
export function validateNote(note: any): note is Note {
  if (!note || typeof note !== 'object') return false;
  if (typeof note.id !== 'string' || !note.id) return false;
  if (typeof note.title !== 'string') return false;
  if (typeof note.content !== 'string') return false;
  if (typeof note.createdAt !== 'number') return false;
  if (typeof note.updatedAt !== 'number') return false;
  
  return true;
}

/**
 * Валидация полной схемы данных
 */
export function validateStorageSchema(data: any): data is StorageSchema {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.notes)) return false;
  
  // Проверяем каждую заметку
  return data.notes.every((note: any) => validateNote(note));
}

/**
 * Уровень 6: Безопасное чтение с восстановлением
 */
export async function safeGetAllNotes(): Promise<Note[]> {
  try {
    const data = await chrome.storage.local.get('hidden_notes');
    const schema = data.hidden_notes;
    
    // Валидация данных
    if (!validateStorageSchema(schema)) {
      console.warn('⚠️ Invalid storage schema detected, attempting recovery...');
      
      // Пытаемся восстановить из бэкапа
      const restored = await restoreFromBackup();
      if (restored) {
        const restoredData = await chrome.storage.local.get('hidden_notes');
        return restoredData.hidden_notes?.notes || [];
      }
      
      return [];
    }
    
    return schema.notes;
  } catch (error) {
    console.error('❌ Failed to read notes, attempting recovery...', error);
    
    // Пытаемся восстановить из бэкапа
    const restored = await restoreFromBackup();
    if (restored) {
      const restoredData = await chrome.storage.local.get('hidden_notes');
      return restoredData.hidden_notes?.notes || [];
    }
    
    return [];
  }
}

/**
 * Уровень 7: Периодическая проверка целостности данных
 */
export async function verifyDataIntegrity(): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Проверка основного хранилища
    const data = await chrome.storage.local.get('hidden_notes');
    const schema = data.hidden_notes;
    
    if (!schema) {
      errors.push('Main storage is empty');
    } else {
      if (!validateStorageSchema(schema)) {
        errors.push('Storage schema validation failed');
      }
      
      // Проверка дубликатов ID
      const ids = new Set();
      schema.notes?.forEach((note: Note) => {
        if (ids.has(note.id)) {
          errors.push(`Duplicate note ID found: ${note.id}`);
        }
        ids.add(note.id);
      });
      
      // Проверка timestamps
      schema.notes?.forEach((note: Note) => {
        if (note.createdAt > Date.now()) {
          warnings.push(`Note "${note.title}" has future createdAt timestamp`);
        }
        if (note.updatedAt < note.createdAt) {
          warnings.push(`Note "${note.title}" has updatedAt before createdAt`);
        }
      });
    }
    
    // Проверка наличия бэкапов
    const backupData = await chrome.storage.local.get(BACKUP_KEY);
    const backups = backupData[BACKUP_KEY] || [];
    if (backups.length === 0) {
      warnings.push('No backups available');
    }
    
    // Проверка использования квоты
    const bytesInUse = await chrome.storage.local.getBytesInUse(null);
    const totalBytes = chrome.storage.local.QUOTA_BYTES || 10485760;
    const percentUsed = (bytesInUse / totalBytes) * 100;
    
    if (percentUsed > 90) {
      errors.push(`Storage critically full: ${percentUsed.toFixed(1)}%`);
    } else if (percentUsed > 80) {
      warnings.push(`Storage usage high: ${percentUsed.toFixed(1)}%`);
    }
    
  } catch (error) {
    errors.push(`Integrity check failed: ${error}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Уровень 8: Emergency Export (экспорт в localStorage как fallback)
 */
export async function emergencyExportToLocalStorage(): Promise<void> {
  try {
    const data = await chrome.storage.local.get('hidden_notes');
    const schema = data.hidden_notes;
    
    if (schema) {
      localStorage.setItem('hidden_notes_emergency_backup', JSON.stringify({
        data: schema,
        timestamp: Date.now(),
        source: 'chrome.storage.local',
      }));
      
      console.log('🆘 Emergency backup saved to localStorage');
    }
  } catch (error) {
    console.error('❌ Emergency export failed:', error);
  }
}

/**
 * Восстановление из emergency backup
 */
export async function restoreFromEmergencyBackup(): Promise<boolean> {
  try {
    const emergencyData = localStorage.getItem('hidden_notes_emergency_backup');
    if (!emergencyData) {
      console.warn('No emergency backup found');
      return false;
    }
    
    const parsed = JSON.parse(emergencyData);
    
    if (validateStorageSchema(parsed.data)) {
      await chrome.storage.local.set({ hidden_notes: parsed.data });
      console.log('✅ Restored from emergency backup');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Emergency restore failed:', error);
    return false;
  }
}

/**
 * Принудительная очистка старых бэкапов для освобождения места
 */
export async function cleanupBackups(): Promise<void> {
  try {
    const bytesBefore = await chrome.storage.local.getBytesInUse(null);
    
    const backupData = await chrome.storage.local.get(BACKUP_KEY);
    const backups = backupData[BACKUP_KEY] || [];
    
    if (backups.length > 0) {
      // Удаляем ВСЕ бэкапы для максимального освобождения места
      await chrome.storage.local.remove(BACKUP_KEY);
      console.log(`🧹 Removed ${backups.length} backups to free space`);
    }
    
    // Также очищаем историю версий если она слишком большая
    const versionData = await chrome.storage.local.get(VERSION_HISTORY_KEY);
    const versions = versionData[VERSION_HISTORY_KEY];
    if (versions && Object.keys(versions).length > 0) {
       // Очищаем версии, оставляем только пустой объект или минимальный набор
       // Для экономии места при критической ситуации удаляем всю историю версий
       await chrome.storage.local.remove(VERSION_HISTORY_KEY);
       console.log('🧹 Removed version history to free space');
    }

    // Очищаем корзину
    try {
      await chrome.storage.local.remove([DELETED_NOTES_KEY, DELETED_FOLDERS_KEY]);
      console.log('🧹 Cleared trash to free space');
    } catch (trashError) {
      // Игнорируем ошибки очистки корзины (может быть уже пуста)
      console.log('⚠️ Could not clear trash (may be empty)');
    }
    
    const bytesAfter = await chrome.storage.local.getBytesInUse(null);
    const freed = bytesBefore - bytesAfter;
    console.log(`✅ Cleanup freed ${freed} bytes (${(freed / 1024).toFixed(2)} KB)`);
    
  } catch (error) {
    console.error('❌ Failed to cleanup backups:', error);
  }
}

/**
 * Инициализировать систему защиты данных
 * Запускает автоматические бэкапы и мониторинг
 */
export async function initDataProtection(): Promise<void> {
  // Проверяем IndexedDB при запуске - возможно нужно восстановление
  const restored = await checkAndRestoreFromIndexedDB();
  if (restored) {
    console.log('✅ Data auto-restored from IndexedDB (extension was reinstalled)');
  }
  
  // Инициализируем внешние бэкапы (IndexedDB)
  initExternalBackups();
  
  // Создаем первый бэкап сразу
  createAutoBackup();
  
  // Автоматический бэкап каждые 5 минут
  setInterval(() => {
    createAutoBackup();
  }, 5 * 60 * 1000);
  
  // Синхронизация с IndexedDB каждые 2 минуты
  setInterval(() => {
    syncToIndexedDB();
  }, 2 * 60 * 1000);
  
  // Проверка целостности каждые 10 минут
  setInterval(async () => {
    const result = await verifyDataIntegrity();
    
    if (!result.isValid) {
      console.error('⚠️ Data integrity issues detected:', result.errors);
      
      // Автоматическое восстановление при критических ошибках
      if (result.errors.some(e => e.includes('validation failed'))) {
        console.log('🔄 Attempting auto-recovery...');
        const backupRestored = await restoreFromBackup();
        
        // Если бэкап не помог, пробуем IndexedDB
        if (!backupRestored) {
          console.log('🔄 Attempting IndexedDB recovery...');
          await checkAndRestoreFromIndexedDB();
        }
      }
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Data warnings:', result.warnings);
    }
  }, 10 * 60 * 1000);
  
  // Emergency backup в localStorage каждый час
  setInterval(() => {
    emergencyExportToLocalStorage();
  }, 60 * 60 * 1000);
  
  console.log('🛡️ Data Protection System initialized with IndexedDB persistence');
}

/**
 * Экспорт защищенных данных (включая бэкапы и историю)
 */
export async function exportProtectedData(): Promise<string> {
  try {
    const mainData = await chrome.storage.local.get('hidden_notes');
    const backupData = await chrome.storage.local.get(BACKUP_KEY);
    const deletedData = await chrome.storage.local.get(DELETED_NOTES_KEY);
    const versionData = await chrome.storage.local.get(VERSION_HISTORY_KEY);
    
    const fullExport = {
      exportedAt: Date.now(),
      exportedAtDate: new Date().toISOString(),
      main: mainData.hidden_notes,
      backups: backupData[BACKUP_KEY] || [],
      deleted: deletedData[DELETED_NOTES_KEY] || [],
      versions: versionData[VERSION_HISTORY_KEY] || {},
      metadata: {
        totalNotes: mainData.hidden_notes?.notes?.length || 0,
        totalBackups: (backupData[BACKUP_KEY] || []).length,
        totalDeleted: (deletedData[DELETED_NOTES_KEY] || []).length,
      },
    };
    
    return JSON.stringify(fullExport, null, 2);
  } catch (error) {
    console.error('❌ Protected export failed:', error);
    return '{}';
  }
}

