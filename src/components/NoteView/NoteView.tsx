/**
 * @file: NoteView.tsx
 * @description: Полноэкранный вид заметки с возможностью редактирования
 * @dependencies: React, shadcn/ui components
 * @created: 2025-10-15
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditorArea } from '@/components/Editor';
import { ArrowLeft, Trash2, Save } from 'lucide-react';

interface NoteViewProps {
  noteId: string;
  noteTitle: string;
  onBack: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({
  noteId: _noteId,
  noteTitle,
  onBack,
  onSave,
  onDelete,
  onTitleChange,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(noteTitle);
  const handleSave = () => {
    onSave?.();
  };

  const handleDelete = () => {
    onDelete?.();
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() !== noteTitle) {
      onTitleChange?.(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(noteTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Note Header */}
      <header className="border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              title="Вернуться к списку заметок"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                autoFocus
              />
            ) : (
              <h1 
                className="text-lg font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={handleTitleClick}
                title="Кликните для редактирования названия"
              >
                {noteTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSave}
              title="Сохранить заметку"
            >
              <Save className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDelete}
              title="Удалить заметку"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        <EditorArea 
          noteTitle={noteTitle} 
          hasNote={true}
          isInModal={false}
        />
      </div>
    </div>
  );
};
