/**
 * Vitest configuration for unit testing
 * @see https://vitest.dev/config/
 */

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    setupFiles: ['./tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'src/test/',
        '**/*.config.js',
        '**/*.config.ts',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/types/**',
        '**/*.test.js',
        '**/*.spec.js',
      ],
      include: [
        'src/**/*.js',
        'src/**/*.vue',
        'src/**/*.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    
    // Test file patterns - include tests in both tests/ and src/ directories
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js',
      'src/**/*.test.js',
      'src/**/*.spec.js',
    ],
    
    // Exclude patterns
    exclude: ['node_modules', 'dist', 'build'],
    
    // Global test timeout
    testTimeout: 10000,
    
    // Watch mode options
    watch: false,
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Globals (for describe, it, expect, etc.)
    globals: true,
  },
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
