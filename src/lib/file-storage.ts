/**
 * @file: file-storage.ts
 * @description: Сохранение изображений на диск пользователя через File System Access API
 * @dependencies: File System Access API
 * @created: 2025-01-XX
 */
// @ts-nocheck
// File System Access API types are not fully supported in TypeScript yet
// This file uses @ts-nocheck to disable type checking

// Интерфейсы для File System Access API
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: any): Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  // @ts-ignore - File System Access API types (resolve may not be in all browsers)
  resolve(possibleDescendant: FileSystemHandle | undefined): Promise<string[] | null>;
  // @ts-ignore - File System Access API types
  queryPermission?(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  // @ts-ignore - File System Access API types
  requestPermission?(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

// Расширяем глобальный интерфейс Window
declare global {
  interface Window {
    // @ts-expect-error - File System Access API types not in TypeScript yet
    showSaveFilePicker?(options?: any): Promise<FileSystemFileHandle>;
    // @ts-expect-error - File System Access API types not in TypeScript yet
    showDirectoryPicker?(options?: any): Promise<FileSystemDirectoryHandle>;
    // @ts-expect-error - File System Access API types not in TypeScript yet
    showOpenFilePicker?(options?: any): Promise<FileSystemFileHandle[]>;
  }
}

/**
 * Сохранить изображение на диск пользователя
 * @param imageDataUrl - Data URL изображения
 * @param fileName - Имя файла (без расширения)
 * @param mimeType - MIME type (например, 'image/webp')
 * @returns Promise с FileSystemFileHandle или null если пользователь отменил
 */
export async function saveImageToDisk(
  imageDataUrl: string,
  fileName: string,
  mimeType: string = 'image/webp'
): Promise<FileSystemFileHandle | null> {
  // Проверяем поддержку File System Access API
  if (!('showSaveFilePicker' in window)) {
    console.warn('File System Access API not supported');
    return null;
  }

  try {
    // Конвертируем data URL в Blob
    const parts = imageDataUrl.split(',');
    const base64Part = parts[1];
    
    if (!base64Part) {
      throw new Error('Invalid data URL format');
    }
    
    const binaryString = atob(base64Part);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });

    // Определяем расширение файла из MIME type
    const mimeParts = mimeType.split('/');
    const extensionPart = mimeParts[1];
    const extension = extensionPart ?? 'webp';

    // Показываем диалог сохранения
    if (!window.showSaveFilePicker) {
      throw new Error('showSaveFilePicker is not available');
    }
    // @ts-expect-error - File System Access API
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `${fileName}.${extension}`,
      types: [
        {
          description: 'Image files',
          accept: {
            // @ts-expect-error - dynamic property
            [mimeType]: [`.${extension}`],
          },
        },
      ],
    });

    // Записываем файл
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    return fileHandle;
  } catch (error: any) {
    // Пользователь отменил диалог
    if (error.name === 'AbortError') {
      return null;
    }
    console.error('Failed to save image to disk:', error);
    throw error;
  }
}

/**
 * Сохранить несколько изображений в папку
 * @param images - Массив объектов { dataUrl, fileName, mimeType }
 * @returns Promise с массивом FileSystemFileHandle или null
 */
export async function saveImagesToFolder(
  images: Array<{ dataUrl: string; fileName: string; mimeType?: string }>
): Promise<Array<FileSystemFileHandle | null>> {
  if (!('showDirectoryPicker' in window)) {
    console.warn('File System Access API not supported');
    return [];
  }

  try {
    // Показываем диалог выбора папки
    if (!window.showDirectoryPicker) {
      throw new Error('showDirectoryPicker is not available');
    }
    // @ts-expect-error - File System Access API
    const directoryHandle = await window.showDirectoryPicker();

    const results: Array<FileSystemFileHandle | null> = [];

    for (const image of images) {
      try {
        const mimeType = image.mimeType || 'image/webp';
        const mimeParts = mimeType.split('/');
        const extensionPart = mimeParts[1];
        const extension: string = extensionPart ?? 'webp';
        const fileName: string = `${image.fileName}.${extension}`;

        // Создаем файл в выбранной папке
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });

        // Конвертируем data URL в Blob
        if (!image.dataUrl) {
          throw new Error('Invalid data URL: dataUrl is undefined');
        }
        const parts = image.dataUrl.split(',');
        const base64Part = parts[1];
        
        if (!base64Part) {
          throw new Error('Invalid data URL format');
        }
        
        const binaryString = atob(base64Part);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });

        // Записываем файл
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        results.push(fileHandle);
      } catch (error) {
        console.error(`Failed to save image ${image.fileName}:`, error);
        results.push(null);
      }
    }

    return results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Failed to save images to folder:', error);
    throw error;
  }
}

