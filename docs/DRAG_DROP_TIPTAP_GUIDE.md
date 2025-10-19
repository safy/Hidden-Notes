# Drag & Drop в Tiptap - Полный Гайд

> Подробное объяснение как реализовать перемещение блоков как в Notion используя Tiptap и ProseMirror

## 📚 Официальная документация

- **Tiptap Docs**: https://tiptap.dev/docs
- **ProseMirror Guide**: https://prosemirror.net/docs/guide/
- **ProseMirror Plugin API**: https://prosemirror.net/docs/ref/#state.Plugin

---

## 🏗️ Архитектура Решения

### Слои компонентов

```
┌─────────────────────────────────────┐
│  TiptapEditor Component (React)     │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│  DraggableBlock Extension (Tiptap)  │
│  ├─ ProseMirror Plugin              │
│  ├─ handleDOMEvents (dragstart...)  │
│  └─ EditorView API                  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│  ProseMirror State & Transactions   │
│  ├─ doc (Document Tree)             │
│  ├─ tr (Transaction)                │
│  └─ dispatch (Apply Changes)        │
└─────────────────────────────────────┘
```

---

## 🔧 DraggableBlock Extension - Полный Разбор

### 1️⃣ Создание Extension

```typescript
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';

export const DraggableBlock = Extension.create({
  name: 'draggableBlock',
  
  // Extension может быть как Mark, Node или просто Plugin
  // В нашем случае - это просто Plugin без данных в документе
  // Он только обрабатывает DOM события для перемещения
  
  addProseMirrorPlugins() {
    return [/* Plugin code */];
  },
});
```

**Почему Extension?**
- ✅ Интегрируется в Tiptap архитектуру
- ✅ Может быть отключен/включен
- ✅ Имеет доступ к EditorView
- ✅ Управляет жизненным циклом

---

### 2️⃣ ProseMirror Plugin

```typescript
// Создание плагина с уникальным ключом
new Plugin({
  key: new PluginKey('draggableBlock'),
  
  // Плагин может иметь локальное состояние
  state: {
    init() {
      return DecorationSet.empty;  // Пока не используем
    },
    apply() {
      return DecorationSet.empty;
    },
  },
  
  // props - это конфигурация поведения плагина
  props: {
    handleDOMEvents: {
      // Здесь обрабатываем все DOM события
    }
  }
})
```

**PluginKey:**
- Уникальный идентификатор плагина
- Позволяет получить состояние плагина из EditorState
- Используется для отладки

---

### 3️⃣ handleDOMEvents - Обработка DOM событий

#### dragstart - Начало перетаскивания

```typescript
dragstart(view: EditorView, event: DragEvent) {
  // 1. Получаем DOM элемент который начинаем перетаскивать
  const blockElement = (event.target as HTMLElement)?.closest(
    'p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, table'
  );
  
  // 2. Проверяем что элемент внутри редактора
  if (!blockElement || !blockElement.closest('.ProseMirror')) {
    return false;
  }

  try {
    // 3. Получаем позицию блока в ProseMirror документе
    // view.posAtDOM находит позицию элемента в документе
    const pos = view.posAtDOM(blockElement, 0);
    
    // 4. Получаем информацию о узле в этой позиции
    const $pos = view.state.doc.resolve(pos);
    const node = $pos.parent;

    // 5. Сохраняем информацию для последующего drop
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'application/x-tiptap-drag-block',
      JSON.stringify({
        pos,
        nodeType: node.type.name,
        nodeSize: node.nodeSize,
      })
    );

    // 6. Визуальный feedback
    blockElement.classList.add('dragging');
    
    return true;
  } catch (error) {
    console.error('Error in dragstart:', error);
    return false;
  }
}
```

**Ключевые моменты:**

| Функция | Что делает |
|---------|-----------|
| `view.posAtDOM(el, 0)` | Находит позицию в ProseMirror document |
| `view.state.doc.resolve(pos)` | Получает информацию о узле |
| `node.nodeSize` | Размер узла в документе |
| `event.dataTransfer.setData()` | Передает данные для drop |

---

#### dragover - Показываем где упадет элемент

