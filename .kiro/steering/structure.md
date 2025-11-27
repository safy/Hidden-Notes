# Project Structure

## Directory Organization

```
src/
├── background/          # Service Worker (extension lifecycle)
├── sidepanel/          # Main app entry point (App.tsx, index.tsx, index.html)
├── components/         # React components
│   ├── ui/            # shadcn/ui base components (button, dialog, etc.)
│   ├── Archive/       # Archive view
│   ├── ColorPicker/   # Color selection for notes/folders
│   ├── Editor/        # Note editor wrapper
│   ├── Folder/        # Folder management (create, edit, move dialogs)
│   ├── NoteView/      # Single note view with editor
│   ├── Search/        # Search dropdown
│   ├── Sidebar/       # Main sidebar with notes list
│   ├── Sort/          # Sort dialog
│   ├── TiptapEditor/  # Tiptap editor + extensions + toolbars
│   └── Trash/         # Trash view
├── hooks/             # Custom React hooks
│   ├── use-toast.ts   # Toast notifications
│   ├── useFolders.ts  # Folder CRUD operations
│   ├── useHiddenTextReveal.ts  # Alt+hover reveal logic
│   └── useNotes.ts    # Note CRUD operations
├── lib/               # Utilities and core logic
│   ├── storage.ts     # Chrome Storage abstraction (CRUD for notes/folders)
│   ├── data-protection.ts  # Backup/restore system
│   ├── archive-disk.ts     # Archive to disk functionality
│   ├── external-backup.ts  # External backup helpers
│   ├── file-storage.ts     # File handling
│   ├── image-compression.ts # Image optimization
│   ├── image-storage.ts    # Image storage management
│   ├── devtools-helpers.ts # DevTools integration
│   └── utils.ts       # General utilities (cn, etc.)
├── types/             # TypeScript type definitions
│   ├── note.ts        # Note interface, StorageSchema
│   └── folder.ts      # Folder interface, helpers
├── i18n/              # Internationalization
│   ├── index.ts       # i18n setup
│   └── locales/       # Translation files (en.json, ru.json)
├── extensions/        # Custom Tiptap extensions
│   └── HiddenText.ts  # Visual text hiding extension
└── styles/            # Global styles
    └── globals.css    # Tailwind + custom CSS

public/
├── icons/             # Extension icons (16, 48, 128)
└── manifest.json      # Chrome Extension manifest

docs/                  # Documentation
tests/                 # Playwright E2E tests
```

## Key Files

- **src/sidepanel/App.tsx**: Main application component, routing, state management
- **src/lib/storage.ts**: Core storage abstraction with AsyncLock for race condition prevention
- **src/lib/data-protection.ts**: 8-level backup system (IndexedDB, localStorage, versioning)
- **src/components/TiptapEditor/TiptapEditor.tsx**: Main editor component
- **src/hooks/useNotes.ts**: Note CRUD hook with auto-refresh
- **src/hooks/useFolders.ts**: Folder CRUD hook with reordering
- **public/manifest.json**: Extension configuration

## Component Patterns

- **Functional components only** (no class components)
- **Props destructuring** at function signature
- **Custom hooks** for shared logic (useNotes, useFolders, useToast)
- **shadcn/ui** for base components (Button, Dialog, etc.)
- **Compound components** for complex UI (FolderCreateMenu, SortDialog)

## State Management

- **Zustand**: Not currently used but available
- **React Context**: Local component state
- **Custom hooks**: useNotes, useFolders wrap storage operations
- **Chrome Storage**: Source of truth for persistence

## Naming Conventions

- **Components**: PascalCase (NoteView.tsx)
- **Hooks**: camelCase with 'use' prefix (useNotes.ts)
- **Utilities**: camelCase (storage.ts)
- **Types**: PascalCase interfaces (Note, Folder)
- **Constants**: UPPER_SNAKE_CASE (STORAGE_KEY)

## Import Aliases

- `@/` maps to `src/` directory
- Example: `import { Button } from '@/components/ui/button'`
