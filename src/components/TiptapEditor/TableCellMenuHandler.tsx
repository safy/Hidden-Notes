/**
 * @file: TableCellMenuHandler.tsx
 * @description: Менеджер кнопки и меню ячейки таблицы (кнопка через Portal)
 * @dependencies: React, @tiptap/react, TableCellButton, TableCellOptionsMenu
 * @created: 2025-11-02
 */

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { TableCellOptionsMenu } from './TableCellOptionsMenu';
import { TableCellButton } from './TableCellButton';

interface TableCellMenuHandlerProps {
  editor: Editor;
}

export const TableCellMenuHandler: React.FC<TableCellMenuHandlerProps> = ({ editor }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleButtonClick = (position: { top: number; left: number }) => {
    setMenuPosition(position);
    setIsMenuOpen(true);
  };

  return (
    <>
      <TableCellButton editor={editor} onButtonClick={handleButtonClick} />
      <TableCellOptionsMenu
        editor={editor}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={menuPosition}
      />
    </>
  );
};
