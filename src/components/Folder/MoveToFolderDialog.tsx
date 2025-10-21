/**
 * @file: MoveToFolderDialog.tsx
 * @description: Диалог для перемещения заметки в папку
 * @dependencies: ui/dialog, useFolders
 * @created: 2025-10-21
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFolders } from '@/hooks/useFolders';
import { Home } from 'lucide-react';
import { FolderIcon } from './FolderIcon';
import { cn } from '@/lib/utils';

interface MoveToFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
  currentFolderId?: string | null;
  noteTitle?: string;
}

export const MoveToFolderDialog: React.FC<MoveToFolderDialogProps> = ({
  isOpen,
  onClose,
  onMove,
  currentFolderId,
  noteTitle,
}) => {
  const { folders } = useFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    currentFolderId || null
  );

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  const handleClose = () => {
    setSelectedFolderId(currentFolderId || null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Переместить заметку</DialogTitle>
          <DialogDescription>
            {noteTitle
              ? `Выберите папку для заметки "${noteTitle}"`
              : 'Выберите папку для заметки'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4 max-h-[400px] overflow-y-auto">
          {/* Корневая папка (без папки) */}
          <button
            type="button"
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors',
              'hover:bg-accent',
              selectedFolderId === null && 'bg-accent ring-2 ring-foreground'
            )}
            onClick={() => setSelectedFolderId(null)}
          >
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
              <Home size={20} className="text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Без папки</div>
              <div className="text-xs text-muted-foreground">
                Корень
              </div>
            </div>
          </button>

          {/* Список папок */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                'hover:bg-accent',
                selectedFolderId === folder.id &&
                  'bg-accent ring-2 ring-foreground',
                currentFolderId === folder.id && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => setSelectedFolderId(folder.id)}
              disabled={currentFolderId === folder.id}
            >
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center border border-border/20"
                style={{ backgroundColor: folder.color }}
              >
                <FolderIcon iconName={folder.icon || 'folder'} size={20} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{folder.name}</div>
                {currentFolderId === folder.id && (
                  <div className="text-xs text-muted-foreground">
                    Текущая папка
                  </div>
                )}
              </div>
            </button>
          ))}

          {folders.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Нет доступных папок
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={selectedFolderId === currentFolderId}
          >
            Переместить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

