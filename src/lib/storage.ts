/**
 * @file: storage.ts
 * @description: Абстракция над Chrome Storage API для CRUD операций с заметками
 * @dependencies: Chrome Extension Storage API, types/note
 * @created: 2025-10-17
 */

import { Note, StorageSchema } from '@/types/note';

const STORAGE_KEY = 'hidden_notes';
const SCHEMA_VERSION = 1;

/**
 * Инициализировать storage с начальной схемой
 */
export async function initializeStorage(): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  
  if (!data[STORAGE_KEY]) {
    const initialSchema: StorageSchema = {
      version: SCHEMA_VERSION,
      notes: [],
      settings: {
        theme: 'light',
        fontSize: 16,
        autoSaveInterval: 1000,
      },
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
export async function createNote(note: Note): Promise<Note> {
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
export async function updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  const noteIndex = schema.notes.findIndex(note => note.id === noteId);
  if (noteIndex === -1) return null;
  
  const updatedNote: Note = {
    ...schema.notes[noteIndex],
    ...updates,
    updatedAt: Date.now(),
  };
  
  schema.notes[noteIndex] = updatedNote;
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  return updatedNote;
}

/**
 * Удалить заметку
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  const initialLength = schema.notes.length;
  schema.notes = schema.notes.filter(note => note.id !== noteId);
  
  if (schema.notes.length === initialLength) return false;
  
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
    const importedNotes = JSON.parse(jsonString) as Note[];
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const schema = data[STORAGE_KEY] as StorageSchema;
    
    // Генерируем новые IDs для импортированных заметок
    const notesWithNewIds = importedNotes.map(note => ({
      ...note,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    
    schema.notes.push(...notesWithNewIds);
    await chrome.storage.local.set({ [STORAGE_KEY]: schema });
    
    return notesWithNewIds.length;
  } catch (error) {
    console.error('Error importing notes:', error);
    return 0;
  }
}
