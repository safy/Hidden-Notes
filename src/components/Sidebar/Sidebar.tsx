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
import { useTranslation } from 'react-i18next';

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
  onCreateFolder?: () => void;
  onFolderSelect?: (folderId: string | null) => void;
  onBackToRoot?: () => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string) => void;
  onMoveFolderToFolder?: (folderId: string, targetFolderId: string | null) => void;
  onReorderFolders?: (folderId: string, newOrder: number) => void;
  onEditFolder?: (folder: any) => void;
  onOpenArchive?: () => void;
  onOpenTrash?: () => void;
  searchQuery?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  notes = [],
  folders: _folders = [],
  currentFolderId = null,
  onNoteSelect, 
  onNotesReorder, 
  onNoteArchive,
  onNoteDelete,
  onNoteColorChange,
  onMoveToFolder,
  onCreateFolder: _onCreateFolder,
  onFolderSelect,
  onBackToRoot,
  onMoveNoteToFolder,
  onMoveFolderToFolder,
  onReorderFolders: _onReorderFolders,
  onEditFolder,
  onOpenArchive,
  onOpenTrash,
  searchQuery = '' 
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState(notes);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Обновляем items когда props.notes меняются
  useEffect(() => {
    setItems(notes);
  }, [notes]);

  // Отслеживаем нажатие Shift для вложения
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

    console.log('=== DRAG END DEBUG ===');
    console.log('Active ID:', active.id);
    console.log('Over ID:', over?.id);
    console.log('Active Data:', active.data.current);
    console.log('Over Data:', over?.data.current);
    console.log('========================');

    // Проверяем, если перетаскиваем папку на папку
    if (active.data.current?.type === 'folder' && over?.data.current?.type === 'folder') {
      const draggedFolderId = active.data.current.folderId;
        const targetFolderId = over.data.current.folderId;
        
        // Проверяем, что это не перетаскивание на саму себя
      if (draggedFolderId !== targetFolderId) {
        // Находим папки в массиве folders
        const draggedFolder = _folders.find((f: any) => f.id === draggedFolderId);
        const targetFolder = _folders.find((f: any) => f.id === targetFolderId);
        
        if (draggedFolder && targetFolder) {
          // ЛОГИКА РАЗЛИЧЕНИЯ:
          // Если обе папки отображаются в текущем уровне (currentFolderId)
          // И имеют одинаковый parentId - это переупорядочивание
          // Иначе - это вложение
          
          const currentLevelFolders = _folders
            .filter((f: any) => f.parentId === currentFolderId)
            .map((f: any) => f.id);
          
          const bothInCurrentLevel = 
            currentLevelFolders.includes(draggedFolderId) && 
            currentLevelFolders.includes(targetFolderId);
          
          const sameParent = draggedFolder.parentId === targetFolder.parentId;
          
          console.log('=== OPERATION DETECTION ===');
          console.log('Both in current level:', bothInCurrentLevel);
          console.log('Same parent:', sameParent);
          console.log('Shift pressed:', isShiftPressed);
          console.log('Current folder ID:', currentFolderId);
          console.log('Dragged parentId:', draggedFolder.parentId);
          console.log('Target parentId:', targetFolder.parentId);
          
          // ЛОГИКА:
          // - Shift зажат = ВЛОЖЕНИЕ (независимо от уровня)
          // - Shift не зажат + обе на одном уровне = ПЕРЕУПОРЯДОЧИВАНИЕ
          // - Shift не зажат + разные уровни = ВЛОЖЕНИЕ (по умолчанию)
          
          if (isShiftPressed) {
            // ВЛОЖЕНИЕ: Shift зажат
            console.log('🎯 NESTING: Shift key pressed');
            console.log('onMoveFolderToFolder exists:', !!onMoveFolderToFolder);
            
            if (onMoveFolderToFolder) {
              console.log('Calling onMoveFolderToFolder with:', { draggedFolderId, targetFolderId });
              onMoveFolderToFolder(draggedFolderId, targetFolderId);
            } else {
              console.error('❌ onMoveFolderToFolder is not defined');
            }
            return;
          } else if (bothInCurrentLevel && sameParent) {
            // ПЕРЕУПОРЯДОЧИВАНИЕ: обе папки на одном уровне
            console.log('🔄 REORDERING: Reordering folders in same level');
            console.log('_onReorderFolders exists:', !!_onReorderFolders);
            
            if (_onReorderFolders) {
              // Получаем отсортированные папки текущего уровня
              const sortedCurrentLevel = _folders
                .filter((f: any) => f.parentId === currentFolderId)
                .sort((a: any, b: any) => a.order - b.order);
              
              const oldIndex = sortedCurrentLevel.findIndex((f: any) => f.id === draggedFolderId);
              const newIndex = sortedCurrentLevel.findIndex((f: any) => f.id === targetFolderId);
              
            console.log('Old index:', oldIndex, 'New index:', newIndex);
            
              if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                // Используем arrayMove для правильного вычисления порядка
                const reorderedFolders = arrayMove(sortedCurrentLevel, oldIndex, newIndex);
                
                // Обновляем order для каждой папки
                console.log('Reordering folders...');
                reorderedFolders.forEach((folder: any, index: number) => {
                  if (folder.id === draggedFolderId) {
                    console.log('Setting new order for dragged folder:', index);
                    _onReorderFolders(draggedFolderId, index);
                  }
                });
              } else {
                console.error('❌ Invalid indices:', { oldIndex, newIndex });
              }
            } else {
              console.error('❌ _onReorderFolders is not defined');
            }
            return;
          } else {
            // ВЛОЖЕНИЕ: папки на разных уровнях или разных родителях
            console.log('🎯 NESTING: Moving folder to folder');
            console.log('onMoveFolderToFolder exists:', !!onMoveFolderToFolder);
            
            if (onMoveFolderToFolder) {
              console.log('Calling onMoveFolderToFolder with:', { draggedFolderId, targetFolderId });
              onMoveFolderToFolder(draggedFolderId, targetFolderId);
            } else {
              console.error('❌ onMoveFolderToFolder is not defined');
            }
            return;
          }
        }
      }
    }

    // Проверяем, если перетаскиваем заметку на папку
    if (over && typeof over.id === 'string' && over.id.startsWith('folder-')) {
      const folderId = over.id.replace('folder-', '');
      const noteId = active.id as string;
      
      // Проверяем, что это действительно заметка, а не папка
      if (active.data.current?.type === 'folder') {
        console.log('⚠️ Skipping note move: active item is a folder, not a note');
        return;
      }
      
      console.log('🎯 MOVING NOTE TO FOLDER:', { noteId, folderId });
      
      if (onMoveNoteToFolder) {
        onMoveNoteToFolder(noteId, folderId);
      }
      return;
    }

    // Обычная сортировка заметок
    if (active.id !== over?.id) {
      // Проверяем, что это действительно заметки, а не папки
      if (active.data.current?.type === 'folder' || over?.data.current?.type === 'folder') {
        console.log('⚠️ Skipping note reorder: one of the items is a folder');
        return;
      }
      
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
              {searchQuery ? t('notes.notFound', { defaultValue: 'Notes not found' }) : t('notes.empty', { defaultValue: 'No notes' })}
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
                {t('notes.foundOf', { defaultValue: 'Found' })}: {filteredNotes.length} {t('common.of', { defaultValue: 'of' })} {items.length}
              </div>
            )}
            {filteredNotes.length} {filteredNotes.length === 1 ? t('notes.one', { defaultValue: 'note' }) : t('notes.many', { defaultValue: 'notes' })}
          </div>
        </div>
      </div>
    </DndContext>
  );
};

