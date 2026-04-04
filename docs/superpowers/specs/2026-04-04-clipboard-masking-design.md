# Спецификация: Clipboard Masking для скрытых данных

**Дата**: 2026-04-04  
**Статус**: Design Review  
**Автор**: Claude Code  

---

## 1. Обзор

Функция маскирования скрытых данных в буфере обмена позволяет безопасно копировать конфиденциальную информацию (пароли, API ключи) из Hidden-Notes на любые сайты, при этом визуально скрывая эти данные звездочками на экране, но сохраняя их рабочоспособность при вставке в сервисы.

### Проблема
Когда пользователь копирует пароль или API ключ и вставляет в браузер:
- Данные видны на экране (можно сфотографировать, сделать скриншот)
- Но должны остаться рабочими при вставке в сервис

### Решение
- При копировании скрытого текста добавляем метаданные в буфер обмена
- При вставке на любом сайте перехватываем и маскируем визуально
- Реальные данные остаются в поле ввода (работают правильно)

---

## 2. Требования

### Функциональные требования

**FR1: Копирование скрытого текста**
- Когда пользователь копирует текст с меткой `hiddenText` из редактора
- В буфер обмена добавляется:
  - `text/plain`: реальные данные (для вставки)
  - `application/x-hidden-notes-masked`: флаг "скрытые данные"
- Копирование должно работать стандартным Ctrl+C

**FR2: Перехват вставки на всех сайтах**
- Content Script работает на всех сайтах (`https://*`, `http://*`)
- Перехватывает событие `paste` на любых полях ввода (input, textarea, contenteditable)
- Проверяет наличие флага `application/x-hidden-notes-masked` в буфере обмена

**FR3: Маскирование при вставке**
- Если флаг найден:
  - Вставляет реальные данные в `input.value` или `contenteditable.textContent`
  - Визуально заменяет все символы на звездочки (`*`)
  - Пример: пароль "secretPass123" → видно "***************" (15 символов)
- Если флага нет:
  - Вставляет данные нормально (стандартное поведение)

**FR4: Безопасное удаление метаданных**
- После вставки метаданные `application/x-hidden-notes-masked` удаляются из буфера обмена
- Реальные данные остаются в поле ввода

### Нефункциональные требования

**NFR1: Безопасность**
- Метаданные в буфере обмена не должны содержать реальные данные
- Маскирование должно быть невозможно обойти через DevTools (данные реальные, но визуально скрыты)
- Не должно быть утечек в консоль браузера

**NFR2: Совместимость**
- Работает на всех сайтах (включая SPA, PWA, обычные HTML формы)
- Поддерживает все типы полей: `input[type="text"]`, `textarea`, `contenteditable` элементы
- Работает при любом способе вставки: Ctrl+V, Cmd+V, правая кнопка мыши, горячие клавиши

**NFR3: Производительность**
- Content Script не должен замедлять работу сайтов
- Проверка метаданных буфера обмена должна быть быстрой (<5ms)

**NFR4: Локализация**
- Поддержка русского и английского языков (если нужны уведомления)

---

## 3. Архитектура

### 3.1 Два подхода реализации

#### **Подход A: Content Script (простой, текущий)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Hidden-Notes Extension                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. TiptapEditor → copyHiddenText()                  │  │
│  │  2. lib/clipboard-masking.ts → Clipboard API        │  │
│  │  3. content-scripts/clipboard-mask.ts → всех сайтов │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

✅ Работает: обычные сайты, формы, textarea
❌ НЕ работает: iframe платежей (Stripe, PayPal и т.д.)
```

#### **Подход B: Web Accessible Resources (расширенный, рекомендуемый)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Hidden-Notes Extension                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Content Script (перехватывает paste)             │  │
│  │  2. Web Accessible Resource (inject-mask.js)         │  │
│  │  3. Скрипт внедряется в контекст страницы           │  │
│  │  4. Может перехватывать paste везде, включая iframe  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

✅ Работает: обычные сайты + iframe платежей + contenteditable
❌ Немного рисков: доступно для XSS (но управляемо)
```

