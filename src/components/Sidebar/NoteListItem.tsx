/**
 * @file: NoteListItem.tsx
 * @description: Элемент списка заметок в Sidebar с drag & drop
 * @dependencies: React, @dnd-kit, shadcn/ui, formatDate utility
 * @created: 2025-10-15
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Archive, Trash2, Palette, FolderInput } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ColorPicker';

interface NoteListItemProps {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  isActive?: boolean;
  color?: string;
  onClick?: () => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onColorChange?: (id: string, color: string) => void;
  onMoveToFolder?: (id: string) => void;
}

const noteColors = [
  { name: 'По умолчанию', value: 'default', class: 'bg-background border-border' },
  { name: 'Синий', value: 'blue', class: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' },
  { name: 'Зеленый', value: 'green', class: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' },
  { name: 'Желтый', value: 'yellow', class: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' },
  { name: 'Красный', value: 'red', class: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' },
  { name: 'Фиолетовый', value: 'purple', class: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800' },
];

export const NoteListItem: React.FC<NoteListItemProps> = ({
  id,
  title,
  preview,
  updatedAt,
  isActive = false,
  color = 'default',
  onClick,
  onArchive,
  onDelete,
  onColorChange,
  onMoveToFolder,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentColor = noteColors.find(c => c.value === color) || noteColors[0]!;

  const handleColorChange = (newColor: string) => {
    onColorChange?.(id, newColor);
  };

  const handleMoveToFolder = () => {
    onMoveToFolder?.(id);
  };

  const handleArchive = () => {
    onArchive?.(id);
  };

  const handleDelete = () => {
    onDelete?.(id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'w-full rounded-md transition-colors',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <div
        className={cn(
          'w-full p-3 rounded-md transition-colors flex items-start gap-2 border group',
          currentColor.class,
          'hover:shadow-sm',
          isActive && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing',
            'text-muted-foreground hover:text-foreground transition-colors'
          )}
          title="Перетащить для изменения порядка"
        >
          <GripVertical className="h-3 w-3" />
        </div>

        {/* Content */}
        <button
          onClick={onClick}
          className="flex-1 text-left space-y-1 min-w-0 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium truncate">{title}</h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(updatedAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{preview}</p>
        </button>

        {/* Context Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Меню заметки"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <ColorPicker
              currentColor={color}
              onColorChange={handleColorChange}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Palette className="mr-2 h-4 w-4" />
                Цвет заметки
              </DropdownMenuItem>
            </ColorPicker>
            <DropdownMenuItem onClick={handleMoveToFolder}>
              <FolderInput className="mr-2 h-4 w-4" />
              Переместить в папку
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Архивировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

