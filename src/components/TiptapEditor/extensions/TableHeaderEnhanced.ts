/**
 * @file: TableHeaderEnhanced.ts
 * @description: Расширенный TableHeader с поддержкой backgroundColor и verticalAlign
 * @dependencies: @tiptap/extension-table-header
 * @created: 2025-11-02
 */

import TableHeader from '@tiptap/extension-table-header';

export const TableHeaderEnhanced = TableHeader.extend({
  name: 'tableHeader',

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

