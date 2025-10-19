# 🔧 Отладка Drag & Drop для блоков - Chrome DevTools Guide

> Пошаговая инструкция по тестированию и отладке функционала перетаскивания блоков

---

## 🎯 Что тестируем?

**Функционал**: Перетаскивание блоков контента (как в Notion)

- ✅ Drag handle показывается при наведении (⋮⋮)
- ✅ Можно перетаскивать блок
- ✅ Блок меняет позицию
- ✅ Визуальный feedback работает
- ✅ Сохранение порядка блоков

---

## 🚀 Быстрый старт отладки

### 1. Загрузить расширение и открыть DevTools

```bash
# Откройте Hidden Notes
F12  # Открыть DevTools

# В Console выполните:
await window.__devtools.addTestNote('Drag & Drop Test')
```

### 2. Добавить контент в заметку

1. Напишите несколько строк текста с заголовками:
```
Заголовок 1
Параграф 1
Заголовок 2
Параграф 2
Список:
- Пункт 1
- Пункт 2
```

2. Сохраните заметку

### 3. Протестировать drag & drop

1. **Наведите на текст** → должен появиться **⋮⋮** (drag handle) слева
2. **Кликните и тащите** на drag handle
3. **Перетащите блок** выше/ниже других блоков
4. **Отпустите мышь** → блок должен переместиться

---

## 🐛 Debugging в Console

### Проверить что расширение загружено

```javascript
// В console
window.__editor  // должно быть определено
window.__editor.view  // доступ к редактору
```

### Логирование drag events

```javascript
// Добавьте логирование в console
const editor = window.__editor;

// Отслеживаем drag события
console.log('📡 Слушаю drag события...');

document.addEventListener('dragstart', (e) => {
  console.log('🚀 dragstart:', e.target);
}, true);

document.addEventListener('dragover', (e) => {
  console.log('➡️ dragover:', e.target);
}, true);

document.addEventListener('drop', (e) => {
  console.log('📍 drop:', e.target);
}, true);

document.addEventListener('dragend', (e) => {
  console.log('🏁 dragend:', e.target);
}, true);
```

### Проверить состояние блоков

```javascript
// Получить все блоки в документе
const blocks = document.querySelectorAll('.ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror ul');
console.log(`Found ${blocks.length} blocks`);

// Проверить каждый блок
blocks.forEach((block, i) => {
  console.log(`Block ${i}:`, {
    type: block.tagName,
    text: block.textContent?.slice(0, 50),
    draggable: block.draggable,
  });
});
```

---

## 🔍 Chrome DevTools - Step-by-Step

### 1. Elements Tab - Инспектировать drag handle

```
F12 → Elements tab
1. Наведите на блок текста в редакторе
2. Правый клик → "Inspect"
3. В DevTools увидите HTML:

<p>Мой текст</p>::before  ← это drag handle (⋮⋮)
```

### 2. Sources Tab - Поставить breakpoints

```
F12 → Sources tab

1. Откройте файл: src/components/TiptapEditor/extensions/DraggableBlock.ts
2. Найдите функцию: dragstart (строка ~35)
3. Кликните на номер строки → поставится breakpoint
4. Теперь при попытке драггировать остановитесь на breakpoint
5. Инспектируйте переменные (event, pos, node)
```

### 3. Console Tab - Выполнить тесты

```javascript
// 🧪 Test 1: Проверить что DraggableBlock loaded
const editor = window.__editor;
if (editor?.extensionManager.extensions.find(e => e.name === 'draggableBlock')) {
  console.log('✅ DraggableBlock расширение загружено');
} else {
  console.log('❌ DraggableBlock НЕ загружено');
}

// 🧪 Test 2: Проверить drag handle видимость
const draggable = document.querySelector('.ProseMirror p');
if (draggable) {
  const styles = window.getComputedStyle(draggable, '::before');
  console.log('Drag handle styles:', {
    content: styles.content,
    opacity: styles.opacity,
  });
}

// 🧪 Test 3: Симулировать drag event
function simulateDrag() {
  const p = document.querySelector('.ProseMirror p');
  if (!p) { console.log('No paragraph found'); return; }
  
  console.log('Simulating drag on:', p.textContent);
  
  const dragstart = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer(),
  });
  
  p.dispatchEvent(dragstart);
  console.log('✅ Drag simulated');
}

// Запустить тест
simulateDrag();
```

