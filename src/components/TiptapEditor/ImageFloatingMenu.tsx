/**
 * @file: ImageFloatingMenu.tsx
 * @description: Floating toolbar для управления изображениями (выравнивание, скачивание, удаление)
 * Использует BubbleMenu из Tiptap для отслеживания selection
 * @dependencies: React, @tiptap/react, shadcn/ui, lucide-react
 * @created: 2025-01-XX
 */

import React, { useEffect } from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ImageFloatingMenuProps {
  editor: Editor;
}

export const ImageFloatingMenu: React.FC<ImageFloatingMenuProps> = ({ editor }) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Логируем что компонент загружен
  useEffect(() => {
    console.log('🎯 ImageFloatingMenu component mounted');
  }, []);

  // Получаем данные текущего изображения
  const getImageData = () => {
    const { state } = editor;
    const { selection } = state;
    
    // Для блочных узлов нужно проверять более широкий диапазон
    // Selection может быть до или после узла изображения
    let imageNode: any = null;
    let imagePos = -1;
    
    // Проверяем узлы в широком диапазоне вокруг selection
    const checkRange = Math.max(5, selection.to - selection.from + 10);
    const startPos = Math.max(0, selection.from - checkRange);
    const endPos = Math.min(state.doc.content.size, selection.to + checkRange);
    
    state.doc.nodesBetween(startPos, endPos, (node, pos) => {
      if (node.type.name === 'imageResize') {
        // Проверяем что selection находится внутри или сразу рядом с узлом изображения
        const nodeEnd = pos + node.nodeSize;
        const isSelected = 
          (selection.from >= pos && selection.from <= nodeEnd) ||
          (selection.to >= pos && selection.to <= nodeEnd) ||
          (selection.from <= pos && selection.to >= nodeEnd) ||
          // Также проверяем что курсор находится близко к узлу (для блочных узлов)
          (Math.abs(selection.from - pos) <= 2) ||
          (Math.abs(selection.to - pos) <= 2);
        
        if (isSelected) {
          imageNode = node;
          imagePos = pos;
          return false;
        }
      }
      return true;
    });
    
    if (imageNode && imagePos >= 0) {
      return {
        node: imageNode,
        pos: imagePos,
        align: imageNode.attrs.align || 'left',
        src: imageNode.attrs.src,
        alt: imageNode.attrs.alt,
      };
    }
    
    return null;
  };

  const imageData = getImageData();
  const currentAlign = imageData?.align || 'left';

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    editor.chain().focus().setImageAlign(newAlign).run();
  };

  const handleDownload = async () => {
    if (!imageData) return;
    
    try {
      const imageSrc = imageData.src;
      
      // Для base64 изображений
      if (imageSrc.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = imageData.alt || 'image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: t('toast.imageDownloaded', { defaultValue: 'Image downloaded' }),
          duration: 2000,
        });
      } else {
        // Для внешних URL
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = imageData.alt || 'image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({
          title: t('toast.imageDownloaded', { defaultValue: 'Image downloaded' }),
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Ошибка скачивания изображения:', error);
      toast({
        title: t('toast.imageDownloadError', { defaultValue: 'Download error' }),
        description: t('toast.imageDownloadFailed', { defaultValue: 'Failed to download image' }),
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleDelete = () => {
    if (!imageData) return;
    
    const { tr } = editor.state;
    tr.delete(imageData.pos, imageData.pos + imageData.node.nodeSize);
    editor.view.dispatch(tr);
    
    toast({
      title: t('toast.imageDeleted', { defaultValue: 'Image deleted' }),
      duration: 2000,
    });
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ 
        duration: 100,
        placement: 'top',
        offset: [0, 8],
      }}
      shouldShow={({ state }) => {
        const { selection } = state;
        
        // Проверяем что выбрано изображение
        let hasImage = false;
        
        // Ищем все изображения в документе
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'imageResize') {
            const nodeEnd = pos + node.nodeSize;
            
            // Строгая проверка: selection должен быть строго внутри узла изображения
            // или на позиции сразу после него (nodeEnd), но НЕ на тексте перед узлом
            const isInsideImage = 
              // Selection полностью внутри узла изображения
              (selection.from >= pos && selection.to <= nodeEnd) ||
              // Selection начинается внутри узла и заканчивается сразу после него (для блочных узлов)
              (selection.from >= pos && selection.from < nodeEnd && selection.to === nodeEnd + 1) ||
              // Selection охватывает весь узел (от начала до конца)
              (selection.from === pos && selection.to === nodeEnd);
            
            if (isInsideImage) {
              // Дополнительная проверка: убеждаемся что selection НЕ находится на текстовом узле
              // Проверяем узел в начале selection
              const nodeAtFrom = state.doc.nodeAt(selection.from);
              
              // Если узел в начале selection - это текст, пропускаем
              if (nodeAtFrom && nodeAtFrom.isText) {
                return true; // Это текст, не изображение
              }
              
              // Проверяем что selection действительно находится в узле изображения
              // Для блочных узлов selection может быть на позиции nodeEnd (сразу после узла)
              if ((selection.from >= pos && selection.from < nodeEnd) || 
                  (selection.from === pos && selection.to >= pos)) {
                hasImage = true;
                return false; // Останавливаем поиск
              }
            }
          }
          return true;
        });
        
        return hasImage;
      }}
    >
      <div className="flex items-center gap-1 bg-background border border-border rounded-md shadow-lg p-1">
        {/* Кнопки выравнивания */}
        <Button
          variant={currentAlign === 'left' ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAlignChange('left')}
          title={t('editor.alignLeft', { defaultValue: 'Align left' })}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={currentAlign === 'center' ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAlignChange('center')}
          title={t('editor.alignCenter', { defaultValue: 'Align center' })}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={currentAlign === 'right' ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAlignChange('right')}
          title={t('editor.alignRight', { defaultValue: 'Align right' })}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Кнопка скачивания */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
          title={t('editor.downloadImage', { defaultValue: 'Download image' })}
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Кнопка удаления */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          title={t('editor.deleteImage', { defaultValue: 'Delete image' })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
};

