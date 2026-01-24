/**
 * Global test setup file
 * Runs before all tests
 */

import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock CSS.escape
if (!window.CSS || !window.CSS.escape) {
  window.CSS = {
    ...window.CSS,
    escape: (str) => {
      return String(str).replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
    },
  };
}

// Mock console methods in tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// };

// Configure Vue Test Utils
config.global.stubs = {
  transition: false,
  'transition-group': false,
};

// Provide PrimeVue configuration for tests
config.global.mocks = {
  $primevue: {
    config: {
      ripple: false,
      locale: {}
    }
  }
};

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  writable: true,
  value: {
    ...import.meta.env,
    DEV: true,
    MODE: 'test',
  },
});

// Mock HTMLMediaElement methods that are not implemented in jsdom
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.load = vi.fn();

