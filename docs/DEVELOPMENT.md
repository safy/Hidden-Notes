# Development Guide - Hidden Notes

> Руководство по разработке Chrome Extension Hidden Notes

---

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Режим разработки

```bash
npm run dev
```

Это запустит Vite dev server с hot reload. Расширение будет автоматически пересобираться при изменении файлов.

### Загрузка расширения в Chrome

1. Откройте Chrome и перейдите на `chrome://extensions/`
2. Включите **"Режим разработчика"** (Developer mode) в правом верхнем углу
3. Нажмите **"Загрузить распакованное расширение"** (Load unpacked)
4. Выберите папку `dist/` из корня проекта
5. Расширение появится в списке установленных расширений

### Hot Reload

При работе в dev режиме (`npm run dev`):
- ✅ React компоненты обновляются автоматически (HMR)
- ✅ CSS обновляется без перезагрузки страницы
- ⚠️ Background script требует перезагрузки расширения (кнопка reload на странице расширений)
- ⚠️ Manifest.json изменения требуют полной перезагрузки расширения

### Открытие Side Panel

После загрузки расширения:
1. Кликните на иконку расширения в панели инструментов Chrome
2. Side Panel откроется автоматически
3. Или: ПКМ на иконку → "Открыть боковую панель"

---

## 🛠 Команды NPM

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev server с hot reload |
| `npm run build` | Production сборка |
| `npm run preview` | Предпросмотр production сборки |
| `npm run lint` | Проверка кода ESLint |
| `npm run lint:fix` | Автоисправление ESLint ошибок |
| `npm run format` | Форматирование кода Prettier |
| `npm run type-check` | Проверка TypeScript типов |
| `npm run generate:icons` | Генерация иконок расширения |

---

## 📁 Структура проекта

```
hidden-notes/
├── public/                    # Статические файлы
│   ├── icons/                # Иконки расширения (auto-generated)
│   └── manifest.json         # Chrome Extension manifest
├── src/
│   ├── background/           # Service Worker
│   │   └── index.ts
│   ├── sidepanel/            # React приложение
│   │   ├── index.html       # HTML entry point
│   │   ├── index.tsx        # React entry point
│   │   └── App.tsx          # Главный компонент
│   ├── components/           # React компоненты
│   │   ├── ui/              # shadcn/ui компоненты
│   │   ├── Editor/          # Rich Text Editor
│   │   ├── NoteList/        # Список заметок
│   │   └── NoteViewer/      # Просмотр заметки
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Утилиты
│   │   └── utils.ts
│   ├── types/               # TypeScript типы
│   │   └── note.ts
│   └── styles/              # Глобальные стили
│       └── globals.css
├── scripts/                  # Скрипты для разработки
│   └── generate-icons.js    # Генератор иконок
├── docs/                     # Документация
│   ├── Project.md           # Архитектура проекта
│   ├── Tasktracker.md       # Трекер задач
│   ├── Diary.md             # Дневник разработки
│   ├── qa.md                # Вопросы и ответы
│   ├── changelog.md         # Журнал изменений
│   └── DEVELOPMENT.md       # Этот файл
└── dist/                     # Production build (git ignored)
```

---

## 🔧 Конфигурационные файлы

### tsconfig.json
- TypeScript strict mode
- Path aliases: `@/*` → `./src/*`
- Target: ES2020
- Module: ESNext

### vite.config.ts
- React plugin
- CRXJS plugin для Chrome Extensions
- Path aliases resolver
- Side panel entry point

### tailwind.config.js
- CSS variables для тем (light/dark)
- Custom animations (noise для hidden text)
- shadcn/ui tokens

### .eslintrc.cjs
- TypeScript + React rules
- Prettier integration
- Custom rules для проекта

---

## 🎨 Разработка компонентов

### Создание нового компонента

```typescript
/**
 * @file: MyComponent.tsx
 * @description: Краткое описание компонента
 * @dependencies: Список зависимостей
 * @created: YYYY-MM-DD
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  isActive = false, 
  onClick 
}) => {
  return (
    <div 
      className={cn(
        'p-4 rounded-lg',
        isActive && 'bg-primary text-primary-foreground'
      )}
      onClick={onClick}
    >
      <h2>{title}</h2>
    </div>
  );
};
```

