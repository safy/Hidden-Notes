/**
 * @file: TiptapEditor.tsx
 * @description: Основной Tiptap редактор с полным функционалом
 * @dependencies: @tiptap/react, @tiptap/starter-kit, React
 * @created: 2025-10-15
 */

import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import { TableCellEnhanced } from './extensions/TableCellEnhanced';
import { TableHeaderEnhanced } from './extensions/TableHeaderEnhanced';
import { ImageResize } from './extensions/ImageResize';
import { LinkBubbleMenu } from './LinkBubbleMenu';
import { HiddenText } from '@/extensions/HiddenText';
import { HiddenContextMenu } from './HiddenContextMenu';
import { DragHandle as DragHandleComponent } from './DragHandle';
import { ImageFloatingMenu } from './ImageFloatingMenu';

interface TiptapEditorProps {
  content?: string;
  onUpdate?: (content: string) => void;
  onEditorReady?: (editor: Editor) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  isCreatingLink?: boolean;
  onLinkCreated?: () => void;
  noteId?: string; // ID текущей заметки для сохранения изображений
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content = '',
  onUpdate,
  onEditorReady,
  placeholder = 'Начните писать...',
  editable = true,
  className = '',
  isCreatingLink = false,
  onLinkCreated,
  noteId,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      Underline,
      Color.configure({
        types: [TextStyle.name],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ImageResize.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'task-item',
        },
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeaderEnhanced,
      TableCellEnhanced,
      HiddenText,
      // NOTE: DragHandle НЕ добавляется! DragHandleComponent его регистрирует автоматически
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('📝 Editor content updated, HTML preview:', html.substring(0, 200));
      
      // Проверяем изображения в контенте
      const imgMatches = html.match(/<img[^>]*>/g);
      if (imgMatches) {
        console.log('🖼️ Images in content:', imgMatches.length);
        imgMatches.forEach((img, i) => {
          const widthMatch = img.match(/width="(\d+)"/);
          const heightMatch = img.match(/height="(\d+)"/);
          console.log(`  Image ${i + 1}:`, {
            hasWidth: !!widthMatch,
            width: widthMatch?.[1],
            hasHeight: !!heightMatch,
            height: heightMatch?.[1],
          });
        });
      }
      
      onUpdate?.(html);
    },
    onCreate: ({ editor }) => {
      // Уведомляем о создании editor
      if (onEditorReady) {
        onEditorReady(editor);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${className}`,
      },
    },
  });

  // onCreate уже обрабатывает уведомление о готовности editor

  // Обработчик кликов по ссылкам
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        event.preventDefault();
        const href = link.getAttribute('href');
        
        if (href) {
          // Проверяем, что это валидный URL
          try {
            const url = new URL(href);
            // Открываем ссылку в новой вкладке
            window.open(url.toString(), '_blank', 'noopener,noreferrer');
          } catch (error) {
            // Если URL невалидный, пытаемся открыть как относительный
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  // Обработчик drag & drop для изображений
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      
      // Проверяем, есть ли файлы изображений
      const hasImages = Array.from(event.dataTransfer?.items || []).some(
        item => item.kind === 'file' && item.type.startsWith('image/')
      );
      
      if (hasImages) {
        event.dataTransfer!.dropEffect = 'copy';
        editorElement.classList.add('drag-over');
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      // Проверяем, что мы действительно покидаем область редактора
      if (!editorElement.contains(event.relatedTarget as Node)) {
        editorElement.classList.remove('drag-over');
      }
    };

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      editorElement.classList.remove('drag-over');
      
      const files = Array.from(event.dataTransfer?.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) return;

      // Берем первое изображение
      const imageFile = imageFiles[0];
      
      if (!imageFile) return;
      
      // Импортируем утилиты для обработки изображений
      const { processImageForStorage } = await import('@/lib/image-storage');
      
      try {
        // Используем noteId или генерируем временный
        const currentNoteId = noteId || `temp-${Date.now()}`;
        
        // Обрабатываем изображение (сжатие + сохранение)
        const { dataUrl, useIndexedDB, imageId } = await processImageForStorage(imageFile, currentNoteId);
        
        // Вставляем изображение в редактор
        const imageAttrs: any = {
          src: dataUrl,
          alt: imageFile.name || 'Вставленное изображение',
        };
        
        // Добавляем атрибуты для IndexedDB если нужно
        if (useIndexedDB && imageId) {
          imageAttrs['data-image-id'] = imageId;
          imageAttrs['data-use-indexeddb'] = 'true';
          imageAttrs['data-note-id'] = currentNoteId;
        }
        
        editor.chain().focus().setImage(imageAttrs).run();
      } catch (error) {
        console.error('Ошибка обработки изображения:', error);
        // Fallback: используем старый метод если сжатие не удалось
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          if (imageUrl) {
            editor.chain().focus().setImage({ 
              src: imageUrl, 
              alt: imageFile.name || 'Вставленное изображение'
            }).run();
          }
        };
        reader.readAsDataURL(imageFile);
      }
    };

    // Добавляем обработчики событий
    editorElement.addEventListener('dragover', handleDragOver);
    editorElement.addEventListener('dragleave', handleDragLeave);
    editorElement.addEventListener('drop', handleDrop);

    return () => {
      editorElement.removeEventListener('dragover', handleDragOver);
      editorElement.removeEventListener('dragleave', handleDragLeave);
      editorElement.removeEventListener('drop', handleDrop);
    };
  }, [editor, noteId]);

  // Обновляем контент при изменении props
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Устанавливаем placeholder
  useEffect(() => {
    if (editor && placeholder) {
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          attributes: {
            ...editor.options.editorProps?.attributes,
            'data-placeholder': placeholder,
          },
        },
      });
    }
  }, [editor, placeholder]);

  return (
    <div className="tiptap-editor relative">
      {editor && (
        <>
          {console.log('🎯 Rendering DragHandleComponent', editor ? 'with editor' : 'without editor')}
          <DragHandleComponent editor={editor} />
          <LinkBubbleMenu 
            editor={editor} 
            isCreatingLink={isCreatingLink}
            onLinkCreated={onLinkCreated}
          />
          <ImageFloatingMenu editor={editor} />
          <HiddenContextMenu editor={editor} />
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