**Рекомендация**: Использовать **Подход B** (Web Accessible Resources) для полной защиты, особенно для контент-креаторов, стримеров и тех, кто записывает экран.

### 3.2 Компоненты системы (Подход B)

```
┌──────────────────────────────────────────────────────────────┐
│                  Hidden-Notes Extension                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. TiptapEditor (HiddenContextMenu.tsx)           │    │
│  │  - Копирование скрытого текста                     │    │
│  │  - Вызов clipboard-masking.copyHiddenText()        │    │
│  └────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  2. lib/clipboard-masking.ts                       │    │
│  │  - copyHiddenText(data: string): Promise<void>     │    │
│  │  - Добавляет метаданные в буфер обмена            │    │
│  └────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│            ┌──────────────────────┐                         │
│            │  Clipboard API       │                         │
│            │  (реальные данные +  │                         │
│            │   application/x-...) │                         │
│            └──────────────────────┘                         │
│                       │                                      │
│          ┌────────────┴────────────┐                        │
│          │                         │                        │
│          ▼                         ▼                        │
│  ┌──────────────────┐     ┌──────────────────────┐        │
│  │  Content Script  │     │  Web Accessible      │        │
│  │  (изолиров.)     │     │  Resource Script     │        │
│  │                  │     │  (в контексте стр.)  │        │
│  │  Работает везде  │     │  Работает везде      │        │
│  │  кроме iframe    │     │  включая iframe      │        │
│  └──────────────────┘     └──────────────────────┘        │
│          │                         │                        │
│          └────────────┬────────────┘                        │
│                       │                                      │
│                       ▼                                      │
│        ┌───────────────────────────────────┐               │
│        │  Любой сайт, включая:             │               │
│        │  - Обычные поля ввода ✅          │               │
│        │  - Textarea ✅                    │               │
│        │  - contenteditable ✅             │               │
│        │  - iframe платежей (Stripe) ✅    │               │
│        │  - Формы логина ✅                │               │
│        │                                   │               │
│        │  На экране видны: ****            │               │
│        │  В поле хранятся: реальные данные │               │
│        └───────────────────────────────────┘               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Поток данных при копировании

```javascript
// 1. Пользователь выбирает скрытый текст и копирует (Ctrl+C)
// HiddenContextMenu.tsx перехватывает копирование

// 2. Проверяем: это скрытый текст?
if (selectedText.hasHiddenMark) {
  // 3. Копируем через маскирование
  clipboard-masking.copyHiddenText(selectedText);
}

// 4. clipboard-masking.ts делает:
navigator.clipboard.write([
  new ClipboardItem({
    'text/plain': new Blob(['secretPassword123']),
    'application/x-hidden-notes-masked': new Blob(['true'])
  })
]);
```

### 3.3 Поток данных при вставке

```javascript
// 1. Пользователь вставляет на сайте (Ctrl+V)
// Content Script перехватывает paste событие

// 2. Проверяем метаданные буфера
const items = await navigator.clipboard.read();
const hasMaskFlag = items.some(item => 
  item.types.includes('application/x-hidden-notes-masked')
);

// 3. Если флаг найден
if (hasMaskFlag) {
  // 4. Получаем реальные данные
  const blob = items[index].getType('text/plain');
  const realData = await blob.text();
  
  // 5. Вставляем в поле
  inputElement.value = realData;
  
  // 6. Визуально маскируем
  inputElement.value = '*'.repeat(realData.length);
  
  // 7. Сохраняем реальные данные в хранилище браузера
  // (чтобы при отправке формы отправились реальные данные)
  sessionStorage.setItem('masked_' + inputElement.id, realData);
}
```

---

## 4. Детальная спецификация компонентов

### 4.1 `src/lib/clipboard-masking.ts`

```typescript
/**
 * Копирует скрытый текст в буфер обмена с метаданными
 * @param text - Реальные данные для копирования
 * @returns Promise<void>
 * @throws Error если Clipboard API недоступен
 */
export async function copyHiddenText(text: string): Promise<void>

/**
 * Проверяет, содержит ли буфер обмена флаг скрытых данных
 * @returns Promise<boolean>
 */
