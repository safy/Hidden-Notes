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

// Инициализация i18n
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
    lng: 'ru', // Язык по умолчанию
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React уже защищает от XSS
    },
  });

export default i18n;




