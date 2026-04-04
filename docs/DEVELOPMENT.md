# Development Guide - Hidden Notes

> Руководство для разработчиков

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Разработка
```bash
npm run dev
```

Откроется Vite dev server. Расширение собирается в `dist/`.

### 3. Загрузка в Chrome
1. Откройте `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `dist/`

### 4. Сборка для production
```bash
npm run build
```

---

## 🔍 Chrome DevTools - Полное руководство

### Открытие DevTools

#### 1️⃣ DevTools для Side Panel

```bash
# Способ 1: Клавиатура
F12  # Откроет DevTools внизу экрана

# Способ 2: Меню
Ctrl+Shift+I  # Или через меню браузера
```

#### 2️⃣ DevTools для Background Service Worker

1. Откройте `chrome://extensions/`
2. Найдите **Hidden Notes**
3. Нажмите на ссылку **"service worker"**
   - ✅ Откроется DevTools в отдельном окне

#### 3️⃣ DevTools для Popup (если есть)

1. Откройте `chrome://extensions/`
2. Нажмите **Details** на карточке расширения
3. Откроется Extension options

---

### DevTools вкладки и что они показывают

| Вкладка | Что делает | Для чего |
|---------|-----------|---------|
| **Console** | Логирование, выполнение скриптов | Отладка, запуск команд |
| **Network** | HTTP запросы | Проверка загрузок (не должно быть!) |
| **Application** | Storage, cookies, cache | Просмотр сохраненных заметок |
| **Performance** | Профилирование | Найти проблемы производительности |
| **Memory** | Использование памяти | Поиск утечек памяти |
| **Sources** | Исходный код | Отладка с breakpoints |
| **Elements** | DOM инспектор | Проверка HTML структуры |

---

### 📝 Работа с Storage

#### Просмотр сохраненных заметок

1. **F12** → **Application** tab
2. Слева: **Storage** → **Extension Storage**
3. Выберите ID расширения (длинная строка букв)
4. Просмотрите ключи:
   - `notes` - массив всех заметок
   - `settings` - настройки приложения

**Структура заметки**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Название заметки",
  "content": "<p>HTML контент</p>",
  "createdAt": 1729353600000,
  "updatedAt": 1729353600000
}
```

---

### 🧪 Тестирование в Console

#### DevTools Helper Commands

При загрузке Side Panel автоматически инициализируется помощник. В console введите:

```javascript
// Просмотр помощи
window.__devtools.help()

// 📝 Управление заметками
await window.__devtools.getAllNotes()              // Получить все заметки
await window.__devtools.addTestNote('Title')       // Добавить тестовую
await window.__devtools.clearAllNotes()            // Очистить все

// 📊 Информация о Storage
await window.__devtools.getStorageInfo()           // Размер и квота
await window.__devtools.exportData()               // Экспорт в JSON

// 📡 Мониторинг
window.__devtools.startMonitoring()                // Отслеживать изменения
await window.__devtools.runTests()                 // Запустить тесты
```

#### Пример использования:

```javascript
// Добавить 10 тестовых заметок
for (let i = 1; i <= 10; i++) {
  await window.__devtools.addTestNote(`Test Note ${i}`);
}

// Проверить размер
const info = await window.__devtools.getStorageInfo();
console.log(`Used: ${info.formattedSize} (${info.percentUsed.toFixed(2)}%)`);
```

---

### 🎯 Автоматизированные тесты в Console

**Запустить набор встроенных тестов**:

```javascript
await window.__devtools.runTests()
```

Результат:
```
🧪 Running tests...

✅ Chrome Storage API available
✅ Can get notes (5 notes found)
✅ Can add notes
✅ Storage size: 45.23 KB (0.44% used)

📊 Test Summary:
✅ Passed: 4
❌ Failed: 0
📈 Success rate: 100.0%
```

---

### 🔎 Debug скрипты для Console

#### Проверка всех данных

```javascript
// Скопируйте и вставьте в Console:
chrome.storage.local.get(null, (result) => {
  console.table(result);  // Красивая таблица
  console.log(JSON.stringify(result, null, 2));  // JSON формат
});
```

#### Добавление заметки через Storage API

```javascript
const newNote = {
  id: 'test-' + Date.now(),
  title: 'Manual Test Note',
  content: '<p>Added from DevTools</p>',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

chrome.storage.local.get(['notes'], (result) => {
  const notes = result.notes || [];
  notes.push(newNote);
  chrome.storage.local.set({ notes }, () => {
    console.log('✅ Note added');
  });
});
```

#### Размер Storage

```javascript
chrome.storage.local.getBytesInUse(null, (bytes) => {
  const mb = (bytes / 1024 / 1024).toFixed(2);
  const quota = 10;  // 10MB limit
  const percent = (bytes / (quota * 1024 * 1024) * 100).toFixed(2);
  console.log(`Storage: ${mb}MB used (${percent}% of ${quota}MB quota)`);
});
```

#### Наблюдение за изменениями

```javascript
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    console.log('⏰ Storage changed at', new Date().toLocaleTimeString());
    Object.keys(changes).forEach(key => {
      console.log(`  ${key}:`, changes[key]);
    });
  }
});

