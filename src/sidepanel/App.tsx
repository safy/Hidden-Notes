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
import { useHiddenTextReveal } from '@/hooks/useHiddenTextReveal';
import { initDevtoolsHelper } from '@/lib/devtools-helpers';
import { Moon, Sun, Settings, Plus, Search, ArrowUpDown, FolderPlus, Archive, HelpCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { NoteView } from '@/components/NoteView';
import { SearchDropdown } from '@/components/Search';

type AppView = 'list' | 'note';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<AppView>('list');
  const [selectedNote, setSelectedNote] = useState<{id: string, title: string} | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  
  // Использование useNotes hook
  const { notes, isLoading, error, addNote, updateNoteContent, removeNote, searchNotes, getNoteById } = useNotes();
  const { toast } = useToast();

  // Enable Alt+hover reveal for hidden text
  useHiddenTextReveal();

  // 🔧 Инициализировать DevTools Helper
  useEffect(() => {
    initDevtoolsHelper();
  }, []);

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
    const newNote = await addNote('Новая заметка');
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

  const handleNoteArchive = (_noteId: string) => {
    toast({
      title: 'Архивирование',
      description: 'Функция архивирования будет добавлена в следующей версии',
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

  const handleNoteColorChange = (_noteId: string, _color: string) => {
    toast({
      title: 'Информация',
      description: 'Раскраска заметок будет добавлена в следующей версии',
      duration: 3000,
    });
  };

  const handleCreateFolder = () => {
    toast({
      title: 'Информация',
      description: 'Создание папок будет добавлено в следующей версии',
      duration: 3000,
    });
  };

  const handleArchive = () => {
    toast({
      title: 'Архивирование',
      description: 'Функция архивирования будет добавлена в следующей версии',
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

  // Фильтрованный список заметок на основе поиска
  const filteredNotes = searchQuery ? searchNotes(searchQuery) : notes;

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
                  <Button variant="ghost" size="icon" title="Settings">
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

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'list' ? (
              <Sidebar 
                notes={filteredNotes}
                onNoteSelect={handleNoteSelect} 
                onNotesReorder={handleNotesReorder}
                onNoteArchive={handleNoteArchive}
                onNoteDelete={handleNoteDelete}
                onNoteColorChange={handleNoteColorChange}
                searchQuery={searchQuery} 
              />
            ) : (
              selectedNote && (
                <NoteView
                  noteId={selectedNote.id}
                  noteTitle={selectedNote.title}
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

          {/* Toaster для уведомлений */}
          <Toaster />
        </>
      )}
    </div>
  );
};

export default App;

