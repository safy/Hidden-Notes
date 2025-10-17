/**
 * @file: note.ts
 * @description: Типы данных для заметок
 * @dependencies: None
 * @created: 2025-10-15
 */

/**
 * Интерфейс заметки
 */
export interface Note {
  /** Уникальный идентификатор заметки */
  id: string;

  /** Название заметки */
  title: string;

  /** Содержимое заметки в формате JSON (Tiptap) */
  content: string;

  /** Timestamp создания заметки */
  createdAt: number;

  /** Timestamp последнего обновления */
  updatedAt: number;

  /** Теги заметки (для будущих версий) */
  tags?: string[];

  /** Закреплена ли заметка (для будущих версий) */
  isPinned?: boolean;
}

/**
 * Входные данные для создания заметки
 */
export interface CreateNoteInput {
  title?: string;
  content?: string;
}

/**
 * Входные данные для обновления заметки
 */
export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
}

/**
 * Настройки приложения
 */
export interface Settings {
  /** Тема приложения */
  theme: 'light' | 'dark' | 'system';

  /** Размер шрифта в редакторе */
  fontSize: number;

  /** Интервал автосохранения в миллисекундах */
  autoSaveInterval: number;

  /** Показывать ли предупреждение о визуальном скрытии */
  showHiddenTextWarning: boolean;
}

/**
 * Схема хранилища Chrome Storage
 */
export interface StorageSchema {
  notes: Note[];
  settings: Settings;
  currentNoteId: string | null;
}

/**
 * Дефолтные настройки
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  fontSize: 14,
  autoSaveInterval: 1000,
  showHiddenTextWarning: true,
};








