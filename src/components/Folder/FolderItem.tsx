/**
 * @file: FolderItem.tsx
 * @description: Компонент элемента папки в sidebar
 * @dependencies: types/folder, lucide-react
 * @created: 2025-10-21
 */

import React from 'react';
import { Folder as FolderType } from '@/types/folder';
import { MoreVertical, Trash2, Edit2, GripVertical } from 'lucide-react';
import { FolderIcon } from './FolderIcon';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  onMoveFolder?: (folderId: string, targetFolderId: string | null) => void;
  activeId?: string | null;
  overId?: string | null;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  isActive,
  notesCount,
  onClick,
  onEdit,
  onDelete,
  onToggleExpanded: _onToggleExpanded,
  onDrop: _onDrop,
  onMoveFolder: _onMoveFolder,
  activeId: _activeId,
  overId: _overId,
}) => {
  // const [isExpanded, setIsExpanded] = useState(folder.isExpanded ?? true);

  // const handleToggleExpand = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   const newExpanded = !isExpanded;
  //   setIsExpanded(newExpanded);
  //   onToggleExpanded?.(folder.id, newExpanded);
  // };

  // useSortable для перетаскивания папок (НЕ используем useDroppable - конфликт!)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folderId: folder.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      className={cn(
        'group relative rounded-lg transition-all duration-200 ease-in-out',
        isOver && 'ring-2 ring-primary ring-opacity-80 bg-primary/20 shadow-lg transform scale-[1.02]'
      )}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'hover:bg-accent',
          isActive && 'bg-accent',
          isDragging && 'opacity-50 z-50',
          isOver && 'border-2 border-dashed border-primary/60 bg-primary/5'
        )}
      >
      {/* Drag handle for dragging folder (prevents click conflicts) */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded hover:bg-accent/50"
        title="Перетащить папку"
      >
        <GripVertical size={12} />
      </div>
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
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          console.log('📁 Folder clicked:', folder.id, folder.name);
          onClick(folder.id);
        }}
      >
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
    </div>
  );
};

