/**
 * @file: useFolders.ts
 * @description: React hook для управления папками
 * @dependencies: storage.ts, types/folder
 * @created: 2025-10-21
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderStats,
  reorderFolders,
  toggleFolderArchive,
  restoreFolder,
} from '@/lib/storage';
import { restoreFolderFromTrash } from '@/lib/data-protection';
import { Folder, CreateFolderInput, UpdateFolderInput } from '@/types/folder';

export interface UseFoldersReturn {
  folders: Folder[];
  currentFolderId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // CRUD операции
  createNewFolder: (input: CreateFolderInput) => Promise<Folder | null>;
  updateExistingFolder: (id: string, updates: UpdateFolderInput) => Promise<Folder | null>;
  deleteExistingFolder: (id: string, moveNotesTo?: string | null) => Promise<boolean>;
  
  // Навигация
  setCurrentFolder: (folderId: string | null) => void;
  getFolderDetails: (folderId: string) => Promise<Folder | null>;
  
  // Drag & Drop
  reorderFoldersHandler: (folderId: string, newOrder: number) => Promise<boolean>;
  
  // Утилиты
  refreshFolders: () => Promise<void>;
  getFolderNotesCount: (folderId: string) => Promise<number>;
  
  // Архив
  archiveFolder: (folderId: string) => Promise<boolean>;
  unarchiveFolder: (folderId: string) => Promise<boolean>;
  
  // Корзина
  restoreFolderFromTrash: (folderId: string) => Promise<boolean>;
}

/**
 * Hook для управления папками
 */
