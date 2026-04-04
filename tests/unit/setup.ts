import { vi } from 'vitest';

try {
  require('@testing-library/jest-dom');
} catch (e) {
  console.warn('testing-library/jest-dom not available', e);
}

// Setup global mocks before any tests run
try {
  // Mock Chrome API
  (global as any).chrome = {
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
  };
} catch (e) {
  console.warn('Failed to setup Chrome API mock', e);
}
