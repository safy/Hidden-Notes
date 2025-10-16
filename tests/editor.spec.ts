import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Тесты для Hidden Notes Editor
 * 
 * Эти тесты проверяют основной функционал редактора:
 * - Загрузка расширения
 * - Открытие Side Panel
 * - Базовое форматирование текста
 * - Работу toolbar
 */

// ES модуль совместимость для __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context: BrowserContext;
let extensionId: string;
const pathToExtension = path.join(__dirname, '../dist');

test.beforeAll(async () => {
  // Запускаем браузер с расширением
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  // Даём время браузеру загрузить расширение
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Получаем ID расширения из service worker
  let [background] = context.serviceWorkers();
  if (!background) {
    try {
      background = await context.waitForEvent('serviceworker', { timeout: 5000 });
    } catch (error) {
      console.log('Service worker not found, trying alternative method...');
    }
  }

  // Если service worker найден, пытаемся получить ID из него
  if (background) {
    const backgroundUrl = background.url();
    console.log(`Background URL: ${backgroundUrl}`);
    
    // Извлекаем ID из URL service worker
    const urlParts = backgroundUrl.split('/');
    extensionId = urlParts[2]; // chrome-extension://ID/service-worker-loader.js
    
    console.log(`Extension ID from service worker: ${extensionId}`);
  }
  
  // Если ID не получен или некорректен, используем альтернативный способ
  if (!extensionId || extensionId.length !== 32) {
    console.log('Trying alternative method to get extension ID...');
    const extensionsPage = await context.newPage();
    await extensionsPage.goto('chrome://extensions/');
    
    // Ждем загрузки страницы
    await extensionsPage.waitForLoadState('networkidle');
    
    // Включаем режим разработчика если нужно
    const devModeToggle = extensionsPage.locator('extensions-manager').locator('#devMode');
    const isDevModeEnabled = await devModeToggle.evaluate((el: HTMLInputElement) => el.checked);
    if (!isDevModeEnabled) {
      await devModeToggle.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Ищем расширение по имени
    const extensionCard = extensionsPage.locator('extensions-item').filter({ hasText: 'Hidden Notes' });
    await expect(extensionCard).toBeVisible({ timeout: 10000 });
    
    // Получаем ID из атрибута id элемента
    const cardId = await extensionCard.getAttribute('id');
    if (cardId) {
      extensionId = cardId;
      console.log(`Extension ID from page: ${extensionId}`);
    }
    
    await extensionsPage.close();
    
    // Если все еще не получили ID, выбрасываем ошибку
    if (!extensionId || extensionId.length !== 32) {
      throw new Error(`Failed to get extension ID. Got: ${extensionId}`);
    }
  }
});

test.afterAll(async () => {
  await context.close();
});

/**
 * Helper function для открытия Side Panel в тестах
 * Использует service worker context для создания страницы расширения
 */
async function openSidePanel() {
  // Получаем URL Side Panel
  const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
  
  // Пробуем через service worker если доступен
  let [serviceWorker] = context.serviceWorkers();
  
  if (serviceWorker) {
    try {
      // Создаем Promise для ожидания новой страницы ПЕРЕД созданием вкладки
      const pagePromise = context.waitForEvent('page', { timeout: 10000 });
      
      // Используем service worker для создания новой вкладки с URL расширения
      await serviceWorker.evaluate(async (url) => {
        await chrome.tabs.create({ url, active: true });
      }, sidePanelUrl);
      
      // Ждем появления новой страницы
      const page = await pagePromise;
      
      // Ждем загрузки
      await page.waitForLoadState('load');
      
      // Закрываем все пустые вкладки (about:blank)
      const allPages = context.pages();
      for (const p of allPages) {
        if (p !== page && p.url() === 'about:blank') {
          await p.close();
        }
      }
      
      // Переводим фокус на нашу страницу
      await page.bringToFront();
      
      return page;
    } catch (error) {
      console.log('Service worker method failed, using alternative...');
    }
  }
  
  // Альтернативный метод: создаем новую страницу напрямую
  // Это работает, когда service worker недоступен
  const page = await context.newPage();
  
  // Навигация к extension URL напрямую
  await page.goto(sidePanelUrl, { waitUntil: 'load' });
  
  // Закрываем пустые вкладки
  const allPages = context.pages();
  for (const p of allPages) {
    if (p !== page && p.url() === 'about:blank') {
      await p.close();
    }
  }
  
  await page.bringToFront();
  
  return page;
}

/**
 * Helper function для создания новой заметки
 */
async function createNewNote(page: any) {
  // Ищем кнопку создания заметки (первая кнопка с "+")
  const createButton = page.locator('button').first();
  
  // Кликаем на кнопку создания
  await createButton.click();
  
  // Ждем появления редактора
  await page.waitForTimeout(2000);
  
  // Проверяем что редактор появился
  const editor = page.locator('.ProseMirror').first();
  await editor.waitFor({ state: 'visible', timeout: 5000 });
  
  return editor;
}

test.describe('Hidden Notes Extension', () => {
  
  test('должно загрузиться расширение', async () => {
    // Проверяем что extension ID получен
    expect(extensionId).toBeDefined();
    expect(extensionId).not.toBe('');
    expect(extensionId.length).toBeGreaterThan(10);
    
    // Проверяем что ID имеет правильный формат (chrome extension ID)
    expect(extensionId).toMatch(/^[a-z]{32}$/);
    
    // Дополнительная проверка - убеждаемся что расширение действительно загружено
    const extensionsPage = await context.newPage();
    await extensionsPage.goto('chrome://extensions/');
    
    // Ищем наше расширение по имени
    const extensionElement = extensionsPage.locator('extensions-item').filter({ hasText: 'Hidden Notes' });
    await expect(extensionElement).toBeVisible({ timeout: 10000 });
    
    await extensionsPage.close();
  });

  test('должен открыться Side Panel', async () => {
    const page = await openSidePanel();
    
    // Ждем загрузки контента
    await page.waitForLoadState('networkidle');
    
    // Проверяем что страница загрузилась
    expect(await page.title()).toContain('Hidden Notes');
    
    await page.close();
  });

  test('должен отобразиться интерфейс приложения', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Ждем появления root элемента
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
    
    // Проверяем наличие основных элементов
    // Sidebar
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 5000 });
    
    // Editor Area
    const editor = page.locator('[data-testid="editor"], .editor, .ProseMirror');
    await expect(editor.first()).toBeVisible({ timeout: 5000 });
    
    await page.close();
  });

  test('должен работать toolbar', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Создаем новую заметку чтобы открылся редактор
    await createNewNote(page);
    
    // Ждем загрузки toolbar
    await page.waitForTimeout(1000);
    
    // Ищем кнопки toolbar (Bold, Italic и т.д.)
    const boldButton = page.locator('button[title="Жирный"]');
    const italicButton = page.locator('button[title="Курсив"]');
    
    // Проверяем что кнопки видимы
    await expect(boldButton).toBeVisible({ timeout: 5000 });
    await expect(italicButton).toBeVisible({ timeout: 5000 });
    
    await page.close();
  });

  test('должен вводиться текст в редактор', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Создаем новую заметку
    const editor = await createNewNote(page);
    
    // Кликаем в редактор
    await editor.click();
    
    // Вводим текст
    await editor.type('Hello World from Playwright!');
    
    // Проверяем что текст появился
    await expect(editor).toContainText('Hello World from Playwright!');
    
    await page.close();
  });

  test('должно применяться форматирование Bold', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Создаем новую заметку
    const editor = await createNewNote(page);
    
    // Вводим текст
    await editor.click();
    await editor.type('Test Bold');
    
    // Выделяем текст (Ctrl+A)
    await page.keyboard.press('Control+A');
    
    // Нажимаем Bold (Ctrl+B)
    await page.keyboard.press('Control+B');
    
    // Проверяем что текст стал жирным
    const strongText = editor.locator('strong, b');
    await expect(strongText).toContainText('Test Bold');
    
    await page.close();
  });

  test('должно применяться форматирование Italic', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Создаем новую заметку
    const editor = await createNewNote(page);
    
    // Вводим текст
    await editor.click();
    await editor.type('Test Italic');
    
    // Выделяем текст (Ctrl+A)
    await page.keyboard.press('Control+A');
    
    // Нажимаем Italic (Ctrl+I)
    await page.keyboard.press('Control+I');
    
    // Проверяем что текст стал курсивным
    const emText = editor.locator('em, i');
    await expect(emText).toContainText('Test Italic');
    
    await page.close();
  });

  test('должен создаваться заголовок H1', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Создаем новую заметку
    const editor = await createNewNote(page);
    
    // Вводим текст
    await editor.click();
    await editor.type('Heading 1');
    
    // Применяем H1 (Ctrl+Alt+1)
    await page.keyboard.press('Control+Alt+Digit1');
    
    // Проверяем что создался H1
    const h1 = editor.locator('h1');
    await expect(h1).toContainText('Heading 1');
    
    await page.close();
  });

  test('должен работать Undo/Redo', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Создаем новую заметку
    const editor = await createNewNote(page);
    
    // Вводим текст
    await editor.click();
    await editor.type('Test Undo');
    
    // Проверяем что текст есть
    await expect(editor).toContainText('Test Undo');
    
    // Отменяем (Ctrl+Z)
    await page.keyboard.press('Control+Z');
    
    // Проверяем что текст исчез
    await expect(editor).not.toContainText('Test Undo');
    
    // Возвращаем (Ctrl+Y)
    await page.keyboard.press('Control+Y');
    
    // Проверяем что текст вернулся
    await expect(editor).toContainText('Test Undo');
    
    await page.close();
  });

  test('должен создаваться Bullet List', async () => {
    const page = await openSidePanel();
    await page.waitForLoadState('networkidle');
    
    // Создаем новую заметку
    const editor = await createNewNote(page);
    
    // Вводим текст
    await editor.click();
    await editor.type('List item 1');
    
    // Применяем Bullet List (Ctrl+Shift+8)
    await page.keyboard.press('Control+Shift+Digit8');
    
    // Проверяем что создался ul
    const ul = editor.locator('ul');
    await expect(ul).toBeVisible();
    await expect(ul.locator('li')).toContainText('List item 1');
    
    await page.close();
  });
});

