/**
 * @file: Toolbar.tsx
 * @description: Панель инструментов для Tiptap редактора
 * @dependencies: React, @tiptap/react, shadcn/ui, lucide-react
 * @created: 2025-10-15
 */

import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Link2Off,
  Image,
  Table,
  Undo,
  Redo,
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Введите URL изображения:');
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: 'Вставленное изображение' }).run();
    }
  };

  const addLink = () => {
    // Если текст не выделен, выделяем слово под курсором
    if (editor.state.selection.empty) {
      editor.chain().focus().selectTextblockStart().run();
    }
    // BubbleMenu автоматически появится при выделении
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border-b border-border p-2 bg-muted/30">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Отменить"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Повторить"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Жирный"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Курсив"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Подчеркнутый"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Зачеркнутый"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Код"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Заголовок 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Заголовок 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Заголовок 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Маркированный список"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('Task list not yet implemented');
          }}
          title="Список задач (скоро)"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Block Elements */}
        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Цитата"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Горизонтальная линия"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Alignment */}
        <Button
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Выровнять по левому краю"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Выровнять по центру"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Выровнять по правому краю"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Выровнять по ширине"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Insert Elements */}
        <Button
          variant="ghost"
          size="icon"
          onClick={addLink}
          title="Добавить ссылку"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="icon"
          onClick={removeLink}
          disabled={!editor.isActive('link')}
          title="Удалить ссылку"
        >
          <Link2Off className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={addImage}
          title="Добавить изображение"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={addTable}
          title="Добавить таблицу"
        >
          <Table className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
