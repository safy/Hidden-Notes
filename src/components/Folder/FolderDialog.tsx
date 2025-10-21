/**
 * @file: FolderDialog.tsx
 * @description: Диалог создания и редактирования папок
 * @dependencies: ui/dialog, ColorPicker, FOLDER_COLORS, FOLDER_ICONS
 * @created: 2025-10-21
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder as FolderType, FOLDER_COLORS, FOLDER_ICONS } from '@/types/folder';
import { cn } from '@/lib/utils';

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string; icon?: string }) => void;
  folder?: FolderType | null; // Если передан - режим редактирования
}

export const FolderDialog: React.FC<FolderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  folder,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(FOLDER_COLORS[0].value);
  const [icon, setIcon] = useState<string>(FOLDER_ICONS[0]);

  const isEditMode = !!folder;

  // Инициализация при открытии
  useEffect(() => {
    if (isOpen) {
      if (folder) {
        // Режим редактирования
        setName(folder.name);
        setColor(folder.color);
        setIcon(folder.icon || FOLDER_ICONS[0]);
      } else {
        // Режим создания
        setName('');
        setColor(FOLDER_COLORS[0].value);
        setIcon(FOLDER_ICONS[0]);
      }
    }
  }, [isOpen, folder]);

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

    handleClose();
  };

  const handleClose = () => {
    setName('');
    setColor(FOLDER_COLORS[0].value);
    setIcon(FOLDER_ICONS[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Редактировать папку' : 'Новая папка'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Измените название, цвет или иконку папки'
                : 'Создайте папку для организации заметок'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Название */}
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Название</Label>
              <Input
                id="folder-name"
                placeholder="Моя папка"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Цвет */}
            <div className="grid gap-2">
              <Label>Цвет</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded-md transition-all',
                      color === colorOption.value &&
                        'ring-2 ring-offset-2 ring-foreground'
                    )}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => setColor(colorOption.value)}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>

            {/* Иконка */}
            <div className="grid gap-2">
              <Label>Иконка</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_ICONS.map((iconOption) => (
                  <button
                    key={iconOption}
                    type="button"
                    className={cn(
                      'w-10 h-10 rounded-md transition-all text-xl',
                      'hover:bg-accent',
                      icon === iconOption &&
                        'bg-accent ring-2 ring-offset-2 ring-foreground'
                    )}
                    onClick={() => setIcon(iconOption)}
                  >
                    {iconOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Предпросмотр */}
            <div className="grid gap-2">
              <Label>Предпросмотр</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: color }}
                >
                  {icon}
                </div>
                <span className="font-medium">
                  {name || 'Название папки'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditMode ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

