/**
 * @file: HiddenText.ts
 * @description: Tiptap Mark extension для скрытия текста
 * @created: 2025-10-17
 */

import { Mark } from '@tiptap/core';

export const HiddenText = Mark.create({
  name: 'hiddenText',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'hidden-text',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-hidden="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        'data-hidden': 'true',
      },
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleMark(this.name),
    };
  },
});