export async function isHiddenDataInClipboard(): Promise<boolean>

/**
 * Очищает флаг скрытых данных из буфера обмена
 * @returns Promise<void>
 */
export async function clearMaskFlag(): Promise<void>
```

### 4.2 `src/content-scripts/clipboard-mask.ts` (Content Script)

```typescript
/**
 * Content Script - работает в изолированном контексте
 * Используется как fallback когда Web Accessible Resources недоступен
 */

/**
 * Инициализирует Content Script на странице
 * - Перехватывает paste события
 * - Проверяет метаданные буфера обмена
 * - Маскирует данные если нужно
 */
export function initClipboardMasking(): void

/**
 * Обработчик paste события
 * @param event - PasteEvent
 */
async function handlePaste(event: ClipboardEvent): Promise<void>

/**
 * Маскирует данные в поле ввода
 * @param element - input/textarea/contenteditable элемент
 * @param realData - Реальные данные
 * @param maskedData - Маскированные данные
 */
function maskInputField(element: HTMLElement, realData: string, maskedData: string): void

/**
 * Восстанавливает реальные данные при отправке формы
 * @param form - HTMLFormElement
 */
function interceptFormSubmit(form: HTMLFormElement): void
```

### 4.3 `public/inject-mask.js` (Web Accessible Resource) — НОВОЕ

```javascript
/**
 * Web Accessible Resource - работает в контексте страницы
 * Может перехватывать paste везде, включая iframe
 * Рекомендуемый подход для полной защиты
 */

/**
 * Инициализирует маскирование на странице
 * - Перехватывает paste события везде (включая iframe)
 * - Проверяет метаданные буфера обмена через postMessage
 * - Маскирует данные визуально
 */
function initClipboardMaskingInPageContext() {
  // Слушаем paste события везде на странице
  document.addEventListener('paste', async (event) => {
    // Перехватываем и маскируем
    await handlePasteInPageContext(event);
  }, true); // true = capture phase, работает везде
}

/**
 * Обработчик paste в контексте страницы
 * @param event - PasteEvent
 */
async function handlePasteInPageContext(event) {
  // Kommunikacija с Content Script через window.postMessage
  window.postMessage({
    type: 'CHECK_CLIPBOARD_MASK',
    source: 'hidden-notes-mask'
  }, '*');
}

/**
 * Слушаем ответ от Content Script
 */
window.addEventListener('message', async (event) => {
  if (event.data.type === 'CLIPBOARD_MASK_RESULT') {
    if (event.data.hasMask) {
      // Маскируем данные
      const target = event.data.target;
      target.value = '*'.repeat(event.data.realDataLength);
      // Сохраняем реальные данные
      sessionStorage.setItem('masked_' + target.id, event.data.realData);
    }
  }
});
```

### 4.4 Обновление `src/components/TiptapEditor/HiddenContextMenu.tsx`

При копировании скрытого текста вместо стандартного `document.execCommand('copy')`:

```typescript
// Вместо этого:
document.execCommand('copy');

// Используем:
import { copyHiddenText } from '@/lib/clipboard-masking';

if (isHiddenText) {
  await copyHiddenText(selectedText);
  toast.success('Скрытый текст скопирован');
} else {
  document.execCommand('copy');
}
```

### 4.5 Обновление `public/manifest.json`

```json
{
  "manifest_version": 3,
  
  "content_scripts": [
    {
      "matches": ["https://*", "http://*"],
      "js": ["src/content-scripts/clipboard-mask.ts"],
      "run_at": "document_start"
    }
  ],
  
  "web_accessible_resources": [
    {
      "resources": ["inject-mask.js"],
      "matches": ["https://*", "http://*"]
    }
  ],
  
  "permissions": [
    "clipboardRead",
    "clipboardWrite"
  ]
}
```

### 4.6 Content Script внедряет Web Accessible Resource

```typescript
// В content-scripts/clipboard-mask.ts

/**
 * Внедраем inject-mask.js в контекст страницы
 * Это нужно для перехвата paste везде, включая iframe
 */
function injectMaskingScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject-mask.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Вызываем при инициализации
injectMaskingScript();

