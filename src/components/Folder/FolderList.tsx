/**
 * @file: FolderList.tsx
 * @description: Компонент списка папок в sidebar
 * @dependencies: FolderItem, useFolders
 * @created: 2025-10-21
 */

import React, { useEffect, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FolderItem } from './FolderItem';
import { useFolders } from '@/hooks/useFolders';
import { Folder as FolderType } from '@/types/folder';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface FolderListProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onEditFolder: (folder: FolderType) => void;
  onDrop?: (noteId: string, folderId: string) => void;
  onBackToRoot?: () => void;
  onMoveFolder?: (folderId: string, targetFolderId: string | null) => void;
  activeId?: string | null;
  overId?: string | null;
  className?: string;
}

export const FolderList: React.FC<FolderListProps> = ({
  currentFolderId,
  onFolderSelect,
  onEditFolder,
  onDrop,
  onBackToRoot,
  onMoveFolder,
  activeId,
  overId,
  className,
}) => {
  const { t } = useTranslation();
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
        t('folders.deleteConfirm', { defaultValue: `Folder "${folder.name}" contains ${notesCount} notes. Move them to root or delete with the folder?\n\nOK - move to root\nCancel - delete` })
      );

      if (confirmed) {
        // Перемещаем заметки в корень (null)
        await deleteExistingFolder(folderId, null);
      } else {
        // Удаляем заметки вместе с папкой
        const doubleConfirm = confirm(
          t('folders.doubleConfirm', { defaultValue: 'Are you sure? All notes will be moved to trash!' })
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

  // Получить полный путь папки (включая вложенные)
  const getFolderPath = () => {
    const pathSegments: { name: string; id: string | null }[] = [];

    // Добавляем "Корень"
    pathSegments.push({ name: t('folders.root', { defaultValue: 'Root' }), id: null });

    if (currentFolderId !== null) {
      // Рекурсивно строим путь от текущей папки до корня
      const buildPath = (folderId: string): void => {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          // Если у папки есть родитель, сначала добавляем родителя
          if (folder.parentId) {
            buildPath(folder.parentId);
          }
          // Затем добавляем саму папку
          pathSegments.push({ name: folder.name, id: folder.id });
        }
      };

      buildPath(currentFolderId);
    }

    return pathSegments;
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
        {t('common.error', { defaultValue: 'Error' })}: {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Хлебные крошки пути + иконка назад слева */}
      <div className="flex items-center gap-2 px-3 py-2">
        {currentFolderId && onBackToRoot && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onBackToRoot}
            title={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft size={14} />
          </Button>
        )}

        {/* Полный путь папки */}
        {getFolderPath().map((segment, index, array) => (
          <React.Fragment key={segment.id || 'root'}>
            <button
              className={cn(
                'text-xs font-semibold text-muted-foreground hover:text-foreground',
                segment.id === currentFolderId && 'text-foreground cursor-default',
                index === 0 && 'uppercase' // "Корень" uppercase
              )}
              onClick={() => onFolderSelect(segment.id)}
              disabled={segment.id === currentFolderId}
            >
              {segment.name}
            </button>
            {index < array.length - 1 && (
              <span className="text-xs text-muted-foreground mx-0.5">/</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Список папок - показываем папки текущего уровня */}
      {(() => {
        // Фильтруем папки по текущему уровню
        const currentLevelFolders = folders.filter(folder => folder.parentId === currentFolderId);
        
        return (
          <>
            {currentLevelFolders.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {currentFolderId === null ? t('folders.emptyRoot', { defaultValue: 'No folders. Create the first one!' }) : t('folders.emptyNested', { defaultValue: 'No subfolders' })}
              </div>
            ) : (
              <SortableContext
                items={currentLevelFolders.map((folder) => `folder-sortable-${folder.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {currentLevelFolders.map((folder) => (
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
                  onMoveFolder={onMoveFolder}
                  activeId={activeId}
                  overId={overId}
                />
                ))}
              </SortableContext>
            )}
          </>
        );
      })()}
    </div>
  );
};


