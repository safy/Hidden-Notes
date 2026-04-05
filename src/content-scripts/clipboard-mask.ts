/**
 * @file: clipboard-mask.ts
 * @description: Content Script для перехвата paste событий и маскирования скрытых данных
 * @dependencies: Clipboard API, Web Accessible Resource (inject-mask.js)
 */

import { isHiddenDataInClipboard } from '@/lib/clipboard-masking';

const MASK_FLAG_TYPE = 'application/x-hidden-notes-masked';

/**
 * Инициализирует Content Script на странице
 * 1. Внедряет Web Accessible Resource скрипт
 * 2. Слушает paste события на основной странице
 * 3. Коммуницирует с Web Accessible Resource через postMessage
 */
export function initClipboardMasking(): void {
  console.log('🔐 Initializing clipboard masking on page');

  // Внедряем Web Accessible Resource скрипт
  injectMaskingScript();

  // Слушаем paste события на основной странице (за пределами iframe)
  document.addEventListener('paste', handlePaste, true);

  // Слушаем сообщения от inject-mask.js
  window.addEventListener('message', handleMessageFromPageContext);
}

/**
 * Внедряет inject-mask.js в контекст страницы
 * Это нужно для перехвата paste везде, включая iframe
 */
function injectMaskingScript(): void {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject-mask.js');
    script.onload = function() {
      console.log('✅ Masking script injected into page context');
      script.remove();
    };
    script.onerror = function() {
      console.warn('⚠️ Failed to inject masking script, using Content Script fallback');
      script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.warn('⚠️ Could not inject masking script:', error);
  }
}

/**
 * Обработчик paste события в Content Script контексте
 * @param event - PasteEvent
 */
async function handlePaste(event: ClipboardEvent): Promise<void> {
  try {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;

    // Проверяем, это поле ввода?
    if (!isInputElement(target)) {
      return;
    }

    // Проверяем, есть ли флаг скрытых данных в буфере
    const hasMask = await isHiddenDataInClipboard();

    if (!hasMask) {
      return; // Обычная вставка, не трогаем
    }

    // Перехватываем paste событие
    event.preventDefault();
    event.stopPropagation();

    // Получаем реальные данные из буфера обмена
    const items = await navigator.clipboard.read();
    if (items.length === 0) return;

    const item = items[0];
    if (!item) return;

    const textBlob = await item.getType('text/plain');
    const realData = await textBlob.text();

    // Вставляем реальные данные в поле
    if (target instanceof HTMLInputElement) {
      target.value = realData;
    } else if (target instanceof HTMLTextAreaElement) {
      target.value = realData;
    }

    // Маскируем визуально
    const maskedData = '*'.repeat(realData.length);
    maskInputField(target, realData, maskedData);

    // Сохраняем реальные данные в Service Worker (безопаснее чем sessionStorage)
    const inputId = target.id || generateInputId();
    await chrome.runtime.sendMessage({
      type: 'STORE_MASKED_DATA',
      id: inputId,
      data: realData,
    });
    target.id = inputId;

    // Перехватываем отправку формы, чтобы отправить реальные данные
    const form = target.closest('form');
    if (form) {
      interceptFormSubmit(form);
    }

    console.log('✅ Hidden data pasted and masked');
  } catch (error) {
    console.error('❌ Error handling paste:', error);
  }
}

/**
 * Маскирует данные в поле ввода визуально
 * Реальные данные остаются в value, но отображаются звездочки
 * Пользователь может редактировать поле
 * @param element - input/textarea элемент
 * @param realData - Реальные данные
 * @param maskedData - Маскированные данные для отображения
 */
function maskInputField(element: HTMLInputElement | HTMLTextAreaElement, realData: string, maskedData: string): void {
  // Проверяем если это структурированное поле (MM/YY, дата, телефон)
  const placeholder = (element as HTMLInputElement).placeholder?.toLowerCase() || '';
  const name = element.name?.toLowerCase() || '';
  const inputType = (element as HTMLInputElement).type?.toLowerCase() || '';

  // Паттерны структурированных полей которые НЕ нужно маскировать
  const structuredPatterns = ['mm/yy', 'mm/yyyy', 'expir', 'date', 'month', 'year', 'phone', 'tel', 'cvv', 'cvc', 'postal', 'zip'];
  const isStructured = structuredPatterns.some(pattern =>
    placeholder.includes(pattern) || name.includes(pattern) || inputType === pattern
  );

  // Для структурированных полей - не маскируем, оставляем как есть
  if (isStructured) {
    console.log('ℹ️ Structured field detected, skipping mask for:', {
      placeholder,
      name,
      type: inputType,
    });
    return;
  }

  // Для обычных полей - маскируем
  if (element instanceof HTMLInputElement && element.type === 'text') {
    // Заменяем тип на password для встроенного маскирования
    try {
      element.type = 'password';
    } catch {
      // Некоторые браузеры не позволяют менять type, используем JS маскирование
      element.value = maskedData;
    }
  } else {
    // Для textarea и contenteditable используем JS маскирование
    element.value = maskedData;
  }

  // Добавляем стили для визуального скрытия
  element.style.letterSpacing = '0.5em';
  element.style.fontFamily = 'monospace';

  // НЕ устанавливаем readOnly - пользователь должен иметь возможность редактировать
  // element.readOnly = true; // Удалено - позволяем редактирование
}

/**
 * Перехватывает отправку формы и восстанавливает реальные данные
 * @param form - HTMLFormElement
 */
function interceptFormSubmit(form: HTMLFormElement): void {
  // Проверяем, не добавлен ли уже listener (избегаем дублей)
  if ((form as any).maskingListenerAttached) {
    console.log('⚠️ Listener already attached to this form, skipping');
    return;
  }

  form.addEventListener('submit', async (e) => {
    // Восстанавливаем реальные данные перед отправкой
    const inputs = form.querySelectorAll('input, textarea');

    for (const input of Array.from(inputs)) {
      const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
      const inputId = inputElement.id;

      if (inputId && inputId.startsWith('masked_')) {
        try {
          // Получаем реальные данные из Service Worker
          const response = await chrome.runtime.sendMessage({
            type: 'GET_MASKED_DATA',
            id: inputId,
          });

          if (response.success && response.data) {
            inputElement.value = response.data;
            console.log('✅ Real data restored from Service Worker for form submission');
          }
        } catch (error) {
          console.warn('⚠️ Could not restore masked data:', error);
        }
      }
    }
  });

  // Отмечаем, что listener уже добавлен
  (form as any).maskingListenerAttached = true;
}

/**
 * Обработчик сообщений от inject-mask.js (Web Accessible Resource)
 * @param event - MessageEvent
 */
function handleMessageFromPageContext(event: MessageEvent): void {
  if (event.source !== window) return;
  if (event.data.source !== 'hidden-notes-mask') return;

  if (event.data.type === 'CHECK_CLIPBOARD_MASK') {
    // Проверяем буфер обмена и отправляем результат
    isHiddenDataInClipboard().then((hasMask) => {
      window.postMessage(
        {
          type: 'CLIPBOARD_MASK_RESULT',
          hasMask: hasMask,
          source: 'hidden-notes-mask-content-script',
        },
        '*'
      );
    });
  }
}

/**
 * Проверяет, является ли элемент полем ввода
 */
function isInputElement(element: any): boolean {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.contentEditable === 'true'
  );
}

/**
 * Генерирует криптографически стойкий уникальный ID
 * Использует Web Crypto API вместо Math.random() для улучшенной безопасности
 */
function generateInputId(): string {
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `masked_${hex}`;
}

// Инициализируем при загрузке скрипта
initClipboardMasking();
