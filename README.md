# 🔒 Hidden Notes

> Chrome Extension для создания заметок с визуальным скрытием конфиденциальной информации

[![Tests](https://img.shields.io/badge/tests-6%2F10%20passing-yellow)](https://github.com/safy/Hidden-Notes)
[![Chrome](https://img.shields.io/badge/chrome-114%2B-green)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 📋 О проекте

**Hidden Notes** — это Chrome Extension (Manifest V3), которое позволяет создавать заметки с функцией визуального скрытия чувствительной информации. Идеально подходит для хранения паролей, PIN-кодов и другой конфиденциальной информации в заметках.

### ✨ Основные возможности

- 📝 **Богатый текстовый редактор** на базе [Tiptap](https://tiptap.dev/)
- 🔒 **Визуальное скрытие текста** — специальный эффект "шума" для скрытия чувствительной информации
- 🎨 **Форматирование текста**: жирный, курсив, подчеркнутый, зачеркнутый, код
- 📐 **Структурирование**: заголовки (H1-H3), списки (маркированные, нумерованные), цитаты
- 🖼️ **Медиа**: вставка изображений, ссылок, таблиц
- 💾 **Локальное хранение** через Chrome Storage API (до 10MB)
- 🔄 **Автосохранение** — заметки сохраняются автоматически
- 🔍 **Быстрый поиск** по заметкам
- 🎯 **Side Panel** — удобный доступ из любой вкладки

### 🎬 Демо

![Hidden Notes Demo](docs/demo.gif)

> *Скриншот/гифка будет добавлена позже*

## 🛠️ Технологический стек

### Frontend
- **React 18** + **TypeScript** — современный UI
- **Tiptap** (ProseMirror) — мощный текстовый редактор
- **shadcn/ui** + **Tailwind CSS** — красивые компоненты
- **Lucide Icons** — иконки

### Chrome Extension
- **Manifest V3** — современный стандарт расширений
- **Side Panel API** (Chrome 114+)
- **Service Worker** — фоновая работа
- **Chrome Storage API** — локальное хранение

### Разработка и тестирование
- **Vite** — быстрая сборка
- **Playwright** — E2E тестирование
- **ESLint** + **Prettier** — качество кода

## 🚀 Быстрый старт

### Требования

- Node.js 18+ и npm
- Google Chrome 114+
- Git

### Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/safy/Hidden-Notes.git
cd Hidden-Notes

# Установите зависимости
npm install

# Соберите проект
npm run build
```

### Загрузка в Chrome

1. Откройте Chrome и перейдите на `chrome://extensions/`
2. Включите **"Режим разработчика"** в правом верхнем углу
3. Нажмите **"Загрузить распакованное расширение"**
4. Выберите папку `dist/` из проекта
5. Расширение появится в списке 🎉

### Использование

1. Кликните на иконку **Hidden Notes** в панели инструментов Chrome
2. Откроется **Side Panel** справа
3. Нажмите **"+"** для создания новой заметки
4. Начните писать!

**Скрытие текста**:
1. Выделите текст, который хотите скрыть
2. ПКМ → "Скрыть текст"
3. Текст визуально скроется эффектом "шума"
4. `Alt + Hover` — временное раскрытие
5. `Ctrl + Click` — копирование без раскрытия

> ⚠️ **Важно**: Это только **визуальное** скрытие, не криптографическое шифрование!

## 📦 Команды разработки

```bash
# Разработка с hot reload
npm run dev

# Сборка production версии
npm run build

# Проверка типов TypeScript
npm run type-check

# Линтинг кода
npm run lint

# Форматирование кода
npm run format

# Запуск E2E тестов
npm run test

# Генерация иконок
npm run generate:icons
```

## 🧪 Тестирование

Проект использует **Playwright** для E2E тестирования Chrome Extension.

### Запуск тестов

```bash
# Все тесты
npm run test

# С UI интерфейсом
npx playwright test --ui

# Конкретный тест
npx playwright test --grep "должно загрузиться расширение"

# Открыть отчет
npx playwright show-report
```

### Статус тестов

| Тест | Статус |
|------|--------|
| Загрузка расширения | ✅ Проходит |
| Открытие Side Panel | ✅ Проходит |
| Работа toolbar | ✅ Проходит |
| Форматирование Bold | ✅ Проходит |
| Создание заголовков H1 | ✅ Проходит |
| Создание маркированных списков | ✅ Проходит |
| Отображение интерфейса | ⚠️ В работе |
| Ввод текста | ⚠️ В работе |
| Форматирование Italic | ⚠️ В работе |
| Undo/Redo | ⚠️ В работе |

**Coverage**: ~60% функционала

Подробнее: [TESTING_GUIDE.md](docs/TESTING_GUIDE.md)

## 📚 Документация

- [📖 Архитектура проекта](docs/Project.md) — технические решения и структура
- [📋 Трекер задач](docs/Tasktracker.md) — план разработки по фазам
- [📝 Дневник разработки](docs/Diary.md) — технические решения и проблемы
- [❓ Вопросы и ответы](docs/qa.md) — Q&A по проекту
- [📜 Changelog](docs/changelog.md) — история изменений
- [🧪 Руководство по тестированию](docs/TESTING_GUIDE.md) — как тестировать
- [📊 Отчет о тестировании](docs/TESTING_REPORT.md) — результаты тестов
- [🔧 Разработка](docs/DEVELOPMENT.md) — гайд для разработчиков
- [📦 Инструкция по загрузке](LOADING_INSTRUCTIONS.md) — как установить расширение

## 🗂️ Структура проекта

```
Hidden-Notes/
├── src/
│   ├── background/          # Service Worker
│   ├── components/          # React компоненты
│   │   ├── Editor/         # Область редактора
│   │   ├── Sidebar/        # Боковая панель с заметками
│   │   ├── TiptapEditor/   # Компоненты Tiptap
│   │   └── ui/             # shadcn/ui компоненты
│   ├── hooks/              # React хуки
│   ├── lib/                # Утилиты
│   ├── sidepanel/          # Side Panel entry point
│   ├── styles/             # Глобальные стили
│   └── types/              # TypeScript типы
├── public/
│   ├── icons/              # Иконки расширения
│   └── manifest.json       # Chrome Extension манифест
├── tests/                  # Playwright E2E тесты
├── docs/                   # Документация
└── dist/                   # Собранное расширение (после build)
```

## 🎯 Дорожная карта

### ✅ Phase 1: Инициализация (Завершено)
- [x] Настройка проекта (Vite, TypeScript, React)
- [x] Конфигурация Chrome Extension Manifest V3
- [x] Интеграция shadcn/ui + Tailwind CSS
- [x] Базовая структура Side Panel
- [x] Background Service Worker

### 🔄 Phase 2: Core Editor (В процессе)
- [x] Интеграция Tiptap
- [x] Toolbar с базовым форматированием
- [x] Настройка Playwright тестов (6/10 проходят)
- [ ] Расширение HiddenText (визуальное скрытие)
- [ ] Note storage и management
- [ ] Поиск по заметкам

### 📋 Phase 3: Advanced Features (Планируется)
- [ ] Теги и категории заметок
- [ ] Экспорт заметок (Markdown, HTML, PDF)
- [ ] Импорт из других приложений
- [ ] Синхронизация (опционально, через Google Drive API)
- [ ] Темная тема
- [ ] Горячие клавиши

### 🚀 Phase 4: Production (Планируется)
- [ ] Оптимизация bundle size (<1MB)
- [ ] Публикация в Chrome Web Store
- [ ] Документация для пользователей
- [ ] Видео-туториалы

Подробнее: [Tasktracker.md](docs/Tasktracker.md)

## 🤝 Вклад в проект

Вклады приветствуются! Пожалуйста:

1. Fork репозиторий
2. Создайте feature ветку (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'feat: add AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

### Стандарты кода

- Используйте **Conventional Commits** для сообщений
- Запустите `npm run lint` и `npm run format` перед коммитом
- Добавьте тесты для новых функций
- Обновите документацию

Подробнее: [DEVELOPMENT.md](docs/DEVELOPMENT.md)

## 🐛 Известные проблемы

- ⚠️ 4 Playwright теста падают из-за проблем с browser context
- ⚠️ Task List extension показывает placeholder вместо чекбоксов
- ⚠️ Bundle size 718KB (цель: <500KB для первоначальной загрузки)

См. полный список: [Issues](https://github.com/safy/Hidden-Notes/issues)

## 📄 Лицензия

MIT License - смотрите [LICENSE](LICENSE) для подробностей.

## 👤 Автор

**Safy**
- GitHub: [@safy](https://github.com/safy)
- Repository: [Hidden-Notes](https://github.com/safy/Hidden-Notes)

## 🙏 Благодарности

- [Tiptap](https://tiptap.dev/) — за отличный редактор
- [shadcn/ui](https://ui.shadcn.com/) — за красивые компоненты
- [Playwright](https://playwright.dev/) — за мощный фреймворк тестирования
- Chrome Extensions Team — за Side Panel API

---

⭐ Поставьте звезду, если проект вам понравился!

📝 [Создать Issue](https://github.com/safy/Hidden-Notes/issues/new) | 💬 [Обсуждения](https://github.com/safy/Hidden-Notes/discussions)
