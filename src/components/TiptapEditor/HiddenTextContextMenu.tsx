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
      console.log('🔍 Context menu handler triggered!');

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
        console.log('📋 Has selection, hasHiddenText:', hasHiddenText);
      } else {
        // Если нет выделения, ищем скрытый текст в текущей позиции курсора
        const hiddenSpan = findHiddenTextAtPos($from.pos);
        console.log('🔎 No selection, hiddenSpan:', hiddenSpan);
        if (hiddenSpan) {
          hasHiddenText = true;
          // Выделяем скрытый span
          const start = editor.state.doc.resolve(hiddenSpan.start);
          const end = editor.state.doc.resolve(hiddenSpan.end);
          editor.view.dispatch(editor.state.tr.setSelection(new TextSelection(start, end)));
        }
      }

      // Если есть выделение, показываем меню
      if (selection.empty && !hasHiddenText) {
        console.log('❌ No selection and no hidden text, hiding menu');
        setShowMenu(false);
        return;
      }

      setIsHidden(hasHiddenText);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
      console.log('✅ Showing menu! isHidden:', hasHiddenText);
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

    console.log('🔘 toggleHiddenText called, hide:', hide);

    // Сохраняем текущее выделение
    const { selection } = editor.state;
    console.log('Current selection:', selection.$from.pos, '-', selection.$to.pos);

    if (hide) {
      // Для скрытия:
      // 1. Применяем mark к выделению
      editor.chain().focus().toggleMark('hiddenText').run();
      console.log('✅ Mark applied');
      
      // 2. Затем убираем выделение чтобы mark деактивировался
      // Перемещаем курсор в конец выделения
      editor.chain().focus().setTextSelection(selection.$to.pos).run();
      console.log('✅ Selection cleared, cursor moved to end');
    } else {
      // Для раскрытия удаляем mark
      const result = editor.chain().focus().unsetMark('hiddenText').run();
      console.log('unsetMark result:', result);
    }

    // Небольшая задержка перед закрытием меню чтобы команда выполнилась
    setTimeout(() => {
      setShowMenu(false);
    }, 50);
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