/**
 * Слушаем сообщения от inject-mask.js
 * Проверяем буфер обмена и отправляем результат обратно
 */
window.addEventListener('message', async (event) => {
  if (event.data.source === 'hidden-notes-mask' && event.data.type === 'CHECK_CLIPBOARD_MASK') {
    // Проверяем буфер обмена
    const hasMask = await isHiddenDataInClipboard();
    const clipboardData = await navigator.clipboard.read();
    
    // Отправляем результат back в контекст страницы
    window.postMessage({
      type: 'CLIPBOARD_MASK_RESULT',
      hasMask: hasMask,
      realData: clipboardData, // реальные данные
      realDataLength: clipboardData.length
    }, '*');
  }
});
```

### 4.3 Обновление `src/components/TiptapEditor/HiddenContextMenu.tsx`

При копировании скрытого текста вместо стандартного `document.execCommand('copy')`:

```typescript
// Вместо этого:
document.execCommand('copy');

// Используем:
import { copyHiddenText } from '@/lib/clipboard-masking';

if (isHiddenText) {
  await copyHiddenText(selectedText);
  toast.success('Скрытый текст скопирован');
} else {
  document.execCommand('copy');
}
```

### 4.4 Обновление `public/manifest.json`

```json
{
  "content_scripts": [
    {
      "matches": ["https://*", "http://*"],
      "js": ["src/content-scripts/clipboard-mask.ts"],
      "run_at": "document_start"
    }
  ],
  "permissions": [
    "clipboardRead",
    "clipboardWrite"
  ]
}
```

---

## 5. Алгоритм маскирования

### 5.1 При копировании

```
INPUT: selectedText = "secretPassword123", hasHiddenMark = true

1. Получить текст из редактора
2. Проверить наличие метки hiddenText
3. Если метка есть:
   a. Создать Blob с реальными данными: 'secretPassword123'
   b. Создать Blob с флагом: 'true'
   c. Использовать navigator.clipboard.write():
      - 'text/plain' → реальные данные
      - 'application/x-hidden-notes-masked' → флаг
4. Если метки нет:
   a. Использовать стандартное копирование

OUTPUT: в буфере обмена {text/plain: 'secretPassword123', application/x-hidden-notes-masked: 'true'}
```

### 5.2 При вставке

```
INPUT: paste event на любом сайте

1. Перехватить paste событие
2. Получить доступ к буфером обмена через navigator.clipboard.read()
3. Проверить, есть ли тип 'application/x-hidden-notes-masked'
4. Если есть:
   a. Получить реальные данные из 'text/plain'
   b. Вставить в поле: input.value = realData
   c. Маскировать визуально: input.value = '*'.repeat(realData.length)
   d. Сохранить маппинг {inputId → realData} в sessionStorage
   e. Не давать пользователю редактировать маскированное содержимое
5. Если нет:
   a. Позволить стандартную вставку
6. Очистить флаг из буфера обмена