### Использование shadcn/ui

```bash
# Добавить компонент из shadcn/ui
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
```

Компоненты будут добавлены в `src/components/ui/`

---

## 🐛 Отладка

### Chrome DevTools для Side Panel

1. Откройте Side Panel
2. ПКМ в любом месте Side Panel → "Inspect"
3. Откроется DevTools для Side Panel

### Отладка Background Script

1. Перейдите на `chrome://extensions/`
2. Найдите Hidden Notes
3. Кликните "Service Worker" (или "Inspect views: service worker")
4. Откроется DevTools для background script

### Просмотр Chrome Storage

```javascript
// В консоли DevTools (Side Panel или Background)
chrome.storage.local.get(null, (data) => console.log(data));
```

### Проверка Storage квоты

```javascript
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log(`Used: ${bytes} bytes`);
  console.log(`Used: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
});
```

---

## ✅ Code Review Checklist

Перед коммитом проверьте:

- [ ] `npm run type-check` - без ошибок
- [ ] `npm run lint` - без ошибок
- [ ] `npm run build` - успешная сборка
- [ ] Расширение загружается в Chrome без ошибок
- [ ] Side Panel открывается и работает
- [ ] Нет console.log в production коде
- [ ] Все новые файлы имеют JSDoc header
- [ ] Обновлена документация (если нужно)

---

## 📦 Production Build

### Создание релиза

```bash
# 1. Генерация иконок и сборка
npm run build

# 2. Проверка bundle size
ls -lh dist/assets/

# 3. Тестирование production build
# Загрузите dist/ в Chrome как распакованное расширение

# 4. Создание ZIP для Chrome Web Store
cd dist
zip -r ../hidden-notes-v1.0.0.zip *
cd ..
```

### Проверка перед публикацией

- [ ] Версия в `manifest.json` обновлена
- [ ] Версия в `package.json` соответствует
- [ ] `changelog.md` обновлен
- [ ] README.md актуален
- [ ] Privacy Policy готова
- [ ] Screenshots и промо-материалы подготовлены
- [ ] Расширение протестировано в Chrome, Edge, Brave

---

## 🔥 Hot Reload Tips

### Что НЕ обновляется автоматически:

1. **manifest.json** изменения
   - Требует полной перезагрузки расширения
   - Кнопка "Reload" на странице chrome://extensions/

2. **Background Service Worker**
   - Требует перезагрузки расширения
   - Или: кнопка "Update" на странице service worker

3. **Content Scripts** (если добавите)
   - Требует перезагрузки страницы, где инжектится script

### Что обновляется автоматически:

1. ✅ React компоненты в Side Panel
2. ✅ CSS/Tailwind стили
3. ✅ TypeScript код (после компиляции)

---

## 📚 Полезные ссылки

### Документация проекта
- [Project.md](./Project.md) - Архитектура
- [Tasktracker.md](./Tasktracker.md) - Задачи
- [Diary.md](./Diary.md) - Технические решения
- [qa.md](./qa.md) - Вопросы и ответы

### Внешняя документация
- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin/)
- [Tiptap Editor](https://tiptap.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🆘 Troubleshooting

### Проблема: Расширение не загружается

**Решение**:
1. Проверьте что `npm run build` выполнен
2. Убедитесь что выбрали папку `dist/`, а не корень проекта
3. Проверьте ошибки на странице chrome://extensions/

### Проблема: Side Panel не открывается

**Решение**:
1. Проверьте Chrome версию (требуется 114+)
2. Проверьте консоль background script на ошибки
3. Убедитесь что permissions в manifest.json включают "sidePanel"

### Проблема: Hot reload не работает

**Решение**:
1. Убедитесь что `npm run dev` запущен
2. Проверьте что нет ошибок TypeScript (`npm run type-check`)
3. Для background script требуется manual reload

### Проблема: Icons не отображаются

**Решение**:
1. Запустите `npm run generate:icons`
2. Проверьте что файлы созданы в `public/icons/`
3. Пересоберите проект `npm run build`

---

**Последнее обновление**: 2025-10-15  
**Версия документа**: 1.0.0








