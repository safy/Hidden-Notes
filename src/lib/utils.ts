/**
 * @file: utils.ts
 * @description: Утилиты и хелперы для приложения
 * @dependencies: clsx, class-variance-authority
 * @created: 2025-10-15
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | number): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} д назад`;

  return target.toLocaleDateString('ru-RU');
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Справочник горячих клавиш для редактора
 */
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Отмена/Повтор',
    shortcuts: [
      { keys: 'Ctrl+Z', description: 'Отменить' },
      { keys: 'Ctrl+Y', description: 'Повторить' },
    ],
  },
  {
    category: 'Форматирование текста',
    shortcuts: [
      { keys: 'Ctrl+B', description: 'Жирный' },
      { keys: 'Ctrl+I', description: 'Курсив' },
      { keys: 'Ctrl+U', description: 'Подчеркнутый' },
      { keys: 'Ctrl+Shift+X', description: 'Зачеркнутый' },
      { keys: 'Ctrl+`', description: 'Код' },
    ],
  },
  {
    category: 'Заголовки',
    shortcuts: [
      { keys: 'Ctrl+Alt+1', description: 'Заголовок 1' },
      { keys: 'Ctrl+Alt+2', description: 'Заголовок 2' },
      { keys: 'Ctrl+Alt+3', description: 'Заголовок 3' },
    ],
  },
  {
    category: 'Списки',
    shortcuts: [
      { keys: 'Ctrl+Shift+8', description: 'Маркированный список' },
      { keys: 'Ctrl+Shift+9', description: 'Нумерованный список' },
      { keys: 'Ctrl+Shift+[', description: 'Список задач' },
    ],
  },
  {
    category: 'Выравнивание',
    shortcuts: [
      { keys: 'Ctrl+Shift+L', description: 'Влево' },
      { keys: 'Ctrl+Shift+E', description: 'По центру' },
      { keys: 'Ctrl+Shift+R', description: 'Вправо' },
      { keys: 'Ctrl+Shift+J', description: 'По ширине' },
    ],
  },
] as const;