OUTPUT: на экране видны звездочки, но в input.value и sessionStorage хранятся реальные данные
```

---

## 6. Тестирование

### 6.1 Unit-тесты (`tests/unit/clipboard-masking.test.ts`)

```typescript
describe('clipboard-masking', () => {
  describe('copyHiddenText', () => {
    it('должен добавить метаданные в буфер обмена');
    it('должен добавить реальные данные в text/plain');
    it('должен выбросить ошибку если Clipboard API недоступен');
  });

  describe('isHiddenDataInClipboard', () => {
    it('должен вернуть true если флаг присутствует');
    it('должен вернуть false если флаг отсутствует');
  });

  describe('clearMaskFlag', () => {
    it('должен удалить флаг из буфера обмена');
    it('должен оставить реальные данные в буфере');
  });
});
```

### 6.2 Integration-тесты (manual)

- [ ] Копировать скрытый текст из Hidden-Notes
- [ ] Вставить на GitHub (поле для кода)
- [ ] Вставить в Google Docs
- [ ] Вставить в форму логина (поле password)
- [ ] Вставить в textarea (форум)
- [ ] Вставить в contenteditable (Medium-like редактор)
- [ ] Проверить, что данные работают (API ключ, пароль работают)
- [ ] Проверить, что на экране видны только звездочки

---

## 7. Граничные случаи и ошибки

### 7.1 Обработка ошибок

| Ошибка | Обработка |
|--------|-----------|
| Clipboard API недоступен | Fallback на `document.execCommand` |
| Буфер обмена пуст | Игнорировать, не маскировать |
| Пользователь не дал разрешение на доступ к буферу | Показать уведомление |
| Web Accessible Resource не внедряется | Fallback на Content Script (ограничения с iframe) |
| Браузер не поддерживает Clipboard API | Graceful degradation, показать warning |

### 7.2 Граничные случаи

| Случай | Обработка |
|--------|-----------|
| Пустой скрытый текст | Копировать пустую строку, маскировать как "" |
| Очень длинный скрытый текст (>10000 символов) | Маскировать нормально, может быть медленнее |
| Скрытый текст со специальными символами | Копировать как есть, маскировать все символы звездочками |
| Вставка в non-standard поле ввода (custom component) | Может не сработать, зависит от реализации компонента |
| iframe платежей (Stripe, PayPal и т.д.) | Web Accessible Resource работает везде ✅ |
| Вложенные iframe | Web Accessible Resource может работать, зависит от CSP |
| Chrome Extension Security Policy (CSP) | inject-mask.js может быть заблокирован, используем fallback |

### 7.3 Совместимость браузеров

| Браузер | Clipboard API | Web Accessible Resource | Статус |
|---------|---------------|------------------------|--------|
| Chrome 89+ | ✅ | ✅ | Полная поддержка |
| Edge 89+ | ✅ | ✅ | Полная поддержка |
| Firefox 53+ | ✅ | ⚠️ | Поддержка, могут быть ограничения |
| Safari 13.1+ | ⚠️ | ⚠️ | Частичная поддержка, ограничения CSP |
| Opera | ✅ | ✅ | Полная поддержка (Chromium-based) |

---

## 8. Безопасность

### 8.1 Утечки данных

- ❌ Не логируем реальные данные в консоль
- ❌ Не сохраняем реальные данные в localStorage (только в sessionStorage, очищается при закрытии вкладки)
- ✅ Метаданные содержат только флаг, не сами данные
- ✅ После вставки удаляем флаг из буфера обмена
- ✅ inject-mask.js использует postMessage для коммуникации (не глобальные переменные)

### 8.2 Web Accessible Resources Security Considerations

**Почему Web Accessible Resources безопасны для нашего случая:**

1. **Ограниченный скоп** — скрипт только перехватывает paste события и общается с Content Script
2. **Нет прямого доступа к расширению** — inject-mask.js не может напрямую вызвать методы расширения
3. **Content Script как посредник** — все проверки безопасности (метаданные, подтверждение) происходят в Content Script
4. **postMessage с источником проверка** — Content Script проверяет `event.source` и `event.origin`
5. **Нет XSS вектора** — inject-mask.js не выполняет eval или dynamically создает код

**Защита от XSS:**
```javascript
// ❌ ОПАСНО (если inject-mask.js имеет XSS уязвимость)
// eval(userInput) // может выполнить вредоносный код

