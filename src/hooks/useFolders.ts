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
} from '@/lib/storage';
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
  
  // Утилиты
  refreshFolders: () => Promise<void>;
  getFolderNotesCount: (folderId: string) => Promise<number>;
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
      
      const allFolders = await getAllFolders();
      
      // Сортируем по order
      const sortedFolders = allFolders.sort((a, b) => a.order - b.order);
      
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

  // Слушаем изменения в Chrome Storage
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.hidden_notes) {
        console.log('📦 Storage changed, reloading folders');
        loadFolders();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadFolders]);

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

  // Обновить папки вручную
  const refreshFolders = useCallback(async () => {
    await loadFolders();
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
    refreshFolders,
    getFolderNotesCount,
  };
}

