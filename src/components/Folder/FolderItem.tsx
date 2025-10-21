/**
 * @file: FolderItem.tsx
 * @description: Компонент элемента папки в sidebar
 * @dependencies: types/folder, lucide-react
 * @created: 2025-10-21
 */

import React from 'react';
import { Folder as FolderType } from '@/types/folder';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { FolderIcon } from './FolderIcon';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface FolderItemProps {
  folder: FolderType;
  isActive: boolean;
  notesCount: number;
  onClick: (folderId: string) => void;
  onEdit: (folder: FolderType) => void;
  onDelete: (folderId: string) => void;
  onToggleExpanded?: (folderId: string, isExpanded: boolean) => void;
  onDrop?: (noteId: string, folderId: string) => void;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  isActive,
  notesCount,
  onClick,
  onEdit,
  onDelete,
  // onDrop, // Используется в useDroppable, но не в обработчике
  // onToggleExpanded, // Закомментировано до реализации вложенных папок
}) => {
  // const [isExpanded, setIsExpanded] = useState(folder.isExpanded ?? true);

  // const handleToggleExpand = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   const newExpanded = !isExpanded;
  //   setIsExpanded(newExpanded);
  //   onToggleExpanded?.(folder.id, newExpanded);
  // };

  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folderId: folder.id,
    },
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(folder);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(folder.id);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
        'hover:bg-accent',
        isActive && 'bg-accent',
        isOver && 'bg-primary/20 border-2 border-primary border-dashed'
      )}
      onClick={() => onClick(folder.id)}
    >
      {/* Expand/Collapse кнопка (для будущих вложенных папок) */}
      {/* <button
        onClick={handleToggleExpand}
        className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button> */}

      {/* Иконка папки с цветом */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center border border-border/20"
        style={{ backgroundColor: folder.color }}
      >
        <FolderIcon iconName={folder.icon || 'folder'} size={16} />
      </div>

      {/* Название папки */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{folder.name}</span>
          {notesCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {notesCount}
            </span>
          )}
        </div>
      </div>

      {/* Меню действий (показывается при hover) */}
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={cn(
              'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-accent-foreground/10',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}
          >
            <MoreVertical size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit2 size={14} className="mr-2" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} className="mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

