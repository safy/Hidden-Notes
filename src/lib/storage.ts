/**
 * @file: storage.ts
 * @description: Абстракция над Chrome Storage API для CRUD операций с заметками и папками
 * @dependencies: Chrome Extension Storage API, types/note, types/folder, data-protection
 * @created: 2025-10-17
 * @updated: 2025-10-21 - Добавлена поддержка папок и архива
 */

import { Note, StorageSchema, DEFAULT_SETTINGS, UpdateNoteInput } from '@/types/note';
import { Folder, createFolder as createFolderHelper, CreateFolderInput, UpdateFolderInput } from '@/types/folder';
import { saveNoteVersion, moveToTrash } from './data-protection';

const STORAGE_KEY = 'hidden_notes';
const SCHEMA_VERSION = 2; // Увеличена версия для поддержки папок

/**
 * Инициализировать storage с начальной схемой
 */
export async function initializeStorage(): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  
  if (!data[STORAGE_KEY]) {
    const initialSchema: StorageSchema = {
      version: SCHEMA_VERSION,
      notes: [],
      folders: [],
      settings: DEFAULT_SETTINGS,
      currentNoteId: null,
      currentFolderId: null,
    };
    
    await chrome.storage.local.set({ [STORAGE_KEY]: initialSchema });
  } else {
    // Миграция старой схемы если необходимо
    await migrateStorageSchema(data[STORAGE_KEY]);
  }
}

/**
 * Миграция схемы данных при обновлении
 */
async function migrateStorageSchema(schema: any): Promise<void> {
  const currentVersion = schema.version || 1;
  
  if (currentVersion < SCHEMA_VERSION) {
    console.log(`🔄 Migrating storage from v${currentVersion} to v${SCHEMA_VERSION}`);
    
    // Миграция v1 → v2: добавление папок
    if (currentVersion === 1 || !schema.version) {
      schema.version = 2;
      schema.folders = schema.folders || [];
      schema.currentFolderId = null;
      
      // Обновляем все заметки - добавляем новые поля
      schema.notes = schema.notes.map((note: Note) => ({
        ...note,
        folderId: note.folderId || null,
        isArchived: note.isArchived || false,
        order: note.order || 0,
      }));
      
      await chrome.storage.local.set({ [STORAGE_KEY]: schema });
      console.log('✅ Migration completed: added folders support');
    }
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
    color: updates.color ?? existingNote.color,
    createdAt: existingNote.createdAt,
    updatedAt: Date.now(),
    tags: updates.tags ?? existingNote.tags,
    isPinned: updates.isPinned ?? existingNote.isPinned,
    folderId: updates.folderId ?? existingNote.folderId,
    isArchived: updates.isArchived ?? existingNote.isArchived,
    archivedAt: updates.archivedAt ?? existingNote.archivedAt,
    order: updates.order ?? existingNote.order,
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

// ============================================================
// FOLDERS CRUD OPERATIONS
// ============================================================

/**
 * Получить все папки из storage
 */
export async function getAllFolders(): Promise<Folder[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  return schema?.folders || [];
}

/**
 * Получить папку по ID
 */
export async function getFolderById(folderId: string): Promise<Folder | null> {
  const folders = await getAllFolders();
  return folders.find(f => f.id === folderId) || null;
}

/**
 * Создать новую папку
 */
export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  // Если order не указан, ставим в конец
  if (input.order === undefined) {
    const maxOrder = schema.folders.reduce((max, f) => Math.max(max, f.order), -1);
    input.order = maxOrder + 1;
  }
  
  const newFolder = createFolderHelper(input);
  schema.folders.push(newFolder);
  
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  console.log('📁 Folder created:', newFolder.name, newFolder.id);
  return newFolder;
}

/**
 * Обновить папку
 */
export async function updateFolder(
  folderId: string,
  updates: UpdateFolderInput
): Promise<Folder | null> {
  console.log('updateFolder called:', { folderId, updates });
  
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  console.log('Current schema folders:', schema.folders.map(f => ({ id: f.id, name: f.name })));
  
  const folderIndex = schema.folders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    console.error('❌ Folder not found:', folderId);
    return null;
  }
  
  // Обновляем только разрешенные поля (сохраняя обязательные)
  const currentFolder = schema.folders[folderIndex];
  if (!currentFolder) {
    console.error('❌ Folder unexpectedly undefined');
    return null;
  }
  
  console.log('Current folder:', currentFolder);
  
  schema.folders[folderIndex] = {
    id: currentFolder.id,
    name: updates.name ?? currentFolder.name,
    color: updates.color ?? currentFolder.color,
    icon: updates.icon ?? currentFolder.icon,
    parentId: updates.parentId !== undefined ? updates.parentId : currentFolder.parentId,
    isExpanded: updates.isExpanded ?? currentFolder.isExpanded,
    order: updates.order ?? currentFolder.order,
    createdAt: currentFolder.createdAt,
    updatedAt: Date.now(),
  };
  
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  const updatedFolder = schema.folders[folderIndex];
  if (!updatedFolder) {
    console.error('❌ Folder unexpectedly missing after update');
    return null;
  }
  
  console.log('📁 Folder updated:', updatedFolder.name);
  return updatedFolder;
}

