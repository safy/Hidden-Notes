/**
 * @file: ImageLoader.tsx
 * @description: Компонент для загрузки изображений из IndexedDB
 * @dependencies: React, image-storage
 * @created: 2025-01-XX
 */

import React, { useEffect, useState } from 'react';
import { getImageFromIndexedDB } from '@/lib/image-storage';

interface ImageLoaderProps {
  src: string;
  imageId?: string;
  noteId: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Компонент для загрузки изображений из IndexedDB
 * Если изображение хранится в IndexedDB, загружает его асинхронно
 */
export const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  imageId,
  noteId,
  alt = '',
  className = '',
  style,
}) => {
  const [loadedSrc, setLoadedSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Проверяем, нужно ли загружать из IndexedDB
    const useIndexedDB = imageId && (src.includes('Loading...') || src.startsWith('data:image/svg+xml'));
    
    if (useIndexedDB && imageId) {
      setIsLoading(true);
      setHasError(false);
      
      getImageFromIndexedDB(imageId)
        .then((dataUrl) => {
          if (dataUrl) {
            setLoadedSrc(dataUrl);
            setIsLoading(false);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error('Failed to load image from IndexedDB:', error);
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      // Обычный data URL, используем как есть
      setLoadedSrc(src);
    }
  }, [src, imageId, noteId]);

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        style={{ minHeight: '200px', ...style }}
      >
        <span className="text-sm">Ошибка загрузки изображения</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted ${className}`}
        style={{ minHeight: '200px', ...style }}
      >
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <img
      src={loadedSrc}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
};

