# Hidden Notes - Chrome Extension

## 📋 Обзор проекта

**Hidden Notes** - расширение для Google Chrome, предоставляющее функциональность защищенных заметок с возможностью визуального скрытия конфиденциальной информации прямо в браузере.

### Основная идея
Пользователи могут создавать заметки с богатым форматированием текста и скрывать чувствительную информацию визуальным шумом. Доступ к скрытому тексту осуществляется через клавиатурные модификаторы без постоянного раскрытия.

### Версионирование
- **Текущая версия**: 1.0.0 (Free)
- **Планируемые версии**: 
  - v2.0.0 (Pro) - синхронизация между устройствами
  - v3.0.0 (Premium) - экспорт/импорт в различные форматы

---

## 🎯 Цели и задачи проекта

### Основные цели
1. **Безопасное хранение заметок** - локальное хранение с визуальной защитой конфиденциальных данных
2. **Удобство использования** - интуитивный интерфейс в боковой панели Chrome
3. **Богатое форматирование** - полноценный редактор с поддержкой всех современных возможностей
4. **Производительность** - быстрая работа без задержек даже с большими заметками

### Функциональные требования

#### Обязательные (MVP)
- ✅ Side Panel интерфейс для работы с заметками
- ✅ Создание, редактирование, удаление заметок
- ✅ Rich text editor с полным набором инструментов форматирования
- ✅ Визуальное скрытие текста с эффектом "шума"
- ✅ Раскрытие скрытого текста при наведении с Alt
- ✅ Копирование скрытого текста с Ctrl без раскрытия
- ✅ Локальное хранилище (Chrome Storage API)
- ✅ Поддержка изображений (paste from clipboard)
- ✅ Создание таблиц

#### Будущие версии (Pro/Premium)
- 🔄 Синхронизация между устройствами (v2.0.0)
- 🔄 Экспорт в MD, HTML, PDF (v3.0.0)
- 🔄 Импорт заметок из других источников (v3.0.0)
- 🔄 Шифрование данных с мастер-паролем (v3.0.0)
- 🔄 Поиск по заметкам (v2.0.0)
- 🔄 Теги и категории (v2.0.0)

---

## 🏗 Архитектура проекта

### Технологический стек

#### Core Technologies
- **Chrome Extension API**: Manifest V3
- **Frontend Framework**: React 18+ с TypeScript
- **Build Tool**: Vite + CRXJS
- **State Management**: Zustand или React Context
- **Storage**: Chrome Storage API (Local)

#### UI/UX
- **Component Library**: shadcn/ui
- **Styling**: Tailwind CSS 3+
- **Icons**: Lucide React
- **Rich Text Editor**: Tiptap (ProseMirror-based)

#### Development
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

### Структура проекта

