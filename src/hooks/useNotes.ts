/**
 * @file: useNotes.ts
 * @description: React hook для управления состоянием заметок и синхронизацией с storage
 * @dependencies: React, storage utilities, types/note
 * @created: 2025-10-17
 */

import { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { getAllNotes, createNote, updateNote, deleteNote, initializeStorage, restoreNote } from '@/lib/storage';
import { restoreFromTrash, listTrashedNotes } from '@/lib/data-protection';
import { htmlToText } from '@/lib/utils';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Инициализация storage и загрузка заметок
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        await initializeStorage();
        const loadedNotes = await getAllNotes();
        setNotes(loadedNotes);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notes');
        console.error('Error loading notes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();

    // Подписка на изменения storage из других окон/вкладок
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'local' && changes.hidden_notes) {
        const newSchema = changes.hidden_notes.newValue;
        setNotes(newSchema?.notes || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Добавить новую заметку
  const addNote = useCallback(async (title: string = 'Новая заметка', folderId?: string | null): Promise<Note | null> => {
    try {
      const newNote: Note = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title,
        content: '',
        folderId: folderId || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const savedNote = await createNote(newNote);
      // Не обновляем локальное состояние здесь, так как onChanged слушатель
      // уже синхронизирует состояние из chrome.storage и предотвращает дублирование
      return savedNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      return null;
    }
  }, []);

  // Обновить заметку
  const updateNoteContent = useCallback(async (
    noteId: string,
    updates: Partial<Note>
  ): Promise<Note | null> => {
    try {
      const updatedNote = await updateNote(noteId, updates);
      if (updatedNote) {
        setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      }
      return updatedNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      return null;
    }
  }, []);

  // Удалить заметку
  const removeNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      const success = await deleteNote(noteId);
      if (success) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      return false;
    }
  }, []);

  // Поиск заметок по названию и контенту
  const searchNotes = useCallback((query: string): Note[] => {
    if (!query.trim()) return notes;

    const lowerQuery = query.toLowerCase();
    return notes.filter(note => {
      const titleMatch = note.title.toLowerCase().includes(lowerQuery);
      // Extract text from HTML content for searching
      const plainContent = htmlToText(note.content);
      const contentMatch = plainContent.toLowerCase().includes(lowerQuery);
      return titleMatch || contentMatch;
    });
  }, [notes]);

  // Получить заметку по ID
  const getNoteById = useCallback((noteId: string): Note | undefined => {
    return notes.find(n => n.id === noteId);
  }, [notes]);

  // Обновить список заметок
  const refreshNotes = useCallback(async () => {
    try {
      const loadedNotes = await getAllNotes();
      setNotes(loadedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh notes');
      console.error('Error refreshing notes:', err);
    }
  }, []);

  // Восстановить заметку из корзины
  const restoreNoteFromTrash = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      setError(null);
      const restoredNote = await restoreFromTrash(noteId);
      
      if (restoredNote) {
        // Восстанавливаем заметку в storage используя storageLock
        const success = await restoreNote(restoredNote);
        if (success) {
          await refreshNotes();
        }
        return success;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore note from trash');
      console.error('❌ Error restoring note from trash:', err);
      return false;
    }
  }, [refreshNotes]);

  // Окончательно удалить заметку из корзины
  const permanentlyDeleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      setError(null);
      const trashedNotes = await listTrashedNotes();
      const noteToDelete = trashedNotes.find(n => n.id === noteId);
      
      if (!noteToDelete) return false;
      
      // Удаляем из корзины
      const deletedData = await chrome.storage.local.get('hidden_notes_deleted');
      const deletedNotes = deletedData.hidden_notes_deleted || [];
      const filteredNotes = deletedNotes.filter((n: any) => n.id !== noteId);
      await chrome.storage.local.set({ hidden_notes_deleted: filteredNotes });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to permanently delete note');
      console.error('❌ Error permanently deleting note:', err);
      return false;
    }
  }, []);

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNoteContent,
    removeNote,
    searchNotes,
    getNoteById,
    refreshNotes,
    restoreNoteFromTrash,
    permanentlyDeleteNote,
  };
}
