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
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

interface TiptapEditorProps {
  content?: string;
  onUpdate?: (content: string) => void;
  onEditorReady?: (editor: Editor) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content = '',
  onUpdate,
  onEditorReady,
  placeholder = 'Начните писать...',
  editable = true,
  className = '',
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
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
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
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
    </div>
  );
};
