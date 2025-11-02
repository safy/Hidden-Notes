/**
 * @file: TableCellButton.tsx
 * @description: React кнопка для ячейки таблицы (рендерится через Portal)
 * @created: 2025-11-02
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';

interface TableCellButtonProps {
  editor: Editor;
  onButtonClick: (position: { top: number; left: number }) => void;
}

export const TableCellButton: React.FC<TableCellButtonProps> = ({ editor, onButtonClick }) => {
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const cell = document.querySelector('.ProseMirror table th.selectedCell, .ProseMirror table td.selectedCell') as HTMLElement;
      
      if (cell) {
        const rect = cell.getBoundingClientRect();
        // ЦЕНТР кнопки 12px должен быть на ЦЕНТРЕ рамки 2px
        // Центр рамки: rect.right - 1
        // Для кнопки 12px: left = центр - 6 = rect.right - 7
        setButtonPosition({
          top: rect.top + rect.height / 2,
          left: rect.right - 7, // Центр кнопки на центре рамки
        });
      } else {
        setButtonPosition(null);
      }
    };

    updatePosition();
    editor.on('selectionUpdate', updatePosition);
    editor.on('update', updatePosition);
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('update', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor]);

  const handleClick = () => {
    if (buttonPosition) {
      onButtonClick({
        top: buttonPosition.top - 60,
        left: buttonPosition.left + 18,
      });
    }
  };

  if (!buttonPosition) return null;

  // Корректируем left при изменении размера чтобы центр оставался на месте
  const currentSize = isHovered ? 20 : 12;
  const adjustedLeft = buttonPosition.left + (12 - currentSize) / 2;

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${adjustedLeft}px`,
    top: `${buttonPosition.top}px`,
    transform: 'translateY(-50%)', // Только по Y, без X
    width: `${currentSize}px`,
    height: `${currentSize}px`,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'all 0.2s ease',
    background: isHovered
      ? `radial-gradient(circle 1.5px at 7px 7px, white, transparent) no-repeat,
         radial-gradient(circle 1.5px at 13px 7px, white, transparent) no-repeat,
         radial-gradient(circle 1.5px at 7px 13px, white, transparent) no-repeat,
         radial-gradient(circle 1.5px at 13px 13px, white, transparent) no-repeat,
         rgb(126, 34, 206)`
      : 'rgb(147, 51, 234)',
  };

  return createPortal(
    <button
      style={buttonStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Table cell options"
    />,
    document.body
  );
};