/**
 * Получить разрешение на доступ к папке для постоянного хранения
 * @param directoryHandle - FileSystemDirectoryHandle
 * @returns Promise с boolean (true если разрешение получено)
 */
export async function requestPersistentAccess(
  directoryHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    // Проверяем текущее разрешение (если метод доступен)
    // @ts-expect-error - queryPermission не в типах TypeScript
    if ('queryPermission' in directoryHandle && typeof directoryHandle.queryPermission === 'function') {
      // @ts-expect-error - queryPermission не в типах TypeScript
      const permissionStatus = await directoryHandle.queryPermission({ mode: 'readwrite' });

      if (permissionStatus === 'granted') {
        return true;
      }

      // Запрашиваем разрешение (если метод доступен)
      // @ts-expect-error - requestPermission не в типах TypeScript
      if ('requestPermission' in directoryHandle && typeof directoryHandle.requestPermission === 'function') {
        // @ts-expect-error - requestPermission не в типах TypeScript
        const newPermissionStatus = await directoryHandle.requestPermission({ mode: 'readwrite' });
        return newPermissionStatus === 'granted';
      }
    }
    // Если методы недоступны, считаем что разрешение есть (для совместимости)
    return true;
  } catch (error) {
    console.error('Failed to request persistent access:', error);
    return false;
  }
}

/**
 * Сохранить изображения заметки в выбранную папку
 * @param _noteId - ID заметки (не используется, но оставлен для совместимости API)
 * @param noteTitle - Название заметки
 * @param imageDataUrls - Массив data URL изображений
 * @returns Promise с количеством сохраненных файлов
 */
export async function saveNoteImagesToFolder(
  _noteId: string,
  noteTitle: string,
  imageDataUrls: string[]
): Promise<number> {
  void _noteId; // Reserved for future use
  if (!('showDirectoryPicker' in window)) {
    console.warn('File System Access API not supported');
    return 0;
  }

  try {
    if (!window.showDirectoryPicker) {
      throw new Error('showDirectoryPicker is not available');
    }
    // @ts-expect-error - File System Access API
    const directoryHandle = await window.showDirectoryPicker();

    // Запрашиваем постоянный доступ
    await requestPersistentAccess(directoryHandle);

    let savedCount = 0;

    for (let i = 0; i < imageDataUrls.length; i++) {
      try {
        const dataUrl = imageDataUrls[i];
        if (!dataUrl || typeof dataUrl !== 'string') {
          continue;
        }
        const fileName = `${noteTitle}-image-${i + 1}`;
        const mimeTypeMatch = dataUrl.match(/data:image\/([^;]+)/);
        const mimeTypePart = mimeTypeMatch?.[1];
        const mimeType: string = mimeTypePart ?? 'webp';

        // Определяем расширение
        const extension: string = mimeType === 'jpeg' ? 'jpg' : mimeType;

        // Создаем файл
        const fileHandle = await directoryHandle.getFileHandle(
          `${fileName}.${extension}`,
          { create: true }
        );

        // Конвертируем и записываем
        const parts = dataUrl.split(',');
        const base64Part = parts[1];
        
        if (!base64Part) {
          throw new Error('Invalid data URL format');
        }
        
        const binaryString = atob(base64Part);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        const blob = new Blob([bytes], { type: `image/${mimeType}` });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        savedCount++;
      } catch (error) {
        console.error(`Failed to save image ${i + 1}:`, error);
      }
    }

    return savedCount;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return 0;
    }
    console.error('Failed to save note images to folder:', error);
    throw error;
  }
}

/**
 * Проверить поддержку File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window && 'showDirectoryPicker' in window;
}
