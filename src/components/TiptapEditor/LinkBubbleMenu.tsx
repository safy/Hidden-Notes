/**
 * @file: LinkBubbleMenu.tsx
 * @description: Всплывающая панель для работы со ссылками
 * @dependencies: @tiptap/react, shadcn/ui
 * @created: 2025-10-16
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Link2Off, ExternalLink, Check } from 'lucide-react';

interface LinkBubbleMenuProps {
  editor: Editor;
  isCreatingLink?: boolean;
  onLinkCreated?: () => void;
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ 
  editor, 
  isCreatingLink = false,
  onLinkCreated 
}) => {
  const [url, setUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Используем ref чтобы всегда иметь актуальное значение isCreatingLink в shouldShow
  const isCreatingLinkRef = useRef(isCreatingLink);
  
  useEffect(() => {
    isCreatingLinkRef.current = isCreatingLink;
  }, [isCreatingLink]);

  // Обновляем URL когда открывается меню на существующей ссылке
  useEffect(() => {
    if (editor.isActive('link')) {
      const { href } = editor.getAttributes('link');
      setUrl(href || '');
    }
  }, [editor]);

  // Принудительно обновляем когда isCreatingLink меняется
  useEffect(() => {
    if (isCreatingLink) {
      // Устанавливаем focus чтобы BubbleMenu пересчитал shouldShow
      editor.chain().focus().run();
    }
  }, [isCreatingLink, editor]);

  const setLink = useCallback(() => {
    if (!url) {
      editor.chain().focus().unsetLink().run();
      setIsEditing(false);
      onLinkCreated?.();
      return;
    }

    // Проверяем что URL начинается с http:// или https://
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = 'https://' + url;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: formattedUrl })
      .run();

    setIsEditing(false);
    setUrl('');
    onLinkCreated?.();
  }, [editor, url, onLinkCreated]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setUrl('');
    setIsEditing(false);
    onLinkCreated?.();
  }, [editor, onLinkCreated]);

  const openLink = useCallback(() => {
    // Получаем URL из существующей ссылки или из input поля
    const { href } = editor.getAttributes('link');
    const linkUrl = href || url;
    
    if (linkUrl) {
      // Добавляем https:// если нужно
      let formattedUrl = linkUrl;
      if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
        formattedUrl = 'https://' + linkUrl;
      }
      window.open(formattedUrl, '_blank');
    }
  }, [editor, url]);

  // Показываем меню когда:
  // 1. Нажата кнопка "добавить ссылку" (создание новой ссылки)
  // 2. Курсор на существующей ссылке (редактирование)
  const shouldShow = useCallback(
    ({ editor }: { editor: Editor }) => {
      // Используем ref.current для получения актуального значения
      const isCreating = isCreatingLinkRef.current;
      
      // Режим редактирования: курсор на существующей ссылке
      const isEditingExisting = editor.isActive('link');
      
      return isCreating || isEditingExisting;
    },
    [] // Пустой массив зависимостей, используем ref
  );

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        maxWidth: 'min(90vw, 500px)', // Адаптивная максимальная ширина
      }}
      shouldShow={shouldShow}
      className="bg-background border border-border rounded-lg shadow-lg p-2 flex flex-wrap items-center gap-2 max-w-[90vw]"
    >
      {editor.isActive('link') && !isEditing && !isCreatingLink ? (
        // Режим просмотра существующей ссылки
        <>
          <div className="flex items-center gap-2 px-2 min-w-0 flex-1">
            <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a
              href={editor.getAttributes('link').href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline max-w-[200px] truncate"
            >
              {editor.getAttributes('link').href}
            </a>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={openLink}
              title="Открыть ссылку"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditing(true)}
              title="Редактировать ссылку"
            >
              <Link2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={removeLink}
              title="Удалить ссылку"
            >
              <Link2Off className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        // Режим создания/редактирования ссылки
        <>
          <Input
            type="url"
            placeholder="Вставьте ссылку..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setLink();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setIsEditing(false);
                onLinkCreated?.();
              }
            }}
            className="h-8 min-w-[180px] w-full max-w-[300px] text-sm flex-1"
            autoFocus
          />

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={setLink}
              disabled={!url}
              title="Сохранить ссылку"
            >
              <Check className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={openLink}
              disabled={!url}
              title="Открыть ссылку"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={removeLink}
              title="Удалить ссылку"
            >
              <Link2Off className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </BubbleMenu>
  );
};

