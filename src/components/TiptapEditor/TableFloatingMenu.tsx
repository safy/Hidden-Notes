/**
 * @file: TableFloatingMenu.tsx
 * @description: Floating menu для управления таблицами (добавление/удаление строк/колонок)
 * @dependencies: React, @tiptap/react, shadcn/ui, lucide-react
 * @created: 2025-01-XX
 */

import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Columns,
  Rows,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TableFloatingMenuProps {
  editor: Editor;
}

export const TableFloatingMenu: React.FC<TableFloatingMenuProps> = ({ editor }) => {
  const { t } = useTranslation();

  const getTableInfo = () => {
    const { selection } = editor.state;
    let tablePos = -1;
    let tableNode: any = null;
    let cellPos = -1;

    editor.state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === 'table') {
        tableNode = node;
        tablePos = pos;
        return false;
      }
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
        cellPos = pos;
      }
      return true;
    });

    if (!tableNode || tablePos === -1) return null;

    const rows = tableNode.childCount;
    const cols = tableNode.firstChild?.childCount || 0;

    return { tablePos, tableNode, rows, cols, cellPos };
  };

  const canAddRowBefore = () => {
    return editor.can().addRowBefore();
  };

  const canAddRowAfter = () => {
    return editor.can().addRowAfter();
  };

  const canAddColumnBefore = () => {
    return editor.can().addColumnBefore();
  };

  const canAddColumnAfter = () => {
    return editor.can().addColumnAfter();
  };

  const canDeleteRow = () => {
    const info = getTableInfo();
    return info && info.rows > 1 && editor.can().deleteRow();
  };

  const canDeleteColumn = () => {
    const info = getTableInfo();
    return info && info.cols > 1 && editor.can().deleteColumn();
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        offset: [0, -12],
        appendTo: () => document.body,
        getReferenceClientRect: () => {
          const { selection } = editor.state;
          const { $from } = selection;
          
          // Находим таблицу и её DOM элемент
          for (let i = $from.depth; i > 0; i--) {
            const node = $from.node(i);
            if (node.type.name === 'table') {
              const pos = $from.before(i);
              const dom = editor.view.nodeDOM(pos);
              if (dom instanceof HTMLElement) {
                const rect = dom.getBoundingClientRect();
                // Возвращаем позицию верхней границы таблицы
                return new DOMRect(rect.left, rect.top, rect.width, 0);
              }
            }
          }
          
          // Fallback на selection
          const coords = editor.view.coordsAtPos($from.pos);
          return new DOMRect(coords.left, coords.top, 0, 0);
        },
      }}
      shouldShow={({ state }) => {
        const { selection } = state;
        const { $from } = selection;
        
        // Проверяем родительские узлы на наличие таблицы
        for (let i = $from.depth; i > 0; i--) {
          const node = $from.node(i);
          if (node.type.name === 'table') {
            return true;
          }
        }
        
        return false;
      }}
    >
      <div className="flex items-center gap-1 bg-background border border-border rounded-md shadow-lg p-1">
        {/* Add Row Before */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!canAddRowBefore()}
          title={t('table.addRowBefore', { defaultValue: 'Add row before' })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>

        {/* Add Row After */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!canAddRowAfter()}
          title={t('table.addRowAfter', { defaultValue: 'Add row after' })}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>

        {/* Delete Row */}
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

        <div className="w-px h-6 bg-border mx-1" />

        {/* Add Column Before */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!canAddColumnBefore()}
          title={t('table.addColumnBefore', { defaultValue: 'Add column before' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Add Column After */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!canAddColumnAfter()}
          title={t('table.addColumnAfter', { defaultValue: 'Add column after' })}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>

        {/* Delete Column */}
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

        <div className="w-px h-6 bg-border mx-1" />

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
    </BubbleMenu>
  );
};

