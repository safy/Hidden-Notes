/**
 * @file: HiddenContextMenu.tsx
 * @description: Универсальное контекстное меню для скрытия/раскрытия текста и изображений
 * @dependencies: React, @tiptap/react, lucide-react
 * @created: 2025-10-20
 */

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Eye, EyeOff, Image as ImageIcon, Type } from 'lucide-react';
import { TextSelection } from '@tiptap/pm/state';
import { useToast } from '@/hooks/use-toast';

interface HiddenContextMenuProps {
  editor: Editor | null;
}

type ElementType = 'text' | 'image' | 'none';

export const HiddenContextMenu: React.FC<HiddenContextMenuProps> = ({ editor }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(false);
  const [elementType, setElementType] = useState<ElementType>('none');
  const [currentHiddenSpan, setCurrentHiddenSpan] = useState<{ start: number; end: number } | null>(null);
  const [currentImagePos, setCurrentImagePos] = useState<number | null>(null);
  const { toast } = useToast();

  // Поиск hidden text span
  const findHiddenTextAtPos = (pos: number): { start: number; end: number } | null => {
    if (!editor) return null;

    let result: { start: number; end: number } | null = null;

    editor.state.doc.nodesBetween(0, editor.state.doc.content.size, (node, nodeStart) => {
      if (node.isText) {
        const hasHiddenMark = node.marks.some((mark) => mark.type.name === 'hiddenText');

        if (hasHiddenMark) {
          const nodeEnd = nodeStart + node.nodeSize;
          if (pos > nodeStart && pos <= nodeEnd) {
            result = { start: nodeStart, end: nodeEnd };
            return false;
          }
        }
      }
      return true;
    });


    return result;
  };

  // Поиск изображения
  const findImageAtPos = (pos: number): { pos: number; node: any; isHidden: boolean } | null => {
    if (!editor) return null;

    let result: { pos: number; node: any; isHidden: boolean } | null = null;

    editor.state.doc.nodesBetween(Math.max(0, pos - 5), Math.min(editor.state.doc.content.size, pos + 5), (node, nodePos) => {
      if (node.type.name === 'imageResize') {
        result = {
          pos: nodePos,
          node,
          isHidden: node.attrs.isHidden || false,
        };
        return false;
      }
      return true;
    });

    return result;
  };

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      
      const { selection } = editor.state;
      const { $from, $to } = selection;
      
      let foundType: ElementType = 'none';
      let foundIsHidden = false;

      // 1. Проверяем клик по изображению
      const imageInfo = findImageAtPos($from.pos);
      if (imageInfo) {
        foundType = 'image';
        foundIsHidden = imageInfo.isHidden;
        setCurrentImagePos(imageInfo.pos);
        setCurrentHiddenSpan(null);
      } else {
        setCurrentImagePos(null);
        
        // 2. Проверяем текст
        if (!selection.empty) {
          // Есть выделение - проверяем скрытый текст
          let hasHiddenMark = false;
          editor.state.doc.nodesBetween($from.pos, $to.pos, (node) => {
            if (node.marks.some((mark) => mark.type.name === 'hiddenText')) {
              hasHiddenMark = true;
            }
          });
          
          if (hasHiddenMark || selection.empty === false) {
            foundType = 'text';
            foundIsHidden = hasHiddenMark;
            setCurrentHiddenSpan(null);
          }
        } else {
          // Нет выделения - ищем скрытый текст в позиции курсора
          const hiddenSpan = findHiddenTextAtPos($from.pos);
          if (hiddenSpan) {
            foundType = 'text';
            foundIsHidden = true;
            setCurrentHiddenSpan(hiddenSpan);
            
            // Выделяем span
            const start = editor.state.doc.resolve(hiddenSpan.start);
            const end = editor.state.doc.resolve(hiddenSpan.end);
            editor.view.dispatch(editor.state.tr.setSelection(new TextSelection(start, end)));
          }
        }
      }

      // Если ничего не найдено - скрываем меню
      if (foundType === 'none' && selection.empty) {
        setShowMenu(false);
        return;
      }

      // Очищаем выделение для скрытых элементов
      if (foundIsHidden && window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }

      setElementType(foundType);
      setIsHidden(foundIsHidden);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    };

    const handleClick = (e: MouseEvent) => {
      setShowMenu(false);
      
      // Ctrl + Click для копирования скрытого текста
      if (e.ctrlKey) {
        const target = e.target as HTMLElement;
        const hiddenTextElement = target.closest('.hidden-text') as HTMLElement;
        
        if (hiddenTextElement) {
          e.preventDefault();
          e.stopPropagation();
          
          if (window.getSelection) {
            window.getSelection()?.removeAllRanges();
          }
          
          const text = hiddenTextElement.textContent?.trim() || '';
          if (text) {
            navigator.clipboard.writeText(text).then(() => {
              toast({
                title: "Текст скопирован",
                duration: 2000,
              });
            });
          }
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('contextmenu', handleContextMenu);
    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor, toast]);

  const toggleHidden = (hide: boolean) => {
    if (!editor) return;

    // Очищаем выделение
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }

    if (elementType === 'image' && currentImagePos !== null) {
      // Работа с изображением
      editor.chain().focus().command(({ tr, dispatch }) => {
        const node = editor.state.doc.nodeAt(currentImagePos);
        if (node && node.type.name === 'imageResize' && dispatch) {
          tr.setNodeMarkup(currentImagePos, undefined, {
            ...node.attrs,
            isHidden: hide,
          });
          dispatch(tr);
          return true;
        }
        return false;
      }).run();
      
      toast({
        title: hide ? "Изображение скрыто" : "Изображение раскрыто",
        duration: 2000,
      });
    } else if (elementType === 'text') {
      // Работа с текстом
      if (hide) {
        editor.chain().focus().toggleMark('hiddenText').run();
        const { selection } = editor.state;
        editor.chain().focus().setTextSelection(selection.$to.pos).run();
      } else {
        if (currentHiddenSpan) {
          const start = editor.state.doc.resolve(currentHiddenSpan.start);
          const end = editor.state.doc.resolve(currentHiddenSpan.end);
          editor.view.dispatch(editor.state.tr.setSelection(new TextSelection(start, end)));
          editor.chain().focus().unsetMark('hiddenText').run();
          editor.chain().focus().setTextSelection(currentHiddenSpan.end).run();
        }
      }
      
      toast({
        title: hide ? "Текст скрыт" : "Текст раскрыт",
        duration: 2000,
      });
    }

    setTimeout(() => {
      setShowMenu(false);
    }, 50);
  };

  if (!showMenu) return null;

  return (
    <div
      className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50 flex gap-2"
      style={{ top: `${menuPos.y}px`, left: `${menuPos.x}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Индикатор типа элемента */}
      <div className="flex items-center gap-1 px-2 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600">
        {elementType === 'image' ? (
          <>
            <ImageIcon className="h-3 w-3" />
            <span>Изображение</span>
          </>
        ) : (
          <>
            <Type className="h-3 w-3" />
            <span>Текст</span>
          </>
        )}
      </div>
      
      {/* Кнопка действия */}
      {isHidden ? (
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
          onClick={() => toggleHidden(false)}
          title="Раскрыть"
        >
          <EyeOff className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Раскрыть</span>
        </button>
      ) : (
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
          onClick={() => toggleHidden(true)}
          title="Скрыть"
        >
          <Eye className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Скрыть</span>
        </button>
      )}
    </div>
  );
};

