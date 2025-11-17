/**
 * @file: ImageStorageMenu.tsx
 * @description: Меню для управления сохранением изображений на диск
 * @dependencies: React, shadcn/ui, file-storage
 * @created: 2025-01-XX
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Download, FolderOpen, HardDrive } from 'lucide-react';
import { 
  saveImageToDisk, 
  saveNoteImagesToFolder,
  isFileSystemAccessSupported 
} from '@/lib/file-storage';
import { getImageFromIndexedDB } from '@/lib/image-storage';

interface ImageStorageMenuProps {
  imageSrc: string;
  imageId?: string;
  noteId: string;
  noteTitle: string;
  fileName?: string;
  onSaved?: () => void;
}

/**
 * Меню для сохранения изображений на диск
 */
export const ImageStorageMenu: React.FC<ImageStorageMenuProps> = ({
  imageSrc,
  imageId,
  noteId,
  noteTitle,
  fileName = 'image',
  onSaved,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  // Проверяем поддержку File System Access API
  const isSupported = isFileSystemAccessSupported();

  if (!isSupported) {
    // Fallback: скачивание через blob URL
    const handleDownload = () => {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `${fileName}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onSaved?.();
    };

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        title="Скачать изображение"
      >
        <Download className="h-4 w-4" />
      </Button>
    );
  }

  const handleSaveToDisk = async () => {
    setIsSaving(true);
    try {
      // Если изображение в IndexedDB, загружаем его
      let imageDataUrl = imageSrc;
      if (imageId) {
        const loadedImage = await getImageFromIndexedDB(imageId);
        if (loadedImage) {
          imageDataUrl = loadedImage;
        }
      }

      // Определяем MIME type
      const mimeType = imageDataUrl.match(/data:image\/([^;]+)/)?.[1] || 'webp';
      const fullMimeType = `image/${mimeType}`;

      await saveImageToDisk(imageDataUrl, fileName, fullMimeType);
      onSaved?.();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to save image to disk:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllToFolder = async () => {
    setIsSaving(true);
    try {
      // Загружаем все изображения из заметки
      // Это упрощенная версия - в реальности нужно извлечь все изображения из HTML
      const imageDataUrls: string[] = [];
      
      // Если изображение в IndexedDB, загружаем его
      if (imageId) {
        const loadedImage = await getImageFromIndexedDB(imageId);
        if (loadedImage) {
          imageDataUrls.push(loadedImage);
        }
      } else {
        imageDataUrls.push(imageSrc);
      }

      await saveNoteImagesToFolder(noteId, noteTitle, imageDataUrls);
      onSaved?.();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to save images to folder:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isSaving}
          title="Сохранить изображение на диск"
        >
          <HardDrive className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSaveToDisk} disabled={isSaving}>
          <Download className="mr-2 h-4 w-4" />
          Сохранить это изображение
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSaveAllToFolder} disabled={isSaving}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Сохранить все изображения заметки
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

