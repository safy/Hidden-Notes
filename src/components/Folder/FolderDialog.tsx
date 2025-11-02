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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
              {isEditMode ? t('folder.editFolder', { defaultValue: 'Edit Folder' }) : t('folder.newFolder', { defaultValue: 'New Folder' })}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? t('folder.editFolderDesc', { defaultValue: 'Change folder name, color or icon' })
                : t('folder.createFolderDesc', { defaultValue: 'Create a folder to organize notes' })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Название */}
            <div className="grid gap-2">
              <Label htmlFor="folder-name">{t('folder.folderName', { defaultValue: 'Name' })}</Label>
              <Input
                id="folder-name"
                placeholder={t('folder.folderNamePlaceholder', { defaultValue: 'My Folder' })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Цвет */}
            <div className="grid gap-2">
              <Label>{t('folder.color', { defaultValue: 'Color' })}</Label>
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
              <Label>{t('folder.icon', { defaultValue: 'Icon' })}</Label>
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
              <Label>{t('folder.preview', { defaultValue: 'Preview' })}</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: color }}
                >
                  {icon}
                </div>
                <span className="font-medium">
                  {name || t('folder.folderNamePreview', { defaultValue: 'Folder name' })}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('folder.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditMode ? t('folder.save', { defaultValue: 'Save' }) : t('folder.create', { defaultValue: 'Create' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

