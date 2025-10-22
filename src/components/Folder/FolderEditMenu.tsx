/**
 * @file: FolderEditMenu.tsx
 * @description: Выдвигающееся меню для редактирования папки
 * @dependencies: React, shadcn/ui components
 * @created: 2025-10-21
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FOLDER_COLORS, FOLDER_ICONS } from '@/types/folder';
import { FolderIcon } from './FolderIcon';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Folder as FolderType } from '@/types/folder';

interface FolderEditMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string; icon?: string }) => void;
  folder: FolderType | null;
}

export const FolderEditMenu: React.FC<FolderEditMenuProps> = ({
  isOpen,
  onClose,
  onSave,
  folder,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('folder');
  const inputRef = useRef<HTMLInputElement>(null);

  // Обновляем состояние при изменении папки
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color);
      setIcon(folder.icon || 'folder');
    }
  }, [folder]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    
    return undefined;
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), color, icon });
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#3b82f6');
    setIcon('folder');
    onClose();
  };

  if (!isOpen || !folder) return null;

  return (
    <div className="w-full border-b border-border">
      <form onSubmit={handleSubmit} className="p-3 space-y-3">
        {/* Поле ввода названия с иконками */}
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder="Название папки..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pr-16 h-8"
          />
          {/* Иконки справа */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Зеленая галочка - Сохранить */}
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              disabled={!name.trim()}
              title="Сохранить изменения"
            >
              <Check size={14} />
            </Button>
            {/* Красный крестик - Отмена */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleClose}
              title="Отмена"
            >
              <X size={14} />
            </Button>
          </div>
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
                    : 'hover:bg-accent'
                )}
                onClick={() => setIcon(iconOption)}
                title={iconOption}
              >
                <FolderIcon iconName={iconOption} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Предварительный просмотр */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Предварительный просмотр
          </label>
          <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center border border-border/20"
              style={{ backgroundColor: color }}
            >
              <FolderIcon iconName={icon} size={16} />
            </div>
            <span className="text-sm font-medium">{name || 'Название папки'}</span>
          </div>
        </div>
      </form>
    </div>
  );
};
