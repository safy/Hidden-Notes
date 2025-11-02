/**
 * @file: TableToolbar.tsx
 * @description: Компактная панель инструментов для работы с таблицами
 * @dependencies: React, @tiptap/react, shadcn/ui, lucide-react
 * @created: 2025-11-02
 */

import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Rows,
  Columns,
  Trash2,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X as ClearIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableToolbarProps {
  editor: Editor | null;
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

export const TableToolbar: React.FC<TableToolbarProps> = ({ editor }) => {
  const { t } = useTranslation();

  if (!editor) {
    return (
      <div className="border-b border-border p-2 bg-muted/30">
        <div className="flex items-center gap-1 flex-wrap opacity-50">
          <div className="w-8 h-8 bg-muted rounded" />
          <div className="w-8 h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const getTableInfo = () => {
    const { selection } = editor.state;
    let tableNode: any = null;

    editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
      if (node.type.name === 'table') {
        tableNode = node;
        return false;
      }
      return true;
    });

    if (!tableNode) return null;

    const rows = tableNode.childCount;
    const cols = tableNode.firstChild?.childCount || 0;

    return { rows, cols };
  };

  const canDeleteRow = () => {
    const info = getTableInfo();
    return info && info.rows > 1 && editor.can().deleteRow();
  };

  const canDeleteColumn = () => {
    const info = getTableInfo();
    return info && info.cols > 1 && editor.can().deleteColumn();
  };

  const handleSetColor = (color: string | null) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
  };

  const handleSetAlign = (align: string) => {
    editor.chain().focus().setCellAttribute('align', align).run();
  };

  const handleClearCell = () => {
    const { selection } = editor.state;
    const { $from } = selection;
    
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
        return;
      }
    }
  };

  return (
    <div className="border-b border-border p-2 bg-muted/30">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Row Operations */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!editor.can().addRowBefore()}
          title={t('table.addRowBefore', { defaultValue: 'Add row before' })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
          title={t('table.addRowAfter', { defaultValue: 'Add row after' })}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!canDeleteRow()}
          title={t('table.deleteRow', { defaultValue: 'Delete row' })}
        >
          <Rows className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Column Operations */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!editor.can().addColumnBefore()}
          title={t('table.addColumnBefore', { defaultValue: 'Add column before' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          title={t('table.addColumnAfter', { defaultValue: 'Add column after' })}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!canDeleteColumn()}
          title={t('table.deleteColumn', { defaultValue: 'Delete column' })}
        >
          <Columns className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Cell Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={t('table.cellColor', { defaultValue: 'Cell color' })}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 p-2">
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cell Alignment */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={t('table.cellAlignment', { defaultValue: 'Cell alignment' })}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32 p-2">
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Cell */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleClearCell}
          title={t('table.clearContents', { defaultValue: 'Clear contents' })}
        >
          <ClearIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Delete Table */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => editor.chain().focus().deleteTable().run()}
          title={t('table.deleteTable', { defaultValue: 'Delete table' })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

