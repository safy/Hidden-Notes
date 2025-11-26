/**
 * @file: App.tsx
 * @description: Главный компонент приложения Hidden Notes
 * @dependencies: React, shadcn/ui components, useNotes hook
 * @created: 2025-10-15
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';
import { SettingsDialog } from '@/components/ui/settings-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNotes } from '@/hooks/useNotes';
import { useFolders } from '@/hooks/useFolders';
import { useHiddenTextReveal } from '@/hooks/useHiddenTextReveal';
import { initDevtoolsHelper } from '@/lib/devtools-helpers';
import { initDataProtection, verifyDataIntegrity, listBackups, restoreFromBackup } from '@/lib/data-protection';
import { Settings, Plus, Search, ArrowUpDown, Archive, FolderPlus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { NoteView } from '@/components/NoteView';
import { SearchDropdown } from '@/components/Search';
import { FolderCreateMenu, MoveToFolderDialog, FolderEditMenu } from '@/components/Folder';
import { SortDialog, SortOptions } from '@/components/Sort';
import { ArchiveView } from '@/components/Archive';
import { TrashView } from '@/components/Trash';
import { moveNoteToFolder, toggleNoteArchive, moveFolderToFolder, updateFolder, sortFolders, sortNotes, sortBoth } from '@/lib/storage';
import '@/i18n'; // Инициализация i18n

// Рантайм-диагностика источника сборки
if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
  // Путь к загруженному manifest.json у текущего экземпляра
  // Поможет проверить, что поднята именно папка dist, а не старый crx
  // Пример: file:///G:/Hidden%20Notes/dist/manifest.json
  // Также выведем список основных ассетов, видимых браузером
  // Эти логи видны в Console side panel
  try {
    // eslint-disable-next-line no-console
    console.info('HN runtime manifest URL:', chrome.runtime.getURL('manifest.json'));
  } catch {}
}

// Проставим маркер сборки (хеш основного бандла из dist)
// Этот импорт отсутствует в рантайме, поэтому используем инлайновую константу
// Обновляется при каждой сборке через изменение комментария ниже.
const HN_BUILD_MARK = 'mark-2025-11-26-sort-v6'; // <- имя/маркер билда для проверки обновления
// eslint-disable-next-line no-console
console.info('HN build marker:', HN_BUILD_MARK);

type AppView = 'list' | 'note';

const App: React.FC = () => {
  const { t, i18n } = useTranslation(); // TODO: Используется для переводов
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<AppView>('list');
  const [selectedNote, setSelectedNote] = useState<{id: string, title: string} | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Dialogs state
  const [isFolderCreateMenuOpen, setIsFolderCreateMenuOpen] = useState(false);
  const [isMoveToFolderDialogOpen, setIsMoveToFolderDialogOpen] = useState(false);
  const [isFolderEditDialogOpen, setIsFolderEditDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  
  // Использование useNotes и useFolders hooks
  const { notes, isLoading, error, addNote, updateNoteContent, removeNote, getNoteById, refreshNotes } = useNotes();
  const { folders, createNewFolder, reorderFoldersHandler, refreshFolders } = useFolders();
  const { toast } = useToast();

  // Enable Alt+hover reveal for hidden text
  useHiddenTextReveal();

  // ?? Инициализировать DevTools Helper и систему защиты данных
  useEffect(() => {
    initDevtoolsHelper();
    
    // Инициализируем защиту данных (async)
    initDataProtection().then(() => {
      // Проверяем целостность данных при запуске
      verifyDataIntegrity().then(result => {
        if (!result.isValid) {
          toast({
            title: t('common.dataIssues', { defaultValue: 'Data issues detected' }),
            description: t('common.dataIssuesDesc', { count: result.errors.length, defaultValue: `Errors: ${result.errors.length}. Press Ctrl+Shift+R to restore.` }),
            duration: 10000,
          });
        } else if (result.warnings.length > 0) {
          console.warn('Data warnings:', result.warnings);
        }
      });
    });
  }, [t, i18n.language]); // Зависимость от языка для корректного перевода

  // Обработка ошибок storage
  useEffect(() => {
    if (error) {
      // Проверяем, является ли это ошибкой квоты хранилища
      const isQuotaError = error.includes('quota') || error.includes('QUOTA_BYTES') || error.includes('kQuotaBytes');
      
      if (isQuotaError) {
        toast({
          title: t('common.quotaExceeded', { defaultValue: 'Storage quota exceeded' }),
          description: t('common.quotaExceededDesc', { defaultValue: 'Extension storage is full (10 MB). Delete old notes or images to free up space.' }),
          duration: 10000,
        });
      } else {
        toast({
          title: t('common.error', { defaultValue: 'Error' }),
          description: error,
          duration: 5000,
        });
      }
    }
  }, [error, toast, t]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    
    toast({
      title: t('toast.themeChanged.title', { defaultValue: 'Theme changed' }),
      description: t('toast.themeChanged.desc', { defaultValue: `Switched to ${newTheme === 'dark' ? 'dark' : 'light'} theme` }),
      duration: 3000,
    });
  };

  const handleNoteSelect = (noteId: string) => {
    const note = getNoteById(noteId);
    if (note) {
      setSelectedNote({ id: noteId, title: note.title });
      setCurrentView('note');
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedNote(null);
  };

  const handleCreateNote = async () => {
    const newNote = await addNote(t('header.newNote', { defaultValue: 'New note' }), currentFolderId);
    if (newNote) {
      setSelectedNote({ id: newNote.id, title: newNote.title });
      setCurrentView('note');
      toast({
        title: t('toast.noteCreated', { defaultValue: 'Note created' }),
        description: t('toast.noteReady', { defaultValue: 'New note is ready to edit' }),
        duration: 3000,
      });
    }
  };

  const handleNoteSave = () => {
    toast({
      title: t('toast.noteSaved', { defaultValue: 'Note saved' }),
      description: t('toast.noteSavedDesc', { defaultValue: selectedNote?.title ? `"${selectedNote.title}" saved` : 'Saved successfully' }),
      duration: 3000,
    });
  };

  const handleCurrentNoteDelete = async () => {
    if (selectedNote) {
      const success = await removeNote(selectedNote.id);
      if (success) {
        toast({
          title: t('toast.noteDeleted', { defaultValue: 'Note deleted' }),
          description: t('toast.noteDeletedDesc', { defaultValue: selectedNote ? `"${selectedNote.title}" deleted` : 'Deleted' }),
          duration: 3000,
        });
        handleBackToList();
      }
    }
  };

  const handleNoteTitleChange = async (newTitle: string) => {
    if (selectedNote) {
      const updated = await updateNoteContent(selectedNote.id, { title: newTitle });
      if (updated) {
        setSelectedNote({ ...selectedNote, title: newTitle });
        toast({
          title: t('toast.noteTitleChanged', { defaultValue: 'Title changed' }),
          description: t('toast.noteRenamedTo', { defaultValue: `Renamed to "${newTitle}"` }),
          duration: 2000,
        });
      }
    }
  };

  const handleContentChange = async (noteId: string, content: string) => {
    // Auto-save content with minimal feedback
    try {
      await updateNoteContent(noteId, { content });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: t('common.error', { defaultValue: 'Save error' }),
        description: t('toast.saveFailed', { defaultValue: 'Failed to save note' }),
        duration: 3000,
      });
    }
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleNotesReorder = (_reorderedNotes: any[]) => {
    toast({
      title: t('info.soon.title', { defaultValue: 'Info' }),
      description: t('info.soon.reorder', { defaultValue: 'Reordering will be added in the next version' }),
      duration: 3000,
    });
  };

  const handleNoteDelete = async (noteId: string) => {
    const success = await removeNote(noteId);
    if (success) {
      toast({
        title: t('note.deleted.title', { defaultValue: 'Note deleted' }),
        description: t('note.deleted.desc', { defaultValue: 'The note has been removed from the list' }),
        duration: 3000,
      });
    }
  };

  const handleNoteColorChange = async (noteId: string, color: string) => {
    try {
      await updateNoteContent(noteId, { color });
    } catch (error) {
    toast({
        title: t('error.title', { defaultValue: 'Error' }),
        description: t('error.applyColor', { defaultValue: 'Failed to apply color' }),
      duration: 3000,
    });
    }
  };

  const handleCreateFolder = () => {
    setIsFolderCreateMenuOpen(true);
  };

  const handleFolderCreateSubmit = async (data: { name: string; color: string; icon?: string }) => {
    const newFolder = await createNewFolder({
      name: data.name,
      color: data.color,
      icon: data.icon,
      parentId: currentFolderId, // Создаем папку в текущей папке
    });
    
    if (newFolder) {
      toast({
        title: t('folder.created.title', { defaultValue: 'Folder created' }),
        description: t('folder.created.desc', { defaultValue: 'Folder created successfully' }),
        duration: 3000,
      });
    }
    
    setIsFolderCreateMenuOpen(false);
  };

  const handleMoveNoteToFolder = (noteId: string) => {
    setMovingNoteId(noteId);
    setIsMoveToFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setIsFolderEditDialogOpen(true);
  };

  const handleFolderEditSubmit = async (data: { name: string; color: string; icon?: string }) => {
    if (!editingFolder) return;
    
    try {
      const updatedFolder = await updateFolder(editingFolder.id, {
        name: data.name,
        color: data.color,
        icon: data.icon,
      });
      
      if (updatedFolder) {
        toast({
          title: t('folder.updated.title', { defaultValue: 'Folder updated' }),
          description: t('folder.updated.desc', { defaultValue: 'Folder updated successfully' }),
          duration: 3000,
        });
      } else {
        toast({
          title: t('error.title', { defaultValue: 'Error' }),
          description: t('folder.updateFailed', { defaultValue: 'Failed to update folder' }),
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: t('error.title', { defaultValue: 'Error' }),
        description: t('folder.updateFailed', { defaultValue: 'Failed to update folder' }),
        duration: 3000,
      });
    }
    
    setIsFolderEditDialogOpen(false);
    setEditingFolder(null);
  };

  const handleMoveToFolderSubmit = async (folderId: string | null) => {
    if (!movingNoteId) return;
    
    const note = getNoteById(movingNoteId);
    if (!note) return;
    
    const success = await moveNoteToFolder(movingNoteId, folderId);
    
    if (success) {
      // Обновляем список заметок
      await refreshNotes();
      
      toast({
        title: t('note.moved.title', { defaultValue: 'Note moved' }),
        description: t('note.moved.desc', { defaultValue: 'Note has been moved' }),
        duration: 3000,
      });
    }
    
    setIsMoveToFolderDialogOpen(false);
    setMovingNoteId(null);
  };

  const handleMoveNoteToFolderSubmit = async (noteId: string, folderId: string) => {
    const note = getNoteById(noteId);
    if (!note) {
      console.error('Note not found:', noteId);
      return;
    }
    
    console.log('Moving note:', note.title, 'to folder:', folderId);
    console.log('Current folder:', currentFolderId);
    
    const success = await moveNoteToFolder(noteId, folderId);
    
    if (success) {
      console.log('Note moved successfully, refreshing notes...');
      
      // Обновляем список заметок чтобы заметка исчезла из текущего списка
      await refreshNotes();
      
      console.log('Notes refreshed');
      
      toast({
        title: t('note.moved.title', { defaultValue: 'Note moved' }),
        description: t('note.moved.desc', { defaultValue: 'Note has been moved' }),
        duration: 3000,
      });
    } else {
      console.error('Failed to move note');
      toast({
        title: t('error.title', { defaultValue: 'Error' }),
        description: t('note.moveFailed', { defaultValue: 'Failed to move note' }),
        duration: 3000,
      });
    }
  };

  const handleMoveFolderToFolder = async (folderId: string, targetFolderId: string | null) => {
    const success = await moveFolderToFolder(folderId, targetFolderId);
    
    if (success) {
      // Обновляем список папок после перемещения
      await refreshFolders();
      
      toast({
        title: t('folder.moved.title', { defaultValue: 'Folder moved' }),
        description: t('folder.moved.desc', { defaultValue: 'Folder moved successfully' }),
        duration: 3000,
      });
    } else {
      toast({
        title: t('error.title', { defaultValue: 'Error' }),
        description: t('folder.moveFailed', { defaultValue: 'Failed to move folder' }),
        duration: 3000,
      });
    }
  };

  const handleReorderFolders = async (folderId: string, newOrder: number) => {
    const success = await reorderFoldersHandler(folderId, newOrder);
    
    if (!success) {
      toast({
        title: t('error.title', { defaultValue: 'Error' }),
        description: t('toast.reorderFailed', { defaultValue: 'Failed to change folder order' }),
        duration: 3000,
      });
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    console.log('handleFolderSelect called:', folderId);
    setCurrentFolderId(folderId);
    // Сбрасываем поиск при смене папки
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleBackToRoot = () => {
    if (!currentFolderId) {
      // Уже в корне, некуда возвращаться
      return;
    }
    
    // Находим текущую папку и переходим к её родителю
    const currentFolder = folders.find(f => f.id === currentFolderId);
    if (currentFolder) {
      // Переходим к родительской папке (или в корень если parentId === null)
      setCurrentFolderId(currentFolder.parentId ?? null);
    } else {
      // Если папка не найдена, возвращаемся в корень
      setCurrentFolderId(null);
    }
  };

  const handleNoteArchive = async (noteId: string) => {
    const note = getNoteById(noteId);
    if (!note) return;
    
    const success = await toggleNoteArchive(noteId);
    
    if (success) {
    toast({
        title: note.isArchived ? t('note.restored.title', { defaultValue: 'Note restored' }) : t('note.archived.title', { defaultValue: 'Note archived' }),
        description: note.isArchived ? t('note.restored.desc', { defaultValue: 'Restored from archive' }) : t('note.archived.desc', { defaultValue: 'Moved to archive' }),
      duration: 3000,
    });
    }
  };

  const handleArchive = () => {
    toast({
      title: t('archive.title', { defaultValue: 'Archive' }),
      description: t('archive.soon', { defaultValue: 'Archive view will be added in the next version' }),
      duration: 3000,
    });
  };

  const handleSort = () => {
    console.log('Opening sort dialog');
    setIsSortDialogOpen(true);
  };

  const handleApplySort = async (options: SortOptions) => {
    console.log('Applying sort:', options);
    try {
      let success = false;

      if (options.target === 'folders') {
        success = await sortFolders(options.field, options.order);
      } else if (options.target === 'notes') {
        const noteField = options.field === 'name' ? 'title' : options.field;
        success = await sortNotes(noteField as 'title' | 'createdAt' | 'updatedAt', options.order);
      } else {
        success = await sortBoth(options.field, options.order);
      }

      if (success) {
        await refreshNotes();
        await refreshFolders();
        toast({
          title: t('sort.success', { defaultValue: 'Sorted successfully' }),
          description: t('sort.successDesc', { defaultValue: 'Items have been sorted' }),
          duration: 2000,
        });
      } else {
        throw new Error('Sort failed');
      }
    } catch (error) {
      console.error('Error sorting:', error);
      toast({
        title: t('sort.error', { defaultValue: 'Sort failed' }),
        description: t('sort.errorDesc', { defaultValue: 'Failed to sort items' }),
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleExportNotes = async () => {
    try {
      const { exportNotes } = await import('@/lib/storage');
      const jsonData = await exportNotes();
      
      // Создаем blob и скачиваем файл
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Форматируем имя файла с временной меткой
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      link.download = `hidden-notes-backup-${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: t('export.done', { defaultValue: 'Export completed' }),
        description: t('export.count', { defaultValue: `Exported notes: ${notes.length}` }),
        duration: 3000,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('export.error', { defaultValue: 'Export error' }),
        description: t('export.failed', { defaultValue: 'Failed to export notes' }),
        duration: 3000,
      });
    }
  };

  // Settings dialog теперь открывается через кнопку в header

  // Функция восстановления из бэкапа
  const handleRestoreFromBackup = async () => {
    const backups = await listBackups();
    
    if (backups.length === 0) {
      toast({
        title: t('backup.none', { defaultValue: 'No backups' }),
        description: t('backup.autoNotCreated', { defaultValue: 'Auto backups are not created yet' }),
        duration: 3000,
      });
      return;
    }
    
    // Показываем информацию о последнем бэкапе
    const lastBackup = backups[backups.length - 1];
    if (!lastBackup) return;
    
    if (confirm(t('backup.confirmRestore', { defaultValue: `Restore data from backup?\n\nDate: ${lastBackup.date}\nNotes: ${lastBackup.notesCount}\n\nUnsaved changes will be lost!` }))) {
      const success = await restoreFromBackup();
      
      if (success) {
        // Перезагружаем страницу для обновления данных
        window.location.reload();
      } else {
        toast({
          title: t('backup.restoreError', { defaultValue: 'Restore error' }),
          description: t('backup.restoreFailed', { defaultValue: 'Failed to restore from backup' }),
          duration: 5000,
        });
      }
    }
  };

  // Глобальные горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E - Экспорт заметок
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExportNotes();
      }
      // Ctrl+/ - Помощь по горячим клавишам
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
      // Ctrl+Shift+R - Восстановление из бэкапа
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handleRestoreFromBackup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Фильтрованный список заметок на основе поиска и папки
  const filteredNotes = React.useMemo(() => {
    let result = notes;
    
    console.log('Filtering notes:', { 
      totalNotes: notes.length, 
      currentFolderId, 
      searchQuery,
      notes: notes.map(n => ({ id: n.id, title: n.title, folderId: n.folderId }))
    });
    
    // Фильтр по папке
    if (currentFolderId !== null) {
      result = result.filter(note => note.folderId === currentFolderId);
      console.log('Filtered by folder:', result.length, 'notes');
    } else {
      // Показываем заметки без папки (корень)
      result = result.filter(note => !note.folderId);
      console.log('Filtered by root (no folder):', result.length, 'notes');
    }
    
    // Фильтр по поиску
    if (searchQuery) {
      result = result.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('Filtered by search:', result.length, 'notes');
    }
    
    console.log('Final filtered notes:', result.map(n => ({ id: n.id, title: n.title, folderId: n.folderId })));
    
    return result;
  }, [notes, currentFolderId, searchQuery]);

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4">?</div>
            <p>{t('loading.notes', { defaultValue: 'Loading notes...' })}</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Conditional Header */}
          {currentView === 'list' && (
            <header className="border-b border-border px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCreateNote} title={t('header.newNote', { defaultValue: 'New note' })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCreateFolder} title={t('header.createFolder', { defaultValue: 'Create folder' })}>
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSearchToggle}
                    title={t('header.search', { defaultValue: 'Search' })}
                    className={isSearchOpen ? 'bg-accent text-accent-foreground' : ''}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSort} title={t('header.sort', { defaultValue: 'Sort' })}>
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleArchive} title={t('header.archive', { defaultValue: 'Archive' })}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSettingsOpen(true)}
                    title={t('header.settings', { defaultValue: 'Settings' })}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                   {/* Иконки горячих клавиш и темы перенесены в настройки */}
                </div>
              </div>
            </header>
          )}

          {/* Search Dropdown */}
          {currentView === 'list' && (
            <SearchDropdown
              isOpen={isSearchOpen}
              onClose={handleSearchClose}
              onSearch={handleSearch}
            />
          )}

          {/* Folder Create Menu */}
          {currentView === 'list' && (
            <FolderCreateMenu
              isOpen={isFolderCreateMenuOpen}
              onClose={() => setIsFolderCreateMenuOpen(false)}
              onSubmit={handleFolderCreateSubmit}
            />
          )}

          {/* Folder Edit Menu */}
          {currentView === 'list' && (
            <FolderEditMenu
              isOpen={isFolderEditDialogOpen}
              onClose={() => {
                setIsFolderEditDialogOpen(false);
                setEditingFolder(null);
              }}
              onSave={handleFolderEditSubmit}
              folder={editingFolder}
            />
          )}

          {/* Sort Dialog */}
          <SortDialog
            open={isSortDialogOpen}
            onOpenChange={setIsSortDialogOpen}
            onSort={handleApplySort}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'list' ? (
              <Sidebar 
                notes={filteredNotes}
                folders={folders}
                currentFolderId={currentFolderId}
                onNoteSelect={handleNoteSelect} 
                onNotesReorder={handleNotesReorder}
                onNoteArchive={handleNoteArchive}
                onNoteDelete={handleNoteDelete}
                onNoteColorChange={handleNoteColorChange}
                onMoveToFolder={handleMoveNoteToFolder}
                onFolderSelect={handleFolderSelect}
                onBackToRoot={handleBackToRoot}
                onMoveNoteToFolder={handleMoveNoteToFolderSubmit}
                onMoveFolderToFolder={handleMoveFolderToFolder}
                onReorderFolders={handleReorderFolders}
                onEditFolder={handleEditFolder}
                searchQuery={searchQuery} 
              />
            ) : (
              selectedNote && (
                <NoteView
                  noteId={selectedNote.id}
                  noteTitle={selectedNote.title}
                  noteContent={getNoteById(selectedNote.id)?.content || ''}
                  onBack={handleBackToList}
                  onSave={handleNoteSave}
                  onDelete={handleCurrentNoteDelete}
                  onTitleChange={handleNoteTitleChange}
                  onContentChange={handleContentChange}
                />
              )
            )}
          </div>

          {/* Dialogs */}
          <SettingsDialog 
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
          
          <KeyboardShortcutsDialog 
            open={isShortcutsOpen} 
            onOpenChange={setIsShortcutsOpen}
          />
          
          <MoveToFolderDialog
            isOpen={isMoveToFolderDialogOpen}
            onClose={() => {
              setIsMoveToFolderDialogOpen(false);
              setMovingNoteId(null);
            }}
            onMove={handleMoveToFolderSubmit}
            currentFolderId={movingNoteId && !movingNoteId.startsWith('folder-') ? getNoteById(movingNoteId)?.folderId : null}
            noteTitle={movingNoteId && !movingNoteId.startsWith('folder-') ? getNoteById(movingNoteId)?.title : undefined}
          />


          {/* Toaster для уведомлений */}
          <Toaster />
        </>
      )}
    </div>
  );
};

export default App;

