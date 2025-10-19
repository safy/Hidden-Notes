# DragHandleReact Integration Guide

> Подробное руководство по использованию официального DragHandleReact компонента от Tiptap в Hidden Notes

---

## 📋 Содержание

1. [Обзор](#обзор)
2. [Установка](#установка)
3. [Архитектура](#архитектура)
4. [Использование](#использование)
5. [Customization](#customization)
6. [Troubleshooting](#troubleshooting)

---

## Обзор

**DragHandleReact** — это официальный React компонент от Tiptap для реализации drag & drop функционала для блоков контента в редакторе. 

### Ключевые особенности

- ✅ Визуальная ручка для перетаскивания (drag handle)
- ✅ Поддержка всех типов блоков (paragraph, heading, list, table, blockquote и т.д.)
- ✅ Плавные переходы и hover effects
- ✅ Full keyboard accessibility
- ✅ Работает с ProseMirror position model
- ✅ Lightweight (использует встроенную логику Tiptap)

---

## Установка

### Зависимости

DragHandleReact требует несколько пакетов. Установите с флагом `--legacy-peer-deps`:

```bash
npm install \
  @tiptap/extension-drag-handle-react \
  @tiptap/extension-drag-handle \
  @tiptap/extension-node-range \
  @tiptap/extension-collaboration \
  @tiptap/y-tiptap \
  yjs \
  y-protocols \
  --save --legacy-peer-deps
```

### Версионирование

⚠️ **Важно**: DragHandleReact работает с `@tiptap/core@3.x`, но Hidden Notes использует `@tiptap/react@2.x`. Это нормально при использовании `--legacy-peer-deps`.

---

## Архитектура

### Файловая структура

```
src/
├── components/
│   └── TiptapEditor/
│       ├── DragHandle.tsx          # React компонент для drag handle
│       ├── TiptapEditor.tsx        # Главный редактор (интегрирует DragHandle)
│       └── index.ts                # Barrel export
├── extensions/
│   └── HiddenText.ts
└── styles/
    └── globals.css                 # Стили для drag handle
```

### Компонент DragHandle.tsx

```typescript
import React from 'react';
import { DragHandle as DragHandleReact } from '@tiptap/extension-drag-handle-react';
import { Editor } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

export const DragHandle: React.FC<{ editor: Editor }> = ({ editor }) => {
  return (
    <DragHandleReact
      editor={editor}
      onNodeChange={(event) => {
        // Handle node changes if needed
        console.debug(`Active node: ${event.node?.type.name}`);
      }}
    >
      <div className="drag-handle">
        <GripVertical className="w-4 h-4" />
      </div>
    </DragHandleReact>
  );
};
```

---

## Использование

### 1. Добавление в TiptapEditor

```typescript
import DragHandle from '@tiptap/extension-drag-handle';
import { DragHandle as DragHandleComponent } from './DragHandle';

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ editor, ... }) => {
  const editor = useEditor({
    extensions: [
      // ... другие расширения
      DragHandle.configure({
        // конфигурация по умолчанию работает отлично
      }),
    ],
  });

  return (
    <div className="tiptap-editor relative">
      {editor && <DragHandleComponent editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};
```

### 2. CSS стили

Основные стили уже добавлены в `src/styles/globals.css`:

```css
.drag-handle {
  position: absolute;
  left: -32px;          /* Позиционируется слева от контента */
  top: 0;
  cursor: grab;
  opacity: 0;           /* Скрыт по умолчанию */
  transition: opacity 0.2s ease, background-color 0.2s ease;
  user-select: none;
  padding: 4px;
  border-radius: 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Показывается при наведении на блок */
.ProseMirror > *:hover .drag-handle {
  opacity: 1;
}

/* Дополнительные стили для hover, focus, dark mode и т.д. */
```

### 3. Использование в редакторе

1. **Наведите** курсор на блок (параграф, заголовок, список и т.д.)
2. **Drag handle** становится видимым (⋮ иконка слева)
3. **Перетаскивайте** блок в нужное место
4. **Отпустите** кнопку мыши для завершения операции

---

## Customization

### Изменение иконки

Замените `GripVertical` на другую иконку из `lucide-react`:

```typescript
import { Move, GripHorizontal, Dot } from 'lucide-react';

// Используйте нужную иконку
<Move className="w-4 h-4" />
<GripHorizontal className="w-4 h-4" />
<Dot className="w-4 h-4" />
```

### Изменение стилей

Отредактируйте `.drag-handle` класс в `globals.css`:

```css
.drag-handle {
  left: -40px;              /* Расстояние от левого края */
  width: 8px;               /* Размер */
  height: 8px;
  background-color: #3b82f6; /* Цвет */
  border-radius: 50%;       /* Круглая форма */
}
```

### Callback на изменение узла

Используйте `onNodeChange` callback для отслеживания активного блока:

```typescript
<DragHandleReact
  editor={editor}
  onNodeChange={(event) => {
    console.log(`Active node type: ${event.node?.type.name}`);
    console.log(`Position in doc: ${event.pos}`);
    
    // Можно использовать для:
    // - Подсветки активного блока
    // - Логирования аналитики
    // - Обновления UI состояния
  }}
>
  {/* ... */}
</DragHandleReact>
```

---

## Troubleshooting

### Drag handle не появляется

**Проблема**: При наведении на блок handle не видно.

**Решения**:
1. Проверьте, что CSS стили загружены (`src/styles/globals.css`)
2. Убедитесь, что TiptapEditor имеет `className="relative"` (для позиционирования)
3. Проверьте консоль браузера на ошибки

### Drag & drop не работает

**Проблема**: Невозможно перетащить блок.

**Решения**:
1. Убедитесь, что `DragHandle` extension добавлен в `extensions` редактора
2. Проверьте, что `DragHandleComponent` рендерится в JSX
3. Убедитесь, что `editor` объект передан корректно

### Console errors

**Проблема**: Ошибки при сборке/development.

**Решения**:
1. Если `peer dependencies` конфликты — используйте `--legacy-peer-deps`
2. Если missing exports — проверьте правильность импорта (`DragHandle as DragHandleReact`)
3. Если TypeScript ошибки — добавьте правильную типизацию для callbacks

### Performance issues

**Проблема**: Редактор тормозит при перетаскивании.

**Решения**:
1. DragHandleReact использует встроенную оптимизацию — обычно проблем нет
2. Проверьте, нет ли тяжелых операций в `onNodeChange` callback
3. Используйте `console.time()` для профилирования

---

## API Reference

### DragHandleReact Props

| Prop | Type | Default | Описание |
|------|------|---------|----------|
| `editor` | `Editor` | Required | Экземпляр Tiptap editor |
| `onNodeChange` | `(event) => void` | undefined | Callback при смене активного узла |
| `children` | `ReactNode` | Required | Содержимое (визуальная ручка) |

### NodeChangeEvent

```typescript
interface NodeChangeEvent {
  node: {
    type: { name: string };
    // ... другие свойства узла
  } | null;
  editor: Editor;
  pos: number;
}
```

---

## Примеры

### Пример 1: Базовое использование

```typescript
export const SimpleEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      DragHandle,
    ],
  });

  return (
    <div>
      {editor && <DragHandle editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};
```

### Пример 2: С отслеживанием активного блока

```typescript
export const AdvancedEditor = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  
  return (
    <>
      <DragHandleReact
        editor={editor}
        onNodeChange={(event) => setActiveNode(event.node?.type.name || null)}
      >
        <GripVertical />
      </DragHandleReact>
      
      {activeNode && <p>Active: {activeNode}</p>}
      <EditorContent editor={editor} />
    </>
  );
};
```

### Пример 3: С кастомными стилями

```typescript
const CustomDragHandle = ({ editor }: { editor: Editor }) => {
  return (
    <DragHandleReact editor={editor} onNodeChange={() => {}}>
      <div
        className={cn(
          'w-6 h-6 rounded flex items-center justify-center',
          'bg-blue-500 text-white',
          'hover:bg-blue-600',
          'cursor-grab active:cursor-grabbing',
          'transition-colors'
        )}
      >
        <Move className="w-3 h-3" />
      </div>
    </DragHandleReact>
  );
};
```

---

## Дополнительные ресурсы

- [Tiptap DragHandle Documentation](https://tiptap.dev/docs/editor/extensions/functionality/drag-handle)
- [Tiptap DragHandleReact Documentation](https://tiptap.dev/docs/editor/extensions/functionality/drag-handle-react)
- [ProseMirror Documentation](https://prosemirror.net/)

---

**Создано**: 2025-10-19  
**Последнее обновление**: 2025-10-19  
**Версия**: 1.0.0
