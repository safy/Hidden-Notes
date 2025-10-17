/**
 * @file: utils.ts
 * @description: Общие утилиты проекта
 * @dependencies: clsx, tailwind-merge
 * @created: 2025-10-15
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет классы Tailwind с учетом конфликтов
 * @param inputs - Массив классов или условных классов
 * @returns Объединенная строка классов
 * 
 * @example
 * cn('p-4 text-red-500', condition && 'text-blue-500')
 * // Если condition = true, вернет 'p-4 text-blue-500' (blue перезаписывает red)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует дату в читаемый вид
 * @param timestamp - Unix timestamp
 * @returns Отформатированная строка даты
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) return 'Только что';
  if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
  if (diffInHours < 24) return `${diffInHours} ч назад`;
  if (diffInDays < 7) return `${diffInDays} дн назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Debounce функции
 * @param fn - Функция для debounce
 * @param delay - Задержка в миллисекундах
 * @returns Debounced функция
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Генерирует короткий UUID
 * @returns UUID строка
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}








