/**
 * @file: DragHandle.tsx
 * @description: React компонент для drag & drop блоков с использованием DragHandleReact
 * @created: 2025-10-19
 */

import React from 'react';
import { DragHandle as DragHandleReact } from '@tiptap/extension-drag-handle-react';
import { Editor } from '@tiptap/react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragHandleProps {
  editor: Editor;
}

interface NodeChangeEvent {
  node: {
    type: {
      name: string;
    };
  } | null;
  editor: Editor;
  pos: number;
}

/**
 * DragHandle компонент - обеспечивает визуальную ручку для перетаскивания блоков
 * Показывает иконку "⋮⋮" при наведении на блок
 * Поддерживает drag & drop для реорганизации контента
 */
export const DragHandle: React.FC<DragHandleProps> = ({ editor }) => {
  return (
    <DragHandleReact
      editor={editor}
      onNodeChange={(event: NodeChangeEvent) => {
        // Отслеживаем активный узел для визуального feedback
        if (event.node) {
          // Логирование для отладки (можно удалить в production)
          console.debug(`DragHandle: Node changed to ${event.node.type.name}`);
        }
      }}
    >
      <div
        className={cn(
          'drag-handle',
          'flex items-center justify-center',
          'w-6 h-6',
          'text-muted-foreground',
          'hover:text-foreground',
          'hover:bg-accent',
          'rounded transition-colors',
          'cursor-grab active:cursor-grabbing'
        )}
        title="Перетащите для перемещения блока"
      >
        <GripVertical className="w-4 h-4" />
      </div>
    </DragHandleReact>
  );
};