/**
 * Удалить папку (с опцией переноса заметок)
 */
export async function deleteFolder(
  folderId: string,
  moveNotesToFolder?: string | null
): Promise<boolean> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  const folderIndex = schema.folders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    console.error('❌ Folder not found:', folderId);
    return false;
  }
  
  // Перемещаем или удаляем заметки в папке
  const notesInFolder = schema.notes.filter(n => n.folderId === folderId);
  
  if (notesInFolder.length > 0) {
    if (moveNotesToFolder !== undefined) {
      // Перемещаем заметки в указанную папку
      schema.notes = schema.notes.map(note =>
        note.folderId === folderId
          ? { ...note, folderId: moveNotesToFolder, updatedAt: Date.now() }
          : note
      );
      console.log(`📝 Moved ${notesInFolder.length} notes to ${moveNotesToFolder || 'root'}`);
    } else {
      // Удаляем заметки вместе с папкой (перемещаем в корзину)
      for (const note of notesInFolder) {
        await moveToTrash(note);
      }
      schema.notes = schema.notes.filter(n => n.folderId !== folderId);
      console.log(`🗑️ Moved ${notesInFolder.length} notes to trash`);
    }
  }
  
  // Удаляем папку
  schema.folders.splice(folderIndex, 1);
  
  // Если это была текущая папка, сбрасываем
  if (schema.currentFolderId === folderId) {
    schema.currentFolderId = null;
  }
  
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  console.log('🗑️ Folder deleted:', folderId);
  return true;
}

/**
 * Изменить порядок папок (drag & drop)
 */
export async function reorderFolders(
  folderId: string,
  newOrder: number
): Promise<boolean> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const schema = data[STORAGE_KEY] as StorageSchema;
  
  const folderIndex = schema.folders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    console.error('❌ Folder not found:', folderId);
    return false;
  }
  
  const folder = schema.folders[folderIndex]!;
  const parentId = folder.parentId;
  
  // Получаем все папки того же уровня, отсортированные по order
  const sameLevelFolders = schema.folders
    .filter(f => f.parentId === parentId)
    .sort((a, b) => a.order - b.order);
  
  console.log('📦 Before reorder:', sameLevelFolders.map(f => ({ id: f.id.slice(-6), order: f.order })));
  
  // Находим текущую позицию папки в отсортированном массиве
  const currentIndex = sameLevelFolders.findIndex(f => f.id === folderId);
  
  if (currentIndex === -1 || newOrder < 0 || newOrder >= sameLevelFolders.length) {
    console.error('❌ Invalid reorder parameters:', { currentIndex, newOrder, length: sameLevelFolders.length });
    return false;
  }
  
  // Переставляем папку в новую позицию (arrayMove logic)
  const [movedFolder] = sameLevelFolders.splice(currentIndex, 1);
  sameLevelFolders.splice(newOrder, 0, movedFolder!);
  
  console.log('📦 After reorder:', sameLevelFolders.map(f => ({ id: f.id.slice(-6), order: f.order })));
  
  // Обновляем order для всех папок в новом порядке
  sameLevelFolders.forEach((f, index) => {
    const idx = schema.folders.findIndex(folder => folder.id === f.id);
    if (idx !== -1) {
      schema.folders[idx]!.order = index;
      schema.folders[idx]!.updatedAt = Date.now();
    }
  });
  
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
  
  console.log('📁 Folders reordered');
  return true;
}

/**
 * Получить заметки в конкретной папке
 */
export async function getNotesByFolder(folderId: string | null): Promise<Note[]> {
  const notes = await getAllNotes();
  
  // null = заметки без папки (корень)
  if (folderId === null) {
    return notes.filter(note => !note.folderId && !note.isArchived);
  }
  
  return notes.filter(note => note.folderId === folderId && !note.isArchived);
}

/**
 * Получить архивные заметки
 */
export async function getArchivedNotes(): Promise<Note[]> {
  const notes = await getAllNotes();
  return notes.filter(note => note.isArchived);
}

