/**
 * @file: folder.ts
 * @description: Типы данных для системы папок
 * @dependencies: None
 * @created: 2025-10-21
 */

/**
 * Интерфейс папки для организации заметок
 */
export interface Folder {
  id: string;
  name: string;
  color: string;           // hex color (#3b82f6)
  icon?: string;           // emoji или lucide icon name
  parentId?: string | null; // для вложенных папок (v2.0)
  isExpanded?: boolean;    // раскрыта ли папка в UI
  order: number;           // порядок отображения
  createdAt: number;
  updatedAt: number;
}

/**
 * Тип для создания новой папки (без auto-generated полей)
 */
export type CreateFolderInput = Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'order'> & {
  order?: number;
};

/**
 * Тип для обновления папки (исключаем id, createdAt, updatedAt)
 */
export type UpdateFolderInput = Partial<Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Предустановленные цвета для папок (пастельные тона)
 */
export const FOLDER_COLORS = [
  { name: 'Светло-желтый', value: '#fef3c7', class: 'bg-yellow-100' },
  { name: 'Светло-зеленый', value: '#d1fae5', class: 'bg-green-100' },
  { name: 'Светло-розовый', value: '#fce7f3', class: 'bg-pink-100' },
  { name: 'Светло-фиолетовый', value: '#e9d5ff', class: 'bg-purple-100' },
  { name: 'Светло-голубой', value: '#dbeafe', class: 'bg-blue-100' },
  { name: 'Светло-оранжевый', value: '#fed7aa', class: 'bg-orange-100' },
  { name: 'Светло-серый', value: '#f3f4f6', class: 'bg-gray-100' },
  { name: 'Светло-бирюзовый', value: '#ccfbf1', class: 'bg-teal-100' },
] as const;

/**
 * Предустановленные иконки для папок (shadcn/ui иконки)
 */
export const FOLDER_ICONS = [
  'folder', // default folder
  'folder-open', // open folder
  'folder-plus', // add folder
  'folder-minus', // remove folder
  'file', // document
  'file-text', // text document
  'file-plus', // add document
  'file-minus', // remove document
  'bookmark', // bookmark
  'tag', // label
  'pin', // pushpin
  'link', // link
  'zap', // lightning
  'archive', // archive
  'inbox', // inbox
  'briefcase', // briefcase
] as const;

/**
 * Фабричная функция для создания новой папки
 */
export function createFolder(input: CreateFolderInput): Folder {
  const now = Date.now();
  
  return {
    id: `folder-${now}-${Math.random().toString(36).substring(2, 9)}`,
    name: input.name,
    color: input.color,
    icon: input.icon,
    parentId: input.parentId || null,
    isExpanded: input.isExpanded ?? true, // по умолчанию раскрыта
    order: input.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Статистика по папке
 */
export interface FolderStats {
  folderId: string;
  notesCount: number;
  archivedCount: number;
  lastUpdated: number;
}

