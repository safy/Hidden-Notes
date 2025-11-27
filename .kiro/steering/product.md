# Product Overview

Hidden Notes is a Chrome Extension (Manifest V3) for creating rich-text notes with visual hiding of sensitive information.

## Core Purpose

Provides a secure, browser-integrated note-taking experience where users can:
- Create and organize notes with rich formatting (via Tiptap editor)
- Visually hide sensitive text (passwords, PINs) with a "noise" effect
- Organize notes in folders with nested structure support
- Archive and trash management with 30-day retention
- Search, sort, and color-code notes

## Key Features

- **Visual Privacy**: Text hiding with Alt+hover reveal and Ctrl+click copy (visual only, not cryptographic)
- **Organization**: Folders, subfolders, archiving, and trash with restore
- **Rich Editor**: Full Tiptap integration with formatting, tables, images, lists
- **Data Protection**: 8-level protection system with IndexedDB backups, localStorage fallback, auto-backups every 2-5 minutes
- **Storage**: Chrome Storage API (10MB quota with unlimitedStorage permission)
- **i18n**: Russian and English interface support

## Target Users

Users who need quick access to notes with sensitive information while browsing, without requiring full encryption but wanting visual privacy from shoulder-surfing.

## Version

Current: v1.0.0 (Free)
Planned: v2.0 (Pro - sync), v3.0 (Premium - encryption, export/import)