```typescript
dragover(_view: EditorView, event: DragEvent) {
  // 1. Проверяем что это наш тип данных
  if (!event.dataTransfer.types.includes('application/x-tiptap-drag-block')) {
    return false;
  }

  // 2. Разрешаем drop
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';

  // 3. Throttle - ограничиваем частоту обработки
  const now = Date.now();
  if (now - dragState.lastDragoverTime < dragState.dragoverThrottle) {
    return true;
  }
  dragState.lastDragoverTime = now;

  // 4. Получаем элемент над которым находится мышь
  const blockElement = (event.target as HTMLElement)?.closest(
    'p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, table'
  );
  
  if (blockElement) {
    // 5. Определяем нужно ли вставить сверху или снизу
    // 40% от высоты = top, остальное = bottom
    const rect = blockElement.getBoundingClientRect();
    const elementHeight = rect.height;
    const offsetFromTop = event.clientY - rect.top;
    const isTop = offsetFromTop < elementHeight * 0.4;
    
    // 6. Показываем визуальный индикатор
    if (isTop) {
      blockElement.classList.add('drag-over-top');
    } else {
      blockElement.classList.add('drag-over-bottom');
    }
  }

  return true;
}
```

**Throttle для стабильности:**
- Без throttle dragover срабатывает ~60 раз в секунду
- С throttle 100ms = максимум 10 раз в секунду
- Результат: плавные, без дергания движения

---

#### drop - Выполняем перемещение

```typescript
drop(view: EditorView, event: DragEvent) {
  // 1. Получаем данные которые передали при dragstart
  const dragData = event.dataTransfer.getData('application/x-tiptap-drag-block');
  
  if (!dragData) return false;

  event.preventDefault();

  try {
    const dragInfo = JSON.parse(dragData);
    const { pos: sourcePos } = dragInfo;

    // 2. Получаем позицию drop (где отпустили мышь)
    const dropCoords = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    if (!dropCoords) return false;

    const { pos: targetPos } = dropCoords;

    // 3. Не перемещаем если позиции слишком близко
    if (Math.abs(sourcePos - targetPos) < 3) {
      return false;
    }

    // 4. КРИТИЧНАЯ ЧАСТЬ: Работа с ProseMirror Document Model
    const { tr } = view.state;  // Transaction для изменений
    const $source = view.state.doc.resolve(sourcePos);
    
    // Получаем размер блока который перемещаем
    const resolvedNodeSize = $source.node($source.depth).nodeSize;
    
    // Вычисляем позиции: from - начало блока, to - конец
    let from = $source.before($source.depth);
    let to = from + resolvedNodeSize;

    // 5. Вырезаем блок из исходной позиции
    const slice = view.state.doc.cut(from, to);

    // 6. Вычисляем позицию вставки
    const $target = view.state.doc.resolve(targetPos);
    let insertPos = $target.before($target.depth);

    // ВАЖНО! Если перемещаем ВНИЗ, вычитаем размер блока
    // Иначе индексы сойдут из-за удаления
    if (targetPos > sourcePos) {
      insertPos -= resolvedNodeSize;
    }

    // 7. Применяем изменения через transaction
    tr.delete(from, to);  // Удаляем со старой позиции
    tr.insert(Math.max(0, insertPos), slice);  // Вставляем на новую

    // 8. Отправляем transaction в редактор
    view.dispatch(tr);
    
    return true;
  } catch (error) {
    console.error('Error during drop:', error);
    return false;
  }
}
```

**Самая важная часть - работа с Document Model:**

```typescript
// ProseMirror Document - это иерархическое дерево узлов
// Каждый узел имеет размер (nodeSize)

// Позиция - это число от 0 до конца документа
// Позиция указывает ВНЕ элемента, а не на элемент

// Пример: <p>Text</p><p>More</p>
// 0 - перед первым <p>
// 1 - перед Text
// 5 - после Text, перед </p>
// 6 - после </p>, перед вторым <p>
// 10 - конец второго <p>

// $pos (resolved position) - это полная информация о структуре
const $pos = doc.resolve(pos);
const depth = $pos.depth;        // Уровень вложенности
const node = $pos.node(depth);   // Узел на этом уровне
const nodeSize = node.nodeSize;  // Размер узла
```

---

#### dragend - Очистка

