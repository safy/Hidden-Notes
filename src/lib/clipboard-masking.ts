/**
 * @file: clipboard-masking.ts
 * @description: Utilities for copying hidden text with metadata to clipboard
 * @dependencies: Clipboard API
 */

const MASK_FLAG_TYPE = 'application/x-hidden-notes-masked';

/**
 * Копирует скрытый текст в буфер обмена с метаданными
 * @param text - Реальные данные для копирования
 * @throws Error если Clipboard API недоступен
 */
export async function copyHiddenText(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  try {
    const textBlob = new Blob([text], { type: 'text/plain' });
    const maskBlob = new Blob(['true'], { type: MASK_FLAG_TYPE });

    const clipboardItem = new ClipboardItem({
      'text/plain': textBlob,
      [MASK_FLAG_TYPE]: maskBlob,
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('✅ Hidden text copied with mask metadata');
  } catch (error) {
    console.error('❌ Failed to copy hidden text:', error);
    throw error;
  }
}

/**
 * Проверяет, содержит ли буфер обмена флаг скрытых данных
 * @returns Promise<boolean>
 */
export async function isHiddenDataInClipboard(): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      return false;
    }

    const items = await navigator.clipboard.read();

    return items.some(item => item.types.includes(MASK_FLAG_TYPE));
  } catch (error) {
    console.warn('⚠️ Could not read clipboard:', error);
    return false;
  }
}

/**
 * Очищает флаг скрытых данных из буфера обмена
 * @returns Promise<void>
 */
export async function clearMaskFlag(): Promise<void> {
  try {
    if (!navigator.clipboard) {
      return;
    }

    // Читаем текущее содержимое буфера
    const items = await navigator.clipboard.read();

    if (items.length === 0) return;

    // Получаем текст из первого item
    const item = items[0];
    if (!item) return;

    const textBlob = await item.getType('text/plain');
    const text = await textBlob.text();

    // Пишем обратно без метаданных флага (только text/plain)
    const newClipboardItem = new ClipboardItem({
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([newClipboardItem]);
    console.log('✅ Mask flag cleared from clipboard');
  } catch (error) {
    console.warn('⚠️ Could not clear mask flag:', error);
    // Это не критично, просто логируем
  }
}
