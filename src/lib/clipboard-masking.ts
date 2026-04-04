/**
 * @file: clipboard-masking.ts
 * @description: Utilities for copying hidden text with metadata to Chrome Storage
 * @dependencies: Clipboard API, Chrome Storage API
 */

const MASK_KEY = 'lastMaskedText';

/**
 * Копирует скрытый текст в буфер обмена с флагом в Chrome Storage
 * @param text - Реальные данные для копирования
 */
export async function copyHiddenText(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  try {
    // Копируем в буфер обмена
    await navigator.clipboard.writeText(text);
    console.log('✅ Text copied to clipboard');

    // Сохраняем флаг маскирования в Chrome Storage (доступен для всех контекстов)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({
        [MASK_KEY]: {
          timestamp: Date.now(),
          text: text,
        },
      });
      console.log('✅ Hidden text flag saved to Chrome Storage');
    }
  } catch (error) {
    console.error('❌ Failed to copy hidden text:', error);
    throw error;
  }
}

/**
 * Проверяет, содержит ли Chrome Storage флаг скрытых данных
 * @returns Promise<boolean>
 */
export async function isHiddenDataInClipboard(): Promise<boolean> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return false;
    }

    return new Promise((resolve) => {
      chrome.storage.local.get([MASK_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ Could not read Chrome Storage:', chrome.runtime.lastError);
          resolve(false);
          return;
        }

        const data = result[MASK_KEY];
        // Флаг действителен только 60 секунд
        if (data && Date.now() - data.timestamp < 60000) {
          console.log('✅ Found hidden text flag in storage');
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.warn('⚠️ Could not check Chrome Storage:', error);
    return false;
  }
}

/**
 * Очищает флаг скрытых данных из Chrome Storage
 * @returns Promise<void>
 */
export async function clearMaskFlag(): Promise<void> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    chrome.storage.local.remove([MASK_KEY]);
    console.log('✅ Mask flag cleared from Chrome Storage');
  } catch (error) {
    console.warn('⚠️ Could not clear mask flag:', error);
  }
}
