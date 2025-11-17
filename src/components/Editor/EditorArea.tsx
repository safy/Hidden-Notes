/**
 * @file: EditorArea.tsx
 * @description: Область редактирования заметок с Tiptap
 * @dependencies: React, @tiptap/react, shadcn/ui components
 * @created: 2025-10-15
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TiptapEditor } from '@/components/TiptapEditor/TiptapEditor';
import { Toolbar } from '@/components/TiptapEditor/Toolbar';
import { TableToolbar } from '@/components/TiptapEditor/TableToolbar';
import { Editor } from '@tiptap/react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface EditorAreaProps {
  noteTitle?: string;
  hasNote?: boolean;
  isInModal?: boolean; // Renamed from isInModal to better reflect its use in NoteView
  onContentChange?: (content: string) => void;
  initialContent?: string;
  noteId?: string; // ID текущей заметки для сохранения изображений
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const EditorArea: React.FC<EditorAreaProps> = ({
  hasNote = true,
  isInModal = false, // Default to false, meaning it's not in a modal/NoteView context
  onContentChange,
  initialContent = '',
  noteId,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [content, setContent] = useState(initialContent);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isInTable, setIsInTable] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const savedIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced auto-save with 1000ms delay and status tracking
  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent);
    setSaveStatus('saving');
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(async () => {
      try {
        await onContentChange?.(newContent);
        setSaveStatus('saved');
        
        // Скрываем индикатор "Saved" через 2 секунды
        savedIndicatorTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Error saving note:', error);
        setSaveStatus('error');
        
        // Показываем ошибку 5 секунд, затем возвращаемся к idle
        savedIndicatorTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 5000);
      }
    }, 1000);
  }, [onContentChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  // Предотвращаем потерю данных при закрытии панели
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Обновляем content когда меняется initialContent (при открытии другой заметки)
  useEffect(() => {
    if (initialContent !== content) {
      setContent(initialContent);
    }
  }, [initialContent]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorReady = (editorInstance: Editor) => {
    setEditor(editorInstance);
  };

  // Отслеживаем позицию курсора для определения нахождения в таблице
  useEffect(() => {
    if (!editor) return;

    const checkIfInTable = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      
      // Проверяем родительские узлы на наличие таблицы
      for (let i = $from.depth; i > 0; i--) {
        const node = $from.node(i);
        if (node.type.name === 'table') {
          setIsInTable(true);
          return;
        }
      }
      
      setIsInTable(false);
    };

    // Проверяем при инициализации
    checkIfInTable();

    // Подписываемся на обновления транзакций
    const handleTransaction = () => {
      checkIfInTable();
    };

    editor.on('transaction', handleTransaction);
    editor.on('selectionUpdate', handleTransaction);

    return () => {
      editor.off('transaction', handleTransaction);
      editor.off('selectionUpdate', handleTransaction);
    };
  }, [editor]);

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
      {/* Conditional Toolbar - показываем TableToolbar когда курсор в таблице */}
      {isInTable ? (
        <TableToolbar editor={editor} />
      ) : (
        <Toolbar 
          editor={editor} 
          onAddLink={() => setIsCreatingLink(true)}
          noteId={noteId}
        />
      )}

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
            noteId={noteId}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex-1 text-center">
            Слов: {content.split(/\s+/).filter(word => word.length > 0).length} | Символов: {content.length} | Время чтения: {Math.ceil(content.split(/\s+/).filter(word => word.length > 0).length / 200)} мин
          </div>
          
          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-1.5 px-3">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  <span className="text-blue-500">Сохранение...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Сохранено</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">Ошибка сохранения</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};