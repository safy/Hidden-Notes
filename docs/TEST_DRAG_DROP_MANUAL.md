# 🧪 Ручное тестирование Drag & Drop - Пошаговая инструкция

> Инструкция по тестированию через Chrome DevTools (10 минут)

---

## ✅ Предварительные условия

- [ ] Chrome 114+ установлен
- [ ] Hidden Notes расширение загружено в Chrome
- [ ] Проект собран (`npm run build`)
- [ ] Расширение перезагружено в chrome://extensions

---

## 🚀 Шаг 1: Подготовка

### 1.1 Откройте Chrome DevTools

```
1. Кликните на иконку Hidden Notes на панели инструментов
2. Откроется Side Panel справа
3. Нажмите F12 (или Ctrl+Shift+I)
4. DevTools откроется внизу экрана
```

### 1.2 Переключитесь на Console

```
1. В DevTools: Console tab
2. Выполните в Console:
```

```javascript
// Проверить что расширение готово
window.__editor ? '✅ Editor ready' : '❌ Not ready'
```

---

## 🎯 Шаг 2: Создать тестовый контент

### 2.1 Добавить заметку

```javascript
// В Console выполните:
await window.__devtools.addTestNote('Drag & Drop Test')
```

**Результат**: В Side Panel появится новая заметка

### 2.2 Добавить контент в заметку

```
1. Откройте заметку в редакторе (если она не открыта)
2. Напишите следующий текст (каждая строка - новый блок):

Заголовок 1
Это первый параграф
Заголовок 2
Это второй параграф
- Пункт списка 1
- Пункт списка 2
```

**Результат**: Должны увидеть несколько блоков в редакторе

---

## 🎨 Шаг 3: Тест 1 - Видимость Drag Handle

### Проверка: Drag handle должен появляться при наведении

```
1. В редакторе наведите мышь на первую строку ("Заголовок 1")
2. Слева от текста должен появиться ⋮⋮ (drag handle)
3. При наведении на другие блоки - ⋮⋮ должен следовать за мышью
```

**Ожидаемый результат**: ✅ Видна иконка ⋮⋮ при наведении на каждый блок

**Если не видна**:
```javascript
// Проверить в Console:
const p = document.querySelector('.ProseMirror p');
const styles = window.getComputedStyle(p, '::before');
console.log({
  content: styles.content,
  opacity: styles.opacity,
  display: styles.display
});

// Должны увидеть:
// { content: '"⋮⋮"', opacity: '1', display: 'block' }
```

---

## 🖱️ Шаг 4: Тест 2 - Cursor изменяется

### Проверка: Cursor должен меняться на grab/grabbing

```
1. Наведите мышь на блок
2. Cursor должен измениться с указателя на ✋ grab
3. Если кликнуть и начать тащить - cursor станет ✊ grabbing
```

**Ожидаемый результат**: ✅ Cursor меняется на grab/grabbing

**Если не меняется**:
```javascript
// Проверить в Console:
const p = document.querySelector('.ProseMirror p');
console.log('Cursor:', window.getComputedStyle(p).cursor);
// Должен быть 'grab' или 'pointer'
```

---

## 🎯 Шаг 5: Тест 3 - Drag & Drop операция

### Проверка: Блок должен перемещаться при перетаскивании

**Сценарий 1: Переместить блок вниз**

```
1. Найдите блок "Заголовок 1" (первый блок)
2. Наведите мышь, появится ⋮⋮
3. КЛИКНИТЕ и УДЕРЖИВАЙТЕ на ⋮⋮
4. ТАЩИТЕ мышь ВНИЗ (примерно на позицию "Заголовок 2")
5. При перетаскивании:
   - Блок должен стать полупрозрачным (50% opacity)
   - На целевом блоке должна появиться голубая линия сверху
6. ОТПУСТИТЕ мышь
```

**Ожидаемый результат**: ✅ "Заголовок 1" переместился ниже "Заголовок 2"

**Сценарий 2: Переместить блок вверх**

```
1. Наведите на блок "Заголовок 2" (теперь находится ниже)
2. КЛИКНИТЕ и ТАЩИТЕ ВВЕРХ на позицию первого блока
3. ОТПУСТИТЕ мышь
```

**Ожидаемый результат**: ✅ Блоки вернулись в исходный порядок

---

## 🧪 Шаг 6: Тест 4 - Visual Feedback

### Проверка: Визуальная подсказка при перетаскивании

Во время drag & drop должны видеть:

