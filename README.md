# 🔒 Hidden Notes

> Chrome Extension для создания заметок с визуальным скрытием конфиденциальной информации

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-yellow?logo=google-chrome)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/yourusername/hidden-notes)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Возможности

### 📝 Rich Text Editor
- **Форматирование**: жирный, курсив, подчеркнутый текст
- **Заголовки**: 6 уровней для структурирования заметок
- **Списки**: нумерованные, маркированные, чекбоксы
- **Код**: блоки с подсветкой синтаксиса
- **Ссылки**: кликабельные гиперссылки
- **Изображения**: вставка из буфера обмена
- **Таблицы**: создание и редактирование

### 🔐 Визуальное скрытие текста

Уникальная функция для защиты конфиденциальной информации:

1. **Выделите текст** → ПКМ → "Скрыть текст"
2. **Навести + Alt** → временное раскрытие
3. **Навести + Ctrl** → копирование без раскрытия

> ⚠️ **Важно**: Это только визуальное скрытие, не шифрование. Данные хранятся в открытом виде.

### ⚡ Дополнительно
- **Side Panel** - удобный доступ без отвлечения от работы
- **Auto-save** - автоматическое сохранение изменений
- **Dark Mode** - темная тема для работы вечером
- **Горячие клавиши** - быстрый доступ ко всем функциям
- **Поиск** - мгновенный поиск по всем заметкам

---

## 🚀 Установка

### Из Chrome Web Store

