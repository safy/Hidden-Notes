/**
 * @file: FolderList.tsx
 * @description: Компонент списка папок в sidebar
 * @dependencies: FolderItem, useFolders
 * @created: 2025-10-21
 */

import React, { useEffect, useState } from 'react';
import { FolderItem } from './FolderItem';
import { useFolders } from '@/hooks/useFolders';
import { Folder as FolderType } from '@/types/folder';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FolderListProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: FolderType) => void;
  onDrop?: (noteId: string, folderId: string) => void;
  className?: string;
}

export const FolderList: React.FC<FolderListProps> = ({
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
  onEditFolder,
  onDrop,
  className,
}) => {
  const {
    folders,
    isLoading,
    error,
    deleteExistingFolder,
    updateExistingFolder,
    getFolderNotesCount,
  } = useFolders();

  const [notesCountMap, setNotesCountMap] = useState<Record<string, number>>({});

  // Загружаем количество заметок для каждой папки
  useEffect(() => {
    const loadNotesCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const folder of folders) {
        const count = await getFolderNotesCount(folder.id);
        counts[folder.id] = count;
      }
      
      setNotesCountMap(counts);
    };

    if (folders.length > 0) {
      loadNotesCounts();
    }
  }, [folders, getFolderNotesCount]);

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const notesCount = notesCountMap[folderId] || 0;

    if (notesCount > 0) {
      const confirmed = confirm(
        `В папке "${folder.name}" находится ${notesCount} заметок. Переместить их в корень или удалить вместе с папкой?\n\nОК - переместить в корень\nОтмена - удалить`
      );

      if (confirmed) {
        // Перемещаем заметки в корень (null)
        await deleteExistingFolder(folderId, null);
      } else {
        // Удаляем заметки вместе с папкой
        const doubleConfirm = confirm(
          `Вы уверены? Все заметки будут перемещены в корзину!`
        );
        if (doubleConfirm) {
          await deleteExistingFolder(folderId);
        }
      }
    } else {
      // Папка пустая, удаляем сразу
      await deleteExistingFolder(folderId);
    }
  };

  const handleToggleExpanded = async (folderId: string, isExpanded: boolean) => {
    await updateExistingFolder(folderId, { isExpanded });
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('px-3 py-4 text-sm text-destructive', className)}>
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Заголовок с кнопкой создания */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Папки
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onCreateFolder}
        >
          <FolderPlus size={14} />
        </Button>
      </div>

      {/* Список папок */}
      {folders.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
          Нет папок. Создайте первую!
        </div>
      ) : (
        folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isActive={currentFolderId === folder.id}
            notesCount={notesCountMap[folder.id] || 0}
            onClick={onFolderSelect}
            onEdit={onEditFolder}
            onDelete={handleDeleteFolder}
            onToggleExpanded={handleToggleExpanded}
            onDrop={onDrop}
          />
        ))
      )}
    </div>
  );
};


