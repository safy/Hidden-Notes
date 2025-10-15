# Development Diary - Hidden Notes

> Подробный журнал технических решений, наблюдений и проблем в процессе разработки проекта Hidden Notes.

---

## 📅 2025-01-15 | День N+1 | Реализация изменения размера изображений

### 🎯 Цель дня
Добавить возможность изменения размера изображений в Tiptap редакторе для улучшения пользовательского опыта.

---

### 📊 Наблюдения

#### Анализ требований
1. **Пользовательский запрос**: "Давай сделаем чтобы картинку можно было ресайзить"
2. **Текущее состояние**: Изображения вставляются, но их размер нельзя изменить
3. **Целевое поведение**: Пользователь должен иметь возможность изменять размер изображений перетаскиванием маркера

#### Технические детали
1. **Проблема с готовыми решениями**: Пакет `tiptap-imagresize` несовместим с текущей версией Tiptap
2. **Решение**: Создание кастомного расширения `ImageResize` с React компонентом
3. **NodeView**: Использование `ReactNodeViewRenderer` для кастомного рендеринга
4. **Drag & Drop**: Обработка событий мыши для изменения размера

---

### ✅ Решения

#### 1. Создание кастомного расширения ImageResize.ts
```typescript
export const ImageResize = Node.create<ImageResizeOptions>({
  name: 'imageResize',
  
  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView);
  },
  
  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});
```

#### 2. React компонент ImageResizeView.tsx
```typescript
export const ImageResizeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const [currentWidth, setCurrentWidth] = useState(width || 300);
  const [currentHeight, setCurrentHeight] = useState(height || 200);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Обработка drag & drop для изменения размера
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;
      
      const newWidth = Math.max(50, startWidth.current + deltaX);
      const newHeight = Math.max(50, startHeight.current + deltaY);
      
      setCurrentWidth(newWidth);
      setCurrentHeight(newHeight);
    };
  };
};
```

#### 3. CSS стили для маркера изменения размера
```css
.image-resizer.selected {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

.resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background: hsl(var(--primary));
  border: 2px solid white;
  border-radius: 50%;
  cursor: se-resize;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

---

### ⚠️ Проблемы

#### TypeScript ошибки
1. **Проблема**: Несовместимость типов между кастомным интерфейсом и `NodeViewProps`
2. **Решение**: Использование стандартного `NodeViewProps` из Tiptap

2. **Проблема**: Неиспользуемые импорты и переменные
3. **Решение**: Очистка кода от неиспользуемых элементов

#### Тестирование
1. **Проблема**: Сложность тестирования в основном приложении из-за проблем с dev-сервером
2. **Решение**: Создание изолированной тестовой страницы для проверки функциональности

---

### 🎉 Результат

✅ **Функциональность изменения размера изображений успешно реализована:**
- Кастомное расширение `ImageResize` с React компонентом
- Маркер изменения размера в правом нижнем углу
- Перетаскивание для изменения размера с минимальными ограничениями (50px)
- Визуальная обратная связь при выделении изображения
- Автоматическое определение оптимального размера при загрузке
- Интеграция с существующим drag & drop функционалом

---

## 📅 2025-01-15 | День N | Реализация Drag & Drop для изображений

### 🎯 Цель дня
Добавить поддержку перетаскивания файлов изображений в Tiptap редактор для улучшения UX.

---

### 📊 Наблюдения

#### Анализ требований
1. **Пользовательский запрос**: "Не работает вставка изображения простым перетаскиванием"
2. **Текущее состояние**: Кнопка "Добавить изображение" работает, но drag & drop отсутствует
3. **Целевое поведение**: Пользователь должен иметь возможность перетащить файл изображения из файловой системы прямо в редактор

#### Технические детали
1. **Tiptap Image Extension**: Уже настроен, но `allowBase64: false`
2. **Drag & Drop API**: Нужно добавить обработчики `dragover`, `dragleave`, `drop`
3. **FileReader API**: Для конвертации файлов в base64 data URL
4. **Визуальная обратная связь**: CSS стили для drag-over состояния

---

### ✅ Решения

#### 1. Обновление TiptapEditor.tsx
```typescript
// Добавлен новый useEffect для drag & drop
useEffect(() => {
  if (!editor) return;
  
  const editorElement = editor.view.dom;
  
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    const hasImages = Array.from(event.dataTransfer?.items || []).some(
      item => item.kind === 'file' && item.type.startsWith('image/')
    );
    
    if (hasImages) {
      event.dataTransfer!.dropEffect = 'copy';
      editorElement.classList.add('drag-over');
    }
  };
  
  // ... остальные обработчики
}, [editor]);
```

#### 2. Конфигурация Image Extension
```typescript
Image.configure({
  inline: false,
  allowBase64: true, // Изменено с false на true
  HTMLAttributes: {
    class: 'rounded-lg max-w-full h-auto',
  },
}),
```

#### 3. CSS стили для визуальной обратной связи
```css
.ProseMirror.drag-over {
  border: 2px dashed hsl(var(--primary));
  background-color: hsl(var(--primary) / 0.05);
}