1. Перейдите в [Chrome Web Store](https://chrome.google.com/webstore)
2. Найдите "Hidden Notes"
3. Нажмите "Добавить в Chrome"

### Локальная установка (для разработки)

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/hidden-notes.git
cd hidden-notes

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Загрузить расширение в Chrome
# 1. Откройте chrome://extensions/
# 2. Включите "Режим разработчика"
# 3. Нажмите "Загрузить распакованное расширение"
# 4. Выберите папку dist/
```

---

## 🎮 Использование

### Основные действия

| Действие | Способ |
|----------|--------|
| Открыть заметки | Клик на иконку расширения |
| Создать заметку | Кнопка "+" или `Ctrl+N` |
| Сохранить | Автоматически через 1 секунду |
| Удалить заметку | Кнопка 🗑️ на заметке |
| Поиск | `Ctrl+F` в списке заметок |

### Форматирование текста

| Формат | Горячая клавиша |
|--------|-----------------|
| **Жирный** | `Ctrl+B` |
| *Курсив* | `Ctrl+I` |
| <u>Подчеркнутый</u> | `Ctrl+U` |
| Заголовок 1 | `Ctrl+Alt+1` |
| Код блок | `Ctrl+Alt+C` |
| Ссылка | `Ctrl+K` |
| Очистить формат | `Ctrl+\` |

### Скрытие текста

1. Выделите конфиденциальный текст
2. **ПКМ** → "Скрыть текст" (или `Ctrl+Shift+H`)
3. Текст скрыт визуальным "шумом"
4. **Alt + наведение** = временно раскрыть
5. **Ctrl + наведение** = скопировать без раскрытия

---

## 📁 Структура проекта

```
hidden-notes/
├── docs/                    # 📚 Документация
│   ├── Project.md          # Архитектура проекта
│   ├── Tasktracker.md      # Трекер задач
│   ├── Diary.md            # Дневник разработки
│   ├── qa.md               # Вопросы и ответы
│   └── changelog.md        # Журнал изменений
├── public/                 # Статические файлы
│   ├── manifest.json       # Манифест расширения
│   └── icons/              # Иконки
├── src/
│   ├── background/         # Service Worker
│   ├── sidepanel/          # React приложение
│   ├── components/         # UI компоненты
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Утилиты
│   └── types/              # TypeScript типы
├── .cursorrules            # Правила разработки
├── package.json
└── README.md               # Этот файл
```

---

## 🛠 Технологии

### Core
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик
- **CRXJS** - плагин для Chrome Extensions

### UI/Styling
- **shadcn/ui** - компоненты
- **Tailwind CSS** - стилизация
- **Lucide React** - иконки

### Rich Text
- **Tiptap** - редактор (на базе ProseMirror)
- **CodeMirror** - подсветка синтаксиса

### Chrome APIs
- **Storage API** - локальное хранилище (10MB)
- **Side Panel API** - интерфейс в боковой панели

---

## 📖 Документация

### Для пользователей
- [Руководство пользователя](docs/USAGE.md) *(планируется)*
- [FAQ](docs/FAQ.md) *(планируется)*
- [Privacy Policy](docs/PRIVACY.md) *(планируется)*

### Для разработчиков
- [Архитектура проекта](docs/Project.md) ✅
- [Руководство по разработке](docs/DEVELOPMENT.md) ✅
- [Инструкции по загрузке](LOADING_INSTRUCTIONS.md) ✅
- [Правила разработки](.cursorrules) ✅
- [Дневник разработки](docs/Diary.md) ✅
- [Трекер задач](docs/Tasktracker.md) ✅

---

## 🗺 Roadmap

### ✅ v1.0.0 - MVP (Q4 2025)
- Базовый редактор заметок
- Визуальное скрытие текста
- Локальное хранилище
- Dark mode

### 🔄 v2.0.0 - Pro (Q1 2026)
- Синхронизация между устройствами
- Продвинутый поиск
- Теги и категории
- Статистика использования

### 🔮 v3.0.0 - Premium (Q2 2026)
- AES-256 шифрование
- Мастер-пароль
- Экспорт/импорт (MD, HTML, PDF)
- Продвинутые таблицы с формулами

### 🚀 v4.0.0 - Enterprise (Q3 2026)
- Collaborative editing
- Team workspaces
- Admin dashboard
- SSO integration

---

## 🤝 Разработка

### Настройка окружения

```bash
# Установка зависимостей
npm install

# Запуск dev сервера с hot reload
npm run dev

# Сборка для production
npm run build

# Линтинг
npm run lint

# Тестирование
npm run test
npm run test:e2e
```

### Workflow

1. Создай feature branch: `git checkout -b feature/my-feature`
2. Следуй правилам в `.cursorrules`
3. Обнови документацию при необходимости
4. Создай Pull Request

### Code Style

Проект использует:
- **ESLint** + **Prettier** - форматирование
- **TypeScript strict mode** - безопасность типов
- **Conventional Commits** - формат коммитов

См. [.cursorrules](.cursorrules) для детальных правил.

---

## 🧪 Тестирование

```bash
# Unit и Integration тесты
npm run test

# E2E тесты
npm run test:e2e

# Coverage отчет
npm run test:coverage
```

**Цель**: Coverage > 80% для критичного кода

---

## 📊 Производительность

### Целевые метрики

| Метрика | Целевое значение | Статус |
|---------|------------------|--------|
| Загрузка Side Panel | < 500ms | ⏳ |
| Ввод текста | < 16ms (60 FPS) | ⏳ |
| Сохранение заметки | < 100ms | ⏳ |
| Bundle size | < 1MB | ⏳ |
| Поиск (1000 notes) | < 50ms | ⏳ |

---

## 🔒 Безопасность

### Текущая версия (v1.0.0)

⚠️ **Визуальное скрытие** - не является реальным шифрованием:
- Данные хранятся в открытом виде в Chrome Storage
- Защита только от случайного просмотра "через плечо"
- Не защищает от доступа к DevTools или файловой системе

### Будущие версии (v3.0.0)

✅ **Реальное шифрование**:
- AES-256 для защиты контента
- Мастер-пароль
- PBKDF2 для деривации ключа
- Шифрование на клиенте перед сохранением

---

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)

---

## 🙏 Благодарности

Проект использует следующие open-source библиотеки:
- [Tiptap](https://tiptap.dev/) - rich text editor
- [shadcn/ui](https://ui.shadcn.com/) - UI компоненты
- [Tailwind CSS](https://tailwindcss.com/) - стилизация
- [Vite](https://vitejs.dev/) - сборка
- [CRXJS](https://crxjs.dev/) - Chrome Extension плагин

---

## 📞 Контакты

- **Issues**: [GitHub Issues](https://github.com/yourusername/hidden-notes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hidden-notes/discussions)
- **Email**: support@hiddennotes.app

---

## 📈 Статус проекта

**Текущая фаза**: Phase 1 - Foundation 🔵 (80% завершено)  
**Следующая задача**: 1.5 - Background Service Worker тестирование ⏭️  
**Прогресс**: 8% (4/50 задач завершено)

### Недавние достижения
- ✅ Задача 1.1: Инициализация проекта
- ✅ Задача 1.2: Настройка Vite + CRXJS
- ✅ Задача 1.3: Интеграция shadcn/ui
- ✅ Задача 1.4: Базовая структура Side Panel
- ✅ Sidebar с списком заметок (collapsible, search)
- ✅ EditorArea с full toolbar (15 кнопок)
- ✅ Professional layout готовый для интеграции Tiptap

См. [Tasktracker.md](docs/Tasktracker.md) для детального прогресса.

---

<p align="center">
  Сделано с ❤️ для безопасности ваших заметок
</p>

<p align="center">
  <a href="https://github.com/yourusername/hidden-notes">⭐ Поставьте звезду на GitHub</a>
</p>


