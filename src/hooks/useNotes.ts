/**
 * @file: useNotes.ts
 * @description: React hook для управления состоянием заметок и синхронизацией с storage
 * @dependencies: React, storage utilities, types/note
 * @created: 2025-10-17
 */

import { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { getAllNotes, createNote, updateNote, deleteNote, initializeStorage } from '@/lib/storage';

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
  const addNote = useCallback(async (title: string = 'Новая заметка'): Promise<Note | null> => {
    try {
      const newNote: Note = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title,
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const savedNote = await createNote(newNote);
      setNotes(prev => [...prev, savedNote]);
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
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }, [notes]);

  // Получить заметку по ID
  const getNoteById = useCallback((noteId: string): Note | undefined => {
    return notes.find(n => n.id === noteId);
  }, [notes]);

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNoteContent,
    removeNote,
    searchNotes,
    getNoteById,
  };
}
