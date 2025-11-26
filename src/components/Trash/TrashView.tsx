/**
 * @file: TrashView.tsx
 * @description: Компонент для просмотра корзины удаленных заметок и папок
 * @dependencies: React, data-protection, hooks
 * @created: 2025-01-XX
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, Folder, FileText, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Note } from '@/types/note';
import { Folder as FolderType } from '@/types/folder';
import { listTrashedNotes, listTrashedFolders, restoreFromTrash, restoreFolderFromTrash } from '@/lib/data-protection';

type FilterType = 'all' | 'notes' | 'folders';

interface TrashViewProps {
  onBack: () => void;
  onNoteRestore?: (noteId: string) => void;
  onFolderRestore?: (folderId: string) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  onBack,
  onNoteRestore,
  onFolderRestore,
}) => {
  const { t } = useTranslation();
  const [trashedNotes, setTrashedNotes] = useState<Array<Note & {
    deletedAt: number;
    canRestoreUntil: number;
    daysUntilPermanentDelete: number;
  }>>([]);
  const [trashedFolders, setTrashedFolders] = useState<Array<FolderType & {
    deletedAt: number;
    canRestoreUntil: number;
    daysUntilPermanentDelete: number;
  }>>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadTrashed = async () => {
    try {
      setIsLoading(true);
      const notes = await listTrashedNotes();
      const folders = await listTrashedFolders();
      setTrashedNotes(notes);
      setTrashedFolders(folders);
    } catch (error) {
      console.error('Failed to load trashed items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrashed();
    
    // Слушаем изменения в storage
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.hidden_notes_deleted || changes.hidden_notes_deleted_folders) {
        loadTrashed();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleRestoreNote = async (noteId: string) => {
    const restoredNote = await restoreFromTrash(noteId);
    if (restoredNote) {
      // Восстанавливаем заметку в storage с сохранением оригинальных timestamps
      const data = await chrome.storage.local.get('hidden_notes');
      const schema = data.hidden_notes;
      if (schema) {
        schema.notes = schema.notes || [];
        schema.notes.push(restoredNote);
        await chrome.storage.local.set({ hidden_notes: schema });
      }
      onNoteRestore?.(noteId);
      await loadTrashed();
    }
  };

  const handleRestoreFolder = async (folderId: string) => {
    const restoredFolder = await restoreFolderFromTrash(folderId);
    if (restoredFolder) {
      // Восстанавливаем папку в storage с сохранением оригинальных timestamps
      const data = await chrome.storage.local.get('hidden_notes');
      const schema = data.hidden_notes;
      if (schema) {
        schema.folders = schema.folders || [];
        schema.folders.push(restoredFolder);
        await chrome.storage.local.set({ hidden_notes: schema });
      }
      onFolderRestore?.(folderId);
      await loadTrashed();
    }
  };

  const handlePermanentlyDeleteNote = async (noteId: string) => {
    const deletedData = await chrome.storage.local.get('hidden_notes_deleted');
    const deletedNotes = deletedData.hidden_notes_deleted || [];
    const filteredNotes = deletedNotes.filter((n: any) => n.id !== noteId);
    await chrome.storage.local.set({ hidden_notes_deleted: filteredNotes });
    await loadTrashed();
  };

  const handlePermanentlyDeleteFolder = async (folderId: string) => {
    const deletedData = await chrome.storage.local.get('hidden_notes_deleted_folders');
    const deletedFolders = deletedData.hidden_notes_deleted_folders || [];
    const filteredFolders = deletedFolders.filter((f: any) => f.id !== folderId);
    await chrome.storage.local.set({ hidden_notes_deleted_folders: filteredFolders });
    await loadTrashed();
  };

  const filteredNotes = filter === 'all' || filter === 'notes' ? trashedNotes : [];
  const filteredFolders = filter === 'all' || filter === 'folders' ? trashedFolders : [];

  const minDaysLeft = Math.min(
    ...trashedNotes.map(n => n.daysUntilPermanentDelete),
    ...trashedFolders.map(f => f.daysUntilPermanentDelete),
    Infinity
  );

  return (
    <div className="w-full border-r border-border bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} title={t('common.back', { defaultValue: 'Back' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Trash2 className="h-4 w-4" />
          <h2 className="font-semibold text-sm">{t('trash.title', { defaultValue: 'Trash' })}</h2>
        </div>
      </div>

      {/* Warning */}
      {minDaysLeft < Infinity && minDaysLeft <= 7 && (
        <div className="p-2 border-b border-border bg-yellow-500/10 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {t('trash.warning', { 
              defaultValue: 'Some items will be permanently deleted in {{days}} days',
              days: minDaysLeft 
            })}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="p-2 border-b border-border flex gap-1">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs"
        >
          {t('trash.all', { defaultValue: 'All' })}
        </Button>
        <Button
          variant={filter === 'notes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('notes')}
          className="text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          {t('trash.notes', { defaultValue: 'Notes' })}
        </Button>
        <Button
          variant={filter === 'folders' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('folders')}
          className="text-xs"
        >
          <Folder className="h-3 w-3 mr-1" />
          {t('trash.folders', { defaultValue: 'Folders' })}
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
            {t('trash.empty', { defaultValue: 'Trash is empty' })}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {/* Trashed Notes */}
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
                    <p className="text-xs text-muted-foreground mb-1">
                      {t('trash.deletedAt', { defaultValue: 'Deleted' })}: {new Date(note.deletedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      {t('trash.daysLeft', { 
                        defaultValue: '{{days}} days until permanent deletion',
                        days: note.daysUntilPermanentDelete 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreNote(note.id)}
                      title={t('trash.restore', { defaultValue: 'Restore' })}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePermanentlyDeleteNote(note.id)}
                      title={t('trash.deletePermanently', { defaultValue: 'Delete permanently' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Trashed Folders */}
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
                    <p className="text-xs text-muted-foreground mb-1">
                      {t('trash.deletedAt', { defaultValue: 'Deleted' })}: {new Date(folder.deletedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      {t('trash.daysLeft', { 
                        defaultValue: '{{days}} days until permanent deletion',
                        days: folder.daysUntilPermanentDelete 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreFolder(folder.id)}
                      title={t('trash.restore', { defaultValue: 'Restore' })}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePermanentlyDeleteFolder(folder.id)}
                      title={t('trash.deletePermanently', { defaultValue: 'Delete permanently' })}
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
          {trashedNotes.length + trashedFolders.length} {t('trash.items', { defaultValue: 'items' })}
        </div>
      </div>
    </div>
  );
};

