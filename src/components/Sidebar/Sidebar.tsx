/**
 * @file: Sidebar.tsx
 * @description: Боковая панель со списком заметок с drag & drop
 * @dependencies: React, @dnd-kit, shadcn/ui components
 * @created: 2025-10-15
 */

import React, { useState, useEffect } from 'react';
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
import { FolderList } from '@/components/Folder';
import { generateNotePreview } from '@/lib/utils';

interface SidebarProps {
  notes?: any[]; // Notes array from parent
  folders?: any[]; // Folders array from parent
  currentFolderId?: string | null;
  onNoteSelect?: (noteId: string) => void;
  onNotesReorder?: (reorderedNotes: any[]) => void;
  onNoteArchive?: (noteId: string) => void;
  onNoteDelete?: (noteId: string) => void;
  onNoteColorChange?: (noteId: string, color: string) => void;
  onMoveToFolder?: (noteId: string) => void;
  onFolderSelect?: (folderId: string | null) => void;
  onBackToRoot?: () => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string) => void;
  onMoveFolderToFolder?: (folderId: string, targetFolderId: string | null) => void;
  onEditFolder?: (folder: any) => void;
  searchQuery?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  notes = [],
  currentFolderId = null,
  onNoteSelect, 
  onNotesReorder, 
  onNoteArchive,
  onNoteDelete,
  onNoteColorChange,
  onMoveToFolder,
  onFolderSelect,
  onBackToRoot,
  onMoveNoteToFolder,
  onMoveFolderToFolder,
  onEditFolder,
  searchQuery = '' 
}) => {
  const [items, setItems] = useState(notes);

  // Обновляем items когда props.notes меняются
  useEffect(() => {
    setItems(notes);
  }, [notes]);

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

    console.log('Drag end:', { active: active.id, over: over?.id, activeData: active.data.current, overData: over?.data.current });

    // Проверяем, если перетаскиваем папку на папку
    if (active.data.current?.type === 'folder' && over?.data.current?.type === 'folder-drop') {
      const draggedFolderId = active.data.current.folderId;
      const targetFolderId = over.data.current.folderId;
      
      console.log('Moving folder to folder:', { draggedFolderId, targetFolderId });
      
      if (onMoveFolderToFolder && draggedFolderId !== targetFolderId) {
        onMoveFolderToFolder(draggedFolderId, targetFolderId);
      }
      return;
    }

    // Проверяем, если перетаскиваем папку на другую папку (для сортировки)
    if (active.data.current?.type === 'folder' && over?.data.current?.type === 'folder') {
      const draggedFolderId = active.data.current.folderId;
      const targetFolderId = over.data.current.folderId;
      
      console.log('Reordering folders:', { draggedFolderId, targetFolderId });
      
      // TODO: Implement folder reordering
      return;
    }

    // Проверяем, если перетаскиваем заметку на папку
    if (over && typeof over.id === 'string' && over.id.startsWith('folder-')) {
      const folderId = over.id.replace('folder-', '');
      const noteId = active.id as string;
      
      console.log('Moving note to folder:', { noteId, folderId });
      
      if (onMoveNoteToFolder) {
        onMoveNoteToFolder(noteId, folderId);
      }
      return;
    }

    // Обычная сортировка заметок
    if (active.id !== over?.id && !active.id.toString().startsWith('folder-')) {
      setItems((items) => {
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
    ? items.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.preview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full border-r border-border bg-muted/30 flex flex-col h-full">
        {/* Folders List */}
        <div className="flex-shrink-0">
          <FolderList
            currentFolderId={currentFolderId}
            onFolderSelect={onFolderSelect || (() => {})}
            onEditFolder={onEditFolder || (() => {})}
            onDrop={onMoveNoteToFolder}
            onBackToRoot={onBackToRoot}
            onMoveFolder={onMoveFolderToFolder}
          />
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchQuery ? 'Заметки не найдены' : 'Нет заметок'}
            </div>
          ) : (
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
                    preview={generateNotePreview(note.content)}
                    updatedAt={note.updatedAt}
                    isActive={note.isActive}
                    color={note.color}
                    onClick={() => onNoteSelect?.(note.id)}
                    onArchive={onNoteArchive}
                    onDelete={onNoteDelete}
                    onColorChange={onNoteColorChange}
                    onMoveToFolder={onMoveToFolder}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {searchQuery && (
              <div className="mb-1">
                Найдено: {filteredNotes.length} из {items.length}
              </div>
            )}
            {filteredNotes.length} {filteredNotes.length === 1 ? 'заметка' : 'заметок'}
          </div>
        </div>
      </div>
    </DndContext>
  );
};

