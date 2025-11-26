/**
 * @file: ArchiveView.tsx
 * @description: Компонент для просмотра архива заметок и папок
 * @dependencies: React, storage, hooks
 * @created: 2025-01-XX
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Archive, Folder, FileText, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Note } from '@/types/note';
import { Folder as FolderType } from '@/types/folder';
import { getArchivedNotes, getArchivedFolders, toggleNoteArchive, toggleFolderArchive } from '@/lib/storage';
import { moveToTrash, moveFolderToTrash } from '@/lib/data-protection';

type FilterType = 'all' | 'notes' | 'folders';

interface ArchiveViewProps {
  onBack: () => void;
  onNoteRestore?: (noteId: string) => void;
  onFolderRestore?: (folderId: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  onBack,
  onNoteRestore,
  onFolderRestore,
}) => {
  const { t } = useTranslation();
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [archivedFolders, setArchivedFolders] = useState<FolderType[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadArchived = async () => {
    try {
      setIsLoading(true);
      const notes = await getArchivedNotes();
      const folders = await getArchivedFolders();
      setArchivedNotes(notes);
      setArchivedFolders(folders);
    } catch (error) {
      console.error('Failed to load archived items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchived();
    
    // Слушаем изменения в storage
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.hidden_notes) {
        loadArchived();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleRestoreNote = async (noteId: string) => {
    const success = await toggleNoteArchive(noteId);
    if (success) {
      onNoteRestore?.(noteId);
      await loadArchived();
    }
  };

  const handleRestoreFolder = async (folderId: string) => {
    const success = await toggleFolderArchive(folderId);
    if (success) {
      onFolderRestore?.(folderId);
      await loadArchived();
    }
  };

  const handleDeleteNote = async (note: Note) => {
    await moveToTrash(note);
    await toggleNoteArchive(note.id);
    await loadArchived();
  };

  const handleDeleteFolder = async (folder: FolderType) => {
    await moveFolderToTrash(folder);
    // Удаляем папку из основного хранилища
    const data = await chrome.storage.local.get('hidden_notes');
    const schema = data.hidden_notes;
    if (schema) {
      schema.folders = schema.folders.filter((f: FolderType) => f.id !== folder.id);
      await chrome.storage.local.set({ hidden_notes: schema });
    }
    await loadArchived();
  };

  const filteredNotes = filter === 'all' || filter === 'notes' ? archivedNotes : [];
  const filteredFolders = filter === 'all' || filter === 'folders' ? archivedFolders : [];

  return (
    <div className="w-full border-r border-border bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} title={t('common.back', { defaultValue: 'Back' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Archive className="h-4 w-4" />
          <h2 className="font-semibold text-sm">{t('archive.title', { defaultValue: 'Archive' })}</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 border-b border-border flex gap-1">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs"
        >
          {t('archive.all', { defaultValue: 'All' })}
        </Button>
        <Button
          variant={filter === 'notes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('notes')}
          className="text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          {t('archive.notes', { defaultValue: 'Notes' })}
        </Button>
        <Button
          variant={filter === 'folders' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('folders')}
          className="text-xs"
        >
          <Folder className="h-3 w-3 mr-1" />
          {t('archive.folders', { defaultValue: 'Folders' })}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('common.loading', { defaultValue: 'Loading...' })}
          </div>
        ) : filteredNotes.length === 0 && filteredFolders.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('archive.empty', { defaultValue: 'Archive is empty' })}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {/* Archived Notes */}
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-medium text-sm truncate">{note.title || t('notes.untitled', { defaultValue: 'Untitled' })}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('archive.archivedAt', { defaultValue: 'Archived' })}: {new Date(note.archivedAt || 0).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreNote(note.id)}
                      title={t('archive.restore', { defaultValue: 'Restore' })}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note)}
                      title={t('archive.delete', { defaultValue: 'Delete' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Archived Folders */}
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="p-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-medium text-sm truncate">{folder.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('archive.archivedAt', { defaultValue: 'Archived' })}: {new Date(folder.archivedAt || 0).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreFolder(folder.id)}
                      title={t('archive.restore', { defaultValue: 'Restore' })}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFolder(folder)}
                      title={t('archive.delete', { defaultValue: 'Delete' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {archivedNotes.length + archivedFolders.length} {t('archive.items', { defaultValue: 'items' })}
        </div>
      </div>
    </div>
  );
};


