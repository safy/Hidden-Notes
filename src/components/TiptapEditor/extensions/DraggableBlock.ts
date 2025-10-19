/**
 * @file: DraggableBlock.ts
 * @description: Tiptap расширение для drag & drop перемещения блоков (официальный подход)
 * @dependencies: @tiptap/core, @tiptap/pm
 * @created: 2025-10-19
 * @updated: 2025-10-19 - Переработана согласно официальной документации Tiptap
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const DraggableBlock = Extension.create({
  name: 'draggableBlock',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('draggableBlock'),
        
        props: {
          handleDOMEvents: {
            dragstart(view, event) {
              // Находим block элемент (параграф, заголовок, и т.д.)
              let blockElement = (event.target as HTMLElement).closest(
                '.ProseMirror > p, .ProseMirror > h1, .ProseMirror > h2, .ProseMirror > h3, ' +
                '.ProseMirror > h4, .ProseMirror > h5, .ProseMirror > h6, ' +
                '.ProseMirror > blockquote, .ProseMirror > pre, ' +
                '.ProseMirror > ul, .ProseMirror > ol, .ProseMirror > table'
              );

              if (!blockElement) {
                blockElement = (event.target as HTMLElement).closest(
                  'p, h1, h2, h3, h4, h5, h6, blockquote, pre, ul, ol, table'
                );
              }

              if (!blockElement) {
                return false;
              }

              // Получаем позицию блока
              const pos = view.posAtDOM(blockElement, 0);
              
              if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/x-block-pos', pos.toString());
                event.dataTransfer.setData('text/html', blockElement.innerHTML);
              }

              blockElement.classList.add('is-dragging');
              return true;
            },

            dragover(_view, event) {
              if (!event.dataTransfer) {
                return false;
              }

              // Проверяем что это наш drag
              const dragData = event.dataTransfer.getData('text/x-block-pos');
              if (!dragData) {
                return false;
              }

              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';

              // Находим текущий блок под курсором
              let targetBlock = (event.target as HTMLElement).closest(
                'p, h1, h2, h3, h4, h5, h6, blockquote, pre, ul, ol, table'
              );

              if (!targetBlock || !targetBlock.closest('.ProseMirror')) {
                return false;
              }

              // Определяем вверху или внизу вставить (по вертикальной позиции)
              const rect = targetBlock.getBoundingClientRect();
              const isTop = event.clientY - rect.top < rect.height / 2;

              // Добавляем визуальный feedback
              targetBlock.classList.remove('drag-over-bottom');
              if (isTop) {
                targetBlock.classList.add('drag-over-top');
              } else {
                targetBlock.classList.remove('drag-over-top');
                targetBlock.classList.add('drag-over-bottom');
              }

              return true;
            },

            dragleave(_view, event) {
              const target = event.target as HTMLElement;
              target.classList.remove('drag-over-top', 'drag-over-bottom');
              return false;
            },

            drop(view, event) {
              if (!event.dataTransfer) {
                return false;
              }

              const dragData = event.dataTransfer.getData('text/x-block-pos');
              if (!dragData) {
                return false;
              }

              event.preventDefault();

              // Очищаем визуальные эффекты
              document.querySelectorAll('.is-dragging, .drag-over-top, .drag-over-bottom').forEach(el => {
                el.classList.remove('is-dragging', 'drag-over-top', 'drag-over-bottom');
              });

              try {
                const sourcePos = parseInt(dragData, 10);
                
                // Находим target блок
                let targetBlock = (event.target as HTMLElement).closest(
                  'p, h1, h2, h3, h4, h5, h6, blockquote, pre, ul, ol, table'
                );

                if (!targetBlock) {
                  return false;
                }

                const targetPos = view.posAtDOM(targetBlock, 0);
                
                // Если это один и тот же блок - ничего не делаем
                if (Math.abs(sourcePos - targetPos) < 2) {
                  return false;
                }

                // Получаем информацию о блоке
                const $source = view.state.doc.resolve(sourcePos);
                const nodeSize = $source.nodeAfter?.nodeSize || 1;

                // Вырезаем блок
                const tr = view.state.tr;
                const start = $source.pos;
                const end = start + nodeSize;
                
                const cut = view.state.doc.cut(start, end);
                
                // Вычисляем позицию вставки
                let insertPos = targetPos;
                if (targetPos > sourcePos) {
                  // Если перемещаем вниз, компенсируем удаленный блок
                  insertPos -= nodeSize;
                }

                // Выполняем операцию
                tr.delete(start, end);
                tr.insert(insertPos, cut.content);

                view.dispatch(tr);
                return true;
              } catch (error) {
                console.error('Error in drop:', error);
                return false;
              }
            },

            dragend(_view, _event) {
              // Очищаем все visual feedback
              document.querySelectorAll('.is-dragging, .drag-over-top, .drag-over-bottom').forEach(el => {
                el.classList.remove('is-dragging', 'drag-over-top', 'drag-over-bottom');
              });
              return false;
            },
          },
        },
      }),
    ];
  },
});
