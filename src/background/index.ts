/**
 * @file: index.ts
 * @description: Background Service Worker для Chrome Extension
 * @dependencies: Chrome Extension API
 * @created: 2025-10-15
 */

import { maskedDataStore } from './masked-data-store';

/**
 * Type definition for incoming messages
 */
interface MaskedDataMessage {
  type: 'STORE_MASKED_DATA' | 'GET_MASKED_DATA' | 'DELETE_MASKED_DATA' | 'PING';
  id?: string;
  data?: string;
}

console.log('Hidden Notes: Background Service Worker started');

/**
 * Настройка Side Panel при установке расширения
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hidden Notes: Extension installed');

  // Настройка Side Panel для открытия при клике на иконку
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Error setting panel behavior:', error));
});

/**
 * Обработчик клика на иконку расширения
 */
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  // Открытие Side Panel
  chrome.sidePanel
    .open({ tabId: tab.id })
    .catch((error) => console.error('Error opening side panel:', error));
});

/**
 * Обработчик сообщений от других частей расширения
 */
chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const msg = message as MaskedDataMessage;
  console.log('Background received message:', msg);

  if (msg.type === 'PING') {
    sendResponse({ status: 'PONG' });
    return true;
  }

  if (msg.type === 'STORE_MASKED_DATA') {
    // Validate required parameters
    if (!msg.id || !msg.data) {
      sendResponse({ success: false, error: 'Missing id or data' });
      return true;
    }

    maskedDataStore
      .set(msg.id, msg.data)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Failed to store masked data:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }

  if (msg.type === 'GET_MASKED_DATA') {
    // Validate required parameters
    if (!msg.id) {
      sendResponse({ success: false, error: 'Missing id' });
      return true;
    }

    maskedDataStore
      .get(msg.id)
      .then((data) => {
        sendResponse({ success: true, data: data || null });
      })
      .catch((error) => {
        console.error('Failed to retrieve masked data:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }

  if (msg.type === 'DELETE_MASKED_DATA') {
    // Validate required parameters
    if (!msg.id) {
      sendResponse({ success: false, error: 'Missing id' });
      return true;
    }

    maskedDataStore.delete(msg.id);
    sendResponse({ success: true });
    return true;
  }

  return true; // Indicates we'll send a response asynchronously
});

// On extension shutdown
chrome.runtime.onSuspend?.addListener(() => {
  maskedDataStore.destroy();
});

/**
 * Мониторинг использования Chrome Storage
 */
async function checkStorageUsage() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse(null);
    
    // Проверяем наличие разрешения unlimitedStorage
    const hasUnlimited = await new Promise<boolean>((resolve) => {
      chrome.permissions.contains({ permissions: ['unlimitedStorage'] }, (result) => {
        resolve(result);
      });
    });

    if (hasUnlimited) {
      console.log(`Storage usage: ${(bytesInUse / 1024 / 1024).toFixed(2)} MB (Unlimited storage active)`);
      return;
    }

    const maxBytes = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB
    const usagePercent = (bytesInUse / maxBytes) * 100;

    console.log(`Storage usage: ${bytesInUse} bytes (${usagePercent.toFixed(2)}%)`);

    // Предупреждение если использовано > 80%
    if (usagePercent > 80) {
      console.warn('Storage is almost full!', {
        used: bytesInUse,
        max: maxBytes,
        percent: usagePercent,
      });
    }
  } catch (error) {
    console.error('Error checking storage usage:', error);
  }
}

// Проверка storage каждые 5 минут
setInterval(checkStorageUsage, 5 * 60 * 1000);

// Первая проверка при старте
checkStorageUsage();