console.log('📡 Listening for changes... (run in another tab to test)');
```

---

### ⚡ Performance Profiling

#### Измерить время выполнения функции

```javascript
console.time('myTimer');
// ... выполнить действие ...
console.timeEnd('myTimer');

// Результат: myTimer: 123.45ms
```

#### Профилировать всю операцию

1. **DevTools** → **Performance** tab
2. Нажмите красную кнопку **Record**
3. Выполните действие (создание заметки, поиск)
4. Нажмите **Stop**
5. Дождитесь анализа и посмотрите chart

**Что проверить**:
- ⚡ JS execution < 16ms для плавности 60 FPS
- 🎨 Rendering < 16ms
- 📝 Total < 100ms для больших действий

---

### 🧠 Memory Profiling

#### Поиск утечек памяти

1. **DevTools** → **Memory** tab
2. Нажмите **Take snapshot** (снимок памяти)
3. Выполните действие (создайте 50 заметок)
4. Нажмите **Take snapshot** снова
5. Сравните размер

**Здоровые показатели**:
- Первый снимок: ~2-3 MB
- После 50 заметок: +1-2 MB (не больше!)

#### Детальная проверка

```javascript
// Проверить объекты в памяти
console.memory.usedJSHeapSize / 1048576  // MB
console.memory.totalJSHeapSize / 1048576  // MB
```

---

### 🐛 Отладка с Breakpoints

#### Добавить breakpoint

1. **DevTools** → **Sources** tab
2. Найдите файл `src/sidepanel/App.tsx`
3. Кликните на номер строки
4. Выполните действие - выполнение приостановится
5. Инспектируйте переменные, используйте **Step** для пошагового выполнения

#### Условные breakpoints

1. Кликните правой кнопкой на номер строки
2. Выберите **Add conditional breakpoint**
3. Введите условие: `notes.length > 10`
4. Breakpoint срабатывает только если условие true

---

### 🔥 Горячие клавиши в DevTools

| Клавиша | Действие |
|---------|---------|
| **F12** | Открыть/закрыть DevTools |
| **Ctrl+Shift+C** | Инспектор элементов |
| **Ctrl+Shift+K** | Консоль |
| **Ctrl+Shift+P** | Команды палитра |
| **Ctrl+,** | Настройки |
| **Ctrl+]** | Следующая вкладка |
| **Ctrl+[** | Предыдущая вкладка |

---

### 📊 React DevTools

#### Установка

1. Откройте Chrome Web Store
2. Ищите "React Developer Tools"
3. Нажмите "Add to Chrome"

#### Использование

1. **DevTools** → **Components** tab (слева будет новая вкладка)
2. Инспектируйте React компоненты:
   - `<App>`
   - `<Sidebar>`
   - `<TiptapEditor>`
   - `<NoteView>`

3. Смотрите **Props** и **State** каждого компонента
4. Используйте **Profiler** для поиска ненужных ре-рендеров

#### Пример:

```
App
├── Sidebar (props: notes, onSelect)
│   └── NoteItem (props: id, title, isActive)
├── NoteView (props: noteId)
│   └── TiptapEditor (props: content, onChange)
└── Header (props: theme, onThemeToggle)
```

---

## 🛠️ Playwright E2E тестирование

### Запуск тестов

```bash
# Обычный запуск
npm run test

# UI режим
npm run test:ui

# Headless (видимый браузер)
npm run test:headed

# Debug режим (Playwright Inspector)
npm run test:debug

# Показать HTML отчет
npm run test:report
```

### Debug режим

Когда вы запускаете `npm run test:debug`:

1. Откроется **Playwright Inspector**
2. В инспекторе есть кнопки:
   - ▶️ **Resume** - выполнить дальше
   - ⏸️ **Pause** - поставить на паузу
   - ➡️ **Step** - один шаг
   - 🔄 **Step back** - назад
3. Браузер показывает действия в реальном времени
4. Можете инспектировать элементы, открыть DevTools (F12)

### Написание тестов

```typescript
import { test, expect } from '@playwright/test';

