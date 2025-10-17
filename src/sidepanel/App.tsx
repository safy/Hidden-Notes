/**
 * @file: App.tsx
 * @description: Главный компонент приложения Hidden Notes
 * @dependencies: React, shadcn/ui components
 * @created: 2025-10-15
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

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

  const handleNoteSelect = (noteId: string, noteTitle: string) => {
    setSelectedNote({ id: noteId, title: noteTitle });
    setCurrentView('note');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedNote(null);
  };

  const handleCreateNote = () => {
    setSelectedNote({ id: 'new', title: 'Новая заметка' });
    setCurrentView('note');
  };

  const handleNoteSave = () => {
    toast({
      title: 'Заметка сохранена',
      description: `"${selectedNote?.title}" успешно сохранена`,
      duration: 3000,
    });
  };

  const handleCurrentNoteDelete = () => {
    toast({
      title: 'Заметка удалена',
      description: `"${selectedNote?.title}" удалена`,
      duration: 3000,
    });
    handleBackToList();
  };

  const handleNoteTitleChange = (newTitle: string) => {
    if (selectedNote) {
      setSelectedNote({ ...selectedNote, title: newTitle });
      toast({
        title: 'Название изменено',
        description: `Заметка переименована в "${newTitle}"`,
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
    // TODO: Реализовать поиск в заметках
    if (query.trim()) {
      console.log('Searching for:', query);
    }
  };

  const handleNotesReorder = (reorderedNotes: any[]) => {
    toast({
      title: 'Порядок изменен',
      description: `Заметки переставлены (${reorderedNotes.length} заметок)`,
      duration: 3000,
    });
    // TODO: Сохранить новый порядок в storage
    console.log('Notes reordered:', reorderedNotes);
  };

  const handleNoteArchive = (noteId: string) => {
    toast({
      title: 'Заметка архивирована',
      description: 'Заметка перемещена в архив',
      duration: 3000,
    });
    // TODO: Реализовать архивирование
    console.log('Note archived:', noteId);
  };

  const handleNoteDelete = (noteId: string) => {
    toast({
      title: 'Заметка удалена',
      description: 'Заметка удалена из списка',
      duration: 3000,
    });
    // TODO: Реализовать удаление
    console.log('Note deleted:', noteId);
  };

  const handleNoteColorChange = (noteId: string, color: string) => {
    toast({
      title: 'Цвет изменен',
      description: `Цвет заметки изменен на ${color}`,
      duration: 3000,
    });
    // TODO: Сохранить цвет в storage
    console.log('Note color changed:', noteId, color);
  };

  const handleCreateFolder = () => {
    toast({
      title: 'Создание папки',
      description: 'Функция создания папок будет добавлена в следующих версиях',
      duration: 3000,
    });
  };

  const handleArchive = () => {
    toast({
      title: 'Архивирование',
      description: 'Функция архивирования заметок будет добавлена в следующих версиях',
      duration: 3000,
    });
  };

  const handleSort = () => {
    toast({
      title: 'Сортировка',
      description: 'Функция сортировки заметок будет добавлена в следующих версиях',
      duration: 3000,
    });
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
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
    </div>
  );
};

export default App;

