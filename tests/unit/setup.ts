import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Blob.text() method if it doesn't exist
if (!Blob.prototype.text) {
  (Blob.prototype as any).text = async function () {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(this);
    });
  };
}

// Mock ClipboardItem
global.ClipboardItem = class {
  data: Record<string, Blob>;

  constructor(data: Record<string, Blob | Promise<Blob>>) {
    this.data = data as Record<string, Blob>;
  }

  async getType(type: string): Promise<Blob> {
    return this.data[type] || new Blob();
  }

  get types(): string[] {
    return Object.keys(this.data);
  }
} as any;

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null,
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
} as any;
