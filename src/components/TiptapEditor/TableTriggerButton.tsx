/**
 * @file: TableTriggerButton.tsx
 * @description: Кнопка с визуальным селектором сетки для создания таблиц
 * @dependencies: React, @tiptap/react, shadcn/ui, lucide-react
 * @created: 2025-01-XX
 */

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Table } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

interface TableTriggerButtonProps {
  editor: Editor | null;
  maxRows?: number;
  maxCols?: number;
}

export const TableTriggerButton: React.FC<TableTriggerButtonProps> = ({
  editor,
  maxRows = 8,
  maxCols = 8,
}) => {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  if (!editor) return null;

  const handleCellHover = (row: number, col: number) => {
    setHoveredCell({ row, col });
  };

  const handleCellClick = (rows: number, cols: number) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setHoveredCell(null);
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={t('editor.table', { defaultValue: 'Table' })}
        >
          <Table className="h-4 w-4 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto p-2" align="start">
        <div
          className="grid gap-0.5 p-1"
          style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}
          onMouseLeave={handleMouseLeave}
        >
          {Array.from({ length: maxRows * maxCols }).map((_, index) => {
            const row = Math.floor(index / maxCols) + 1;
            const col = (index % maxCols) + 1;
            const isSelected =
              hoveredCell &&
              row <= hoveredCell.row &&
              col <= hoveredCell.col;

            return (
              <button
                key={index}
                className={`
                  w-6 h-6 border-2 rounded-sm transition-colors
                  ${isSelected 
                    ? 'bg-blue-500 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400'}
                `}
                onMouseEnter={() => handleCellHover(row, col)}
                onClick={() => handleCellClick(row, col)}
                aria-label={`${row}×${col} table`}
              />
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center px-2">
          {hoveredCell
            ? `${hoveredCell.row}×${hoveredCell.col} ${t('editor.table', { defaultValue: 'Table' })}`
            : t('editor.selectTableSize', { defaultValue: 'Select table size' })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

