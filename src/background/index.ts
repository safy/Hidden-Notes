/**
 * @file: index.ts
 * @description: Background Service Worker для Chrome Extension
 * @dependencies: Chrome Extension API
 * @created: 2025-10-15
 */

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
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message);

  // Здесь можно добавить обработку различных типов сообщений
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG' });
  }

  return true; // Indicates we'll send a response asynchronously
});

/**
 * Мониторинг использования Chrome Storage
 */
async function checkStorageUsage() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse(null);
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

