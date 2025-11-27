import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sortFolders, sortNotes, sortBoth } from '@/lib/storage';

describe('Sorting functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sortFolders', () => {
    it('должна сортировать папки по названию (возрастание)', async () => {
      const mockData = {
        hidden_notes_data: {
          folders: [
            { id: '1', name: 'Zebra', createdAt: 1000, updatedAt: 1000, order: 0 },
            { id: '2', name: 'Apple', createdAt: 2000, updatedAt: 2000, order: 1 },
            { id: '3', name: 'Banana', createdAt: 3000, updatedAt: 3000, order: 2 },
          ],
          notes: [],
        },
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      const result = await sortFolders('name', 'asc');

      expect(result).toBe(true);
      
      const savedData = vi.mocked(chrome.storage.local.set).mock.calls[0][0];
      const folders = savedData.hidden_notes_data.folders;
      
      expect(folders[0].name).toBe('Apple');
      expect(folders[1].name).toBe('Banana');
      expect(folders[2].name).toBe('Zebra');
      
      // Проверяем что order обновлен
      expect(folders[0].order).toBe(0);
      expect(folders[1].order).toBe(1);
      expect(folders[2].order).toBe(2);
    });

    it('должна сортировать папки по названию (убывание)', async () => {
      const mockData = {
        hidden_notes_data: {
          folders: [
            { id: '1', name: 'Apple', createdAt: 1000, updatedAt: 1000, order: 0 },
            { id: '2', name: 'Banana', createdAt: 2000, updatedAt: 2000, order: 1 },
            { id: '3', name: 'Zebra', createdAt: 3000, updatedAt: 3000, order: 2 },
          ],
          notes: [],
        },
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      const result = await sortFolders('name', 'desc');

      expect(result).toBe(true);
      
      const savedData = vi.mocked(chrome.storage.local.set).mock.calls[0][0];
      const folders = savedData.hidden_notes_data.folders;
      
      expect(folders[0].name).toBe('Zebra');
      expect(folders[1].name).toBe('Banana');
      expect(folders[2].name).toBe('Apple');
    });

    it('должна сортировать папки по дате создания', async () => {
      const mockData = {
        hidden_notes_data: {
          folders: [
            { id: '1', name: 'C', createdAt: 3000, updatedAt: 1000, order: 0 },
            { id: '2', name: 'A', createdAt: 1000, updatedAt: 2000, order: 1 },
            { id: '3', name: 'B', createdAt: 2000, updatedAt: 3000, order: 2 },
          ],
          notes: [],
        },
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      const result = await sortFolders('createdAt', 'asc');

      expect(result).toBe(true);
      
      const savedData = vi.mocked(chrome.storage.local.set).mock.calls[0][0];
      const folders = savedData.hidden_notes_data.folders;
      
      expect(folders[0].createdAt).toBe(1000);
      expect(folders[1].createdAt).toBe(2000);
      expect(folders[2].createdAt).toBe(3000);
    });
  });

  describe('sortNotes', () => {
    it('должна сортировать заметки по названию (возрастание)', async () => {
      const mockData = {
        hidden_notes_data: {
          folders: [],
          notes: [
            { id: '1', title: 'Zebra', content: '', createdAt: 1000, updatedAt: 1000, order: 0 },
            { id: '2', title: 'Apple', content: '', createdAt: 2000, updatedAt: 2000, order: 1 },
            { id: '3', title: 'Banana', content: '', createdAt: 3000, updatedAt: 3000, order: 2 },
          ],
        },
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      const result = await sortNotes('title', 'asc');

      expect(result).toBe(true);
      
      const savedData = vi.mocked(chrome.storage.local.set).mock.calls[0][0];
      const notes = savedData.hidden_notes_data.notes;
      
      expect(notes[0].title).toBe('Apple');
      expect(notes[1].title).toBe('Banana');
      expect(notes[2].title).toBe('Zebra');
    });

    it('должна сортировать заметки по дате изменения', async () => {
      const mockData = {
        hidden_notes_data: {
          folders: [],
          notes: [
            { id: '1', title: 'C', content: '', createdAt: 1000, updatedAt: 3000, order: 0 },
            { id: '2', title: 'A', content: '', createdAt: 2000, updatedAt: 1000, order: 1 },
            { id: '3', title: 'B', content: '', createdAt: 3000, updatedAt: 2000, order: 2 },
          ],
        },
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      const result = await sortNotes('updatedAt', 'asc');

      expect(result).toBe(true);
      
      const savedData = vi.mocked(chrome.storage.local.set).mock.calls[0][0];
      const notes = savedData.hidden_notes_data.notes;
      
      expect(notes[0].updatedAt).toBe(1000);
      expect(notes[1].updatedAt).toBe(2000);
      expect(notes[2].updatedAt).toBe(3000);
    });
  });

  describe('sortBoth', () => {
    it('должна сортировать и папки и заметки', async () => {
      const mockData = {
        hidden_notes_data: {
          folders: [
            { id: '1', name: 'Z', createdAt: 1000, updatedAt: 1000, order: 0 },
            { id: '2', name: 'A', createdAt: 2000, updatedAt: 2000, order: 1 },
          ],
          notes: [
            { id: '1', title: 'Z', content: '', createdAt: 1000, updatedAt: 1000, order: 0 },
            { id: '2', title: 'A', content: '', createdAt: 2000, updatedAt: 2000, order: 1 },
          ],
        },
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      const result = await sortBoth('name', 'asc');

      expect(result).toBe(true);
      
      const savedData = vi.mocked(chrome.storage.local.set).mock.calls[0][0];
      const folders = savedData.hidden_notes_data.folders;
      const notes = savedData.hidden_notes_data.notes;
      
      expect(folders[0].name).toBe('A');
      expect(folders[1].name).toBe('Z');
      expect(notes[0].title).toBe('A');
      expect(notes[1].title).toBe('Z');
    });
  });
});
