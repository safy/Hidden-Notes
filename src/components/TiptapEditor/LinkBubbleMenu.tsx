/**
 * @file: LinkBubbleMenu.tsx
 * @description: Всплывающая панель для работы со ссылками
 * @dependencies: @tiptap/react, shadcn/ui
 * @created: 2025-10-16
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Link2Off, ExternalLink, Check, X } from 'lucide-react';

interface LinkBubbleMenuProps {
  editor: Editor;
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor }) => {
  const [url, setUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Обновляем URL когда открывается меню на существующей ссылке
  useEffect(() => {
    if (editor.isActive('link')) {
      const { href } = editor.getAttributes('link');
      setUrl(href || '');
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!url) {
      editor.chain().focus().unsetLink().run();
      setIsEditing(false);
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
  }, [editor, url]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setUrl('');
    setIsEditing(false);
  }, [editor]);

  const openLink = useCallback(() => {
    const { href } = editor.getAttributes('link');
    if (href) {
      window.open(href, '_blank');
    }
  }, [editor]);

  // Показываем меню только когда курсор на существующей ссылке
  const shouldShow = useCallback(
    ({ editor }: { editor: Editor }) => {
      // Показываем только если курсор на существующей ссылке (для редактирования)
      return editor.isActive('link');
    },
    []
  );

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        maxWidth: '500px',
      }}
      shouldShow={shouldShow}
      className="bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-2"
    >
      {editor.isActive('link') && !isEditing ? (
        // Режим просмотра существующей ссылки
        <>
          <div className="flex items-center gap-2 px-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <a
              href={editor.getAttributes('link').href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline max-w-[200px] truncate"
            >
              {editor.getAttributes('link').href}
            </a>
          </div>

          <div className="h-4 w-px bg-border" />

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
              }
            }}
            className="h-8 w-[300px] text-sm"
            autoFocus
          />

          <Button
            variant="default"
            size="icon"
            className="h-8 w-8"
            onClick={setLink}
            disabled={!url}
            title="Сохранить"
          >
            <Check className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setIsEditing(false);
              setUrl('');
            }}
            title="Отмена"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </BubbleMenu>
  );
};