.ProseMirror.drag-over::after {
  content: 'Перетащите изображение сюда';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: hsl(var(--primary));
  font-weight: 600;
  font-size: 1.2em;
  pointer-events: none;
  z-index: 10;
}
```

---

### ⚠️ Проблемы

#### TypeScript ошибки при сборке
1. **Проблема**: Неиспользуемые переменные `view` и `from` в коде
2. **Решение**: Удалил неиспользуемые переменные, оставил только необходимый функционал

3. **Проблема**: `imageFile` может быть undefined
4. **Решение**: Добавил проверку `if (!imageFile) return;`

#### Тестирование drag & drop
1. **Проблема**: Сложно симулировать drag & drop события через Chrome DevTools
2. **Решение**: Создал тестовую страницу для изолированного тестирования, затем проверил интеграцию в основном приложении

---

### 🎉 Результат

✅ **Drag & Drop функциональность успешно реализована:**
- Поддержка перетаскивания файлов изображений
- Визуальная обратная связь при перетаскивании
- Автоматическое преобразование в base64
- Интеграция с существующим Tiptap редактором
- TypeScript типизация и error handling

---

## 📅 2025-10-15 | День 0 | Инициализация проекта

### 🎯 Цель дня
Создание архитектурной документации и определение технического стека проекта.

---

### 📊 Наблюдения

#### Анализ требований
1. **Уникальная фича**: Визуальное скрытие конфиденциальной информации - это core value proposition проекта. Необходимо уделить особое внимание UX этой функции.

2. **Технический стек**:
   - Выбран **Tiptap** как rich text editor (на основе ProseMirror)
   - **shadcn/ui** для компонентов (уже установлен в package.json)
   - **Manifest V3** для Chrome Extension (текущий стандарт)
   - **Vite + CRXJS** для dev experience с hot reload

3. **Архитектурные решения**:
   - **Локальное хранилище**: Chrome Storage API (Local) - 10MB лимит, достаточно для MVP
   - **Без шифрования в v1.0.0**: Только визуальное скрытие, безопасность откладывается на v3.0.0
   - **Side Panel API**: Современный подход вместо popup/extension page

4. **Структура проекта**:
   ```
   src/
   ├── background/      - Service Worker
   ├── sidepanel/       - React приложение
   ├── components/      - UI компоненты
   ├── hooks/           - Custom React hooks
   ├── lib/             - Utilities
   └── types/           - TypeScript типы
   ```

---

### ✅ Решения

#### 1. Rich Text Editor: Tiptap vs alternatives

**Рассмотренные варианты**:
- **Tiptap** (выбран)
- Draft.js
- Slate
- Quill
- Lexical

**Обоснование выбора Tiptap**:
- ✅ Модульная архитектура - легко создавать кастомные расширения (нужно для HiddenText)
- ✅ Отличная TypeScript поддержка
- ✅ Активная разработка и community
- ✅ Хорошая документация
- ✅ Легковесный и производительный
- ✅ Встроенная поддержка таблиц, списков, кода
- ❌ Платные расширения для некоторых advanced features (но базовые бесплатны)

**Альтернатива (Lexical)** также хороша, но Tiptap более зрелый и имеет больше готовых расширений.

---

#### 2. UI Library: shadcn/ui + Tailwind

**Обоснование**:
- ✅ Уже установлен в проекте (package.json показывает shadcn)
- ✅ Copy-paste компоненты - полный контроль над кодом
- ✅ Отличная кастомизация через CSS переменные
- ✅ Tailwind для быстрой разработки
- ✅ Accessibility out of the box (Radix UI под капотом)
- ✅ Современный дизайн

---

#### 3. State Management: Zustand vs Context

**Решение**: Начать с **React Context** + useState, при необходимости мигрировать на Zustand.

**Обоснование**:
- Для MVP Context достаточно (состояние не слишком сложное)
- Zustand добавить легко позже если понадобится
- Меньше зависимостей на старте
- Если появятся проблемы с производительностью - рефакторинг на Zustand

**Состояние приложения**:
```typescript
{
  notes: Note[],           // Все заметки
  currentNoteId: string,   // ID активной заметки
  theme: 'light' | 'dark', // Тема
  settings: Settings,      // Настройки
}
```

---

#### 4. HiddenText Implementation Strategy

**Архитектура функции скрытия**:

1. **Tiptap Mark Extension**:
   - Создать кастомное `Mark` расширение (не `Node`, так как это inline элемент)
   - Хранить оригинальный текст в атрибуте `data-content`
   - Рендерить как `<span data-hidden="true">`

2. **CSS эффект**:
   - Использовать `background` с pattern для создания "шума"
   - Анимация для динамичности эффекта
   - `color: transparent` для скрытия текста
   - `user-select: none` для предотвращения случайного выделения

3. **Интерактивность**:
   - Event listeners на document level с делегированием
   - Alt + hover = временное раскрытие (добавить класс `.revealed`)
   - Ctrl + click = копирование в clipboard без раскрытия

4. **Accessibility**:
   - ARIA атрибуты для screen readers
   - Keyboard navigation (Tab для фокуса, Enter для раскрытия)
   - Focus visible стили

**Пример кода Mark**:
```typescript
export const HiddenText = Mark.create({
  name: 'hiddenText',
  
  addAttributes() {
    return {
      content: {
        default: null,
        parseHTML: element => element.getAttribute('data-content'),
        renderHTML: attributes => ({
          'data-content': attributes.content,
        }),
      },
    };
  },
  
  parseHTML() {
    return [{ tag: 'span[data-hidden="true"]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', {
      ...HTMLAttributes,
      'data-hidden': 'true',
      class: 'hidden-text',
    }, 0];
  },
  
  addCommands() {
    return {
      toggleHiddenText: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});
```

---

#### 5. Build Setup: Vite + CRXJS

**Преимущества**:
- ⚡ Мгновенный dev server
- 🔥 Hot Module Replacement для расширений
- 📦 Оптимизированная production сборка
- 🎯 TypeScript out of the box

**Конфигурация**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        sidepanel: 'src/sidepanel/index.html',
      },
    },
  },
});
```

---

#### 6. Storage Strategy

**Chrome Storage Local API**:
- **Квота**: 10MB (QUOTA_BYTES: 10485760)
- **Структура данных**:
  ```typescript
  {
    notes: Note[],  // Массив заметок
    settings: {     // Настройки приложения
      theme: 'light' | 'dark',
      fontSize: number,
      autoSaveInterval: number,
    },
  }
  ```

**Оптимизация**:
- Сжатие изображений перед сохранением
- Лимит на размер изображения (2MB?)
- Предупреждение при приближении к квоте (> 80%)
- Периодическая очистка старых/удаленных заметок

**Мониторинг квоты**:
```typescript
chrome.storage.local.getBytesInUse(null, (bytes) => {
  const usedMB = bytes / (1024 * 1024);
  const totalMB = 10;
  const percentage = (usedMB / totalMB) * 100;
  
  if (percentage > 80) {
    showWarning('Storage almost full');
  }
});
```

---

#### 7. Auto-save Strategy

**Подход**:
- Debounced save: 1000ms после последнего изменения
- Visual indicator: "Saving..." → "Saved" → (исчезает через 2 сек)
- Optimistic updates: UI обновляется сразу, storage async

**Реализация**:
```typescript
const debouncedSave = useMemo(
  () => debounce((note: Note) => {
    saveNote(note);
  }, 1000),
  []
);

useEffect(() => {
  if (currentNote) {
    debouncedSave(currentNote);
  }
}, [currentNote.content]);
```

**Edge cases**:
- Сохранение при закрытии side panel (beforeunload)
- Retry при ошибке сохранения (max 3 попытки)
- Conflict resolution (если заметка изменена в другой вкладке)

---

### ⚠️ Проблемы

#### 1. Chrome Extension Manifest V3 ограничения

**Проблема**: Manifest V3 имеет строгие ограничения на выполнение кода.

**Ограничения**:
- Нельзя использовать `eval()` или `new Function()`
- Inline scripts запрещены
- Remotely hosted code запрещен
- Строгий CSP (Content Security Policy)

**Влияние на проект**:
- ✅ Tiptap работает (не использует eval)
- ✅ React работает (собирается в bundle)
- ⚠️ Некоторые syntax highlighters могут не работать (проверить!)

**Решение**:
- Использовать статически импортируемые библиотеки
- Для syntax highlighting использовать lowlight (не highlight.js с dynamic imports)
- Тщательно тестировать все библиотеки перед интеграцией

---

#### 2. Storage sync между вкладками

**Проблема**: Если Side Panel открыт в нескольких окнах Chrome, изменения в одном не отражаются в другом автоматически.

**Решение**:
- Использовать `chrome.storage.onChanged` listener
- Обновлять локальное состояние при изменениях в storage
- Показывать уведомление "Note updated in another window"

**Реализация**:
```typescript
useEffect(() => {
  const listener = (changes, areaName) => {
    if (areaName === 'local' && changes.notes) {
      setNotes(changes.notes.newValue);
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}, []);
```

**Проблемы**:
- Конфликты при одновременном редактировании одной заметки
- Решение: Last Write Wins (простая стратегия для MVP)
- Для Pro версии: Operational Transformation или CRDT

---

#### 3. Performance с большим количеством заметок

**Потенциальная проблема**: Если пользователь создаст 1000+ заметок, список может тормозить.

**Решение**:
- **Виртуализация списка**: react-window или react-virtualized
- **Lazy loading**: загружать только видимые заметки
- **Pagination**: показывать по 50 заметок, загружать по мере прокрутки
- **Indexing**: создать индекс для быстрого поиска

**Benchmark target**:
- Render 1000 заметок: < 100ms
- Scroll performance: 60 FPS
- Search 1000 заметок: < 50ms

---

#### 4. Безопасность визуального скрытия

**Проблема**: Визуальное скрытие не является реальной защитой данных.

**Ограничения**:
- Текст хранится в открытом виде в Chrome Storage
- DevTools позволяет читать storage
- Скриншоты могут не захватывать скрытый текст, но это не гарантировано

**Решение для MVP**:
- ⚠️ Документировать ограничения в FAQ
- ⚠️ Предупреждать пользователя при первом использовании функции
- 🔮 Для v3.0.0: реальное шифрование с мастер-паролем

**Disclaimer текст**:
```
"Hidden Text" feature provides visual obscuring only. 
It does not encrypt your data. For true security, 
upgrade to Premium version with AES-256 encryption.
```

---

#### 5. Images в заметках → размер storage

**Проблема**: Изображения в base64 занимают много места. 10MB квота может быстро заполниться.

**Решение**:
1. **Сжатие изображений**:
   - Конвертировать в WebP (лучшее сжатие)
   - Resize до максимального размера (1920px width)
   - Quality 80%

2. **Лимиты**:
   - Максимум 2MB на изображение (после сжатия)
   - Предупреждение при вставке большого изображения
   - Option: "Compress image?" dialog

3. **Storage monitoring**:
   - Показывать используемое пространство в Settings
   - Предупреждение при > 80% использования
   - Опция очистки кэша/старых заметок

**Код сжатия**:
```typescript
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Resize
        let width = img.width;
        let height = img.height;
        const maxWidth = 1920;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
```

---

### 🎓 Технические заметки

#### Tiptap Concepts

**ProseMirror Schema**:
- **Node**: Block-level элементы (paragraph, heading, codeBlock)
- **Mark**: Inline форматирование (bold, italic, link, **hiddenText**)
- **Schema**: Определяет какие Nodes и Marks разрешены

**Commands**:
- Императивные методы для изменения документа
- Можно вызывать из UI (buttons) или keyboard shortcuts
- Chainable: `editor.chain().focus().toggleBold().run()`

**Extensions**:
- Модульная система для добавления функционала
- Каждое расширение может добавлять: nodes, marks, commands, plugins
- StarterKit = набор базовых расширений

---

#### Chrome Storage API Best Practices

1. **Не хранить слишком много данных в одном ключе**:
   - ❌ Плохо: `{ notes: [1000 заметок] }` - весь массив перезаписывается
   - ✅ Хорошо: `{ 'note_id1': note1, 'note_id2': note2, ... }` - обновление по одной

2. **Использовать транзакции**:
   ```typescript
   // Атомарная операция
   chrome.storage.local.set({ [noteId]: note }, () => {
     if (chrome.runtime.lastError) {
       // Rollback or retry
     }
   });
   ```

3. **Версионирование схемы данных**:
   ```typescript
   interface StorageData {
     version: number;  // Для миграций
     notes: Note[];
   }
   ```

---

### 📚 Полезные ресурсы

#### Документация
- [Tiptap Docs](https://tiptap.dev/docs)
- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)

#### Примеры кодов
- [Tiptap Examples](https://tiptap.dev/examples)
- [CRXJS Examples](https://crxjs.dev/vite-plugin/getting-started)

#### Сообщество
- [Tiptap Discord](https://discord.com/invite/WtJ49jGshW)
- [Chrome Extensions Stack Overflow](https://stackoverflow.com/questions/tagged/google-chrome-extension)

---

### 📋 TODO на следующую сессию

**Phase 1 - Foundation**:
1. ✅ Создать документацию проекта
2. ⏭️ Инициализировать npm проект
3. ⏭️ Настроить Vite + CRXJS + TypeScript
4. ⏭️ Интегрировать shadcn/ui компоненты
5. ⏭️ Создать базовую структуру Side Panel

**Приоритет**: Начать с задачи 1.1 (Инициализация проекта) из Tasktracker.md

---

### 💭 Размышления

**Что прошло хорошо**:
- ✅ Выбор технологического стека основан на требованиях проекта
- ✅ Архитектура документирована детально
- ✅ Задачи разбиты на manageable chunks
- ✅ Риски и проблемы идентифицированы заранее

**Что можно улучшить**:
- ⚠️ Возможно, слишком амбициозный roadmap для одного разработчика
- ⚠️ Нужно больше времени заложить на тестирование
- ⚠️ Privacy Policy и юридические аспекты требуют консультации

**Уроки на будущее**:
- Начать с простого, добавлять сложность постепенно
- Тестировать каждую фичу в изоляции перед интеграцией
- Документировать архитектурные решения сразу (а не потом)

---

### 🔖 Теги записи
`#architecture` `#planning` `#tech-stack` `#hidden-text` `#tiptap` `#chrome-extension`

---

**Автор**: System Architect  
**Время работы**: 2 часа  
**Следующая запись**: После завершения Phase 1 (Задачи 1.1-1.5)







