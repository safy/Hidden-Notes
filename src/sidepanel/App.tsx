/**
 * @file: App.tsx
 * @description: Главный компонент приложения Hidden Notes
 * @dependencies: React, shadcn/ui components, useNotes hook
 * @created: 2025-10-15
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNotes } from '@/hooks/useNotes';
import { useFolders } from '@/hooks/useFolders';
import { useHiddenTextReveal } from '@/hooks/useHiddenTextReveal';
import { initDevtoolsHelper } from '@/lib/devtools-helpers';
import { initDataProtection, verifyDataIntegrity, listBackups, restoreFromBackup } from '@/lib/data-protection';
import { Moon, Sun, Settings, Plus, Search, ArrowUpDown, Archive, HelpCircle, FolderPlus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { NoteView } from '@/components/NoteView';
import { SearchDropdown } from '@/components/Search';
import { FolderCreateMenu, MoveToFolderDialog, FolderEditMenu } from '@/components/Folder';
import { moveNoteToFolder, toggleNoteArchive, moveFolderToFolder, updateFolder } from '@/lib/storage';

type AppView = 'list' | 'note';

const App: React.FC = () => {
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
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  
  // Использование useNotes и useFolders hooks
  const { notes, isLoading, error, addNote, updateNoteContent, removeNote, getNoteById, refreshNotes } = useNotes();
  const { folders, createNewFolder } = useFolders();
  const { toast } = useToast();

  // Enable Alt+hover reveal for hidden text
  useHiddenTextReveal();

  // 🔧 Инициализировать DevTools Helper и систему защиты данных
  useEffect(() => {
    initDevtoolsHelper();
    
    // Инициализируем защиту данных (async)
    initDataProtection().then(() => {
      // Проверяем целостность данных при запуске
      verifyDataIntegrity().then(result => {
        if (!result.isValid) {
          toast({
            title: '⚠️ Проблемы с данными обнаружены',
            description: `Ошибок: ${result.errors.length}. Нажмите Ctrl+Shift+R для восстановления.`,
            duration: 10000,
          });
        } else if (result.warnings.length > 0) {
          console.warn('Data warnings:', result.warnings);
        }
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Обработка ошибок storage
  useEffect(() => {
    if (error) {
      toast({
        title: 'Ошибка',
        description: error,
        duration: 5000,
      });
    }
  }, [error, toast]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    
    toast({
      title: 'Тема изменена',
      description: `Переключено на ${newTheme === 'dark' ? 'темную' : 'светлую'} тему`,
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
    const newNote = await addNote('Новая заметка', currentFolderId);
    if (newNote) {
      setSelectedNote({ id: newNote.id, title: newNote.title });
      setCurrentView('note');
      toast({
        title: 'Заметка создана',
        description: 'Новая заметка готова к редактированию',
        duration: 3000,
      });
    }
  };

  const handleNoteSave = () => {
    toast({
      title: 'Заметка сохранена',
      description: `"${selectedNote?.title}" успешно сохранена`,
      duration: 3000,
    });
  };

  const handleCurrentNoteDelete = async () => {
    if (selectedNote) {
      const success = await removeNote(selectedNote.id);
      if (success) {
        toast({
          title: 'Заметка удалена',
          description: `"${selectedNote.title}" удалена`,
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
          title: 'Название изменено',
          description: `Заметка переименована в "${newTitle}"`,
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
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить заметку',
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
    // TODO: Реализовать переупорядочение заметок
    toast({
      title: 'Информация',
      description: 'Переупорядочение будет добавлено в следующей версии',
      duration: 3000,
    });
  };

  const handleNoteDelete = async (noteId: string) => {
    const success = await removeNote(noteId);
    if (success) {
      toast({
        title: 'Заметка удалена',
        description: 'Заметка удалена из списка',
        duration: 3000,
      });
    }
  };

  const handleNoteColorChange = async (noteId: string, color: string) => {
    try {
      await updateNoteContent(noteId, { color });
    } catch (error) {
    toast({
        title: 'Ошибка',
        description: 'Не удалось применить цвет',
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
        title: 'Папка создана',
        description: `"${data.name}" успешно создана`,
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
          title: 'Папка обновлена',
          description: `"${data.name}" успешно обновлена`,
          duration: 3000,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось обновить папку',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить папку',
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
      const folderName = folderId 
        ? folders.find(f => f.id === folderId)?.name || 'папку'
        : 'корень';
      
      // Обновляем список заметок
      await refreshNotes();
      
      toast({
        title: 'Заметка перемещена',
        description: `"${note.title}" перемещена в ${folderName}`,
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
      const folderName = folders.find(f => f.id === folderId)?.name || 'папку';
      
      console.log('Note moved successfully, refreshing notes...');
      
      // Обновляем список заметок чтобы заметка исчезла из текущего списка
      await refreshNotes();
      
      console.log('Notes refreshed');
      
      toast({
        title: 'Заметка перемещена',
        description: `"${note.title}" перемещена в папку "${folderName}"`,
        duration: 3000,
      });
    } else {
      console.error('Failed to move note');
      toast({
        title: 'Ошибка',
        description: 'Не удалось переместить заметку',
        duration: 3000,
      });
    }
  };

  const handleMoveFolderToFolder = async (folderId: string, targetFolderId: string | null) => {
    const success = await moveFolderToFolder(folderId, targetFolderId);
    
    if (success) {
      const folderName = folders.find(f => f.id === folderId)?.name || 'папка';
      const targetFolderName = targetFolderId 
        ? folders.find(f => f.id === targetFolderId)?.name || 'папку'
        : 'корень';
      
      toast({
        title: 'Папка перемещена',
        description: `"${folderName}" перемещена в ${targetFolderName}`,
        duration: 3000,
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось переместить папку',
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
    setCurrentFolderId(null);
  };

  const handleNoteArchive = async (noteId: string) => {
    const note = getNoteById(noteId);
    if (!note) return;
    
    const success = await toggleNoteArchive(noteId);
    
    if (success) {
    toast({
        title: note.isArchived ? 'Заметка восстановлена' : 'Заметка архивирована',
        description: `"${note.title}" ${note.isArchived ? 'восстановлена из архива' : 'перемещена в архив'}`,
      duration: 3000,
    });
    }
  };

  const handleArchive = () => {
    toast({
      title: 'Архив',
      description: 'Просмотр архива будет добавлен в следующей версии',
      duration: 3000,
    });
  };

  const handleSort = () => {
    toast({
      title: 'Сортировка',
      description: 'Функция сортировки будет добавлена в следующей версии',
      duration: 3000,
    });
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
        title: 'Экспорт завершен',
        description: `Экспортировано заметок: ${notes.length}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать заметки',
        duration: 3000,
      });
    }
  };

  const handleSettings = () => {
    // TODO: Открыть модальное окно настроек
    toast({
      title: 'Настройки',
      description: 'Окно настроек будет добавлено в следующей версии. Нажмите Ctrl+E для экспорта заметок.',
      duration: 4000,
    });
  };

  // Функция восстановления из бэкапа
  const handleRestoreFromBackup = async () => {
    const backups = await listBackups();
    
    if (backups.length === 0) {
      toast({
        title: 'Нет бэкапов',
        description: 'Автоматические бэкапы еще не созданы',
        duration: 3000,
      });
      return;
    }
    
    // Показываем информацию о последнем бэкапе
    const lastBackup = backups[backups.length - 1];
    if (!lastBackup) return;
    
    if (confirm(`Восстановить данные из бэкапа?\n\nДата: ${lastBackup.date}\nЗаметок: ${lastBackup.notesCount}\n\nТекущие несохраненные изменения будут потеряны!`)) {
      const success = await restoreFromBackup();
      
      if (success) {
        // Перезагружаем страницу для обновления данных
        window.location.reload();
      } else {
        toast({
          title: 'Ошибка восстановления',
          description: 'Не удалось восстановить данные из бэкапа',
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
            <div className="animate-spin mb-4">⏳</div>
            <p>Загрузка заметок...</p>
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
                  <Button variant="ghost" size="icon" onClick={handleCreateNote} title="Новая заметка">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCreateFolder} title="Создать папку">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSearchToggle}
                    title="Поиск"
                    className={isSearchOpen ? 'bg-accent text-accent-foreground' : ''}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSort} title="Сортировка">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleArchive} title="Архив">
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsShortcutsOpen(true)}
                    title="Горячие клавиши"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSettings} title="Settings (Ctrl+E для экспорта)">
                    <Settings className="h-4 w-4" />
                  </Button>
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

