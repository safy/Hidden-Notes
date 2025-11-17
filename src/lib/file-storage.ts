/**
 * @file: file-storage.ts
 * @description: Сохранение изображений на диск пользователя через File System Access API
 * @dependencies: File System Access API
 * @created: 2025-01-XX
 */

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
    const base64 = imageDataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });

    // Определяем расширение файла из MIME type
    const extension = mimeType.split('/')[1] || 'webp';

    // Показываем диалог сохранения
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `${fileName}.${extension}`,
      types: [
        {
          description: 'Image files',
          accept: {
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
    const directoryHandle = await window.showDirectoryPicker();

    const results: Array<FileSystemFileHandle | null> = [];

    for (const image of images) {
      try {
        const mimeType = image.mimeType || 'image/webp';
        const extension = mimeType.split('/')[1] || 'webp';
        const fileName = `${image.fileName}.${extension}`;

        // Создаем файл в выбранной папке
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });

        // Конвертируем data URL в Blob
        const base64 = image.dataUrl.split(',')[1];
        const binaryString = atob(base64);
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
    // Проверяем текущее разрешение
    const permissionStatus = await directoryHandle.queryPermission({ mode: 'readwrite' });

    if (permissionStatus === 'granted') {
      return true;
    }

    // Запрашиваем разрешение
    const newPermissionStatus = await directoryHandle.requestPermission({ mode: 'readwrite' });
    return newPermissionStatus === 'granted';
  } catch (error) {
    console.error('Failed to request persistent access:', error);
    return false;
  }
}

/**
 * Сохранить изображения заметки в выбранную папку
 * @param noteId - ID заметки
 * @param noteTitle - Название заметки
 * @param imageDataUrls - Массив data URL изображений
 * @returns Promise с количеством сохраненных файлов
 */
export async function saveNoteImagesToFolder(
  noteId: string,
  noteTitle: string,
  imageDataUrls: string[]
): Promise<number> {
  if (!('showDirectoryPicker' in window)) {
    console.warn('File System Access API not supported');
    return 0;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker();

    // Запрашиваем постоянный доступ
    await requestPersistentAccess(directoryHandle);

    let savedCount = 0;

    for (let i = 0; i < imageDataUrls.length; i++) {
      try {
        const dataUrl = imageDataUrls[i];
        const fileName = `${noteTitle}-image-${i + 1}`;
        const mimeType = dataUrl.match(/data:image\/([^;]+)/)?.[1] || 'webp';

        // Определяем расширение
        const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;

        // Создаем файл
        const fileHandle = await directoryHandle.getFileHandle(
          `${fileName}.${extension}`,
          { create: true }
        );

        // Конвертируем и записываем
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
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

