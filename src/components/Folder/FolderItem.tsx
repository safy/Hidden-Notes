/**
 * @file: FolderItem.tsx
 * @description: Компонент элемента папки в sidebar
 * @dependencies: types/folder, lucide-react
 * @created: 2025-10-21
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Folder as FolderType } from '@/types/folder';
import { MoreVertical, Trash2, Edit2, GripVertical } from 'lucide-react';
import { FolderIcon } from './FolderIcon';
import { cn } from '@/lib/utils';
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
  onMoveFolder, // Теперь используется для вложенности папок
  onDrop, // Используется для drop заметок
  onToggleExpanded, // Для будущего функционала
  activeId,
  overId,
}) => {
  // Используем параметры для избежания ошибок TypeScript
  console.log('FolderItem props:', { onMoveFolder: !!onMoveFolder, onDrop: !!onDrop, onToggleExpanded: !!onToggleExpanded });
  // const [isExpanded, setIsExpanded] = useState(folder.isExpanded ?? true);

  // const handleToggleExpand = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   const newExpanded = !isExpanded;
  //   setIsExpanded(newExpanded);
  //   onToggleExpanded?.(folder.id, newExpanded);
  // };

  // useSortable для перетаскивания папок (изменение порядка) - только через drag handle
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `folder-sortable-${folder.id}`,
    data: {
      type: 'folder-sortable',
      folderId: folder.id,
    },
  });

  // useDroppable для приема заметок и других папок
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `folder-drop-${folder.id}`,
    data: {
      type: 'folder-drop',
      folderId: folder.id,
    },
    disabled: true, // Отключаем droppable для папок, используем только useSortable
  });

  // Определяем позицию перетаскивания для показа обводки
  const currentFolderSortableId = `folder-sortable-${folder.id}`;
  const isOverThisFolder = overId === currentFolderSortableId;
  
  // Определяем, нужно ли показывать обводку
  // Показываем обводку когда что-то перетаскивается над папкой и это не текущая папка
  const shouldShowOutline = isOverThisFolder && activeId && activeId !== `folder-sortable-${folder.id}` && !isDragging;
  
  // Логирование для отладки
  console.log(`📁 FolderItem ${folder.name} (${folder.id}):`, {
    sortableId: `folder-sortable-${folder.id}`,
    droppableId: `folder-drop-${folder.id}`,
    parentId: folder.parentId,
    isOver,
    isDragging,
    disabled: true,
    activeId,
    overId,
    shouldShowOutline,
    isOverThisFolder
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
        ref={setDroppableNodeRef}
        className={cn(
          'group relative rounded-lg transition-all duration-200 ease-in-out',
          shouldShowOutline && 'ring-2 ring-primary ring-opacity-80 bg-primary/20 shadow-lg transform scale-[1.02]'
        )}
      >
      <div
        ref={setSortableNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          'hover:bg-accent',
          isActive && 'bg-accent',
          isDragging && 'opacity-50 z-50',
          shouldShowOutline && 'border-2 border-dashed border-primary/60 bg-primary/5'
        )}
      >
      {/* Drag handle для перетаскивания папки */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded hover:bg-accent/50 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
        }}
        title="Перетащить для изменения порядка"
      >
        <GripVertical size={12} />
      </div>

      {/* Кликабельная область для открытия папки */}
      <div 
        className="flex items-center gap-2 flex-1 cursor-pointer"
        onClick={(e) => {
          console.log('Folder clicked:', folder.id, folder.name);
          e.stopPropagation();
          onClick(folder.id);
        }}
      >
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

