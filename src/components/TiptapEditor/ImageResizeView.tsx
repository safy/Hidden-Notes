/**
 * @file: ImageResizeView.tsx
 * @description: React компонент для отображения изображения с возможностью изменения размера
 * @dependencies: React, @tiptap/react
 * @created: 2025-01-15
 */

import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

export const ImageResizeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { src, alt, width, height, isHidden, align } = node.attrs;
  const [currentWidth, setCurrentWidth] = useState(width || 300);
  const [currentHeight, setCurrentHeight] = useState(height || 200);
  const imageRef = useRef<HTMLImageElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startWidth = useRef(0);
  const startHeight = useRef(0);
  const isInitialized = useRef(false);

  // Синхронизируем локальный state с node.attrs при изменении
  useEffect(() => {
    if (width && height) {
      setCurrentWidth(width);
      setCurrentHeight(height);
      isInitialized.current = true;
    }
  }, [width, height, src]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startWidth.current = currentWidth;
    startHeight.current = currentHeight;

    let finalWidth = currentWidth;
    let finalHeight = currentHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;
      
      const newWidth = Math.max(50, startWidth.current + deltaX);
      const newHeight = Math.max(50, startHeight.current + deltaY);
      
      finalWidth = newWidth;
      finalHeight = newHeight;
      
      setCurrentWidth(newWidth);
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = () => {
      updateAttributes({
        width: finalWidth,
        height: finalHeight,
      });
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleImageLoad = () => {
    // Если размеры уже установлены (из сохраненных данных), не перезаписываем
    if (!imageRef.current || isInitialized.current || width || height) return;
    
    const { naturalWidth, naturalHeight } = imageRef.current;
    const maxWidth = 400;
    const maxHeight = 300;
    
    let newWidth = naturalWidth;
    let newHeight = naturalHeight;
    
    if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
      const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
      newWidth = naturalWidth * ratio;
      newHeight = naturalHeight * ratio;
    }
    
    setCurrentWidth(newWidth);
    setCurrentHeight(newHeight);
    updateAttributes({
      width: newWidth,
      height: newHeight,
    });
    isInitialized.current = true;
  };

  const currentAlign = align || 'left';

  return (
    <NodeViewWrapper 
      className={`image-resize-wrapper image-align-${currentAlign}`}
      data-align={currentAlign}
    >
      <div
        className={`image-resizer ${selected ? 'selected' : ''} ${isHidden ? 'hidden-image' : ''}`}
        data-hidden={isHidden ? 'true' : 'false'}
        style={{
          width: currentWidth,
          height: currentHeight,
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          className={isHidden ? 'opacity-0' : ''}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '0.5rem',
            userSelect: 'none',
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />
        
        {/* Показываем resize handle когда selected */}
        {selected && (
          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 12,
              height: 12,
              background: 'hsl(var(--primary))',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'se-resize',
              zIndex: 10,
            }}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};
