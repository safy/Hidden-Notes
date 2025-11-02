/**
 * @file: TableCellEnhanced.ts
 * @description: Расширенный TableCell с кастомными атрибутами (backgroundColor, align)
 * @dependencies: @tiptap/extension-table-cell
 * @created: 2025-11-02
 */

import TableCell from '@tiptap/extension-table-cell';

export const TableCellEnhanced = TableCell.extend({
  name: 'tableCell',

  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => element.style.textAlign || 'left',
        renderHTML: attributes => {
          if (!attributes.align || attributes.align === 'left') {
            return {};
          }
          return {
            style: `text-align: ${attributes.align}`,
          };
        },
      },
    };
  },
});
