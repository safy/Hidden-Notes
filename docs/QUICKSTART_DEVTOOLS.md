# ⚡ QuickStart - Chrome DevTools для Hidden Notes

> Пошаговый гайд для новичков (5 минут)

---

## 🎯 Цель

Научиться тестировать расширение Hidden Notes через Chrome DevTools, не поднимая UI.

---

## 📋 Шаг 1: Подготовка (2 минуты)

### Требования
- Chrome 114+ (для Side Panel API)
- Расширение Hidden Notes загружено ([инструкции](./TESTING_GUIDE.md#1-установка-расширения-в-chrome))
- npm dependencies установлены (`npm install`)

### Проверка

```bash
# Убедитесь что расширение загружено
# 1. Откройте chrome://extensions/
# 2. Найдите Hidden Notes
# 3. Видите надпись "Включено" ✅
```

---

## 🚀 Шаг 2: Открыть DevTools (1 минута)

1. **Кликните на иконку Hidden Notes** в панели инструментов Chrome
2. **Откроется Side Panel** справа
3. **Нажмите F12** (или Ctrl+Shift+I)
4. **DevTools откроется** внизу экрана

✅ **Результат**: Side Panel + DevTools внизу

---

## 🧪 Шаг 3: Первый тест (2 минуты)

### В консоли выполните:

```javascript
window.__devtools.help()
```

**Вы должны увидеть:**

```
🎯 DevTools Helper Commands:

📝 Notes Management:
  window.__devtools.getAllNotes()           - Get all notes
  window.__devtools.addTestNote('title')    - Add test note
  window.__devtools.clearAllNotes()         - Clear all notes
...
```

### Если видите - ✅ все работает!

---

## 🔧 Популярные команды

### Проверить хранилище

```javascript
// Получить все заметки
await window.__devtools.getAllNotes()

// Вывод: Array с всеми заметками (или пусто)
```

### Добавить тестовую заметку

```javascript
await window.__devtools.addTestNote('My Test Note')

// Вывод: ✅ Test note added: test-1729...
// Заметка появится в Side Panel!
```

### Проверить размер

```javascript
await window.__devtools.getStorageInfo()

// Вывод:
// {
//   bytesUsed: 4521,
//   percentUsed: 0.044,
//   quota: 10485760,
//   formattedSize: "4.41 KB"
// }
```

### Запустить автотесты

```javascript
await window.__devtools.runTests()

// Вывод:
// ✅ Chrome Storage API available
// ✅ Can get notes (1 notes found)
// ✅ Can add notes
// ✅ Storage size: 8.63 KB (0.08% used)
//
// 📊 Test Summary:
// ✅ Passed: 4
// ❌ Failed: 0
// 📈 Success rate: 100.0%
```

---

## 📊 Примеры скриптов

### Пример 1: Создать 10 заметок

```javascript
for (let i = 1; i <= 10; i++) {
  await window.__devtools.addTestNote(`Note ${i}`);
}
console.log('✅ 10 заметок создано');

// Результат: В Side Panel появятся 10 заметок!
```

### Пример 2: Проверить производительность

```javascript
console.time('add-10-notes');
for (let i = 1; i <= 10; i++) {
  await window.__devtools.addTestNote(`Perf Test ${i}`);
}
console.timeEnd('add-10-notes');

// Результат: add-10-notes: 234.56ms
// Хорошо если < 500ms
```

### Пример 3: Очистить и заново

```javascript
await window.__devtools.clearAllNotes()
console.log('✅ Все очищено, можно начать с нуля');
```

---

## 🎓 Что далее?

### Для дальнейшего изучения:

- 📖 **Полное руководство**: `docs/DEVELOPMENT.md`
- 📚 **Полная справка**: `docs/DEVTOOLS_CHEATSHEET.md`
- 🧪 **Тестирование**: `docs/TESTING_GUIDE.md`
- 🐛 **Отладка**: `docs/qa.md`

### Следующие навыки:

1. **Performance tab** - измерять скорость операций
2. **Memory tab** - искать утечки памяти
3. **Network tab** - проверять запросы (не должно быть!)
4. **Sources tab** - debug с breakpoints
5. **React DevTools** - инспектировать компоненты

---

## 🆘 Если что-то не работает

### DevTools Helper не видна?

```javascript
// Проверьте что видите (должно быть не undefined):
window.__devtools

// Если undefined - перезагрузите расширение
// chrome://extensions → Hidden Notes → Reload button
```

### Команда падает с ошибкой?

```javascript
// Обмотайте в try-catch:
try {
  const result = await window.__devtools.getAllNotes();
  console.log(result);
} catch(e) {
  console.error('Error:', e.message);
}
```

### Storage пуста?

```javascript
// Проверьте Background Service Worker:
// 1. chrome://extensions/
// 2. Hidden Notes → Details
// 3. Смотрите в разделе "Service Worker"

// Если там ошибки - есть проблема с расширением
```

---

## ✅ Checklist

Вы успешно настроили DevTools если:

- [ ] ✅ DevTools открывается с F12
- [ ] ✅ `window.__devtools.help()` выводит справку
- [ ] ✅ `await window.__devtools.runTests()` проходит все тесты
- [ ] ✅ `await window.__devtools.addTestNote('Test')` создает заметку
- [ ] ✅ Новая заметка видна в Side Panel

---

## 🚀 Готовы к разработке!

Теперь вы можете:

1. **Тестировать** функционал через console
2. **Отлаживать** проблемы с Storage
3. **Профилировать** производительность
4. **Мониторить** изменения в реальном времени
5. **Добавлять** test данные для ручного тестирования

---

## 💡 Pro Tips

### Сохраняйте скрипты

```javascript
// Скопируйте полезные скрипты в Overrides (Sources → Overrides)
// DevTools → Sources → Overrides tab
// Так они будут доступны всегда
```

### Используйте условные breakpoints

```javascript
// DevTools → Sources tab
// Правый клик на номер строки → Add conditional breakpoint
// Условие: notes.length > 5
// Breakpoint сработает только если условие true
```

### Консоль как калькулятор

```javascript
// Прямо в консоли:
5 + 5  // 10
Date.now()  // текущее время
Math.random()  // случайное число
```

---

**Последнее обновление**: 2025-10-19  
**Версия**: 1.0.0
