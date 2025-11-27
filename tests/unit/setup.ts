import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

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
