/**
 * @file: HiddenTextContextMenu.tsx
 * @description: Context menu для скрытия/раскрытия текста
 * @created: 2025-10-17
 */

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Eye, EyeOff } from 'lucide-react';

interface HiddenTextContextMenuProps {
  editor: Editor | null;
}

export const HiddenTextContextMenu: React.FC<HiddenTextContextMenuProps> = ({ editor }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // Проверяем есть ли выделение
      const { selection } = editor.state;
      if (selection.empty) {
        setShowMenu(false);
        return;
      }

      // Проверяем содержит ли выделение скрытый текст
      let hasHiddenText = false;
      editor.state.doc.nodesBetween(selection.$from.pos, selection.$to.pos, (node) => {
        if (node.marks.some((mark) => mark.type.name === 'hiddenText')) {
          hasHiddenText = true;
        }
      });

      setIsHidden(hasHiddenText);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    };

    const handleClick = () => {
      setShowMenu(false);
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, [editor]);

  const toggleHiddenText = (hide: boolean) => {
    if (!editor) return;

    if (hide) {
      editor.chain().focus().setMark('hiddenText').run();
    } else {
      editor.chain().focus().unsetMark('hiddenText').run();
    }

    setShowMenu(false);
  };

  if (!showMenu) return null;

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50 flex gap-2"
      style={{ top: `${menuPos.y}px`, left: `${menuPos.x}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {isHidden ? (
        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={() => toggleHiddenText(false)}
          title="Убрать скрытие"
        >
          <EyeOff className="h-5 w-5 text-gray-700" />
        </button>
      ) : (
        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={() => toggleHiddenText(true)}
          title="Скрыть текст"
        >
          <Eye className="h-5 w-5 text-gray-700" />
        </button>
      )}
    </div>
  );
};
