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
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Переместить заметку</DialogTitle>
          <DialogDescription className="text-sm">
            {noteTitle
              ? `Выберите папку для заметки "${noteTitle}"`
              : 'Выберите папку для заметки'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5 py-2 max-h-[300px] overflow-y-auto">
          {/* Корневая папка (без папки) */}
          <button
            type="button"
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-md transition-colors',
              'hover:bg-accent',
              selectedFolderId === null && 'bg-accent ring-1 ring-foreground'
            )}
            onClick={() => setSelectedFolderId(null)}
          >
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <Home size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">Без папки</div>
              <div className="text-xs text-muted-foreground">
                Корень
              </div>
            </div>
          </button>

          {/* Список папок в иерархическом порядке */}
          {(() => {
            // Функция для построения иерархического списка папок
            const buildFolderHierarchy = (parentId: string | null = null, level: number = 0): React.ReactNode[] => {
              const childFolders = folders.filter(folder => folder.parentId === parentId);
              
              return childFolders.map((folder) => (
                <React.Fragment key={folder.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2.5 p-2 rounded-md transition-colors',
                      'hover:bg-accent',
                      selectedFolderId === folder.id &&
                        'bg-accent ring-1 ring-foreground',
                      currentFolderId === folder.id && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{ paddingLeft: `${8 + level * 16}px` }}
                    onClick={() => setSelectedFolderId(folder.id)}
                    disabled={currentFolderId === folder.id}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-border/20"
                      style={{ backgroundColor: folder.color }}
                    >
                      <FolderIcon iconName={folder.icon || 'folder'} size={16} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{folder.name}</div>
                      {currentFolderId === folder.id && (
                        <div className="text-xs text-muted-foreground">
                          Текущая папка
                        </div>
                      )}
                    </div>
                  </button>
                  {/* Рекурсивно добавляем вложенные папки */}
                  {buildFolderHierarchy(folder.id, level + 1)}
                </React.Fragment>
              ));
            };

            return buildFolderHierarchy();
          })()}

          {folders.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Нет доступных папок
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            type="button"
            size="sm"
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

