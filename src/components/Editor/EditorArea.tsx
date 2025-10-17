/**
 * @file: EditorArea.tsx
 * @description: Область редактирования заметок с Tiptap
 * @dependencies: React, @tiptap/react, shadcn/ui components
 * @created: 2025-10-15
 */

import React, { useState, useCallback, useRef } from 'react';
import { TiptapEditor } from '@/components/TiptapEditor/TiptapEditor';
import { Toolbar } from '@/components/TiptapEditor/Toolbar';
import { Editor } from '@tiptap/react';

interface EditorAreaProps {
  noteTitle?: string;
  hasNote?: boolean;
  isInModal?: boolean; // Renamed from isInModal to better reflect its use in NoteView
  onContentChange?: (content: string) => void;
  initialContent?: string;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  hasNote = true,
  isInModal = false, // Default to false, meaning it's not in a modal/NoteView context
  onContentChange,
  initialContent = '',
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [content, setContent] = useState(initialContent);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced auto-save with 1000ms delay
  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      onContentChange?.(newContent);
    }, 1000);
  }, [onContentChange]);

  const handleEditorReady = (editorInstance: Editor) => {
    setEditor(editorInstance);
  };

  if (!hasNote) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">📝</div>
          <h2 className="text-2xl font-semibold">Начните новую заметку</h2>
          <p className="text-muted-foreground">
            Нажмите "Новая заметка" вверху, чтобы создать свою первую заметку.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${isInModal ? 'h-full' : 'h-full'}`}>
      {/* Toolbar */}
      <Toolbar 
        editor={editor} 
        onAddLink={() => setIsCreatingLink(true)}
      />

      {/* Editor Content */}
      <div className={`flex-1 overflow-y-auto ${isInModal ? 'p-4' : 'p-6'}`}>
        <div className={`${isInModal ? 'max-w-none' : 'max-w-4xl'} mx-auto`}>
          <TiptapEditor
            content={content}
            onUpdate={handleContentUpdate}
            onEditorReady={handleEditorReady}
            placeholder="Начните писать заметку..."
            className="min-h-[400px]"
            isCreatingLink={isCreatingLink}
            onLinkCreated={() => setIsCreatingLink(false)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="text-xs text-muted-foreground text-center">
          Слов: {content.split(/\s+/).filter(word => word.length > 0).length} | Символов: {content.length} | Время чтения: {Math.ceil(content.split(/\s+/).filter(word => word.length > 0).length / 200)} мин
        </div>
      </div>
    </div>
  );
};