```
hidden-notes/
├── docs/                          # Документация
│   ├── Project.md                 # Архитектура и описание
│   ├── Tasktracker.md             # Трекинг задач
│   ├── Diary.md                   # Дневник разработки
│   └── qa.md                      # Вопросы и ответы
├── public/                        # Статические файлы
│   ├── icons/                     # Иконки расширения
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── manifest.json              # Манифест расширения
├── src/                           # Исходный код
│   ├── background/                # Background Service Worker
│   │   └── index.ts
│   ├── sidepanel/                 # Side Panel приложение
│   │   ├── App.tsx                # Главный компонент
│   │   ├── index.tsx              # Точка входа
│   │   └── index.html
│   ├── components/                # React компоненты
│   │   ├── ui/                    # shadcn/ui компоненты
│   │   ├── Editor/                # Rich Text Editor
│   │   │   ├── Editor.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── MenuBar.tsx
│   │   │   └── extensions/        # Tiptap расширения
│   │   │       └── HiddenText.ts  # Кастомное расширение
│   │   ├── NoteList/              # Список заметок
│   │   │   ├── NoteList.tsx
│   │   │   └── NoteItem.tsx
│   │   └── NoteViewer/            # Просмотр заметки
│   │       └── NoteViewer.tsx
│   ├── hooks/                     # Custom React hooks
│   │   ├── useNotes.ts            # Управление заметками
│   │   ├── useStorage.ts          # Chrome Storage API
│   │   └── useHotkeys.ts          # Горячие клавиши
│   ├── lib/                       # Утилиты и библиотеки
│   │   ├── storage.ts             # Storage helpers
│   │   ├── utils.ts               # Общие утилиты
│   │   └── hiddenText.ts          # Логика скрытия текста
│   ├── types/                     # TypeScript типы
│   │   ├── note.ts
│   │   └── storage.ts
│   └── styles/                    # Глобальные стили
│       └── globals.css
├── .cursorrules                   # Правила разработки
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔧 Компоненты системы

### 1. Background Service Worker

**Файл**: `src/background/index.ts`

**Задачи**:
- Инициализация расширения
- Открытие Side Panel при клике на иконку
- Управление жизненным циклом расширения
- Обработка событий установки/обновления

**API**:
```typescript
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```

### 2. Side Panel Application

**Файл**: `src/sidepanel/App.tsx`

**Структура**:
- Список заметок (левая часть/коллапсируемая)
- Редактор заметки (основная область)
- Панель инструментов (toolbar)

**Состояние**:
```typescript
interface AppState {
  notes: Note[];
  currentNoteId: string | null;
  isLoading: boolean;
}
```

### 3. Rich Text Editor

**Библиотека**: Tiptap

**Расширения**:
- StarterKit (базовые элементы)
- Bold, Italic, Underline
- Heading (levels 1-6)
- BulletList, OrderedList
- TaskList, TaskItem
- CodeBlock (с подсветкой синтаксиса)
- Link
- Image (paste support)
- Table
- **HiddenText** (кастомное расширение)

**Кастомное расширение HiddenText**:

```typescript
// src/components/Editor/extensions/HiddenText.ts
import { Mark } from '@tiptap/core';

