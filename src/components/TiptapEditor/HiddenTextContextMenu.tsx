/**
 * @file: HiddenTextContextMenu.tsx
 * @description: Context menu для скрытия/раскрытия текста
 * @created: 2025-10-17
 */

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Eye, EyeOff } from 'lucide-react';
import { TextSelection } from '@tiptap/pm/state';

interface HiddenTextContextMenuProps {
  editor: Editor | null;
}

export const HiddenTextContextMenu: React.FC<HiddenTextContextMenuProps> = ({ editor }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(false);

  // Вспомогательная функция для поиска hidden text span содержащего позицию
  const findHiddenTextAtPos = (pos: number): { start: number; end: number } | null => {
    if (!editor) return null;

    let result: { start: number; end: number } | null = null;

    // Проходим по всем текстовым узлам в документе
    editor.state.doc.nodesBetween(0, editor.state.doc.content.size, (node, nodeStart) => {
      if (node.isText) {
        // Проверяем есть ли hiddenText mark в этом текстовом узле
        const hasHiddenMark = node.marks.some((mark) => mark.type.name === 'hiddenText');

        if (hasHiddenMark) {
          const nodeEnd = nodeStart + node.nodeSize;

          // Проверяем находится ли cursor в этом узле
          if (pos > nodeStart && pos <= nodeEnd) {
            result = { start: nodeStart, end: nodeEnd };
            return false; // Stop iteration
          }
        }
      }
      return true; // Continue iteration
    });

    return result;
  };

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      const { selection } = editor.state;
      const { $from, $to } = selection;
      let hasHiddenText = false;

      if (!selection.empty) {
        // Если есть выделение, проверяем содержит ли оно скрытый текст
        editor.state.doc.nodesBetween($from.pos, $to.pos, (node) => {
          if (node.marks.some((mark) => mark.type.name === 'hiddenText')) {
            hasHiddenText = true;
          }
        });
      } else {
        // Если нет выделения, ищем скрытый текст в текущей позиции курсора
        const hiddenSpan = findHiddenTextAtPos($from.pos);
        if (hiddenSpan) {
          hasHiddenText = true;
          // Выделяем скрытый span
          const start = editor.state.doc.resolve(hiddenSpan.start);
          const end = editor.state.doc.resolve(hiddenSpan.end);
          editor.view.dispatch(editor.state.tr.setSelection(new TextSelection(start, end)));
        }
      }

      // Если нет скрытого текста, скрываем меню
      if (!hasHiddenText) {
        setShowMenu(false);
        return;
      }

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
      // Для скрытия нужно применить mark к выделению
      editor.chain().focus().toggleMark('hiddenText').run();
    } else {
      // Для раскрытия нужно удалить mark
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