| Этап | Визуальное изменение |
|------|------------------|
| **Hover** | ⋮⋮ появляется, cursor `grab` |
| **Drag start** | Блок полупрозрачный (opacity 50%) |
| **Drag over target** | Голубая линия сверху + пульсирующий эффект |
| **Drop** | Блок вернул нормальную opacity, переместился на новое место |
| **After drop** | Все визуальные эффекты убрались |

**Если что-то не так**:
```javascript
// Проверить классы
const dragging = document.querySelector('.dragging');
const dragOver = document.querySelector('.drag-over');
console.log({
  hasDraggingClass: !!dragging,
  hasDragOverClass: !!dragOver
});
```

---

## 📊 Шаг 7: Тест 5 - Сохранение порядка

### Проверка: Порядок блоков должен сохраняться

```
1. После drag & drop переместите еще несколько блоков
2. Перезагрузите расширение (Ctrl+R в Chrome)
3. Откройте заметку снова
```

**Ожидаемый результат**: ✅ Порядок блоков сохранился так же, как после перемещения

**Если не сохранился**:
```javascript
// Проверить что сохраняется в storage
await window.__devtools.exportData()

// В JSON должны увидеть `content` с правильным порядком блоков
```

---

## 🐛 Шаг 8: Debug в Console

### 8.1 Проверить что DraggableBlock загружено

```javascript
const editor = window.__editor;
const hasDraggable = editor?.extensionManager.extensions.find(
  e => e.name === 'draggableBlock'
);
console.log('DraggableBlock loaded:', hasDraggable ? '✅' : '❌');
```

### 8.2 Отслеживать drag события

```javascript
// Логирование всех drag событий
console.log('📡 Слушаю drag события...');

['dragstart', 'dragover', 'drop', 'dragend'].forEach(eventName => {
  document.addEventListener(eventName, (e) => {
    console.log(`[${eventName}]`, e.target?.tagName, e.target?.textContent?.slice(0, 30));
  }, true);
});

// Теперь при любом drag вы увидите логи в Console
```

### 8.3 Получить все блоки

```javascript
const blocks = document.querySelectorAll('.ProseMirror p, h1, h2, h3, ul, ol, blockquote, pre, table');
console.table([...blocks].map((b, i) => ({
  index: i,
  type: b.tagName,
  text: b.textContent?.slice(0, 40),
  class: b.className
})));
```

---

## ✅ Финальный Checklist

После тестирования проверьте:

- [ ] ✅ Drag handle (⋮⋮) видна при наведении
- [ ] ✅ Cursor меняется на grab при наведении
- [ ] ✅ Cursor становится grabbing при перетаскивании
- [ ] ✅ Блок полупрозрачный (opacity 50%) при drag
- [ ] ✅ Голубая линия на drop target
- [ ] ✅ Блок переместился после drop
- [ ] ✅ Порядок сохранился после перезагрузки
- [ ] ✅ Нет ошибок в Console
- [ ] ✅ Работает для всех блок-элементов (p, h1, h2, lists, blockquote, tables)

---

## 🆘 Если что-то не работает

### Проблема: Drag handle не видна

```bash
1. Откройте DevTools → Elements
2. Наведите на блок в редакторе
3. Правый клик → Inspect
4. В DevTools найдите <p>:::before
5. Смотрите Style → .ProseMirror p::before
6. Проверьте opacity, display, content
```

### Проблема: Блок не перемещается

```bash
1. Откройте DevTools → Sources
2. Найдите файл DraggableBlock.ts
3. Поставьте breakpoint на строку ~100 (drop function)
4. Выполните drag & drop
5. Проверьте значения переменных в debugger
```

### Проблема: Ошибки в Console

```bash
1. Скопируйте ошибку из Console
2. В файле DraggableBlock.ts найдите упомянутую строку
3. Добавьте debug логирование:

console.log('Debug info:', { 
  sourcePos, targetPos, node 
});

4. Выполните drag снова и посмотрите логи
```

---

## 📚 Дополнительно

- **Исходный код**: `src/components/TiptapEditor/extensions/DraggableBlock.ts`
- **Стили**: `src/styles/globals.css` (поиск "DRAG & DROP")
- **Полная документация**: `docs/DRAG_DROP_DEBUG.md`
- **E2E тесты**: `tests/drag-drop.spec.ts`

---

**Версия**: 1.0.0  
**Дата**: 2025-10-19  
**Время тестирования**: ~10 минут