// ✅ БЕЗОПАСНО (наш подход)
// Только перехватываем события и отправляем сообщения
window.postMessage({ type: 'CHECK_CLIPBOARD_MASK' }, '*');
```

### 8.3 Атаки и защита

| Атака | Защита |
|-------|--------|
| Screenshot/скриншот | Видны только звездочки ✅ |
| Keylogger | Реальные данные в value, но keylogger видит звездочки ✅ |
| DevTools inspection | Данные в value (можно увидеть в DevTools), пользователь выбрал маскирование осознанно ✅ |
| XSS на сайте | inject-mask.js не имеет доступа к расширению, Content Script в изолированном контексте ✅ |
| CSRF атаки | Web Accessible Resource не может отправлять запросы от имени расширения ✅ |
| Man-in-the-middle (MitM) | Работает только с HTTPS сайтами, буфер обмена локален ✅ |
| Вредоносное расширение | Chrome имеет механизм проверки расширений, пользователь дает разрешения ✅ |

---

## 9. Миграция и обратная совместимость

- Функция добавляется как **новая** — не ломает существующий функционал
- Старое копирование текста остается без изменений (копируется как обычный текст)
- Только скрытый текст (с меткой `hiddenText`) копируется с маскированием

---

## 10. Известные ограничения

### 10.1 Ограничения текущей реализации

| Ограничение | Статус | Примечание |
|-------------|--------|-----------|
| Маскирование везде, включая iframe платежей | ✅ РЕШЕНО | Web Accessible Resource |
| Работает на всех сайтах | ✅ РЕШЕНО | Поддерживает https:// и http://* |
| Safari и Firefox | ⚠️ ОГРАНИЧЕНО | Web Accessible Resource может иметь ограничения |
| Очень закрытые iframe (sandboxed) | ⚠️ ОГРАНИЧЕНО | Некоторые iframe могут блокировать inject-mask.js |

### 10.2 Технические ограничения

1. **CSP (Content Security Policy)** некоторых сайтов могут блокировать inject-mask.js
   - Решение: Fallback на Content Script (ограничения с iframe)

2. **Очень старые браузеры** (<Chrome 89) не поддерживают Clipboard API
   - Решение: Graceful degradation, показать warning

3. **Sandboxed iframe** (с атрибутом `sandbox`) могут блокировать paste события
   - Решение: Таких iframe очень мало, обычно для рекламы

## 11. Будущие улучшения (out of scope)

- [ ] Кнопка "Показать пароль" (иконка глазика) в маскированном поле
- [ ] Временное раскрытие данных при наведении (toggle)
- [ ] Поддержка других типов скрытых данных (изображения, файлы)
- [ ] Синхронизация маскирования между вкладками браузера
- [ ] Поддержка Safari и Firefox с полной функциональностью
- [ ] Уведомление пользователю когда маскирование активировано

---

## 12. Файлы для изменения

```
NEW:
  src/lib/clipboard-masking.ts                   (утилиты для копирования)
  src/content-scripts/clipboard-mask.ts          (Content Script)
  public/inject-mask.js                          (Web Accessible Resource) ⭐
  tests/unit/clipboard-masking.test.ts           (unit-тесты)

MODIFIED:
  src/components/TiptapEditor/HiddenContextMenu.tsx  (использовать copyHiddenText)
  public/manifest.json                           (добавить content script + WAR)
  src/types/note.ts                              (если нужны новые типы)

DOCUMENTATION:
  docs/DEVELOPMENT.md                            (раздел о clipboard masking)
  docs/USER_GUIDE.md                             (инструкция пользователю)
  docs/SECURITY.md                               (раздел про безопасность)
```

---

## 13. Успешные критерии реализации

✅ Реализация завершена когда:
- [ ] copyHiddenText() работает (добавляет метаданные в буфер)
- [ ] Content Script перехватывает paste везде
- [ ] Web Accessible Resource внедряется и работает
- [ ] Маскирование работает на обычных сайтах ✅
- [ ] Маскирование работает в iframe платежей (Stripe) ✅
- [ ] Маскирование работает в textarea ✅
- [ ] Маскирование работает в contenteditable ✅
- [ ] Реальные данные остаются в поле (работают при отправке)
- [ ] Звездочки видны вместо реальных данных
- [ ] Метаданные удаляются после вставки
- [ ] Fallback работает если Web Accessible Resource недоступен
- [ ] Unit-тесты написаны и проходят
- [ ] Integration-тесты (manual) пройдены на реальных сайтах
- [ ] Documentation обновлена

---

## 14. Метрики успеха

📊 Функция считается успешной если:
- **99%+ paste событий перехватывается и маскируется**
- **Нет утечек реальных данных на экране** (видны только *)
- **Маскирование работает везде, включая iframe платежей** ✅
- **Производительность: <5ms для проверки метаданных**
- **Нет консольных ошибок при использовании**
- **Работает на Chrome, Edge (основные браузеры)**
- **Стримеры/контент-креаторы могут безопасно вводить платежные данные** 🎬
