/**
 * @file: DraggableBlock.ts
 * @description: Tiptap расширение для drag & drop перемещения блоков как в Notion
 * @dependencies: @tiptap/core, @tiptap/pm
 * @created: 2025-10-19
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';

interface DragState {
  draggedFrom: number | null;
  isDragging: boolean;
  lastOverElement: HTMLElement | null;
  lastOverPosition: 'top' | 'bottom' | null;
  lastDragoverTime: number;
  dragoverThrottle: number;
}

export const DraggableBlock = Extension.create({
  name: 'draggableBlock',

  addProseMirrorPlugins() {
    let dragState: DragState = {
      draggedFrom: null,
      isDragging: false,
      lastOverElement: null,
      lastOverPosition: null,
      lastDragoverTime: 0,
      dragoverThrottle: 100, // 100ms throttle
    };

    return [
      new Plugin({
        key: new PluginKey('draggableBlock'),

        props: {
          handleDOMEvents: {
            dragstart(view: EditorView, event: DragEvent) {
              // Получаем ближайший block элемент
              const blockElement = (event.target as HTMLElement)?.closest(
                'p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, table'
              );

              if (!blockElement || !blockElement.closest('.ProseMirror')) {
                return false;
              }

              try {
                // Получаем позицию блока в документе
                const pos = view.posAtDOM(blockElement, 0);
                const $pos = view.state.doc.resolve(pos);
                const node = $pos.parent;

                if (!node) {
                  return false;
                }

                dragState.draggedFrom = pos;
                dragState.isDragging = true;

                // Заполняем dataTransfer
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData(
                    'application/x-tiptap-drag-block',
                    JSON.stringify({
                      pos,
                      nodeType: node.type.name,
                      nodeSize: node.nodeSize,
                    })
                  );

                  // Добавляем текст для fallback
                  event.dataTransfer.setData('text/plain', node.textContent || '');
                }

                // Visual feedback
                blockElement.classList.add('dragging');
                (blockElement as HTMLElement).style.opacity = '0.5';

                return true;
              } catch (error) {
                console.error('Error in dragstart:', error);
                return false;
              }
            },

            dragover(_view: EditorView, event: DragEvent) {
              if (!event.dataTransfer) return false;

              // Проверяем что это наш тип drag data
              if (!event.dataTransfer.types.includes('application/x-tiptap-drag-block')) {
                return false;
              }

              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';

              // Throttle dragover события (максимум 1 раз в 100ms)
              const now = Date.now();
              if (now - dragState.lastDragoverTime < dragState.dragoverThrottle) {
                return true;
              }
              dragState.lastDragoverTime = now;

              const blockElement = (event.target as HTMLElement)?.closest(
                'p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, table'
              );

              if (blockElement && blockElement !== dragState.lastOverElement) {
                // Новый элемент - очищаем старые маркеры
                if (dragState.lastOverElement) {
                  dragState.lastOverElement.classList.remove('drag-over-top', 'drag-over-bottom');
                }
                dragState.lastOverElement = blockElement as HTMLElement;
                dragState.lastOverPosition = null;
              }

              if (blockElement) {
                // Определяем нужно ли вставить сверху или снизу (40% threshold)
                const rect = blockElement.getBoundingClientRect();
                const elementHeight = rect.height;
                const offsetFromTop = event.clientY - rect.top;
                const isTop = offsetFromTop < elementHeight * 0.4;
                const newPosition: 'top' | 'bottom' = isTop ? 'top' : 'bottom';

                // Только обновляем если позиция действительно изменилась
                if (dragState.lastOverPosition !== newPosition) {
                  blockElement.classList.remove('drag-over-top', 'drag-over-bottom');

                  if (newPosition === 'top') {
                    blockElement.classList.add('drag-over-top');
                  } else {
                    blockElement.classList.add('drag-over-bottom');
                  }

                  dragState.lastOverPosition = newPosition;
                }
              }

              return true;
            },

            dragleave(_view: EditorView, event: DragEvent) {
              const blockElement = event.target as HTMLElement;

              // Только удаляем классы если это элемент который мы отслеживали
              if (blockElement === dragState.lastOverElement) {
                blockElement?.classList.remove('drag-over-top', 'drag-over-bottom');
                dragState.lastOverElement = null;
                dragState.lastOverPosition = null;
              }

              return false;
            },

            drop(view: EditorView, event: DragEvent) {
              if (!event.dataTransfer) return false;

              const dragData = event.dataTransfer.getData('application/x-tiptap-drag-block');

              if (!dragData) {
                return false;
              }

              event.preventDefault();

              try {
                const dragInfo = JSON.parse(dragData);
                const { pos: sourcePos } = dragInfo;

                // Очищаем визуальные подсказки
                document.querySelectorAll('.dragging, .drag-over-top, .drag-over-bottom').forEach(el => {
                  el.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
                  (el as HTMLElement).style.opacity = '';
                });

                // Получаем позицию drop
                const dropCoords = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });

                if (!dropCoords) {
                  return false;
                }

                const { pos: targetPos } = dropCoords;

                // Не перемещаем если позиции одинаковые или очень близко
                if (Math.abs(sourcePos - targetPos) < 3) {
                  return false;
                }

                const { tr } = view.state;
                const $source = view.state.doc.resolve(sourcePos);

                // Получаем блок которое нужно переместить
                const resolvedNodeSize = $source.node($source.depth).nodeSize;
                let from = $source.before($source.depth);
                let to = from + resolvedNodeSize;

                // Вырезаем блок
                const slice = view.state.doc.cut(from, to);

                // Вычисляем позицию вставки
                const $target = view.state.doc.resolve(targetPos);
                let insertPos = $target.before($target.depth);

                // Если перемещаем вниз, вычитаем размер перемещаемого блока
                if (targetPos > sourcePos) {
                  insertPos -= resolvedNodeSize;
                }

                // Выполняем операцию: удаляем и вставляем
                tr.delete(from, to);
                tr.insert(Math.max(0, insertPos), slice);

                view.dispatch(tr);
                return true;
              } catch (error) {
                console.error('Error during drop:', error);
                return false;
              }
            },

            dragend(_view: EditorView, _event: DragEvent) {
              // Очищаем все классы и состояние
              document.querySelectorAll('.dragging, .drag-over-top, .drag-over-bottom').forEach(el => {
                el.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
                (el as HTMLElement).style.opacity = '';
              });

              dragState.draggedFrom = null;
              dragState.isDragging = false;
              dragState.lastOverElement = null;
              dragState.lastOverPosition = null;
              dragState.lastDragoverTime = 0;

              return false;
            },
          },
        },
      }),
    ];
  },
});
