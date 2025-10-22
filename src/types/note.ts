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

  /** Цвет карточки заметки (ui-метаданные) */
  color?: string; // 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'

  /** ID папки в которой находится заметка (null = без папки) */
  folderId?: string | null;

  /** Timestamp создания заметки */
  createdAt: number;

  /** Timestamp последнего обновления */
  updatedAt: number;

  /** Теги заметки (для будущих версий) */
  tags?: string[];

  /** Закреплена ли заметка */
  isPinned?: boolean;

  /** Заметка в архиве (скрыта из основного списка) */
  isArchived?: boolean;

  /** Timestamp архивирования */
  archivedAt?: number;

  /** Порядок заметки в списке/папке */
  order?: number;
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
  color?: string;
  folderId?: string | null;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  archivedAt?: number;
  order?: number;
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
  version: number;                    // версия схемы для миграций
  notes: Note[];
  folders: Array<import('./folder').Folder>; // NEW - папки для организации
  settings: Settings;
  currentNoteId: string | null;
  currentFolderId: string | null;     // NEW - текущая открытая папка
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








