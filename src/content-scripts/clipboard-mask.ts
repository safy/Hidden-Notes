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
      this.remove();
    };
    script.onerror = function() {
      console.warn('⚠️ Failed to inject masking script, using Content Script fallback');
      this.remove();
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

    const textBlob = await items[0].getType('text/plain');
    const realData = await textBlob.text();

    // Вставляем реальные данные в поле
    if (target instanceof HTMLInputElement) {
      target.value = realData;
    } else if (target instanceof HTMLTextAreaElement) {
      target.value = realData;
    }

    // Маскируем визуально
    maskInputField(target, realData);

    // Сохраняем реальные данные в sessionStorage
    const inputId = target.id || generateInputId();
    sessionStorage.setItem(`masked_${inputId}`, realData);
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
 * @param element - input/textarea элемент
 * @param realData - Реальные данные
 */
function maskInputField(element: HTMLInputElement | HTMLTextAreaElement, realData: string): void {
  const maskedData = '*'.repeat(realData.length);

  // Для input, можно использовать type="password"
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

  // Предотвращаем редактирование маскированного содержимого
  element.readOnly = true;
}

/**
 * Перехватывает отправку формы и восстанавливает реальные данные
 * @param form - HTMLFormElement
 */
function interceptFormSubmit(form: HTMLFormElement): void {
  form.addEventListener('submit', (e) => {
    // Восстанавливаем реальные данные перед отправкой
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach((input: any) => {
      const inputId = input.id;
      if (inputId) {
        const realData = sessionStorage.getItem(`masked_${inputId}`);
        if (realData) {
          input.value = realData;
          console.log('✅ Real data restored for form submission');
        }
      }
    });
  });
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
 * Генерирует уникальный ID для поля ввода
 */
function generateInputId(): string {
  return `masked_input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Инициализируем при загрузке скрипта
initClipboardMasking();
