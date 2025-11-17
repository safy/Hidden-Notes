/**
 * @file: image-compression.ts
 * @description: Утилиты для сжатия и оптимизации изображений перед сохранением
 * @dependencies: Canvas API
 * @created: 2025-01-XX
 */

export interface ImageCompressionOptions {
  maxWidth?: number;      // Максимальная ширина (по умолчанию 1920px)
  maxHeight?: number;     // Максимальная высота (по умолчанию 1920px)
  quality?: number;       // Качество сжатия 0-1 (по умолчанию 0.8)
  format?: 'webp' | 'jpeg' | 'png'; // Формат (по умолчанию webp)
  maxSizeBytes?: number;  // Максимальный размер в байтах (по умолчанию 1MB)
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'webp',
  maxSizeBytes: 1024 * 1024, // 1MB
};

/**
 * Сжать изображение с использованием Canvas API
 * @param file - Файл изображения
 * @param options - Опции сжатия
 * @returns Promise с data URL сжатого изображения
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Вычисляем новые размеры с сохранением пропорций
          let { width, height } = img;
          
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(
              opts.maxWidth / width,
              opts.maxHeight / height
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Создаем canvas для сжатия
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Рисуем изображение на canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Определяем MIME type
          let mimeType: string;
          switch (opts.format) {
            case 'jpeg':
              mimeType = 'image/jpeg';
              break;
            case 'png':
              mimeType = 'image/png';
              break;
            case 'webp':
            default:
              mimeType = 'image/webp';
              break;
          }
          
          // Пробуем сжать с разным качеством, если размер превышает лимит
          let currentQuality = opts.quality;
          const tryCompress = (quality: number): void => {
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const sizeBytes = getDataUrlSize(dataUrl);
            
            // Если размер в пределах лимита или качество уже минимальное
            if (sizeBytes <= opts.maxSizeBytes || quality <= 0.3) {
              resolve(dataUrl);
              return;
            }
            
            // Уменьшаем качество и пробуем снова
            tryCompress(Math.max(0.3, quality - 0.1));
          };
          
          tryCompress(currentQuality);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Получить размер data URL в байтах
 */
function getDataUrlSize(dataUrl: string): number {
  // Убираем префикс "data:image/...;base64,"
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  
  // Base64 увеличивает размер на ~33%, поэтому реальный размер меньше
  // Формула: (base64.length * 3) / 4
  return (base64.length * 3) / 4;
}

/**
 * Проверить, нужно ли сжимать изображение
 */
export function shouldCompressImage(file: File): boolean {
  // Сжимаем если файл больше 500KB
  return file.size > 500 * 1024;
}

/**
 * Получить информацию об изображении без загрузки
 */
export function getImageInfo(file: File): {
  size: number;
  sizeMB: number;
  type: string;
  name: string;
} {
  return {
    size: file.size,
    sizeMB: file.size / (1024 * 1024),
    type: file.type,
    name: file.name,
  };
}

