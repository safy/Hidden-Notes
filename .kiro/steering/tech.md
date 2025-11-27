# Technology Stack

## Core Technologies

- **Chrome Extension**: Manifest V3, Side Panel API (Chrome 114+)
- **Frontend**: React 18 + TypeScript (strict mode)
- **Build**: Vite + @crxjs/vite-plugin
- **State**: Zustand for global state, React Context for local
- **Storage**: Chrome Storage API (local, 10MB quota)

## UI/UX Stack

- **Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3+
- **Icons**: Lucide React
- **Editor**: Tiptap (ProseMirror-based) with custom extensions
- **Drag & Drop**: @dnd-kit for folder/note reordering
- **i18n**: react-i18next

## Development Tools

- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Testing**: Playwright (E2E), Vitest (unit tests)
- **Type Checking**: TypeScript 5.5+

## Common Commands

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Testing
npm run test              # Playwright E2E
npm run test:unit         # Vitest unit tests
npm run test:unit:run     # Vitest single run

# Generate icons
npm run generate:icons
```

## Loading Extension in Chrome

1. Build: `npm run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

## Key Libraries

- **@tiptap/react**: Rich text editor
- **@radix-ui/***: Accessible UI primitives
- **@dnd-kit/***: Drag and drop functionality
- **nanoid**: ID generation
- **i18next**: Internationalization
- **zustand**: State management

## Storage Architecture

- **Primary**: Chrome Storage Local API (10MB)
- **Backup**: IndexedDB (survives extension uninstall)
- **Fallback**: localStorage (emergency recovery)
- **Protection**: Auto-backups, versioning (last 5 versions), 30-day trash retention
