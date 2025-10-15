/**
 * @file: Sidebar.tsx
 * @description: Боковая панель со списком заметок с drag & drop
 * @dependencies: React, @dnd-kit, shadcn/ui components
 * @created: 2025-10-15
 */

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { NoteListItem } from './NoteListItem';

interface SidebarProps {
  onNoteSelect?: (noteId: string, noteTitle: string) => void;
  onNotesReorder?: (reorderedNotes: any[]) => void;
  onNoteArchive?: (noteId: string) => void;
  onNoteDelete?: (noteId: string) => void;
  onNoteColorChange?: (noteId: string, color: string) => void;
  searchQuery?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onNoteSelect, 
  onNotesReorder, 
  onNoteArchive,
  onNoteDelete,
  onNoteColorChange,
  searchQuery = '' 
}) => {
  // Mock data для демонстрации
  const initialNotes = [
    {
      id: '1',
      title: 'Первая заметка',
      preview: 'Это пример заметки с некоторым содержимым...',
      updatedAt: Date.now() - 1000 * 60 * 5, // 5 минут назад
      isActive: true,
      color: 'blue',
    },
    {
      id: '2',
      title: 'Список покупок',
      preview: 'Молоко, хлеб, яйца...',
      updatedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 часа назад
      isActive: false,
      color: 'green',
    },
    {
      id: '3',
      title: 'Идеи для проекта',
      preview: 'Добавить темную тему, настроить иконки...',
      updatedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 день назад
      isActive: false,
      color: 'yellow',
    },
    {
      id: '4',
      title: 'Встреча с командой',
      preview: 'Обсудить архитектуру, задачи на неделю...',
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 дня назад
      isActive: false,
      color: 'default',
    },
  ];

  const [notes, setNotes] = useState(initialNotes);

  // Настройка сенсоров для drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Обработка завершения перетаскивания
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setNotes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        onNotesReorder?.(newItems);
        return newItems;
      });
    }
  };

  // Фильтрация заметок по поисковому запросу
  const filteredNotes = searchQuery.trim()
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.preview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  return (
    <div className="w-full border-r border-border bg-muted/30 flex flex-col h-full">
      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {searchQuery ? 'Заметки не найдены' : 'Нет заметок'}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredNotes.map((note) => note.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="p-2 space-y-1">
                {filteredNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    id={note.id}
                    title={note.title}
                    preview={note.preview}
                    updatedAt={note.updatedAt}
                    isActive={note.isActive}
                    color={note.color}
                    onClick={() => onNoteSelect?.(note.id, note.title)}
                    onArchive={onNoteArchive}
                    onDelete={onNoteDelete}
                    onColorChange={onNoteColorChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {searchQuery && (
            <div className="mb-1">
              Найдено: {filteredNotes.length} из {notes.length}
            </div>
          )}
          {filteredNotes.length} {filteredNotes.length === 1 ? 'заметка' : 'заметок'}
        </div>
      </div>
    </div>
  );
};

