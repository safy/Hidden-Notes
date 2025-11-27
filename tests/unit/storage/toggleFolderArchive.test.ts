import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toggleFolderArchive } from '@/lib/storage';

describe('toggleFolderArchive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должна архивировать папку и все заметки в ней', async () => {
    const mockData = {
      hidden_notes_data: {
        folders: [
          {
            id: 'folder-1',
            name: 'Test Folder',
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: 0,
          },
        ],
        notes: [
          {
            id: 'note-1',
            title: 'Note 1',
            content: 'Content 1',
            folderId: 'folder-1',
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: 0,
          },
          {
            id: 'note-2',
            title: 'Note 2',
            content: 'Content 2',
            folderId: 'folder-1',
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: 1,
          },
        ],
      },
    };

    // Mock chrome.storage.local.get
    vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
    
    // Mock chrome.storage.local.set
    vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

    const result = await toggleFolderArchive('folder-1');

    expect(result).toBe(true);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        hidden_notes_data: expect.objectContaining({
          folders: expect.arrayContaining([
            expect.objectContaining({
              id: 'folder-1',
              isArchived: true,
              archivedAt: expect.any(Number),
            }),
          ]),
          notes: expect.arrayContaining([
            expect.objectContaining({
              id: 'note-1',
              isArchived: true,
              archivedAt: expect.any(Number),
            }),
            expect.objectContaining({
              id: 'note-2',
              isArchived: true,
              archivedAt: expect.any(Number),
            }),
          ]),
        }),
      })
    );
  });

  it('должна разархивировать папку и все заметки в ней', async () => {
    const mockData = {
      hidden_notes_data: {
        folders: [
          {
            id: 'folder-1',
            name: 'Test Folder',
            isArchived: true,
            archivedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: 0,
          },
        ],
        notes: [
          {
            id: 'note-1',
            title: 'Note 1',
            content: 'Content 1',
            folderId: 'folder-1',
            isArchived: true,
            archivedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: 0,
          },
        ],
      },
    };

    vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
    vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

    const result = await toggleFolderArchive('folder-1');

    expect(result).toBe(true);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        hidden_notes_data: expect.objectContaining({
          folders: expect.arrayContaining([
            expect.objectContaining({
              id: 'folder-1',
              isArchived: false,
              archivedAt: undefined,
            }),
          ]),
          notes: expect.arrayContaining([
            expect.objectContaining({
              id: 'note-1',
              isArchived: false,
              archivedAt: undefined,
            }),
          ]),
        }),
      })
    );
  });

  it('должна вернуть false если папка не найдена', async () => {
    const mockData = {
      hidden_notes_data: {
        folders: [],
        notes: [],
      },
    };

    vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);

    const result = await toggleFolderArchive('non-existent-folder');

    expect(result).toBe(false);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('должна обработать ошибку при сохранении', async () => {
    const mockData = {
      hidden_notes_data: {
        folders: [
          {
            id: 'folder-1',
            name: 'Test Folder',
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: 0,
          },
        ],
        notes: [],
      },
    };

    vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
    vi.mocked(chrome.storage.local.set).mockRejectedValue(new Error('Storage error'));

    const result = await toggleFolderArchive('folder-1');

    expect(result).toBe(false);
  });
});
