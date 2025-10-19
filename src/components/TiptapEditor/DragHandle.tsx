/**
 * @file: DragHandle.tsx
 * @description: React компонент для drag & drop блоков с использованием DragHandleReact
 * @created: 2025-10-19
 */

import React from 'react';
import { DragHandle as DragHandleComponent } from '@tiptap/extension-drag-handle-react';
import { Editor } from '@tiptap/react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragHandleWrapperProps {
  editor: Editor;
}

/**
 * DragHandleWrapper компонент - обеспечивает визуальную ручку для перетаскивания блоков
 * Показывает иконку при наведении на блок
 * Поддерживает drag & drop для реорганизации контента
 */
export const DragHandle: React.FC<DragHandleWrapperProps> = ({ editor }) => {
  // Логирование для диагностики
  React.useEffect(() => {
    console.log('🎯 DragHandle component mounted!');
    console.log('Editor:', editor);
    console.log('Editor view:', editor?.view);
  }, [editor]);

  // DragHandleComponent функция/компонент для перетаскивания
  return (
    <DragHandleComponent editor={editor}>
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
    </DragHandleComponent>
  );
};