---

## 📊 Performance Profiling

### Профилировать drag операцию

```
F12 → Performance tab

1. Нажмите красный Record
2. Выполните drag & drop блока
3. Нажмите Stop
4. Анализируйте:
   - JS Execution должен быть < 16ms
   - Layout не должен быть > 50ms
   - Paint < 10ms
```

### Проверить Memory leaks

```
F12 → Memory tab

1. Take Snapshot (первый)
2. Выполните 10x drag & drop операций
3. Take Snapshot (второй)
4. Сравните размер памяти
   - Должна вырасти на < 1 MB
```

---

## 🎯 Частые проблемы и решения

### Проблема: Drag handle не видна

**Отладка**:
```javascript
// Проверьте CSS
const p = document.querySelector('.ProseMirror p');
console.log('Has before pseudo element:', window.getComputedStyle(p, '::before').content);

// Проверьте hover
p.hover()  // симуляция hover
```

**Решение**:
- [ ] Проверьте что CSS загружен: DevTools → Elements → Style → найдите `.ProseMirror p::before`
- [ ] Проверьте что opacity не 0: должна быть 1 при hover

### Проблема: Блок не перемещается

**Отладка**:
```javascript
// Проверьте что dataTransfer работает
const event = new DragEvent('dragstart', {
  dataTransfer: new DataTransfer(),
});

event.dataTransfer?.setData('application/x-tiptap-drag-block', '{"pos": 100}');
console.log('Data:', event.dataTransfer?.getData('application/x-tiptap-drag-block'));
```

**Решение**:
- [ ] Поставьте breakpoint в drop function (строка ~80)
- [ ] Проверьте что targetPos > sourcePos или sourcePos > targetPos
- [ ] Проверьте console на ошибки

### Проблема: Error в console при drag

**Отладка**:
```javascript
// Получите полный stack trace
window.__editor?.on('error', (error) => {
  console.error('Editor error:', error);
  console.error('Stack:', error.stack);
});
```

**Решение**:
- [ ] Скопируйте ошибку из console
- [ ] Проверьте что pos вычисляется правильно
- [ ] Проверьте что targetPos не undefined

---

## ✅ Checklist проверки

Функционал работает если:

- [ ] ✅ Drag handle (⋮⋮) видна при наведении
- [ ] ✅ Cursor меняется на `grab` при наведении
- [ ] ✅ Cursor меняется на `grabbing` при перетаскивании
- [ ] ✅ Блок становится полупрозрачным (opacity 0.5) при drag
- [ ] ✅ Drop target получает border-top
- [ ] ✅ Блок перемещается после drop
- [ ] ✅ Нет ошибок в console
- [ ] ✅ Порядок блоков сохраняется при сохранении заметки

---

## 🚀 Полный тест сценарий

```javascript
console.log('🧪 Full Drag & Drop Test\n');

// 1. Проверить расширение
const editor = window.__editor;
const hasDraggable = editor?.extensionManager.extensions.find(e => e.name === 'draggableBlock');
console.log(`1️⃣ DraggableBlock loaded: ${hasDraggable ? '✅' : '❌'}`);

// 2. Добавить контент
const content = `<p>Блок 1</p><p>Блок 2</p><p>Блок 3</p>`;
console.log('2️⃣ Content added');

// 3. Получить блоки
const blocks = document.querySelectorAll('.ProseMirror p');
console.log(`3️⃣ Found ${blocks.length} blocks`);

// 4. Проверить drag handles
let handlesVisible = 0;
blocks.forEach((block, i) => {
  block.onmouseenter = () => {
    const beforeStyle = window.getComputedStyle(block, '::before');
    if (beforeStyle.opacity === '1') handlesVisible++;
  };
});
console.log(`4️⃣ Drag handles visible: ${handlesVisible}/${blocks.length}`);

// 5. Итог
console.log('\n✅ Test completed!');
```

---

## 📚 Дополнительно

- **Source code**: `src/components/TiptapEditor/extensions/DraggableBlock.ts`
- **Styles**: `src/styles/globals.css` (строки с `DRAG & DROP BLOCK`)
- **Integration**: `src/components/TiptapEditor/TiptapEditor.tsx`

---

**Последнее обновление**: 2025-10-19  
**Версия**: 1.0.0