export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка папок при монтировании
  const loadFolders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Принудительно читаем из storage без кэша
      const allFolders = await getAllFolders();
      
      // Сортируем по order
      const sortedFolders = allFolders.sort((a, b) => a.order - b.order);
      
      console.log('📂 loadFolders: loaded', sortedFolders.length, 'active folders', 
        sortedFolders.map(f => ({ id: f.id.slice(-6), name: f.name, isArchived: f.isArchived })));
      
      setFolders(sortedFolders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load folders';
      setError(message);
      console.error('❌ Error loading folders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Слушаем изменения в Chrome Storage с debounce
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.hidden_notes) {
        console.log('📦 Storage changed, reloading folders');
        
        // Очищаем предыдущий таймаут
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Debounce: ждем 50ms перед перезагрузкой (уменьшено с 100ms для более быстрой реакции)
        // Это помогает избежать множественных обновлений, но не слишком задерживает UI
        timeoutId = setTimeout(() => {
          loadFolders();
        }, 50);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loadFolders]);

  // Проверяем, что currentFolderId указывает на существующую папку
  useEffect(() => {
    if (currentFolderId !== null && folders.length > 0) {
      const folderExists = folders.some(f => f.id === currentFolderId);
      if (!folderExists) {
        console.log('📁 Current folder not found, switching to root');
        setCurrentFolderId(null);
      }
    }
  }, [folders, currentFolderId]);

  // Создать новую папку
  const createNewFolder = useCallback(async (input: CreateFolderInput): Promise<Folder | null> => {
    try {
      setError(null);
      const newFolder = await createFolder(input);
      await loadFolders(); // Перезагружаем список
      return newFolder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create folder';
      setError(message);
      console.error('❌ Error creating folder:', err);
      return null;
    }
  }, [loadFolders]);

  // Обновить папку
  const updateExistingFolder = useCallback(
    async (id: string, updates: UpdateFolderInput): Promise<Folder | null> => {
      try {
        setError(null);
        const updatedFolder = await updateFolder(id, updates);
        await loadFolders(); // Перезагружаем список
        return updatedFolder;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update folder';
        setError(message);
        console.error('❌ Error updating folder:', err);
        return null;
      }
    },
    [loadFolders]
  );

  // Удалить папку
  const deleteExistingFolder = useCallback(
    async (id: string, moveNotesTo?: string | null): Promise<boolean> => {
      try {
        setError(null);
        const success = await deleteFolder(id, moveNotesTo);
        
        if (success) {
          // Если удалили текущую папку, сбрасываем
          if (currentFolderId === id) {
            setCurrentFolderId(null);
          }
          await loadFolders();
        }
        
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete folder';
        setError(message);
        console.error('❌ Error deleting folder:', err);
        return false;
      }
    },
    [currentFolderId, loadFolders]
  );

  // Получить детали папки
  const getFolderDetails = useCallback(async (folderId: string): Promise<Folder | null> => {
    try {
      return await getFolderById(folderId);
    } catch (err) {
      console.error('❌ Error getting folder details:', err);
      return null;
    }
  }, []);

  // Получить количество заметок в папке
  const getFolderNotesCount = useCallback(async (folderId: string): Promise<number> => {
    try {
      const stats = await getFolderStats(folderId);
      return stats.notesCount;
    } catch (err) {
      console.error('❌ Error getting folder notes count:', err);
      return 0;
    }
  }, []);

  // Изменить порядок папок (drag & drop)
  const reorderFoldersHandler = useCallback(
    async (folderId: string, newOrder: number): Promise<boolean> => {
      try {
        setError(null);
        const success = await reorderFolders(folderId, newOrder);
        
        if (success) {
          await loadFolders();
        }
        
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reorder folders';
        setError(message);
        console.error('❌ Error reordering folders:', err);
        return false;
      }
    },
    [loadFolders]
  );

  // Обновить папки вручную
  const refreshFolders = useCallback(async () => {
    await loadFolders();
  }, [loadFolders]);

  // Архивировать папку
  const archiveFolder = useCallback(async (folderId: string): Promise<boolean> => {
    try {
      setError(null);
      const folder = await getFolderById(folderId);
      if (!folder || folder.isArchived) {
        console.log('⚠️ Folder already archived or not found:', folderId);
        return false;
      }
      
      console.log('📥 Archiving folder:', folderId, folder.name);
      const success = await toggleFolderArchive(folderId);
      
      if (success) {
        // Если заархивировали текущую папку, переключаемся на корень
        if (currentFolderId === folderId) {
          setCurrentFolderId(null);
        }
        
        // Даем storage время обновиться перед перезагрузкой (увеличено до 150ms)
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Принудительно перезагружаем папки
        await loadFolders();
        
        // Дополнительная проверка: убеждаемся, что папка исчезла из списка
        const verifyFolders = await getAllFolders();
        const folderStillExists = verifyFolders.some(f => f.id === folderId && !f.isArchived);
        
        if (folderStillExists) {
          console.warn('⚠️ Folder still visible after archive, reloading again...');
          await new Promise(resolve => setTimeout(resolve, 100));
          await loadFolders();
        }
        
        console.log('✅ Folder archived, folders reloaded');
      } else {
        console.error('❌ Failed to archive folder:', folderId);
      }
      
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive folder';
      setError(message);
      console.error('❌ Error archiving folder:', err);
      return false;
    }
  }, [currentFolderId, loadFolders]);

  // Разархивировать папку
  const unarchiveFolder = useCallback(async (folderId: string): Promise<boolean> => {
    try {
      setError(null);
      const folder = await getFolderById(folderId);
      if (!folder || !folder.isArchived) {
        console.log('⚠️ Folder not archived or not found:', folderId);
        return false;
      }
      
      console.log('📤 Unarchiving folder:', folderId, folder.name);
      const success = await toggleFolderArchive(folderId);
      
      if (success) {
        // Даем storage время обновиться перед перезагрузкой
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Принудительно перезагружаем папки
        await loadFolders();
        
        console.log('✅ Folder unarchived, folders reloaded');
      } else {
        console.error('❌ Failed to unarchive folder:', folderId);
      }
      
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unarchive folder';
      setError(message);
      console.error('❌ Error unarchiving folder:', err);
      return false;
    }
  }, [loadFolders]);

  // Восстановить папку из корзины
  const restoreFolderFromTrashHandler = useCallback(async (folderId: string): Promise<boolean> => {
    try {
      setError(null);
      const restoredFolderData = await restoreFolderFromTrash(folderId);
      
      if (restoredFolderData) {
        // Восстанавливаем папку в storage используя storageLock
        const success = await restoreFolder(restoredFolderData);
        if (success) {
          await loadFolders();
        }
        return success;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore folder from trash';
      setError(message);
      console.error('❌ Error restoring folder from trash:', err);
      return false;
    }
  }, [loadFolders]);

  return {
    folders,
    currentFolderId,
    isLoading,
    error,
    createNewFolder,
    updateExistingFolder,
    deleteExistingFolder,
    setCurrentFolder: setCurrentFolderId,
    getFolderDetails,
    reorderFoldersHandler,
    refreshFolders,
    getFolderNotesCount,
    archiveFolder,
    unarchiveFolder,
    restoreFolderFromTrash: restoreFolderFromTrashHandler,
  };
}

