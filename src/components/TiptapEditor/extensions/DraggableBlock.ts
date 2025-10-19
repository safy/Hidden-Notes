/**
 * @file: DraggableBlock.ts
 * @description: Tiptap расширение для drag & drop перемещения блоков как в Notion
 * @dependencies: @tiptap/core, @tiptap/pm
 * @created: 2025-10-19
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';

export const DraggableBlock = Extension.create({
  name: 'draggableBlock',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('draggableBlock'),
        
        props: {
          decorations() {
            return null;
          },

          handleDOMEvents: {
            dragstart(view: EditorView, event: DragEvent) {
              // Получаем ближайший block элемент
              let blockElement = (event.target as HTMLElement)?.closest('[data-block]') ||
                                (event.target as HTMLElement)?.closest('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, table');
              
              if (blockElement && blockElement.closest('.ProseMirror')) {
                const pos = view.posAtDOM(blockElement, 0);
                const $pos = view.state.doc.resolve(pos);
                const node = $pos.parent;

                // Если это block-level элемент, готовимся к драггированию
                if (node) {
                  (event.dataTransfer as DataTransfer).effectAllowed = 'move';
                  (event.dataTransfer as DataTransfer).setData('application/x-tiptap-drag-block', JSON.stringify({
                    pos,
                    nodeType: node.type.name,
                  }));

                  // Создаем visual feedback
                  blockElement.classList.add('dragging');
                  (blockElement as HTMLElement).style.opacity = '0.5';

                  return true;
                }
              }

              return false;
            },

            dragover(_view: EditorView, event: DragEvent) {
              if ((event.dataTransfer as DataTransfer).types.includes('application/x-tiptap-drag-block')) {
                event.preventDefault();
                (event.dataTransfer as DataTransfer).dropEffect = 'move';

                const blockElement = (event.target as HTMLElement)?.closest('[data-block]') ||
                                    (event.target as HTMLElement)?.closest('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, table');
                
                if (blockElement) {
                  blockElement.classList.add('drag-over');
                  return true;
                }
              }
              return false;
            },

            dragleave(_view: EditorView, event: DragEvent) {
              const blockElement = (event.target as HTMLElement);
              blockElement?.classList.remove('drag-over');
              return false;
            },

            drop(view: EditorView, event: DragEvent) {
              const dragData = (event.dataTransfer as DataTransfer).getData('application/x-tiptap-drag-block');
              
              if (!dragData) return false;

              event.preventDefault();

              try {
                const { pos: sourcePos } = JSON.parse(dragData);
                const dropTarget = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });

                if (!dropTarget) return false;

                const { pos: targetPos } = dropTarget;

                // Не перемещаем если целевая позиция совпадает
                if (Math.abs(sourcePos - targetPos) < 2) return false;

                // Очищаем визуальные подсказки
                document.querySelectorAll('.dragging, .drag-over').forEach(el => {
                  el.classList.remove('dragging', 'drag-over');
                  (el as HTMLElement).style.opacity = '';
                });

                // Выполняем перемещение
                const { tr } = view.state;
                const $source = view.state.doc.resolve(sourcePos);
                const $target = view.state.doc.resolve(targetPos);

                let fromPos = $source.before($source.depth);
                let toPos = $target.before($target.depth);

                if (targetPos > sourcePos) {
                  toPos -= $source.node($source.depth).nodeSize;
                }

                const slice = view.state.doc.cut(fromPos, fromPos + $source.node($source.depth).nodeSize);
                tr.delete(fromPos, fromPos + $source.node($source.depth).nodeSize);
                tr.insert(Math.max(0, toPos - (targetPos > sourcePos ? $source.node($source.depth).nodeSize : 0)), slice);

                view.dispatch(tr);
                return true;
              } catch (error) {
                console.error('Error during drop:', error);
                return false;
              }
            },

            dragend(_view: EditorView, _event: DragEvent) {
              document.querySelectorAll('.dragging, .drag-over').forEach(el => {
                el.classList.remove('dragging', 'drag-over');
                (el as HTMLElement).style.opacity = '';
              });
              return false;
            },
          },
        },
      }),
    ];
  },
});