export const HiddenText = Mark.create({
  name: 'hiddenText',
  
  addAttributes() {
    return {
      content: {
        default: null,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-hidden]',
      },
    ];
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

### 4. Визуальное скрытие текста

**Механизм**:
1. Пользователь выделяет текст
2. ПКМ → Контекстное меню → "Скрыть текст"
3. Применяется Mark `hiddenText` к выделенному тексту
4. CSS применяет визуальный эффект "шума"

**CSS эффект**:
```css
.hidden-text {
  position: relative;
  color: transparent;
  user-select: none;
  background: repeating-linear-gradient(
    45deg,
    #e0e0e0,
    #e0e0e0 2px,
    #f5f5f5 2px,
    #f5f5f5 4px
  );
  animation: noise 0.3s infinite;
}

@keyframes noise {
  0%, 100% { 
    background-position: 0 0;
  }
  50% { 
    background-position: 2px 2px;
  }
}

.hidden-text.revealed {
  color: inherit;
  background: rgba(255, 255, 0, 0.2);
  user-select: auto;
  animation: none;
}
```

**Интерактивность**:
```typescript
// Обработчик наведения с Alt
const handleMouseEnter = (e: MouseEvent) => {
  if (e.altKey && e.target.dataset.hidden) {
    e.target.classList.add('revealed');
  }
};

const handleMouseLeave = (e: MouseEvent) => {
  e.target.classList.remove('revealed');
};

// Обработчик копирования с Ctrl
const handleMouseDown = (e: MouseEvent) => {
  if (e.ctrlKey && e.target.dataset.hidden) {
    const hiddenText = e.target.textContent;
    navigator.clipboard.writeText(hiddenText);
    // Показать toast уведомление
  }
};
```

### 5. Storage System

**API**: Chrome Storage Local

**Схема данных**:
```typescript
interface Note {
  id: string;                    // UUID
  title: string;
  content: string;               // JSON от Tiptap
  createdAt: number;             // timestamp
  updatedAt: number;             // timestamp
  tags?: string[];               // для будущих версий
}

interface StorageSchema {
  notes: Note[];
  settings: {
    theme: 'light' | 'dark';
    fontSize: number;
    autoSave: boolean;
  };
}
```

**Квоты**:
- Chrome Storage Local: 10MB (достаточно для ~5000 заметок)
- Мониторинг использования памяти

### 6. Toolbar/MenuBar

**Инструменты форматирования**:

| Кнопка | Функция | Горячая клавиша |
|--------|---------|-----------------|
| **B** | Bold | Ctrl+B |
| *I* | Italic | Ctrl+I |
| <u>U</u> | Underline | Ctrl+U |
| H1-H6 | Заголовки | Ctrl+Alt+1-6 |
| • | Bullet List | Ctrl+Shift+8 |
| 1. | Ordered List | Ctrl+Shift+7 |
| ☐ | Task List | Ctrl+Shift+9 |
| </> | Code Block | Ctrl+Alt+C |
| 🔗 | Link | Ctrl+K |
| 🖼 | Image | Вставка из буфера |
| ⊞ | Table | - |
| 🚫 | Clear Format | Ctrl+\\ |
| 👁️‍🗨️ | Hide Text | ПКМ меню |

---

## 🎨 Дизайн и UX

### Цветовая схема

**Light Mode**:
- Background: `#ffffff`
- Surface: `#f5f5f5`
- Primary: `#2563eb`
- Text: `#1f2937`
- Border: `#e5e7eb`

**Dark Mode**:
- Background: `#0f172a`
- Surface: `#1e293b`
- Primary: `#3b82f6`
- Text: `#f1f5f9`
- Border: `#334155`

### Layout

```
┌─────────────────────────────────────────────┐
│  [≡] Hidden Notes          [+] [⚙️] [🌓]   │ Header
├──────────┬──────────────────────────────────┤
│          │  ╔═══════════════════════════╗  │
│  📝 Note │  ║ Note Title                ║  │
│  📝 Note │  ╚═══════════════════════════╝  │
│  📝 Note │  ┌───────────────────────────┐  │
│  📝 Note │  │ B I U | H • 1. ☐ | </> 🔗│  │ Toolbar
│  📝 Note │  └───────────────────────────┘  │
│  📝 Note │                                  │
│  📝 Note │  Editor Content Area             │
│          │                                  │
│  [🔍]    │                                  │
└──────────┴──────────────────────────────────┘
  Sidebar       Main Editor Area
```

### UX принципы
1. **Минимализм** - чистый интерфейс без отвлекающих элементов
2. **Быстрый доступ** - все функции в пределах 2 кликов
3. **Визуальная обратная связь** - анимации и toast уведомления
4. **Keyboard-first** - все действия доступны с клавиатуры
5. **Отзывчивость** - интерфейс адаптируется под ширину side panel

---

## 🔐 Безопасность

### Текущая версия (v1.0.0)

**Визуальное скрытие**:
- Скрытие только на уровне отображения
- Данные хранятся в открытом виде в Chrome Storage
- Защита от случайного просмотра "через плечо"

**Ограничения**:
⚠️ НЕ защищает от:
- Доступа к Chrome Storage через DevTools
- Экспорта данных расширения
- Физического доступа к устройству

### Будущие версии (v3.0.0 Premium)

**Планируемое шифрование**:
- AES-256 для шифрования содержимого заметок
- Мастер-пароль для доступа к заметкам
- PBKDF2 для деривации ключа
- Шифрование на клиенте перед сохранением

---

## 📊 Производительность

### Целевые метрики

| Метрика | Целевое значение |
|---------|------------------|
| Время загрузки Side Panel | < 500ms |
| Отклик на ввод текста | < 16ms (60 FPS) |
| Время сохранения заметки | < 100ms |
| Размер bundle | < 1MB |
| Время поиска заметки | < 50ms |

### Оптимизации

1. **Lazy Loading**:
   - Загрузка только активной заметки
   - Виртуализация списка заметок (react-window)

2. **Debouncing**:
   - Auto-save с debounce 1000ms
   - Поиск с debounce 300ms

3. **Memoization**:
   - React.memo для компонентов списка
   - useMemo для тяжелых вычислений

4. **Code Splitting**:
   - Динамический импорт для редактора таблиц
   - Динамический импорт для подсветки синтаксиса

---

## 🧪 Тестирование

### Стратегия тестирования

**Unit Tests**:
- Утилиты и хелперы (lib/)
- Custom hooks (hooks/)
- Storage операции

**Integration Tests**:
- Взаимодействие компонентов
- Storage + UI
- Editor расширения

**E2E Tests**:
- Создание/редактирование заметки
- Скрытие/раскрытие текста
- Копирование скрытого текста

**Manual Testing**:
- Кроссбраузерность (Chrome, Edge, Brave)
- Производительность с большим объемом данных
- UX flow

### Инструменты
- **Vitest** - Unit/Integration тесты
- **Testing Library** - React компоненты
- **Playwright** - E2E тесты для расширений

---

## 🚀 Этапы разработки

### Phase 1: Foundation (Неделя 1-2)
- ✅ Инициализация проекта
- ✅ Настройка Vite + CRXJS
- ✅ Интеграция shadcn/ui
- ✅ Базовая структура Side Panel
- ✅ Background Service Worker

### Phase 2: Core Editor (Неделя 3-4)
- 🔲 Интеграция Tiptap
- 🔲 Базовые расширения форматирования
- 🔲 Toolbar/MenuBar компоненты
- 🔲 Горячие клавиши
- 🔲 Поддержка изображений
- 🔲 Создание таблиц

### Phase 3: Hidden Text Feature (Неделя 5)
- 🔲 Кастомное Tiptap расширение HiddenText
- 🔲 CSS эффект "шума"
- 🔲 Контекстное меню для скрытия
- 🔲 Обработчик Alt (раскрытие)
- 🔲 Обработчик Ctrl (копирование)

### Phase 4: Storage & Notes Management (Неделя 6-7)
- 🔲 Chrome Storage API интеграция
- 🔲 CRUD операции для заметок
- 🔲 Auto-save механизм
- 🔲 Список заметок (sidebar)
- 🔲 Создание/удаление заметок

### Phase 5: Polish & Testing (Неделя 8)
- 🔲 Темная тема
- 🔲 Анимации и переходы
- 🔲 Toast уведомления
- 🔲 Настройки приложения
- 🔲 Unit/Integration тесты
- 🔲 E2E тесты

### Phase 6: Release (Неделя 9)
- 🔲 Оптимизация bundle
- 🔲 Документация пользователя
- 🔲 Chrome Web Store листинг
- 🔲 Публикация v1.0.0

---

## 📦 Зависимости

### Production Dependencies
```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "@tiptap/react": "^2.6.0",
  "@tiptap/starter-kit": "^2.6.0",
  "@tiptap/extension-table": "^2.6.0",
  "@tiptap/extension-image": "^2.6.0",
  "@tiptap/extension-link": "^2.6.0",
  "@tiptap/extension-task-list": "^2.6.0",
  "@tiptap/extension-task-item": "^2.6.0",
  "zustand": "^4.5.0",
  "lucide-react": "^0.400.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.3.0",
  "nanoid": "^5.0.0"
}
```

### Development Dependencies
```json
{
  "@crxjs/vite-plugin": "^2.0.0",
  "vite": "^5.4.0",
  "typescript": "^5.5.0",
  "@types/chrome": "^0.0.270",
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0",
  "eslint": "^8.57.0",
  "prettier": "^3.3.0",
  "vitest": "^2.0.0",
  "@testing-library/react": "^16.0.0",
  "playwright": "^1.46.0"
}
```

---

## 🔧 Стандарты разработки

### Code Style

**TypeScript**:
- Strict mode включен
- Явная типизация для всех функций
- Избегать `any`, использовать `unknown`
- Interface для объектов, Type для union/intersection

**React**:
- Functional components только
- Hooks для состояния и side-effects
- Props деструктуризация
- Именование: PascalCase для компонентов

**CSS**:
- Tailwind utility classes
- CSS modules для кастомных стилей
- BEM методология для сложных компонентов
- CSS переменные для темизации

### Git Workflow

**Branch Strategy**:
- `main` - production ready код
- `develop` - разработка
- `feature/*` - новые фичи
- `bugfix/*` - исправления
- `hotfix/*` - критические исправления

**Commit Convention**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(editor): add hidden text extension

Implement custom Tiptap mark for hiding sensitive text.
Add keyboard shortcuts and context menu integration.

Closes #12
```

### Code Review Checklist

- [ ] Код соответствует TypeScript strict mode
- [ ] Добавлены unit тесты (coverage > 80%)
- [ ] Нет eslint ошибок/предупреждений
- [ ] Компоненты документированы JSDoc
- [ ] Производительность: нет ненужных ре-рендеров
- [ ] Доступность: семантический HTML, ARIA атрибуты
- [ ] Responsive: работает при разных размерах side panel

---

## 🎓 Принципы SOLID

### Single Responsibility
Каждый компонент/модуль имеет одну ответственность:
- `Editor.tsx` - только редактирование
- `NoteList.tsx` - только отображение списка
- `storage.ts` - только работа с Chrome Storage

### Open/Closed
Расширяемость через Tiptap extensions:
- Новые расширения добавляются без изменения core
- Plugins система для дополнительного функционала

### Liskov Substitution
React компоненты взаимозаменяемы через props interface

### Interface Segregation
Маленькие, специфичные интерфейсы:
```typescript
interface Saveable {
  save(): Promise<void>;
}

interface Deletable {
  delete(): Promise<void>;
}
```

### Dependency Inversion
Зависимости через abstractions (hooks):
```typescript
// Вместо прямого использования Chrome API
const { notes, addNote } = useNotes();
// useNotes инкапсулирует storage logic
```

---

## 📚 Дополнительные принципы

### KISS (Keep It Simple, Stupid)
- Простые решения предпочтительнее сложных
- Избегать преждевременной оптимизации
- Читаемость > умность

### DRY (Don't Repeat Yourself)
- Общие утилиты в `lib/`
- Переиспользуемые компоненты в `components/ui/`
- Custom hooks для дублирующейся логики

### YAGNI (You Aren't Gonna Need It)
- Реализовывать только текущие требования
- Не добавлять функционал "на будущее"
- Рефакторинг по мере необходимости

---

## 📈 Метрики успеха

### Технические метрики
- Code coverage > 80%
- Bundle size < 1MB
- Lighthouse Performance Score > 90
- 0 критических уязвимостей (npm audit)

### Бизнес метрики
- > 1000 установок в первый месяц
- Rating > 4.5 в Chrome Web Store
- < 2% refund rate для Pro версии
- > 30% конверсия Free → Pro

---

## 🔮 Roadmap

### v1.0.0 (MVP) - Q4 2025
- Базовый функционал заметок
- Визуальное скрытие текста
- Локальное хранилище

### v2.0.0 (Pro) - Q1 2026
- Синхронизация между устройствами
- Поиск по заметкам
- Теги и категории
- Статистика использования

### v3.0.0 (Premium) - Q2 2026
- Экспорт/импорт (MD, HTML, PDF)
- AES-256 шифрование
- Мастер-пароль
- Продвинутые таблицы (формулы)
- Темы оформления

### v4.0.0 (Enterprise) - Q3 2026
- Collaborative editing
- Team workspaces
- Admin dashboard
- SSO integration

---

## 📞 Контакты и поддержка

**Разработка**:
- Repository: [GitHub]
- Issue Tracker: [GitHub Issues]
- Discussions: [GitHub Discussions]

**Пользовательская поддержка**:
- Email: support@hiddennotes.app
- Chrome Web Store: Отзывы и вопросы

---

## 📄 Лицензия

MIT License - открытый исходный код для базовой версии.

---

**Дата создания**: 2025-10-15  
**Последнее обновление**: 2025-10-15  
**Версия документа**: 1.0.0  
**Автор**: System Architect Team