test('Create a new note', async ({ page }) => {
  // Загрузить расширение (если тестируете локально)
  await page.goto('chrome-extension://...');
  
  // 🔧 DEBUG: Раскомментируйте для паузы
  // await page.pause();
  
  // Ваш тест
  const button = page.locator('button:has-text("New")');
  await button.click();
  await expect(button).toBeEnabled();
});
```

---

## 📝 Логирование

### Добавить логи в код

```typescript
console.log('ℹ️  Info:', data);         // Информация
console.warn('⚠️  Warning:', error);    // Предупреждение
console.error('❌ Error:', error);      // Ошибка
console.table(data);                    // Таблица
console.group('Group name');            // Группировка
console.log('  nested');
console.groupEnd();
```

### Фильтрация логов в Console

1. **DevTools** → **Console** tab
2. Используйте фильтр вверху
3. Вводите текст для поиска: `Storage`, `Error`, `@tiptap`
4. Нажмите **Clear console** для очистки

---

## 🚀 Workflow разработки

1. **Запустите dev сервер**: `npm run dev`
2. **Загрузите в Chrome**: chrome://extensions → Load unpacked → dist/
3. **Откройте DevTools**: F12
4. **Разрабатывайте**: Код автоматически перестраивается
5. **Перезагружайте**: Ctrl+R в браузере (Ctrl+Shift+R для полной перезагрузки)
6. **Тестируйте в Console**: `window.__devtools.help()`

---

## ✅ Checklist перед коммитом

- [ ] Нет console.log (использовать logger)
- [ ] Нет console.error в прод коде
- [ ] Разрешения в manifest минимальны
- [ ] Нет утечек памяти (Memory profiler)
- [ ] Производительность приемлемая (Performance tab)
- [ ] Все тесты проходят: `npm run test`
- [ ] Нет ESLint ошибок: `npm run lint`

## Clipboard Masking System

### Overview
Hidden Notes implements secure clipboard masking for sensitive data (passwords, API keys, credit cards).

### Architecture
- `src/lib/clipboard-masking.ts` - Core utilities
- `src/content-scripts/clipboard-mask.ts` - Paste interception on websites
- `public/inject-mask.js` - Works in iframes (Stripe, PayPal, etc.)

### How It Works
1. User copies hidden text from Hidden-Notes
2. copyHiddenText() adds metadata to clipboard
3. Content Script on any website intercepts paste
4. Real data is pasted but visually masked with asterisks
5. On form submit, real data is restored

### Testing
Run: `npm run test:unit -- tests/unit/clipboard-masking.test.ts`

### Security Notes
- Visual masking protects from screenshots/streams
- Real data kept in memory only (sessionStorage)
- Cleared when tab closes

### Complete Guide
See [CLIPBOARD_MASKING_GUIDE.md](./CLIPBOARD_MASKING_GUIDE.md) for detailed documentation.

---

## 🎯 Принципы Разработки

### Всегда опирайтесь на DRAG_DROP_TIPTAP_GUIDE.md

При создании ЛЮБОГО функционала в Hidden Notes, который связан с редактором:

1. **Используйте Extension архитектуру**
   - Для интеграции функционала в Tiptap
   - Позволяет управлять жизненным циклом
   - Легко отключить/включить

2. **Применяйте ProseMirror Plugin API**
   ```typescript
   new Plugin({
     key: new PluginKey('myFeature'),
     state: { init, apply },
     props: { handleDOMEvents: { /* handlers */ } }
   })
   ```

3. **Используйте EditorView API правильно**
   - `view.state` - текущее состояние
   - `view.dispatch(tr)` - применить изменения
   - `view.posAtDOM(el, 0)` - найти позицию элемента
   - `view.posAtCoords({x, y})` - найти позицию по координатам

4. **Работайте с Transaction для изменений**
   ```typescript
   const tr = view.state.tr;
   tr.delete(from, to);
   tr.insert(pos, slice);
   view.dispatch(tr);
   ```

5. **Добавляйте throttle для частых событий**
   - dragover срабатывает ~60 раз в сек без throttle
   - С throttle 100ms = максимум 10 раз в сек
   - Результат: плавные движения без дергания

6. **Правильно вычисляйте позиции в Document Model**
   - Учитывайте `nodeSize` при перемещении вниз
   - Используйте `$pos.depth` и `$pos.node(depth)`
   - Помните что позиция - это число, указывающее ВНЕ элемента

7. **Используйте CSS классы для visual feedback**
   - ❌ Не используйте inline styles
   - ✅ Добавляйте/удаляйте CSS классы
   - Пример: `.dragging`, `.drag-over-top`, `.drag-over-bottom`

8. **Добавляйте cursor: grab для UX**
   - Показывает что элемент можно перетаскивать
   - `cursor: grab` при hover
   - `cursor: grabbing` при active

### Структура нового функционала

```typescript
// 1. Создай Extension
export const MyFeature = Extension.create({
  name: 'myFeature',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('myFeature'),
        
        state: {
          init() { return {}; },
          apply(tr, state) { return state; }
        },
        
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              // твой код
              return false;
            },
            // другие события...
          }
        }
      })
    ];
  }
});

// 2. Добавь в editor extensions
const editor = useEditor({
  extensions: [
    StarterKit,
    MyFeature,  // Твое расширение
  ]
});
```

### Проверочный список перед commit

- [ ] Следую ли я архитектуре из DRAG_DROP_TIPTAP_GUIDE.md?
- [ ] Использую ли я Extension + Plugin?
- [ ] Правильно ли работаю с EditorView?
- [ ] Применяю ли Transaction для изменений?
- [ ] Есть ли throttle для частых событий?
- [ ] Правильно ли вычисляю позиции в Document Model?
- [ ] Использую ли CSS классы для стилей?
- [ ] Добавил ли cursor: grab для UX?
- [ ] Документирована ли функция в коде?
- [ ] Прошла ли проверка линтом?