```typescript
dragend(_view: EditorView, _event: DragEvent) {
  // Очищаем все визуальные классы
  document.querySelectorAll('.dragging, .drag-over-top, .drag-over-bottom')
    .forEach(el => {
      el.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
      (el as HTMLElement).style.opacity = '';
    });

  // Очищаем состояние
  dragState.draggedFrom = null;
  dragState.isDragging = false;
  dragState.lastOverElement = null;
  dragState.lastOverPosition = null;
  dragState.lastDragoverTime = 0;
  
  return false;
}
```

---

## 🎯 Ключевые Концепции Tiptap/ProseMirror

### 1. EditorView

```typescript
// EditorView - это связь между ProseMirror state и DOM
view.state;          // Текущее состояние документа
view.dispatch(tr);   // Применить изменения
view.posAtDOM(el, 0);     // Найти позицию элемента в документе
view.posAtCoords({x, y}); // Найти позицию по координатам мыши
view.domAtPos(pos);  // Найти DOM элемент по позиции
```

### 2. Transaction (tr)

```typescript
// Transaction - это описание изменений
const tr = state.tr;  // Начинаем транзакцию

tr.delete(from, to);           // Удалить текст
tr.insert(pos, node);          // Вставить узел
tr.replace(from, to, slice);   // Заменить

// Можно цепировать операции
tr.delete(from, to)
  .insert(pos, slice);

// Применяем
view.dispatch(tr);
```

### 3. Document Structure

```typescript
// Document - это дерево Node-ов
doc.content;        // Содержимое документа
doc.resolve(pos);   // Получить полную информацию о позиции
doc.cut(from, to);  // Вырезать часть документа
doc.nodeSize;       // Общий размер документа
```

---

## 📊 Жизненный Цикл Drag & Drop

```
┌──────────────┐
│  dragstart   │ Пользователь нажимает на drag handle и начинает тянуть
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  dragover    │ Пересчитываем позицию (максимум 10 раз в сек)
│  (repeated)  │ Показываем синюю линию где упадет элемент
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   drop       │ Пользователь отпускает мышь
│              │ Вычисляем новую позицию
│              │ Создаем transaction
│              │ Удаляем старый блок
│              │ Вставляем в новой позиции
│              │ Отправляем изменения
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  dragend     │ Очищаем все классы и состояние
└──────────────┘
```

---

## 🔍 Отладка

### Проверить текущий документ в консоли

```typescript
// В браузерной консоли
const view = window.__tiptapView;  // Если открыли в window
console.log(view.state.doc);        // Увидим структуру документа
console.log(view.state.doc.toJSON()); // JSON представление
```

### Отладить позиции

```typescript
const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });
console.log('Position:', pos);  // { pos: 42, inside: 0 }
const $pos = view.state.doc.resolve(pos.pos);
console.log('Resolved:', $pos);
console.log('Node:', $pos.parent);
console.log('Depth:', $pos.depth);
```

---

## 📚 Ссылки на документацию

| Тема | Ссылка |
|------|--------|
| Tiptap Extensions | https://tiptap.dev/docs/guide/extending-tiptap/creating-extensions |
| ProseMirror Plugin | https://prosemirror.net/docs/ref/#state.Plugin |
| EditorView API | https://prosemirror.net/docs/ref/#view.EditorView |
| Transactions | https://prosemirror.net/docs/ref/#state.Transaction |
| Document Model | https://prosemirror.net/docs/guide/#doc |
| DOM Events | https://prosemirror.net/docs/ref/#view.EditorProps.handleDOMEvents |

---

## ✅ Checklist для создания своего Drag-Drop

- [ ] Создать Extension с `addProseMirrorPlugins()`
- [ ] Реализовать `dragstart` - сохранить позицию источника
- [ ] Реализовать `dragover` - показать индикатор drop-зоны
- [ ] Добавить throttle для стабильности (~100ms)
- [ ] Реализовать `drop` - выполнить перемещение через transaction
- [ ] Реализовать `dragend` - очистить состояние и CSS классы
- [ ] Добавить CSS стили для визуального feedback
- [ ] Добавить cursor: grab для UX
- [ ] Протестировать на разных типах блоков
- [ ] Оптимизировать производительность

---

**Created**: 2025-10-19  
**Версия**: 1.0.0
**Статус**: ✅ Документировано и готово к использованию
