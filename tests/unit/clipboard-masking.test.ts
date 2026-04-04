import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyHiddenText, isHiddenDataInClipboard, clearMaskFlag } from '@/lib/clipboard-masking';

describe('clipboard-masking', () => {
  beforeEach(() => {
    // Mock navigator.clipboard
    vi.stubGlobal('navigator', {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
        read: vi.fn().mockResolvedValue([]),
      },
    });
  });

  describe('copyHiddenText', () => {
    it('should copy text with hidden mask metadata to clipboard', async () => {
      const testText = 'secretPassword123';

      await copyHiddenText(testText);

      const clipboardWrite = navigator.clipboard.write as any;
      expect(clipboardWrite).toHaveBeenCalled();

      // Verify ClipboardItem was created with correct types
      const callArg = clipboardWrite.mock.calls[0][0];
      expect(callArg).toBeDefined();
      expect(callArg[0].types).toContain('text/plain');
    });

    it('should throw error if Clipboard API is not available', async () => {
      vi.stubGlobal('navigator', { clipboard: undefined });

      await expect(copyHiddenText('test')).rejects.toThrow();
    });

    it('should handle empty string', async () => {
      await copyHiddenText('');

      const clipboardWrite = navigator.clipboard.write as any;
      expect(clipboardWrite).toHaveBeenCalled();
    });
  });

  describe('isHiddenDataInClipboard', () => {
    it('should return true if mask metadata exists', async () => {
      const mockClipboardItem = {
        types: ['text/plain', 'application/x-hidden-notes-masked'],
        getType: vi.fn(),
      };

      (navigator.clipboard.read as any).mockResolvedValue([mockClipboardItem]);

      const result = await isHiddenDataInClipboard();

      expect(result).toBe(true);
    });

    it('should return false if mask metadata does not exist', async () => {
      const mockClipboardItem = {
        types: ['text/plain'],
        getType: vi.fn(),
      };

      (navigator.clipboard.read as any).mockResolvedValue([mockClipboardItem]);

      const result = await isHiddenDataInClipboard();

      expect(result).toBe(false);
    });

    it('should return false if clipboard is empty', async () => {
      (navigator.clipboard.read as any).mockResolvedValue([]);

      const result = await isHiddenDataInClipboard();

      expect(result).toBe(false);
    });
  });

  describe('clearMaskFlag', () => {
    it('should remove mask metadata from clipboard', async () => {
      const mockClipboardItem = {
        types: ['text/plain', 'application/x-hidden-notes-masked'],
        getType: vi.fn().mockResolvedValue(new Blob(['test data'], { type: 'text/plain' })),
      };

      (navigator.clipboard.read as any).mockResolvedValue([mockClipboardItem]);

      await clearMaskFlag();

      const clipboardWrite = navigator.clipboard.write as any;
      expect(clipboardWrite).toHaveBeenCalled();
    });
  });
});
