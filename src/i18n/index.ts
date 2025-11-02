/**
 * @file: i18n/index.ts
 * @description: Конфигурация интернационализации приложения
 * @dependencies: i18next, react-i18next
 * @created: 2025-10-29
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';

// Функция для загрузки языка из storage
const loadLanguageFromStorage = async (): Promise<string> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get('language');
      return result.language === 'en' ? 'en' : 'ru';
    }
  } catch (error) {
    console.error('Error loading language from storage:', error);
  }
  return 'ru'; // По умолчанию русский
};

// Инициализируем синхронно для совместимости с существующим кодом
// Но также загружаем язык из storage
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ru: {
        translation: ruTranslations,
      },
    },
    lng: 'ru', // Язык по умолчанию (будет переопределен ниже)
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React уже защищает от XSS
    },
  });

// Загружаем язык из storage после инициализации
loadLanguageFromStorage().then((lang) => {
  i18n.changeLanguage(lang);
});

export default i18n;




