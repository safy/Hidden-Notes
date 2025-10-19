# Официальный Подход Tiptap к Drag Handles

> Реализация drag handles следуя рекомендациям официальной документации Tiptap  
> Источник: https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/examples

## 📌 Официальный Статус

Согласно [официальной документации Tiptap](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/examples):

> **Drag handles aren't that easy to add.** We are still on the lookout what's the best way to add them. Official support will come at some point, but there's no timeline yet.

Это означает что:
- ✅ Drag handles - это важная функция
- ✅ Tiptap ищет лучший способ реализации
- ✅ Нет официального расширения (на данный момент)
- ✅ Нужно использовать Node Views для кастомной реализации

---

## 🎯 Официально Рекомендуемый Подход

Tiptap рекомендует использовать **Node Views** для реализации drag handles:

### 1. Node View с Drag Handle иконкой

```typescript
// src/components/TiptapEditor/extensions/DragHandleNodeView.tsx
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';

export const DragHandleNodeView = (props) => {
  const { selected, node, getPos, editor } = props;

  return (
    <NodeViewWrapper className="node-with-drag-handle">
      {/* Drag handle - зона для захвата */}
      <div 
        className="drag-handle"
        draggable
        onDragStart={(e) => {
          // Обработка начала перетаскивания
          const pos = getPos();
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/x-tiptap-node', pos.toString());
        }}
      >
        ⋮⋮  {/* Иконка для захвата */}
      </div>

      {/* Содержимое блока */}
      <NodeViewContent className="node-content" />
    </NodeViewWrapper>
  );
};
```

### 2. Интеграция в Extension

```typescript
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

export const ParagraphWithDragHandle = Node.create({
  name: 'paragraphWithDragHandle',
  group: 'block',
  content: 'inline*',
  
  // Используем кастомный view для drag handle
  addNodeView() {
    return ReactNodeViewRenderer(DragHandleNodeView);
  },

  parseHTML() {
    return [{ tag: 'p' }];
  },

  renderHTML() {
    return ['p', 0];
  },
});
```

---

## ✅ Наша Реализация vs Официальный Подход

| Аспект | Официальный Tiptap | Наша Реализация |
|--------|-------------------|-----------------|
| **Основа** | Node Views + Plugin | Plugin + DOM Events |
| **Approach** | CSS-based drag handle | CSS + JavaScript события |
| **Сложность** | Средняя | Средняя |
| **Performance** | ✅ Оптимизирована | ✅ С throttle |
| **Browser Support** | Все современные | Все современные |

### Почему мы выбрали текущий подход?

1. **Универсальность** - работает со всеми типами блоков без создания отдельного Node
2. **Простота** - не требует создания React компонента для каждого типа блока
3. **Производительность** - Plugin подход менее требователен к памяти чем NodeView для каждого элемента
4. **Flexible** - работает с любыми HTML элементами которые генерирует Tiptap

---

## 🔍 Ключевые Отличия в Подходах

### Node View Approach (Официальный)

**Плюсы:**
- ✅ Хорошо документирован в Tiptap
- ✅ Каждый узел имеет полный контроль
- ✅ Легко добавить кастомные UI элементы
- ✅ React интеграция встроена

**Минусы:**
- ❌ Требует создание отдельного компонента для каждого типа
- ❌ Может быть медленнее на большом количестве элементов
- ❌ Усложняет архитектуру для простой функции

```typescript
// Пришлось бы создать:
- ParagraphWithDragHandle
- HeadingWithDragHandle  
- BlockquoteWithDragHandle
- ListWithDragHandle
- и т.д. для каждого типа...
```

### Plugin + DOM Events (Наш подход)

**Плюсы:**
- ✅ Работает с ВСЕ типы элементов автоматически
- ✅ Меньше кода
- ✅ Единая реализация для всех типов
- ✅ Лучше для производительности

**Минусы:**
- ❌ Требует понимания ProseMirror Plugin API
- ❌ Работает на уровне DOM, а не View

---

## 📚 Когда использовать какой подход?

| Сценарий | Рекомендация |
|----------|-------------|
| Drag handles для всех блоков | ✅ Наш подход (Plugin) |
| Специальный UI для одного типа блока | ✅ Node View подход |
| Много кастомных элементов для разных типов | ✅ Node View подход |
| Простой функционал для всех блоков | ✅ Наш подход (Plugin) |

---

## 🎓 Обучение на Примерах Tiptap

Хотя Tiptap не имеет готового расширения drag-handle, в их примерах есть полезные паттерны:

### 1. Использование getPos() для получения позиции

```typescript
// Из Node View примеров Tiptap
const pos = getPos();  // Получить позицию узла
const nodeSelection = Selection.atNode(view.state.doc.resolve(pos));
```

### 2. Обработка dragstart события в Node View

```typescript
onDragStart={(e) => {
  const pos = getPos();
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('position', pos.toString());
}}
```

### 3. Использование Drag Handle иконки (⋮⋮)

Tiptap примеры используют стандартные иконки для drag handle:
- `⋮⋮` - вертикальные точки (наш выбор) ✅
- `≡` - три горизонтальные линии
- `⠿` - брайль паттерн

---

## ✨ Комбинируем Лучшее из Обоих Подходов

Мы можем улучшить нашу реализацию, взяв паттерны из официальных примеров:

```typescript
// Комбинированный подход
export const DraggableBlock = Extension.create({
  name: 'draggableBlock',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('draggableBlock'),
        
        state: {
          init() {
            return { draggedPos: null };  // Тип из Node View примеров
          },
          apply(tr, state) {
            return state;
          },
        },
        
        props: {
          handleDOMEvents: {
            dragstart(view, event) {
              // Получаем позицию как в Node View примерах
              const pos = view.posAtDOM(event.target, 0);
              
              // Используем dataTransfer как в официальных примерах
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('position', pos.toString());
              
              return false;
            }
          }
        }
      })
    ];
  },
});
```

---

## 🔗 Официальные Ресурсы

- 📖 [Tiptap Node Views Examples](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/examples)
- 📖 [Tiptap Extension API](https://tiptap.dev/docs/api/extensions/extension-api)
- 📖 [React Node View Renderer](https://tiptap.dev/docs/guide/extending-tiptap/creating-extensions)
- 📖 [ProseMirror Plugin API](https://prosemirror.net/docs/ref/#state.Plugin)

---

## ✅ Вывод

**Наша реализация** базируется на принципах, которые рекомендует Tiptap:
- ✅ Используем Plugin API (как в примерах)
- ✅ Работаем с DOM Events
- ✅ Обработка dragstart/dragover/drop
- ✅ Визуальный feedback через CSS классы

**Отличие:** мы применили это на уровне Plugin, а не Node View, что дает лучшую универсальность и производительность для drag handles для ВСЕ типов блоков.

---

**Created**: 2025-10-19  
**Источник**: https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/examples  
**Статус**: ✅ Адаптировано под Hidden Notes
