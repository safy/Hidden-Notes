/**
 * @file: ImageResize.ts
 * @description: Кастомное расширение для изменения размера изображений в Tiptap
 * @dependencies: @tiptap/core, @tiptap/extension-image
 * @created: 2025-01-15
 */

import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageResizeView } from '../ImageResizeView';

export interface ImageResizeOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
  editor?: any; // Добавляем editor в options
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageResize: {
      setImage: (options: { src: string; alt?: string; width?: number; height?: number; align?: 'left' | 'center' | 'right' }) => ReturnType;
      setImageAlign: (align: 'left' | 'center' | 'right') => ReturnType;
      toggleImageHidden: () => ReturnType;
      setImageHidden: (isHidden: boolean) => ReturnType;
    };
  }
}

export const ImageResize = Node.create<ImageResizeOptions>({
  name: 'imageResize',

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  group: 'block',

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('width');
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: element => {
          const height = element.getAttribute('height');
          return height ? parseInt(height, 10) : null;
        },
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      isHidden: {
        default: false,
        parseHTML: element => element.getAttribute('data-hidden') === 'true',
        renderHTML: attributes => {
          if (!attributes.isHidden) {
            return {};
          }
          return {
            'data-hidden': 'true',
            class: 'hidden-image',
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => {
          const align = element.getAttribute('data-align') || element.style.textAlign || 'left';
          return ['left', 'center', 'right'].includes(align) ? align : 'left';
        },
        renderHTML: attributes => {
          if (!attributes.align || attributes.align === 'left') {
            return {};
          }
          return {
            'data-align': attributes.align,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          const parent = img.parentElement;
          const align = parent?.getAttribute('data-align') || 
                       parent?.style.textAlign || 
                       img.getAttribute('data-align') || 
                       'left';
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: img.getAttribute('width') ? parseInt(img.getAttribute('width')!, 10) : null,
            height: img.getAttribute('height') ? parseInt(img.getAttribute('height')!, 10) : null,
            isHidden: img.getAttribute('data-hidden') === 'true',
            align: ['left', 'center', 'right'].includes(align) ? align : 'left',
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Убеждаемся что width и height из node.attrs попадают в HTML
    const attrs: Record<string, any> = {
      ...this.options.HTMLAttributes,
      ...HTMLAttributes,
      src: node.attrs.src,
    };
    
    // Добавляем атрибуты только если они не null/undefined
    if (node.attrs.alt) {
      attrs.alt = node.attrs.alt;
    }
    if (node.attrs.width != null) {
      attrs.width = node.attrs.width;
    }
    if (node.attrs.height != null) {
      attrs.height = node.attrs.height;
    }
    
    if (node.attrs.isHidden) {
      attrs['data-hidden'] = 'true';
      attrs.class = (attrs.class || '') + ' hidden-image';
    }
    
    // Добавляем выравнивание
    const align = node.attrs.align || 'left';
    if (align !== 'left') {
      attrs['data-align'] = align;
    }
    
    return ['img', attrs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView, {
      contentDOMElementTag: 'div',
      // Передаем editor через as prop
      as: 'div',
    });
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            ...options,
            align: options.align || 'left',
          },
        });
      },
      setImageAlign: (align: 'left' | 'center' | 'right') => ({ state, tr, dispatch }) => {
        const { selection } = state;
        const { $from } = selection;
        
        // Найти изображение в текущей позиции
        let imageNode: any = null;
        let imagePos = -1;
        
        state.doc.nodesBetween($from.pos - 1, $from.pos + 1, (node, pos) => {
          if (node.type.name === 'imageResize') {
            imageNode = node;
            imagePos = pos;
            return false;
          }
          return true;
        });
        
        if (imageNode && imagePos >= 0 && dispatch) {
          tr.setNodeMarkup(imagePos, undefined, {
            ...imageNode.attrs,
            align,
          });
          dispatch(tr);
          return true;
        }
        
        return false;
      },
      toggleImageHidden: () => ({ state, tr, dispatch }) => {
        const { selection } = state;
        const { $from } = selection;
        
        // Найти изображение в текущей позиции
        let imageNode: any = null;
        let imagePos = -1;
        
        state.doc.nodesBetween($from.pos - 1, $from.pos + 1, (node, pos) => {
          if (node.type.name === 'imageResize') {
            imageNode = node;
            imagePos = pos;
            return false;
          }
          return true;
        });
        
        if (imageNode && imagePos >= 0 && dispatch) {
          const currentHidden = imageNode.attrs.isHidden || false;
          tr.setNodeMarkup(imagePos, undefined, {
            ...imageNode.attrs,
            isHidden: !currentHidden,
          });
          dispatch(tr);
          return true;
        }
        
        return false;
      },
      setImageHidden: (isHidden: boolean) => ({ state, tr, dispatch }) => {
        const { selection } = state;
        const { $from } = selection;
        
        // Найти изображение в текущей позиции
        let imageNode: any = null;
        let imagePos = -1;
        
        state.doc.nodesBetween($from.pos - 1, $from.pos + 1, (node, pos) => {
          if (node.type.name === 'imageResize') {
            imageNode = node;
            imagePos = pos;
            return false;
          }
          return true;
        });
        
        if (imageNode && imagePos >= 0 && dispatch) {
          tr.setNodeMarkup(imagePos, undefined, {
            ...imageNode.attrs,
            isHidden,
          });
          dispatch(tr);
          return true;
        }
        
        return false;
      },
    };
  },
});
