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

export interface SidebarProps {
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
  onReorderFolders?: (folderId: string, newOrder: number) => void;
  onEditFolder?: (folder: any) => void;
  searchQuery?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  notes = [],
  folders = [],
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
  onReorderFolders,
  onEditFolder,
  searchQuery = '' 
}) => {
  const [items, setItems] = useState(notes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    setOverId(event.over?.id || null);
    
    // Логируем позицию перетаскивания для отладки
    if (event.active && event.over) {
      console.log('Drag over:', {
        activeId: event.active.id,
        overId: event.over.id,
        activeData: event.active.data.current,
        overData: event.over.data.current
      });
    }
  };

  // Обработка завершения перетаскивания
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;

    console.log('=== DRAG END DEBUG ===');
    console.log('Active ID:', active.id);
    console.log('Over ID:', over?.id);
    console.log('Active Data:', active.data.current);
    console.log('Over Data:', over?.data.current);
    console.log('Available folders:', folders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })));
    console.log('Current folder ID:', currentFolderId);
    console.log('========================');

    // Если перетаскиваем папку для сортировки или вложения
    if (active.data.current?.type === 'folder-sortable') {
      const draggedFolderId = active.data.current.folderId;
      
      // Проверяем, если перетаскиваем папку на другую папку
      if (over?.data.current?.type === 'folder-sortable') {
        const targetFolderId = over.data.current.folderId;
        
        // Проверяем, что это не перетаскивание на саму себя
        if (draggedFolderId === targetFolderId) {
          console.log('Skipping reorder: same folder');
          return;
        }
        
        // ПРИОРИТЕТ: Сначала проверяем возможность вложения
        const draggedFolder = folders.find(f => f.id === draggedFolderId);
        const targetFolder = folders.find(f => f.id === targetFolderId);
        
        console.log('=== FOLDER COMPARISON ===');
        console.log('Dragged folder:', draggedFolder ? { id: draggedFolder.id, name: draggedFolder.name, parentId: draggedFolder.parentId } : 'NOT FOUND');
        console.log('Target folder:', targetFolder ? { id: targetFolder.id, name: targetFolder.name, parentId: targetFolder.parentId } : 'NOT FOUND');
        console.log('========================');
        
        if (draggedFolder && targetFolder) {
          // Проверяем, что целевая папка не является дочерней папкой перетаскиваемой папки
          const isTargetChildOfDragged = (checkFolderId: string): boolean => {
            const checkFolder = folders.find(f => f.id === checkFolderId);
            if (!checkFolder) return false;
            
            if (checkFolder.parentId === draggedFolderId) {
              return true;
            }
            
            if (checkFolder.parentId) {
              return isTargetChildOfDragged(checkFolder.parentId);
            }
            
            return false;
          };
          
          if (isTargetChildOfDragged(targetFolderId)) {
            console.log('Skipping move: would create circular reference');
            return;
          }
          
          // ПРОВЕРЯЕМ: Если папки находятся в разных родительских папках, это вложение
          console.log('=== PARENT ID COMPARISON ===');
          console.log('Dragged folder parentId:', draggedFolder.parentId);
          console.log('Target folder parentId:', targetFolder.parentId);
          console.log('Are they different?', draggedFolder.parentId !== targetFolder.parentId);
          console.log('============================');
          
          if (draggedFolder.parentId !== targetFolder.parentId) {
            console.log('🎯 NESTING: Moving folder to folder (nesting):', { draggedFolderId, targetFolderId });
            
            if (onMoveFolderToFolder) {
              onMoveFolderToFolder(draggedFolderId, targetFolderId);
            }
            return;
          }
          
          // ПРОВЕРЯЕМ: Если папки находятся в одной родительской папке
          if (draggedFolder.parentId === targetFolder.parentId) {
            // ЛОГИКА РАЗЛИЧЕНИЯ: Используем позицию для определения намерения
            // Если перетаскиваем в центр папки - это вложение
            // Если перетаскиваем между папками - это переупорядочивание
            
            // Для простоты, пока что всегда делаем переупорядочивание
            // Вложение папок будет добавлено позже через специальный механизм
            console.log('🔄 REORDERING: Reordering folders in same parent:', { draggedFolderId, targetFolderId });
            
            // Находим индексы папок в текущем уровне
            const currentLevelFolders = folders
              .filter(f => f.parentId === currentFolderId)
              .sort((a, b) => a.order - b.order);
            
            const oldIndex = currentLevelFolders.findIndex(f => f.id === draggedFolderId);
            const newIndex = currentLevelFolders.findIndex(f => f.id === targetFolderId);
                
            console.log('Current level folders:', currentLevelFolders.map(f => ({ id: f.id, name: f.name, order: f.order })));
            console.log('Old index:', oldIndex, 'New index:', newIndex);
            
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex && onReorderFolders) {
              // Вызываем обработчик с новым order
              onReorderFolders(draggedFolderId, newIndex);
            }
            return;
          }
        }
      }
    }
    
    // ЛОГИКА ВЛОЖЕНИЯ ПАПОК: Если перетаскиваем папку на другую папку
    // и это не переупорядочивание, то это вложение
    if (active.data.current?.type === 'folder-sortable' && over?.data.current?.type === 'folder-sortable') {
      const draggedFolderId = active.data.current.folderId;
      const targetFolderId = over.data.current.folderId;
      
      // Проверяем, что это не переупорядочивание
      if (draggedFolderId !== targetFolderId) {
        const draggedFolder = folders.find(f => f.id === draggedFolderId);
        const targetFolder = folders.find(f => f.id === targetFolderId);
        
        if (draggedFolder && targetFolder) {
          // Если папки в разных родителях, это вложение
          if (draggedFolder.parentId !== targetFolder.parentId) {
            console.log('🎯 NESTING: Moving folder to folder (nesting):', { draggedFolderId, targetFolderId });
            
            if (onMoveFolderToFolder) {
              onMoveFolderToFolder(draggedFolderId, targetFolderId);
            }
            return;
          }
          
          // Если папки в одном родителе, это тоже может быть вложением
          // если пользователь явно хочет вложить одну папку в другую
          if (draggedFolder.parentId === targetFolder.parentId) {
            console.log('🎯 NESTING: Moving folder to folder (nesting in same parent):', { draggedFolderId, targetFolderId });
            
            if (onMoveFolderToFolder) {
              onMoveFolderToFolder(draggedFolderId, targetFolderId);
            }
            return;
          }
        }
      }
    }

    // Проверяем, если перетаскиваем заметку на папку
    if (over && typeof over.id === 'string' && over.id.startsWith('folder-sortable-')) {
      const folderId = over.id.replace('folder-sortable-', '');
      const noteId = active.id as string;
      
      console.log('🎯 MOVING NOTE TO FOLDER:', { noteId, folderId, overId: over.id });
      
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
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
            activeId={activeId}
            overId={overId}
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