/**
 * Переместить заметку в папку
 */
export async function moveNoteToFolder(
  noteId: string,
  folderId: string | null
): Promise<boolean> {
  console.log('moveNoteToFolder called:', { noteId, folderId });
  
  const note = await getNoteById(noteId);
  if (!note) {
    console.error('Note not found for move:', noteId);
    return false;
  }
  
  console.log('Note before move:', { id: note.id, title: note.title, folderId: note.folderId });
  
  const result = await updateNote(noteId, { folderId });
  
  if (result) {
    console.log('Note after move:', { id: result.id, title: result.title, folderId: result.folderId });
  } else {
    console.error('Failed to update note');
  }
  
  return result !== null;
}

/**
 * Переместить заметку в архив / вернуть из архива
 */
export async function toggleNoteArchive(noteId: string): Promise<boolean> {
  const note = await getNoteById(noteId);
  if (!note) return false;
  
  const updates: UpdateNoteInput = {
    isArchived: !note.isArchived,
    archivedAt: !note.isArchived ? Date.now() : undefined,
  };
  
  const result = await updateNote(noteId, updates);
  console.log(note.isArchived ? '📤 Note unarchived' : '📥 Note archived', noteId);
  return result !== null;
}

/**
 * Получить статистику по папке
 */
export async function getFolderStats(folderId: string): Promise<{
  notesCount: number;
  archivedCount: number;
  lastUpdated: number;
}> {
  const allNotes = await getAllNotes();
  
  const folderNotes = allNotes.filter(n => n.folderId === folderId);
  const activeNotes = folderNotes.filter(n => !n.isArchived);
  const archivedNotes = folderNotes.filter(n => n.isArchived);
  
  const lastUpdated = folderNotes.length > 0
    ? Math.max(...folderNotes.map(n => n.updatedAt))
    : 0;
  
  return {
    notesCount: activeNotes.length,
    archivedCount: archivedNotes.length,
    lastUpdated,
  };
}

/**
 * Переместить папку в другую папку
 */
export async function moveFolderToFolder(
  folderId: string,
  targetFolderId: string | null
): Promise<boolean> {
  console.log('moveFolderToFolder called:', { folderId, targetFolderId });

  const folder = await getFolderById(folderId);
  if (!folder) {
    console.error('Folder not found for move:', folderId);
    return false;
  }

  // Проверяем, что не пытаемся переместить папку в саму себя или в свою дочернюю папку
  if (targetFolderId === folderId) {
    console.error('Cannot move folder into itself');
    return false;
  }

  // Проверяем циклические ссылки (папка не может быть перемещена в свою дочернюю папку)
  if (targetFolderId) {
    const targetFolder = await getFolderById(targetFolderId);
    if (targetFolder && targetFolder.parentId === folderId) {
      console.error('Cannot move folder into its own child');
      return false;
    }
    
    // Проверяем, что не пытаемся переместить папку в саму себя
    if (targetFolderId === folderId) {
      console.error('Cannot move folder into itself');
      return false;
    }
    
    // Проверяем более глубокие циклические ссылки (рекурсивно)
    const checkCircularReference = async (checkFolderId: string): Promise<boolean> => {
      const checkFolder = await getFolderById(checkFolderId);
      if (!checkFolder) return false;
      
      if (checkFolder.parentId === folderId) {
        return true; // Найдена циклическая ссылка
      }
      
      if (checkFolder.parentId) {
        return await checkCircularReference(checkFolder.parentId);
      }
      
      return false;
    };
    
    if (await checkCircularReference(targetFolderId)) {
      console.error('Cannot move folder: would create circular reference');
      return false;
    }
  }

  console.log('Folder before move:', { id: folder.id, name: folder.name, parentId: folder.parentId });

  // При перемещении папки в новую родительскую папку, устанавливаем order в конец
  let newOrder = folder.order;
  if (folder.parentId !== targetFolderId) {
    // Получаем максимальный order среди папок в целевой родительской папке
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const schema = data[STORAGE_KEY] as StorageSchema;
    const targetLevelFolders = schema.folders.filter(f => f.parentId === targetFolderId);
    newOrder = targetLevelFolders.length > 0 ? Math.max(...targetLevelFolders.map(f => f.order)) + 1 : 0;
  }

  const result = await updateFolder(folderId, { parentId: targetFolderId, order: newOrder });

  if (result) {
    console.log('Folder after move:', { id: result.id, name: result.name, parentId: result.parentId, order: result.order });
  } else {
    console.error('Failed to update folder');
  }

  return result !== null;
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
