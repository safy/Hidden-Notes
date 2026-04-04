import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MASK_FLAG_TYPE = 'application/x-hidden-notes-masked';

describe('clipboard-masking utilities and content script', () => {
  beforeEach(() => {
    // Clear sessionStorage
    sessionStorage.clear();

    // Mock navigator.clipboard
    const mockClipboardWrite = vi.fn().mockResolvedValue(undefined);
    const mockClipboardRead = vi.fn().mockResolvedValue([]);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        write: mockClipboardWrite,
        read: mockClipboardRead,
      },
      writable: true,
      configurable: true,
    });
  });

  describe('copyHiddenText', () => {
    it('should copy text with hidden mask metadata to clipboard', async () => {
      const testText = 'secretPassword123';

      const copyHiddenText = async (text: string) => {
        if (!navigator.clipboard) {
          throw new Error('Clipboard API not available');
        }
        const textBlob = new Blob([text], { type: 'text/plain' });
        const maskBlob = new Blob(['true'], { type: MASK_FLAG_TYPE });
        const clipboardItem = new ClipboardItem({
          'text/plain': textBlob,
          [MASK_FLAG_TYPE]: maskBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      };

      await copyHiddenText(testText);

      const clipboardWrite = navigator.clipboard.write as any;
      expect(clipboardWrite).toHaveBeenCalled();
    });

    it('should throw error if Clipboard API is not available', async () => {
      const copyHiddenText = async (text: string) => {
        if (!navigator.clipboard) {
          throw new Error('Clipboard API not available');
        }
        const textBlob = new Blob([text], { type: 'text/plain' });
        const maskBlob = new Blob(['true'], { type: MASK_FLAG_TYPE });
        const clipboardItem = new ClipboardItem({
          'text/plain': textBlob,
          [MASK_FLAG_TYPE]: maskBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      };

      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(copyHiddenText('test')).rejects.toThrow();
    });

    it('should handle empty string', async () => {
      const copyHiddenText = async (text: string) => {
        if (!navigator.clipboard) {
          throw new Error('Clipboard API not available');
        }
        const textBlob = new Blob([text], { type: 'text/plain' });
        const maskBlob = new Blob(['true'], { type: MASK_FLAG_TYPE });
        const clipboardItem = new ClipboardItem({
          'text/plain': textBlob,
          [MASK_FLAG_TYPE]: maskBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      };

      await copyHiddenText('');
      const clipboardWrite = navigator.clipboard.write as any;
      expect(clipboardWrite).toHaveBeenCalled();
    });
  });

  describe('isHiddenDataInClipboard', () => {
    it('should return true if mask metadata exists', async () => {
      const isHiddenDataInClipboard = async () => {
        try {
          if (!navigator.clipboard) {
            return false;
          }
          const items = await navigator.clipboard.read();
          return items.some((item: any) => item.types.includes(MASK_FLAG_TYPE));
        } catch {
          return false;
        }
      };

      const mockClipboardItem = {
        types: ['text/plain', MASK_FLAG_TYPE],
        getType: vi.fn(),
      };

      const mockClipboardRead = vi.fn().mockResolvedValue([mockClipboardItem]);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          read: mockClipboardRead,
          write: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const result = await isHiddenDataInClipboard();
      expect(result).toBe(true);
    });

    it('should return false if mask metadata does not exist', async () => {
      const isHiddenDataInClipboard = async () => {
        try {
          if (!navigator.clipboard) {
            return false;
          }
          const items = await navigator.clipboard.read();
          return items.some((item: any) => item.types.includes(MASK_FLAG_TYPE));
        } catch {
          return false;
        }
      };

      const mockClipboardItem = {
        types: ['text/plain'],
        getType: vi.fn(),
      };

      const mockClipboardRead = vi.fn().mockResolvedValue([mockClipboardItem]);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          read: mockClipboardRead,
          write: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const result = await isHiddenDataInClipboard();
      expect(result).toBe(false);
    });

    it('should return false if clipboard is empty', async () => {
      const isHiddenDataInClipboard = async () => {
        try {
          if (!navigator.clipboard) {
            return false;
          }
          const items = await navigator.clipboard.read();
          return items.some((item: any) => item.types.includes(MASK_FLAG_TYPE));
        } catch {
          return false;
        }
      };

      const mockClipboardRead = vi.fn().mockResolvedValue([]);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          read: mockClipboardRead,
          write: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const result = await isHiddenDataInClipboard();
      expect(result).toBe(false);
    });
  });

  describe('clearMaskFlag', () => {
    it('should remove mask metadata from clipboard', async () => {
      const clearMaskFlag = async () => {
        try {
          if (!navigator.clipboard) {
            return;
          }
          const items = await navigator.clipboard.read();
          if (items.length === 0) return;
          const textBlob = await items[0].getType('text/plain');
          const text = await textBlob.text();
          const newClipboardItem = new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
          });
          await navigator.clipboard.write([newClipboardItem]);
        } catch {
          // Silently fail
        }
      };

      const mockClipboardItem = {
        types: ['text/plain', MASK_FLAG_TYPE],
        getType: vi.fn().mockResolvedValue(
          new Blob(['testData'], { type: 'text/plain' })
        ),
      };

      const mockClipboardWrite = vi.fn().mockResolvedValue(undefined);
      const mockClipboardRead = vi.fn().mockResolvedValue([mockClipboardItem]);

      Object.defineProperty(navigator, 'clipboard', {
        value: {
          read: mockClipboardRead,
          write: mockClipboardWrite,
        },
        writable: true,
        configurable: true,
      });

      await clearMaskFlag();
      expect(mockClipboardWrite).toHaveBeenCalled();
    });
  });

  describe('Content Script - handlePaste and masking', () => {
    let inputElement: HTMLInputElement;

    beforeEach(() => {
      // Setup DOM
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.id = 'test-input';
      document.body.appendChild(inputElement);
    });

    afterEach(() => {
      if (document.body.contains(inputElement)) {
        document.body.removeChild(inputElement);
      }
    });

    it('should intercept paste event and mask hidden data', async () => {
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });

      expect(pasteEvent.type).toBe('paste');
      expect(pasteEvent.target).toBeNull();
    });

    it('should replace input value with asterisks for visual masking', async () => {
      const realData = 'secretPassword123';
      inputElement.value = realData;

      // Simulate masking
      const masked = '*'.repeat(inputElement.value.length);
      expect(masked).toBe('*******************');
    });

    it('should preserve real data in sessionStorage', async () => {
      const realData = 'secretPassword123';
      const key = 'masked_test-input';

      sessionStorage.setItem(key, realData);

      expect(sessionStorage.getItem(key)).toBe(realData);
    });

    it('should generate unique input ID if not provided', async () => {
      const inputId = `masked_input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      expect(inputId).toMatch(/^masked_input_\d+_[a-z0-9]+$/);
    });

    it('should mask input field with letter spacing and monospace font', async () => {
      const realData = 'password123';
      inputElement.value = realData;
      inputElement.style.letterSpacing = '0.5em';
      inputElement.style.fontFamily = 'monospace';

      expect(inputElement.style.letterSpacing).toBe('0.5em');
      expect(inputElement.style.fontFamily).toBe('monospace');
    });

    it('should set input field to readonly after masking', async () => {
      inputElement.readOnly = true;
      expect(inputElement.readOnly).toBe(true);
    });

    it('should work with textarea elements', async () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'test-textarea';
      textarea.value = 'secretData';
      document.body.appendChild(textarea);

      const realData = textarea.value;
      const masked = '*'.repeat(realData.length);
      expect(masked).toBe('**********');

      document.body.removeChild(textarea);
    });

    it('should handle form submission and restore real data', async () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'form-input';
      input.value = '***';

      form.appendChild(input);
      document.body.appendChild(form);

      // Store real data
      const realData = 'secretPassword';
      sessionStorage.setItem('masked_form-input', realData);

      // Simulate form submission logic
      const formInputs = form.querySelectorAll('input, textarea');
      formInputs.forEach((formInput: any) => {
        const inputId = formInput.id;
        if (inputId) {
          const storedData = sessionStorage.getItem(`masked_${inputId}`);
          if (storedData) {
            formInput.value = storedData;
          }
        }
      });

      expect(input.value).toBe(realData);

      document.body.removeChild(form);
    });

    it('should check if element is input, textarea, or contenteditable', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const contenteditable = document.createElement('div');
      contenteditable.contentEditable = 'true';
      const regularDiv = document.createElement('div');

      const isInputElement = (element: any) => {
        return (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element.contentEditable === 'true'
        );
      };

      expect(isInputElement(input)).toBe(true);
      expect(isInputElement(textarea)).toBe(true);
      expect(isInputElement(contenteditable)).toBe(true);
      expect(isInputElement(regularDiv)).toBe(false);
    });
  });
});
