/**
 * @file: FolderCreateMenu.tsx
 * @description: Fly-out меню для создания папки (в стиле SearchDropdown)
 * @dependencies: ui components, FOLDER_COLORS, FOLDER_ICONS, FolderIcon
 * @created: 2025-10-21
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FOLDER_COLORS, FOLDER_ICONS } from '@/types/folder';
import { FolderIcon } from './FolderIcon';
import { cn } from '@/lib/utils';

interface FolderCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string; icon?: string }) => void;
}

export const FolderCreateMenu: React.FC<FolderCreateMenuProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(FOLDER_COLORS[0].value);
  const [icon, setIcon] = useState<string>(FOLDER_ICONS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокус на input при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      color,
      icon,
    });

    // Сброс формы
    setName('');
    setColor(FOLDER_COLORS[0].value);
    setIcon(FOLDER_ICONS[0]);
    onClose();
  };

  const handleClose = () => {
    setName('');
    setColor(FOLDER_COLORS[0].value);
    setIcon(FOLDER_ICONS[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="w-full border-b border-border">
      <form onSubmit={handleSubmit} className="p-3 space-y-3">
        {/* Поле ввода названия (как поиск) */}
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder="Название папки..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClose}
          >
            ×
          </Button>
        </div>

        {/* Цвета (меньше размер) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Цвет
          </label>
          <div className="flex gap-1.5">
            {FOLDER_COLORS.map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all',
                  'hover:scale-110 focus:outline-none focus:ring-1 focus:ring-ring',
                  color === colorOption.value
                    ? 'border-foreground ring-1 ring-ring'
                    : 'border-muted-foreground/30'
                )}
                style={{ backgroundColor: colorOption.value }}
                onClick={() => setColor(colorOption.value)}
                title={colorOption.name}
              />
            ))}
          </div>
        </div>

        {/* Иконки (shadcn/ui) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Иконка
          </label>
          <div className="grid grid-cols-8 gap-1">
            {FOLDER_ICONS.map((iconOption) => (
              <button
                key={iconOption}
                type="button"
                className={cn(
                  'w-8 h-8 rounded-md transition-all flex items-center justify-center',
                  'hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring',
                  icon === iconOption
                    ? 'bg-accent ring-1 ring-ring'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => setIcon(iconOption)}
              >
                <FolderIcon iconName={iconOption} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Предпросмотр */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Предпросмотр
          </label>
          <div className="flex items-center gap-3 p-2 rounded-md bg-accent">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center border border-border/20"
              style={{ backgroundColor: color }}
            >
              <FolderIcon iconName={icon} size={16} />
            </div>
            <span className="text-sm font-medium">
              {name || 'Название папки'}
            </span>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={handleClose}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            className="flex-1 h-8"
            disabled={!name.trim()}
          >
            Создать
          </Button>
        </div>
      </form>
    </div>
  );
};
