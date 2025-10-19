import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// ES модуль совместимость для __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright Configuration для тестирования Chrome Extension
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Папка с тестами
  testDir: './tests',
  
  // Максимальное время выполнения одного теста
  timeout: 60 * 1000,
  
  // Количество повторных попыток при падении теста
  retries: process.env.CI ? 2 : 0,
  
  // Количество параллельных workers
  workers: process.env.CI ? 1 : undefined,
  
  // Репортеры
  reporter: 'html',
  
  // Глобальные настройки для всех тестов
  use: {
    // Базовый URL (если понадобится)
    baseURL: 'http://localhost:3000',
    
    // Скриншоты при падении
    screenshot: 'only-on-failure',
    
    // Видео при падении
    video: 'retain-on-failure',
    
    // Trace при падении
    trace: 'on-first-retry',
    
    // Таймауты для actions
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Проекты - разные конфигурации запуска
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

