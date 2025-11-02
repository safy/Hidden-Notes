/**
 * @file: Toolbar.tsx
 * @description: Панель инструментов для Tiptap редактора
 * @dependencies: React, @tiptap/react, shadcn/ui, lucide-react
 * @created: 2025-10-15
 */

import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Image as ImageIcon,
  Undo,
  Redo,
  Highlighter,
  RotateCcw,
} from 'lucide-react';
import { TableTriggerButton } from './TableTriggerButton';

interface ToolbarProps {
  editor: Editor | null;
  onAddLink?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor, onAddLink }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    // Render empty toolbar structure while editor is loading
    return (
      <div className="border-b border-border p-2 bg-muted/30">
        <div className="flex items-center gap-1 flex-wrap opacity-50">
          <div className="w-8 h-8 bg-muted rounded" />
          <div className="w-8 h-8 bg-muted rounded" />
          <div className="w-8 h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Цвета для выделения текста
  const highlightColors = [
    { color: '#fef3c7', label: 'Желтый' },      // amber-100
    { color: '#d1fae5', label: 'Зеленый' },     // emerald-100
    { color: '#fecdd3', label: 'Розовый' },     // rose-100
    { color: '#ddd6fe', label: 'Фиолетовый' },  // violet-100
    { color: '#bfdbfe', label: 'Синий' },       // blue-100
  ];

  const setHighlight = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
  };

  const removeHighlight = () => {
    editor.chain().focus().unsetHighlight().run();
  };

  const addImage = () => {
    // Открываем диалог выбора файла
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageFile = files[0];
    
    // Проверяем что файл существует и это изображение
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      console.warn('Выбранный файл не является изображением');
      return;
    }

    // Создаем FileReader для чтения файла
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      if (imageUrl) {
        // Вставляем изображение в редактор
        editor.chain().focus().setImage({ 
          src: imageUrl, 
          alt: imageFile.name || 'Загруженное изображение'
        }).run();
      }
    };
    
    reader.onerror = () => {
      console.error('Ошибка чтения файла изображения');
    };
    
    // Читаем файл как data URL (base64)
    reader.readAsDataURL(imageFile);
    
    // Сбрасываем значение input чтобы можно было выбрать тот же файл снова
    event.target.value = '';
  };

  const addLink = () => {
    // Устанавливаем focus на редактор чтобы BubbleMenu пересчитал shouldShow
    editor.chain().focus().run();
    
    // Вызываем callback который активирует режим создания ссылки
    onAddLink?.();
  };


  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
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

        {/* Clear Formatting */}
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFormatting}
          title="Очистить форматирование"
        >
          <RotateCcw className="h-4 w-4" />
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

        {/* Highlight Color Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={editor.isActive('highlight') ? 'default' : 'ghost'}
              size="icon"
              title="Выделить текст"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto p-2">
            <div className="flex gap-1">
              {highlightColors.map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() => setHighlight(color)}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-600 transition-colors"
                  style={{ backgroundColor: color }}
                  title={label}
                  aria-label={`Выделить ${label}`}
                />
              ))}
              {/* Кнопка для удаления выделения */}
              <button
                onClick={removeHighlight}
                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center bg-white"
                title="Убрать выделение"
                aria-label="Убрать выделение"
              >
                <span className="text-xs text-gray-600">✕</span>
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
          variant={editor.isActive('taskList') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Список задач"
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
          variant="ghost"
          size="icon"
          onClick={addImage}
          title="Добавить изображение"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <TableTriggerButton editor={editor} />
      </div>
      
      {/* Скрытый input для загрузки изображений */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Загрузить изображение"
      />
    </div>
  );
};
