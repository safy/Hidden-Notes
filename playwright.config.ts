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
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Глобальные настройки для всех тестов
  use: {
    // Базовый URL (если понадобится)
    // baseURL: 'http://localhost:5173',
    
    // Скриншоты при падении
    screenshot: 'only-on-failure',
    
    // Видео при падении
    video: 'retain-on-failure',
    
    // Trace при падении
    trace: 'retain-on-failure',
    
    // Таймауты для actions
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Проекты - разные конфигурации запуска
  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Запускать НЕ в headless режиме для расширений
        headless: false,
        // Путь к собранному расширению
        args: [
          `--disable-extensions-except=${path.join(__dirname, './dist')}`,
          `--load-extension=${path.join(__dirname, './dist')}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      },
    },
    
    // Опционально: headless режим для CI
    {
      name: 'chromium-extension-headless',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        args: [
          `--disable-extensions-except=${path.join(__dirname, './dist')}`,
          `--load-extension=${path.join(__dirname, './dist')}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--headless=new',
        ],
      },
    },
  ],
});

