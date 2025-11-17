/**
 * @file: image-storage.ts
 * @description: Хранение больших изображений в IndexedDB вместо chrome.storage
 * @dependencies: IndexedDB API, image-compression
 * @created: 2025-01-XX
 */

import { compressImage, shouldCompressImage } from './image-compression';

const IMAGE_DB_NAME = 'HiddenNotesImages';
const IMAGE_DB_VERSION = 1;
const IMAGE_STORE_NAME = 'images';

// Порог размера для хранения в IndexedDB (500KB)
const INDEXEDDB_THRESHOLD = 500 * 1024;

/**
 * Инициализация IndexedDB для изображений
 */
function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);
    
    request.onerror = () => {
      reject(new Error('Failed to open Image IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        const store = db.createObjectStore(IMAGE_STORE_NAME, { 
          keyPath: 'id'
        });
        
        // Индекс для поиска по noteId
        store.createIndex('noteId', 'noteId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Сохранить изображение в IndexedDB и вернуть ссылку
 * @param imageDataUrl - Data URL изображения
 * @param noteId - ID заметки, к которой относится изображение
 * @param imageId - Уникальный ID изображения (генерируется автоматически если не указан)
 * @returns ID изображения для использования в HTML как data-image-id="..."
 */
export async function saveImageToIndexedDB(
  imageDataUrl: string,
  noteId: string,
  imageId?: string
): Promise<string> {
  const id = imageId || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    const db = await openImageDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    
    const imageData = {
      id,
      noteId,
      dataUrl: imageDataUrl,
      timestamp: Date.now(),
      size: getDataUrlSize(imageDataUrl),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(imageData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return id;
  } catch (error) {
    console.error('Failed to save image to IndexedDB:', error);
    throw error;
  }
}

/**
 * Получить изображение из IndexedDB по ID
 */
export async function getImageFromIndexedDB(imageId: string): Promise<string | null> {
  try {
    const db = await openImageDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    
    const imageData = await new Promise<any>((resolve, reject) => {
      const request = store.get(imageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return imageData?.dataUrl || null;
  } catch (error) {
    console.error('Failed to get image from IndexedDB:', error);
    return null;
  }
}

/**
 * Удалить изображение из IndexedDB
 */
export async function deleteImageFromIndexedDB(imageId: string): Promise<void> {
  try {
    const db = await openImageDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Failed to delete image from IndexedDB:', error);
  }
}

/**
 * Удалить все изображения для заметки
 */
export async function deleteImagesForNote(noteId: string): Promise<void> {
  try {
    const db = await openImageDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const index = store.index('noteId');
    
    const request = index.openCursor(IDBKeyRange.only(noteId));
    
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Failed to delete images for note:', error);
  }
}

/**
 * Обработать изображение: сжать и сохранить в IndexedDB если нужно
 * @param file - Файл изображения
 * @param noteId - ID заметки
 * @returns Data URL или ссылка на IndexedDB
 */
export async function processImageForStorage(
  file: File,
  noteId: string
): Promise<{ dataUrl: string; useIndexedDB: boolean; imageId?: string }> {
  // Всегда сжимаем изображение
  const compressedDataUrl = await compressImage(file);
  const size = getDataUrlSize(compressedDataUrl);
  
  // Если размер после сжатия всё ещё большой, сохраняем в IndexedDB
  if (size > INDEXEDDB_THRESHOLD) {
    const imageId = await saveImageToIndexedDB(compressedDataUrl, noteId);
    // Возвращаем placeholder вместо полного data URL
    return {
      dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><text>Loading...</text></svg>`,
      useIndexedDB: true,
      imageId,
    };
  }
  
  // Маленькие изображения храним прямо в HTML
  return {
    dataUrl: compressedDataUrl,
    useIndexedDB: false,
  };
}

/**
 * Загрузить изображение для отображения (из IndexedDB если нужно)
 */
export async function loadImageForDisplay(
  src: string,
  noteId: string
): Promise<string> {
  // Проверяем, это ссылка на IndexedDB или обычный data URL
  if (src.startsWith('data:image/svg+xml') && src.includes('Loading...')) {
    // Это placeholder, нужно загрузить из IndexedDB
    // Извлекаем imageId из атрибута data-image-id в HTML
    // (это будет обрабатываться в компоненте)
    return src;
  }
  
  // Обычный data URL
  return src;
}

/**
 * Получить размер data URL в байтах
 */
function getDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  return (base64.length * 3) / 4;
}

/**
 * Получить статистику использования IndexedDB для изображений
 */
export async function getImageStorageStats(): Promise<{
  totalImages: number;
  totalSize: number;
  totalSizeMB: number;
}> {
  try {
    const db = await openImageDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    
    const images: any[] = [];
    const request = store.openCursor();
    
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          images.push(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
    
    return {
      totalImages: images.length,
      totalSize,
      totalSizeMB: totalSize / (1024 * 1024),
    };
  } catch (error) {
    console.error('Failed to get image storage stats:', error);
    return { totalImages: 0, totalSize: 0, totalSizeMB: 0 };
  }
}

