/**
 * @file: TableCellOptionsMenu.tsx
 * @description: Меню настроек ячейки таблицы (Color, Alignment, Clear)
 * @dependencies: React, @tiptap/react, shadcn/ui
 * @created: 2025-11-02
 */

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  X,
  ChevronRight,
} from 'lucide-react';

interface TableCellOptionsMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

const CELL_COLORS = [
  { label: 'По умолчанию', value: null },
  { label: 'Красный', value: 'rgba(255, 200, 200, 0.5)' },
  { label: 'Оранжевый', value: 'rgba(255, 220, 180, 0.5)' },
  { label: 'Жёлтый', value: 'rgba(255, 255, 200, 0.5)' },
  { label: 'Зелёный', value: 'rgba(200, 255, 200, 0.5)' },
  { label: 'Синий', value: 'rgba(200, 220, 255, 0.5)' },
  { label: 'Фиолетовый', value: 'rgba(230, 200, 255, 0.5)' },
];

export const TableCellOptionsMenu: React.FC<TableCellOptionsMenuProps> = ({
  editor,
  isOpen,
  onClose,
  position,
}) => {
  const [showColors, setShowColors] = useState(false);
  const [showAlignment, setShowAlignment] = useState(false);

  if (!isOpen) return null;

  const handleSetColor = (color: string | null) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    setShowColors(false);
    onClose();
  };

  const handleSetAlign = (align: string) => {
    editor.chain().focus().setCellAttribute('align', align).run();
    setShowAlignment(false);
    onClose();
  };

  const handleClearCell = () => {
    const { selection } = editor.state;
    const { $from } = selection;
    
    // Находим ячейку и очищаем её
    for (let i = $from.depth; i > 0; i--) {
      const node = $from.node(i);
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
        const pos = $from.before(i);
        editor
          .chain()
          .focus()
          .setTextSelection({ from: pos + 1, to: pos + node.nodeSize - 1 })
          .deleteSelection()
          .run();
        onClose();
        return;
      }
    }
  };

  return (
    <>
      {/* Backdrop для закрытия меню */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Меню */}
      <div
        className="fixed z-50 w-48 bg-background border border-border rounded-md shadow-lg p-2"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex flex-col gap-1">
          {/* Color */}
          <div className="relative">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => {
                setShowColors(!showColors);
                setShowAlignment(false);
              }}
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Color</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {showColors && (
              <div className="absolute left-full top-0 ml-2 bg-background border border-border rounded-md shadow-lg p-2 z-50 w-40">
                <div className="flex flex-col gap-1">
                  {CELL_COLORS.map((color) => (
                    <button
                      key={color.label}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent text-sm"
                      onClick={() => handleSetColor(color.value)}
                    >
                      <div
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: color.value || 'transparent' }}
                      />
                      <span>{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alignment */}
          <div className="relative">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => {
                setShowAlignment(!showAlignment);
                setShowColors(false);
              }}
            >
              <div className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4" />
                <span>Alignment</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {showAlignment && (
              <div className="absolute left-full top-0 ml-2 bg-background border border-border rounded-md shadow-lg p-2 z-50 w-32">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleSetAlign('left')}
                  >
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Слева
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleSetAlign('center')}
                  >
                    <AlignCenter className="h-4 w-4 mr-2" />
                    По центру
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleSetAlign('right')}
                  >
                    <AlignRight className="h-4 w-4 mr-2" />
                    Справа
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border my-1" />

          {/* Clear contents */}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleClearCell}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-current rounded flex items-center justify-center">
                <X className="h-3 w-3" />
              </div>
              <span>Clear contents</span>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
};

