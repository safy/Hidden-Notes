# 🔍 Chrome DevTools Cheatsheet - Hidden Notes

> Быстрая справка для разработчиков

---

## 🚀 Быстрый старт

1. **Откройте расширение**: Кликните на иконку Hidden Notes
2. **Откройте DevTools**: F12 или Ctrl+Shift+I
3. **Переключитесь в Console**: DevTools → Console tab
4. **Получите справку**: `window.__devtools.help()`

---

## 📝 Основные команды

### Управление заметками

```javascript
// Получить все заметки
await window.__devtools.getAllNotes()
// Результат: Array of Note objects

// Добавить тестовую заметку
await window.__devtools.addTestNote('My Note')
// Результат: Note добавлена в storage

// Очистить все заметки
await window.__devtools.clearAllNotes()
// Результат: storage очищено
```

### Информация о Storage

```javascript
// Получить инфу о storage
await window.__devtools.getStorageInfo()
// Результат: { bytesUsed: 45230, percentUsed: 0.44, quota: 10485760, formattedSize: "44.17 KB" }

// Экспортировать данные в JSON
await window.__devtools.exportData()
// Результат: JSON строка со всеми данными (также выводится в консоль)
```

### Мониторинг

```javascript
// Начать отслеживать изменения
window.__devtools.startMonitoring()
// Результат: В консоли будут логи всех изменений storage

// Запустить тесты
await window.__devtools.runTests()
// Результат: Отчет с результатами 4 тестов
```

---

## 🎯 Частые сценарии

### Сценарий 1: Добавить 50 тестовых заметок

```javascript
console.log('Добавляю 50 заметок...');
for (let i = 1; i <= 50; i++) {
  await window.__devtools.addTestNote(`Note #${i}`);
}
console.log('✅ Готово!');

// Проверить размер
const info = await window.__devtools.getStorageInfo();
console.log(`Storage используется: ${info.formattedSize}`);
```

### Сценарий 2: Проверить есть ли утечки памяти

```javascript
// 1. Откройте DevTools Memory tab
// 2. Нажмите "Take Snapshot" (первый снимок памяти)
// 3. Выполните в console:

console.log('Добавляю 100 заметок...');
for (let i = 1; i <= 100; i++) {
  await window.__devtools.addTestNote(`Memory Test ${i}`);
  if (i % 20 === 0) console.log(`${i} заметок добавлено`);
}

// 4. Нажмите "Take Snapshot" (второй снимок)
// 5. Если памяти прибавилось больше чем на 3-5 MB - есть утечка
```

### Сценарий 3: Мониторить изменения от другой вкладки

```javascript
// Вкладка 1 (в консоли):
window.__devtools.startMonitoring()
console.log('📡 Слушаю изменения...');

// Вкладка 2 (откройте Hidden Notes еще раз):
// Создайте/отредактируйте заметку

// В Вкладке 1 появятся логи изменений:
// [HH:MM:SS] 📝 Storage изменился:
//   notes: { oldValueSize: 1234, newValueSize: 1567 }
```

### Сценарий 4: Проверить производительность

```javascript
// Способ 1: console.time()
console.time('add-50-notes');
for (let i = 1; i <= 50; i++) {
  await window.__devtools.addTestNote(`Perf Test ${i}`);
}
console.timeEnd('add-50-notes');
// Результат: add-50-notes: 1234.56ms

// Способ 2: Performance tab
// 1. DevTools → Performance tab
// 2. Нажмите красный Record
// 3. Выполните в console: for(...) await window.__devtools.addTestNote(...)
// 4. Нажмите Stop
// 5. Анализируйте график
```

---

## 🔧 Chrome DevTools вкладки

| Вкладка | Для чего |
|---------|---------|
| **Console** | Выполнение JS команд, логирование |
| **Application** | Просмотр Storage, cookies, cache |
| **Network** | Проверка HTTP запросов (не должно быть!) |
| **Performance** | Измерение скорости операций |
| **Memory** | Поиск утечек памяти |
| **Sources** | Отладка с breakpoints |
| **Elements** | Инспекция HTML |

---

## 📊 Что проверять

### ✅ Здоровые показатели

| Метрика | Хорошо | Плохо |
|---------|--------|-------|
| **Storage размер** (пусто) | 0-1 KB | > 10 KB |
| **Storage размер** (10 заметок) | 5-20 KB | > 100 KB |
| **Добавить 1 заметку** | < 50ms | > 200ms |
| **Получить все заметки** | < 10ms | > 100ms |
| **Memory после 50 заметок** | +1-2 MB | > 10 MB |
| **Bundle size** | < 1 MB | > 2 MB |

---

## 🆘 Troubleshooting

### DevTools Helper недоступен?

```javascript
// Проверьте:
window.__devtools
// Если undefined - перезагрузите расширение

// Или инициализируйте вручную:
import { initDevtoolsHelper } from '@/lib/devtools-helpers';
initDevtoolsHelper();
```

### Команда не работает?

```javascript
// Проверьте ошибку:
try {
  await window.__devtools.getAllNotes()
} catch(e) {
  console.error('Error:', e.message);
}
```

### Storage не обновляется?

```javascript
// 1. Проверьте Background Service Worker
// chrome://extensions → Hidden Notes → "Service Worker"

// 2. Проверьте Chrome Storage API:
chrome.storage.local.get(null, console.log);

// 3. Смотрите Application tab в DevTools
// DevTools → Application → Storage → Extension Storage
```

---

## 🎓 Примеры скриптов

### Полная проверка

```javascript
console.log('🔍 Полная проверка расширения...\n');

// 1. Тесты API
console.log('1️⃣ Запуск тестов...');
await window.__devtools.runTests();

// 2. Storage инфо
console.log('\n2️⃣ Storage информация:');
const info = await window.__devtools.getStorageInfo();
console.table(info);

// 3. Все заметки
console.log('\n3️⃣ Все заметки:');
const notes = await window.__devtools.getAllNotes();
console.log(`Найдено ${notes.length} заметок:`);
console.table(notes);

console.log('\n✅ Проверка завершена!');
```

### Stress test памяти

```javascript
console.log('🔥 Memory stress test...');

const startMemory = performance.memory?.usedJSHeapSize || 0;

for (let i = 1; i <= 200; i++) {
  await window.__devtools.addTestNote(`Stress Test ${i}`);
  if (i % 50 === 0) {
    const current = performance.memory?.usedJSHeapSize || 0;
    const delta = ((current - startMemory) / 1024 / 1024).toFixed(2);
    console.log(`${i} заметок: +${delta}MB`);
  }
}

console.log('✅ Stress test завершен');
```

---

## 🚀 Клавиатурные сокращения

| Клавиша | Действие |
|---------|---------|
| F12 | Открыть DevTools |
| Ctrl+Shift+K | Открыть Console |
| Ctrl+Shift+C | Инспектор элементов |
| Ctrl+Shift+P | Command palette |
| Ctrl+\ | Toggle DevTools |
| ↑ / ↓ | История команд |
| Ctrl+L | Очистить консоль |

---

## 📚 Дополнительно

- **Полное руководство**: Смотрите `docs/DEVELOPMENT.md`
- **Тестирование**: Смотрите `docs/TESTING_GUIDE.md`
- **Исходный код**: `src/lib/devtools-helpers.ts`

---

**Последнее обновление**: 2025-10-19  
**Версия документа**: 1.0.0
