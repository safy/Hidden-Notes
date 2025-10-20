/**
 * @file: storage.ts
 * @description: Абстракция над Chrome Storage API для CRUD операций с заметками
 * @dependencies: Chrome Extension Storage API, types/note, data-protection
 * @created: 2025-10-17
 * @updated: 2025-10-20 - Добавлена интеграция с системой защиты данных
 */

import { Note, StorageSchema, DEFAULT_SETTINGS } from '@/types/note';
import { saveNoteVersion, moveToTrash } from './data-protection';

const STORAGE_KEY = 'hidden_notes';

/**
 * Инициализировать storage с начальной схемой
 */
export async function initializeStorage(): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  
  if (!data[STORAGE_KEY]) {
    const initialSchema: StorageSchema = {
      notes: [],
      settings: DEFAULT_SETTINGS,
      currentNoteId: null,
    };
    
    await chrome.storage.local.set({ [STORAGE_KEY]: initialSchema });
  }
}

/**
 * Получить все заметки из storage
 */
export async function getAllNotes(): Promise<Note[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  return schema?.notes || [];
}

/**
 * Получить конкретную заметку по ID
 */
export async function getNoteById(noteId: string): Promise<Note | null> {
  const notes = await getAllNotes();
  return notes.find(note => note.id === noteId) || null;
}

/**
 * Создать новую заметку
 */
export async function createNote(note: Omit<Note, 'createdAt' | 'updatedAt'>): Promise<Note> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  const newNote: Note = {
    ...note,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  schema.notes.push(newNote);
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  return newNote;
}

/**
 * Обновить заметку
 */
export async function updateNote(noteId: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | null> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  const noteIndex = schema.notes.findIndex(note => note.id === noteId);
  if (noteIndex === -1) return null;
  
  const existingNote = schema.notes[noteIndex];
  if (!existingNote) return null;
  
  const updatedNote: Note = {
    id: existingNote.id,
    title: updates.title ?? existingNote.title,
    content: updates.content ?? existingNote.content,
    createdAt: existingNote.createdAt,
    updatedAt: Date.now(),
    tags: updates.tags ?? existingNote.tags,
    isPinned: updates.isPinned ?? existingNote.isPinned,
  };
  
  schema.notes[noteIndex] = updatedNote;
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  // Сохраняем версию заметки для истории
  await saveNoteVersion(updatedNote);
  
  return updatedNote;
}

/**
 * Удалить заметку (soft delete - перемещение в корзину)
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  const noteIndex = schema.notes.findIndex(note => note.id === noteId);
  if (noteIndex === -1) return false;
  
  const noteToDelete = schema.notes[noteIndex];
  if (!noteToDelete) return false;
  
  // Перемещаем в корзину вместо полного удаления
  await moveToTrash(noteToDelete);
  
  // Удаляем из основного хранилища
  schema.notes = schema.notes.filter(note => note.id !== noteId);
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  return true;
}

/**
 * Получить статистику использования storage
 */
export async function getStorageStats(): Promise<{
  usedBytes: number;
  totalBytes: number;
  percentUsed: number;
  notesCount: number;
}> {
  const bytesInUse = await chrome.storage.local.getBytesInUse(null);
  const totalBytes = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB по умолчанию
  const notes = await getAllNotes();
  
  return {
    usedBytes: bytesInUse,
    totalBytes,
    percentUsed: (bytesInUse / totalBytes) * 100,
    notesCount: notes.length,
  };
}

/**
 * Экспортировать все заметки в JSON
 */
export async function exportNotes(): Promise<string> {
  const notes = await getAllNotes();
  return JSON.stringify(notes, null, 2);
}

/**
 * Импортировать заметки из JSON
 */
export async function importNotes(jsonString: string): Promise<number> {
  try {
    const importedNotes = JSON.parse(jsonString) as Array<{
      id: string;
      title: string;
      content: string;
      createdAt?: number;
      updatedAt?: number;
      tags?: string[];
      isPinned?: boolean;
    }>;
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const schema = data[STORAGE_KEY] as StorageSchema;
    
    // Генерируем новые IDs для импортированных заметок
    const notesWithNewIds: Note[] = importedNotes.map(note => {
      const newNote: Note = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: note.title || 'Импортированная заметка',
        content: note.content || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (note.tags) newNote.tags = note.tags;
      if (note.isPinned) newNote.isPinned = note.isPinned;
      return newNote;
    });
    
    schema.notes.push(...notesWithNewIds);
    await chrome.storage.local.set({ [STORAGE_KEY]: schema });
    
    return notesWithNewIds.length;
  } catch (error) {
    console.error('Error importing notes:', error);
    return 0;
  }
}
