/**
 * @file: DragHandle.tsx
 * @description: React компонент для drag & drop блоков с использованием DragHandleReact
 * @created: 2025-10-19
 */

import React from 'react';
import { DragHandle as DragHandleComponent } from '@tiptap/extension-drag-handle-react';
import { Editor } from '@tiptap/react';

interface DragHandleWrapperProps {
  editor: Editor;
}

/**
 * DragHandleWrapper компонент - обеспечивает визуальную ручку для перетаскивания блоков
 * Показывает :: иконку при наведении на блок
 * Поддерживает drag & drop для реорганизации контента
 */
export const DragHandle: React.FC<DragHandleWrapperProps> = ({ editor }) => {
  return (
    <DragHandleComponent editor={editor}>
      ⋮⋮
    </DragHandleComponent>
  );
};
