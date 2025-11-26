/**
 * @file: archive-disk.ts
 * @description: Сохранение архивных данных на диск через File System Access API
 * @dependencies: File System Access API, types/note, types/folder
 * @created: 2025-11-20
 */

import { Note } from '@/types/note';
import { Folder } from '@/types/folder';

// Интерфейсы для File System Access API
interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showSaveFilePicker?(options?: any): Promise<FileSystemFileHandle>;
  }
}

export interface ArchiveData {
  folder: Folder;
  notes: Note[];
  archivedAt: number;
  version: number;
}

const ARCHIVE_VERSION = 1;

/**
 * Сохранить архивную папку с заметками на диск
 * @param folder - Папка для архивации
 * @param notes - Заметки в папке
 * @returns Promise с FileSystemFileHandle или null если пользователь отменил
 */
export async function saveArchiveToDisk(
  folder: Folder,
  notes: Note[]
): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) {
    console.warn('File System Access API not supported');
    return null;
  }

  try {
    const archiveData: ArchiveData = {
      folder,
      notes,
      archivedAt: Date.now(),
      version: ARCHIVE_VERSION,
    };

    const jsonData = JSON.stringify(archiveData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Показываем диалог сохранения
    if (!window.showSaveFilePicker) {
      throw new Error('showSaveFilePicker is not available');
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileName = `hidden-notes-archive-${folder.name}-${timestamp}.json`;

    const fileHandle = await (window.showSaveFilePicker as (options?: any) => Promise<FileSystemFileHandle>)({
      suggestedName: fileName,
      types: [
        {
          description: 'Hidden Notes Archive',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    });

    // Записываем файл
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    console.log('✅ Archive saved to disk:', fileHandle.name);
    return fileHandle;
  } catch (error: any) {
    // Пользователь отменил диалог
    if (error.name === 'AbortError') {
      return null;
    }
    console.error('❌ Failed to save archive to disk:', error);
    throw error;
  }
}

/**
 * Загрузить архивную папку с заметками с диска
 * @param fileHandle - FileSystemFileHandle файла архива
 * @returns Promise с ArchiveData или null если ошибка
 */
export async function loadArchiveFromDisk(
  fileHandle: FileSystemFileHandle
): Promise<ArchiveData | null> {
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    const archiveData: ArchiveData = JSON.parse(text);

    // Проверяем версию
    if (archiveData.version !== ARCHIVE_VERSION) {
      console.warn('⚠️ Archive version mismatch:', archiveData.version, 'expected', ARCHIVE_VERSION);
    }

    console.log('✅ Archive loaded from disk:', fileHandle.name);
    return archiveData;
  } catch (error) {
    console.error('❌ Failed to load archive from disk:', error);
    return null;
  }
}

/**
 * Сохранить fileHandle в storage (только метаданные)
 * Используем IndexedDB для хранения fileHandle, так как он не сериализуется в JSON
 */
export async function saveArchiveHandleToStorage(
  folderId: string,
  fileHandle: FileSystemFileHandle
): Promise<void> {
  try {
    // Сохраняем только имя файла и пытаемся сохранить handle через IndexedDB
    const archiveMetadata = {
      folderId,
      fileName: fileHandle.name,
      savedAt: Date.now(),
    };

    // Сохраняем метаданные в chrome.storage
    const data = await chrome.storage.local.get('hidden_notes_archive_metadata');
    const metadata = data.hidden_notes_archive_metadata || {};
    metadata[folderId] = archiveMetadata;
    await chrome.storage.local.set({ hidden_notes_archive_metadata: metadata });

    // Сохраняем fileHandle в IndexedDB (если доступен)
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('hidden_notes_archive_handles', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('handles')) {
            db.createObjectStore('handles', { keyPath: 'folderId' });
          }
        };
      });

      const transaction = db.transaction('handles', 'readwrite');
      const store = transaction.objectStore('handles');
      await store.put({ folderId, fileHandle, savedAt: Date.now() });
      console.log('✅ Archive handle saved to IndexedDB');
    } catch (indexedDBError) {
      console.warn('⚠️ Could not save handle to IndexedDB, using metadata only:', indexedDBError);
    }
  } catch (error) {
    console.error('❌ Failed to save archive handle to storage:', error);
    throw error;
  }
}

/**
 * Загрузить fileHandle из storage
 */
export async function loadArchiveHandleFromStorage(
  folderId: string
): Promise<FileSystemFileHandle | null> {
  try {
    // Пытаемся загрузить из IndexedDB
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('hidden_notes_archive_handles', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const transaction = db.transaction('handles', 'readonly');
      const store = transaction.objectStore('handles');
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(folderId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (result && result.fileHandle) {
        console.log('✅ Archive handle loaded from IndexedDB');
        return result.fileHandle;
      }
    } catch (indexedDBError) {
      console.warn('⚠️ Could not load handle from IndexedDB:', indexedDBError);
    }

    // Fallback: возвращаем null (пользователю нужно будет выбрать файл вручную)
    console.warn('⚠️ Archive handle not found, user will need to select file manually');
    return null;
  } catch (error) {
    console.error('❌ Failed to load archive handle from storage:', error);
    return null;
  }
}

/**
 * Выбрать архивный файл для загрузки
 * @returns Promise с FileSystemFileHandle или null если пользователь отменил
 */
export async function selectArchiveFile(): Promise<FileSystemFileHandle | null> {
  if (!('showOpenFilePicker' in window)) {
    console.warn('File System Access API not supported');
    return null;
  }

  try {
    if (!window.showOpenFilePicker) {
      throw new Error('showOpenFilePicker is not available');
    }

    const fileHandles = await (window.showOpenFilePicker as (options?: any) => Promise<FileSystemFileHandle[]>)({
      types: [
        {
          description: 'Hidden Notes Archive',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
      multiple: false,
    });

    if (fileHandles.length === 0) {
      return null;
    }

    return fileHandles[0]!;
  } catch (error: any) {
    // Пользователь отменил диалог
    if (error.name === 'AbortError') {
      return null;
    }
    console.error('❌ Failed to select archive file:', error);
    throw error;
  }
}

/**
 * Проверить поддержку File System Access API
 */
export function isArchiveDiskSupported(): boolean {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

